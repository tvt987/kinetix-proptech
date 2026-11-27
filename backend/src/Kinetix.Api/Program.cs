using System.Text.Json;
using System.Text.Json.Serialization;
using Kinetix.Domain.Models;
using Kinetix.Domain.Services;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});

builder.Services.AddProblemDetails();

var corsOrigins = builder.Configuration.GetSection("Kinetix:DefaultCorsOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:4173", "http://localhost:8080"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("KinetixFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithExposedHeaders("X-Idempotency-Status", "Location");
    });
});

// Clean Architecture Domain Services
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ResidenceCatalog>();
builder.Services.AddSingleton<MortgageUnderwritingEngine>();
builder.Services.AddSingleton<SaigonSolarEngine>();
builder.Services.AddSingleton<UnitEscrowLocker>();
builder.Services.AddSingleton<SaigonMarketCatalog>();
builder.Services.AddSingleton<AssetBenchmarkEngine>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("KinetixFrontend");

// Strict Security Response Headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    await next();
});

// GET /health
app.MapGet("/health", (UnitEscrowLocker escrow, ResidenceCatalog catalog, SaigonMarketCatalog marketCatalog) =>
{
    return Results.Ok(new
    {
        status = "healthy",
        service = "Kinetix.Api",
        version = "4.0.0",
        runtime = ".NET 10",
        residencesLoaded = catalog.GetAll().Count,
        saigonDistrictsLoaded = marketCatalog.GetAll().Count,
        activeEscrowHolds = escrow.ActiveHoldCount,
        timestampUtc = DateTimeOffset.UtcNow
    });
});

var v1 = app.MapGroup("/api/v1");

// GET /api/v1/residences
v1.MapGet("/residences", (
    ResidenceCatalog catalog,
    UnitEscrowLocker escrow,
    string? tier,
    string? status,
    string? orientation,
    int? minFloor,
    long? maxPriceVnd) =>
{
    BedroomTier? parsedTier = null;
    if (!string.IsNullOrWhiteSpace(tier))
    {
        parsedTier = tier.Trim().ToUpperInvariant() switch
        {
            "1BR" or "ONEBR" => BedroomTier.OneBr,
            "2BR" or "TWOBR" => BedroomTier.TwoBr,
            "3BR" or "THREEBR" => BedroomTier.ThreeBr,
            "PENTHOUSE" => BedroomTier.Penthouse,
            _ => null
        };
        if (!parsedTier.HasValue)
            return Results.BadRequest(new ProblemDetails { Title = "Invalid tier filter", Detail = $"Unsupported tier '{tier}'." });
    }

    UnitAvailabilityStatus? parsedStatus = null;
    if (!string.IsNullOrWhiteSpace(status))
    {
        if (!Enum.TryParse<UnitAvailabilityStatus>(status.Trim(), ignoreCase: true, out var st))
            return Results.BadRequest(new ProblemDetails { Title = "Invalid status filter", Detail = $"Unsupported status '{status}'." });
        parsedStatus = st;
    }

    ResidenceOrientation? parsedOrientation = null;
    if (!string.IsNullOrWhiteSpace(orientation))
    {
        var normalized = orientation.Trim().Replace("_", "", StringComparison.Ordinal);
        if (!Enum.TryParse<ResidenceOrientation>(normalized, ignoreCase: true, out var ori))
            return Results.BadRequest(new ProblemDetails { Title = "Invalid orientation filter", Detail = $"Unsupported orientation '{orientation}'." });
        parsedOrientation = ori;
    }

    var heldIds = escrow.GetActivelyHeldUnitIds();
    var units = catalog.Query(parsedTier, parsedStatus, parsedOrientation, minFloor, maxPriceVnd, heldIds);

    return Results.Ok(new
    {
        count = units.Count,
        activeEscrowHolds = heldIds.Count,
        items = units
    });
});

// GET /api/v1/residences/{id}
v1.MapGet("/residences/{id}", (string id, ResidenceCatalog catalog, UnitEscrowLocker escrow) =>
{
    var unit = catalog.GetById(id);
    if (unit is null)
        return Results.NotFound(new ProblemDetails { Title = "Residence not found", Detail = $"Unit '{id}' does not exist." });

    var heldIds = escrow.GetActivelyHeldUnitIds();
    var projected = heldIds.Contains(unit.Id) && unit.Status == UnitAvailabilityStatus.Available
        ? unit with { Status = UnitAvailabilityStatus.Reserved }
        : unit;

    return Results.Ok(projected);
});

// POST /api/v1/underwriting/stress-test
v1.MapPost("/underwriting/stress-test", (
    UnderwritingStressTestRequest request,
    MortgageUnderwritingEngine engine) =>
{
    if (request.PropertyPriceVnd < 1_000_000_000L ||
        request.DownPaymentPct < 5m || request.DownPaymentPct > 95m ||
        request.LoanTermYears < 1 || request.LoanTermYears > 35 ||
        request.AnnualInterestRatePct < 0m || request.AnnualInterestRatePct > 30m ||
        request.MonthlyIncomeVnd <= 0L)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["request"] = ["PropertyPriceVnd >= 1B VND, DownPaymentPct in [5, 95], LoanTermYears in [1, 35], AnnualInterestRatePct in [0, 30], and MonthlyIncomeVnd > 0 are required."]
        });
    }

    var result = engine.EvaluateUnderwriting(request);
    return Results.Ok(result);
});

// POST /api/v1/escrow/hold (requires Idempotency-Key header)
v1.MapPost("/escrow/hold", (
    HttpContext httpContext,
    EscrowHoldRequest request,
    UnitEscrowLocker escrow) =>
{
    var idempotencyKey = httpContext.Request.Headers["Idempotency-Key"].FirstOrDefault();
    if (string.IsNullOrWhiteSpace(idempotencyKey))
    {
        return Results.BadRequest(new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Missing Idempotency-Key header",
            Detail = "POST /api/v1/escrow/hold requires a unique non-empty 'Idempotency-Key' header to guarantee exactly-once escrow lock semantics."
        });
    }

    var outcome = escrow.AcquireHold(idempotencyKey, request);

    switch (outcome.Status)
    {
        case EscrowHoldStatus.Created:
            httpContext.Response.Headers["X-Idempotency-Status"] = "CREATED";
            return Results.Created($"/api/v1/escrow/holds/{outcome.Receipt!.HoldId}", outcome.Receipt);

        case EscrowHoldStatus.IdempotentReplay:
            httpContext.Response.Headers["X-Idempotency-Status"] = "REPLAYED";
            return Results.Ok(outcome.Receipt);

        case EscrowHoldStatus.UnitNotFound:
            return Results.NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Residence not found",
                Detail = outcome.ErrorMessage
            });

        case EscrowHoldStatus.ValidationFailed:
            return Results.BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid escrow hold request",
                Detail = outcome.ErrorMessage
            });

        case EscrowHoldStatus.ConflictAlreadyHeld:
        case EscrowHoldStatus.ConflictIdempotencyKeyMismatch:
        case EscrowHoldStatus.ConflictUnitSold:
            return Results.Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = outcome.Status == EscrowHoldStatus.ConflictAlreadyHeld
                    ? "Residence already locked in active escrow"
                    : outcome.Status == EscrowHoldStatus.ConflictUnitSold
                        ? "Residence already sold"
                        : "Idempotency key payload mismatch",
                Detail = outcome.ErrorMessage,
                Extensions =
                {
                    ["conflictCode"] = outcome.Status.ToString(),
                    ["existingHoldId"] = outcome.ConflictHoldId,
                    ["expiresAtUtc"] = outcome.ConflictExpiresAtUtc
                }
            });

        default:
            return Results.StatusCode(StatusCodes.Status500InternalServerError);
    }
});

// GET /api/v1/escrow/holds/{holdId}
v1.MapGet("/escrow/holds/{holdId}", (string holdId, UnitEscrowLocker escrow) =>
{
    var receipt = escrow.GetHoldById(holdId);
    return receipt is null
        ? Results.NotFound(new ProblemDetails { Title = "Escrow hold not found", Detail = $"Hold '{holdId}' does not exist." })
        : Results.Ok(receipt);
});

// POST /api/v1/architecture/solar-exposure
v1.MapPost("/architecture/solar-exposure", (
    SolarExposureRequest request,
    SaigonSolarEngine solarEngine) =>
{
    if (request.LocalHour < 6.0 || request.LocalHour > 18.0 ||
        double.IsNaN(request.FacadeAzimuthDeg) || double.IsInfinity(request.FacadeAzimuthDeg))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["localHour"] = ["LocalHour must be between 6.0 and 18.0 (Ho Chi Minh City ICT) and FacadeAzimuthDeg must be finite."]
        });
    }

    var exposure = solarEngine.ComputeExposure(request);
    return Results.Ok(exposure);
});

// GET /api/v1/market/saigon-districts
v1.MapGet("/market/saigon-districts", (string? sortBy, SaigonMarketCatalog marketCatalog) =>
{
    try
    {
        var summary = marketCatalog.GetMarketSummary(sortBy);
        return Results.Ok(summary);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Invalid sortBy parameter",
            Detail = ex.Message
        });
    }
});

// POST /api/v1/investment/asset-benchmark
v1.MapPost("/investment/asset-benchmark", (
    AssetBenchmarkRequest request,
    AssetBenchmarkEngine benchmarkEngine) =>
{
    if (request.InitialCapitalVnd < 1_000_000_000L || request.InitialCapitalVnd > 500_000_000_000L ||
        request.HorizonYears < 1 || request.HorizonYears > 20 ||
        request.LtvPct < 0m || request.LtvPct > 85m ||
        request.MortgageInterestRatePct < 0m || request.MortgageInterestRatePct > 30m ||
        request.LoanTermYears < 5 || request.LoanTermYears > 35 ||
        request.BankDepositRatePct < 0m || request.BankDepositRatePct > 25m)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["request"] = ["InitialCapitalVnd must be in [1B, 500B] VND, HorizonYears in [1, 20], LtvPct in [0, 85], LoanTermYears in [5, 35], and rates within institutional bounds."]
        });
    }

    var result = benchmarkEngine.ComputeBenchmark(request);
    return Results.Ok(result);
});

app.Run();

public partial class Program;
