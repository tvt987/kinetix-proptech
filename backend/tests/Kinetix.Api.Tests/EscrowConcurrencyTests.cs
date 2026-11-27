using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kinetix.Domain.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kinetix.Api.Tests;

public sealed class EscrowConcurrencyTests
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private static HttpRequestMessage BuildHoldHttpRequest(string? idempotencyKey, EscrowHoldRequest body)
    {
        var msg = new HttpRequestMessage(HttpMethod.Post, "/api/v1/escrow/hold")
        {
            Content = JsonContent.Create(body, options: JsonOpts)
        };
        if (idempotencyKey is not null)
        {
            msg.Headers.Add("Idempotency-Key", idempotencyKey);
        }
        return msg;
    }

    [Fact]
    public async Task PostEscrowHold_WithoutIdempotencyKey_Returns400BadRequest()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        var body = new EscrowHoldRequest("knx-40p", "Nguyen Minh Quan", "quan@capital.vn", 200_000_000L);
        using var response = await client.SendAsync(BuildHoldHttpRequest(null, body));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostEscrowHold_FirstRequestReturns201Created_AndIdempotentRetryReturns200WithSameReceipt()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        var key = "idem-knx-40p-buyer-001";
        var body = new EscrowHoldRequest("knx-40p", "Alexander Tran", "alex@privatewealth.sg", 500_000_000L, "KNX-2026-A84F");

        using var firstResp = await client.SendAsync(BuildHoldHttpRequest(key, body));
        Assert.Equal(HttpStatusCode.Created, firstResp.StatusCode);
        Assert.Equal("CREATED", firstResp.Headers.GetValues("X-Idempotency-Status").Single());
        var firstReceipt = await firstResp.Content.ReadFromJsonAsync<EscrowHoldReceipt>(JsonOpts);
        Assert.NotNull(firstReceipt);
        Assert.Equal("K-40P", firstReceipt.UnitCode);
        Assert.Equal("970407", firstReceipt.BankBin);
        Assert.Contains("KNX-2026-A84F", firstReceipt.TransferMemo);

        // Retry with exact same Idempotency-Key -> 200 OK replay with identical HoldId & CreatedAtUtc
        using var retryResp = await client.SendAsync(BuildHoldHttpRequest(key, body));
        Assert.Equal(HttpStatusCode.OK, retryResp.StatusCode);
        Assert.Equal("REPLAYED", retryResp.Headers.GetValues("X-Idempotency-Status").Single());
        var replayReceipt = await retryResp.Content.ReadFromJsonAsync<EscrowHoldReceipt>(JsonOpts);
        Assert.NotNull(replayReceipt);
        Assert.Equal(firstReceipt.HoldId, replayReceipt.HoldId);
        Assert.Equal(firstReceipt.CreatedAtUtc, replayReceipt.CreatedAtUtc);

        // Inspect hold via GET /api/v1/escrow/holds/{holdId}
        using var getResp = await client.GetAsync($"/api/v1/escrow/holds/{firstReceipt.HoldId}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
    }

    [Fact]
    public async Task PostEscrowHold_ReusingIdempotencyKeyForDifferentUnit_Returns409Conflict()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        var key = "idem-reused-mismatch-01";
        var first = new EscrowHoldRequest("knx-28a", "Buyer A", "a@kinetix.vn", 200_000_000L);
        var mismatch = new EscrowHoldRequest("knx-30b", "Buyer A", "a@kinetix.vn", 200_000_000L);

        using var r1 = await client.SendAsync(BuildHoldHttpRequest(key, first));
        Assert.Equal(HttpStatusCode.Created, r1.StatusCode);

        using var r2 = await client.SendAsync(BuildHoldHttpRequest(key, mismatch));
        Assert.Equal(HttpStatusCode.Conflict, r2.StatusCode);
    }

    [Fact]
    public async Task PostEscrowHold_SoldUnit_Returns409Conflict()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        // knx-26c is permanently SOLD
        var body = new EscrowHoldRequest("knx-26c", "Late Buyer", "late@kinetix.vn", 200_000_000L);
        using var resp = await client.SendAsync(BuildHoldHttpRequest("idem-sold-unit", body));
        Assert.Equal(HttpStatusCode.Conflict, resp.StatusCode);
    }

    [Fact]
    public async Task PostEscrowHold_UnknownUnit_Returns404NotFound()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        var body = new EscrowHoldRequest("knx-99z", "Ghost Buyer", "ghost@kinetix.vn", 200_000_000L);
        using var resp = await client.SendAsync(BuildHoldHttpRequest("idem-unknown-unit", body));
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task PostEscrowHold_TenWayConcurrentRaceOnSameUnit_ReturnsStrictly1x201And9x409()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        // Launch 10 simultaneous distinct buyers attempting to lock Crown Duplex K-42P
        var tasks = Enumerable.Range(1, 10).Select(async buyerIdx =>
        {
            var body = new EscrowHoldRequest(
                UnitId: "knx-42p",
                BuyerName: $"VIP Buyer {buyerIdx:D2}",
                BuyerEmail: $"buyer{buyerIdx:D2}@familyoffice.vn",
                DepositAmountVnd: 500_000_000L
            );
            using var resp = await client.SendAsync(BuildHoldHttpRequest($"race-key-{buyerIdx:D2}", body));
            return resp.StatusCode;
        });

        var statuses = await Task.WhenAll(tasks);

        var createdCount = statuses.Count(s => s == HttpStatusCode.Created);
        var conflictCount = statuses.Count(s => s == HttpStatusCode.Conflict);

        Assert.Equal(1, createdCount);
        Assert.Equal(9, conflictCount);

        // Verify GET /api/v1/residences/knx-42p now reflects Reserved status
        var unit = await client.GetFromJsonAsync<ResidenceUnit>("/api/v1/residences/knx-42p", JsonOpts);
        Assert.NotNull(unit);
        Assert.Equal(UnitAvailabilityStatus.Reserved, unit.Status);
    }

    [Fact]
    public async Task PostEscrowHold_DistinctAvailableUnitsConcurrently_AllReturn201Created()
    {
        await using var factory = new WebApplicationFactory<Program>();
        var client = factory.CreateClient();

        string[] unitIds = ["knx-18a", "knx-24a", "knx-32a", "knx-36a"];
        var tasks = unitIds.Select(async (unitId, idx) =>
        {
            var body = new EscrowHoldRequest(unitId, $"Investor {idx}", $"inv{idx}@capital.vn", 200_000_000L);
            using var resp = await client.SendAsync(BuildHoldHttpRequest($"multi-unit-{unitId}", body));
            return resp.StatusCode;
        });

        var statuses = await Task.WhenAll(tasks);
        Assert.All(statuses, s => Assert.Equal(HttpStatusCode.Created, s));
    }
}
