using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kinetix.Domain.Models;
using Kinetix.Domain.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kinetix.Api.Tests;

public sealed class UnderwritingTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private readonly HttpClient _client;
    private readonly MortgageUnderwritingEngine _engine = new();

    public UnderwritingTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private static UnderwritingStressTestRequest CreatePenthouseRequest(
        long monthlyIncomeVnd = 950_000_000L,
        decimal activeShockPct = 2.0m,
        decimal annualRatePct = 7.2m,
        decimal appreciationPct = 6.0m) =>
        new(
            PropertyPriceVnd: 68_500_000_000L,
            DownPaymentPct: 30m,
            LoanTermYears: 20,
            AnnualInterestRatePct: annualRatePct,
            EstimatedMonthlyRentVnd: 410_000_000L,
            MonthlyMaintenanceFeeVnd: 14_976_000L,
            AnnualAppreciationPct: appreciationPct,
            MonthlyIncomeVnd: monthlyIncomeVnd,
            ActiveRateShockPct: activeShockPct
        );

    [Fact]
    public void FixedAnnuityPmt_MatchesStandardBankingFormula_AndAmortizesToExactZero()
    {
        var principal = 10_000_000_000L; // 10B VND
        var pmt = _engine.CalculateMonthlyAnnuityPmt(principal, 7.2m, 20);
        // Standard PMT(7.2%/12, 240, 10B) ≈ 78,735,085 VND
        Assert.InRange(pmt, 78_700_000d, 78_770_000d);

        var schedule = _engine.GenerateFixedAnnuitySchedule(principal, 7.2m, 20);
        Assert.Equal(20, schedule.Count);
        Assert.Equal(principal, schedule[0].OpeningBalanceVnd);
        Assert.Equal(0L, schedule[^1].EndingBalanceVnd);
        Assert.Equal(principal, schedule[^1].CumulativePrincipalVnd);
    }

    [Fact]
    public void ReducingBalanceSchedule_HasDecliningPayments_AndSavesInterestVsFixedAnnuity()
    {
        var req = CreatePenthouseRequest();
        var result = _engine.EvaluateUnderwriting(req);

        Assert.Equal(20, result.ReducingBalance.Schedule.Count);
        Assert.Equal(0L, result.ReducingBalance.Schedule[^1].EndingBalanceVnd);
        Assert.True(result.ReducingBalance.FirstMonthPaymentVnd > result.ReducingBalance.FinalMonthPaymentVnd);
        Assert.True(result.ReducingBalance.TotalInterestVnd < result.TotalAnnuityInterestVnd);
        Assert.True(result.ReducingBalance.InterestSavingsVsAnnuityVnd > 0L);
    }

    [Fact]
    public void StressTest_RateShocks_AreStrictlyMonotonicAcrossBasePlus2Plus4()
    {
        var result = _engine.EvaluateUnderwriting(CreatePenthouseRequest());

        Assert.Equal(3, result.BenchmarkScenarios.Count);
        var baseSc = result.BenchmarkScenarios[0];
        var shock2 = result.BenchmarkScenarios[1];
        var shock4 = result.BenchmarkScenarios[2];

        Assert.Equal(0m, baseSc.ShockPct);
        Assert.Equal(0L, baseSc.DeltaMonthlyPaymentVnd);
        Assert.Equal(2m, shock2.ShockPct);
        Assert.Equal(4m, shock4.ShockPct);

        Assert.True(shock2.MonthlyPaymentVnd > baseSc.MonthlyPaymentVnd);
        Assert.True(shock4.MonthlyPaymentVnd > shock2.MonthlyPaymentVnd);
        Assert.True(shock4.TotalInterestVnd > shock2.TotalInterestVnd);
        Assert.True(shock4.DtiRatioPct > shock2.DtiRatioPct);
    }

    [Fact]
    public void StressTest_Plus4PercentShock_TriggersDtiBreachFromCautionToHighRisk()
    {
        // Choose income where base 7.2% PMT (~377.5M) is ~39% DTI (Caution),
        // +2% shock (~438M) is ~46% DTI (Caution),
        // +4% shock (~502M) breaches >50% DTI (HighRisk)!
        var req = CreatePenthouseRequest(monthlyIncomeVnd: 950_000_000L, activeShockPct: 4.0m);
        var result = _engine.EvaluateUnderwriting(req);

        var baseSc = result.BenchmarkScenarios[0];
        var shock4 = result.BenchmarkScenarios[2];

        Assert.Equal(DtiSafetyTier.Caution, baseSc.DtiSafetyTier);
        Assert.True(shock4.DtiRatioPct > 50m);
        Assert.Equal(DtiSafetyTier.HighRisk, shock4.DtiSafetyTier);
        Assert.Equal(DtiSafetyTier.HighRisk, result.ActiveStressScenario.DtiSafetyTier);
    }

    [Fact]
    public void StressTest_HighIncomeInvestor_RemainsBankGradeSafeAcrossAllShocks()
    {
        var req = CreatePenthouseRequest(monthlyIncomeVnd: 1_800_000_000L, activeShockPct: 4.0m);
        var result = _engine.EvaluateUnderwriting(req);

        Assert.All(result.BenchmarkScenarios, sc =>
        {
            Assert.True(sc.DtiRatioPct <= 35m);
            Assert.Equal(DtiSafetyTier.Safe, sc.DtiSafetyTier);
        });
    }

    [Fact]
    public void TenYearLeverageComparison_ComputesExactCapitalFreed_AndPositiveIrrAlphaAtLowBorrowingRate()
    {
        var req = CreatePenthouseRequest(annualRatePct: 6.5m, appreciationPct: 7.0m);
        var result = _engine.EvaluateUnderwriting(req);
        var cmp = result.TenYearLeverageComparison;

        Assert.Equal(10, cmp.HorizonYears);
        Assert.Equal(0m, cmp.CashStrategy.LtvPct);
        Assert.Equal(70m, cmp.LeveragedStrategy.LtvPct);
        Assert.Equal(cmp.LeveragedStrategy.LoanPrincipalVnd, cmp.CapitalFreedVnd);
        Assert.True(cmp.LeveragedStrategy.NetIrrPct > cmp.CashStrategy.NetIrrPct);
        Assert.True(cmp.IrrSpreadPct > 0m);
        Assert.True(cmp.LeveragedStrategy.EquityMultiple > cmp.CashStrategy.EquityMultiple);
    }

    [Fact]
    public async Task PostUnderwritingStressTest_Endpoint_Returns200WithFullPayload()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/underwriting/stress-test", CreatePenthouseRequest(), JsonOpts);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<UnderwritingStressTestResponse>(JsonOpts);
        Assert.NotNull(payload);
        Assert.Equal(47_950_000_000L, payload.LoanPrincipalVnd);
        Assert.Equal(3, payload.BenchmarkScenarios.Count);
        Assert.Equal(20, payload.FixedAnnuitySchedule.Count);
        Assert.Equal(20, payload.ReducingBalance.Schedule.Count);
    }

    [Fact]
    public async Task PostUnderwritingStressTest_Endpoint_Returns400OnInvalidInputs()
    {
        var invalid = CreatePenthouseRequest(monthlyIncomeVnd: 0L);
        var response = await _client.PostAsJsonAsync("/api/v1/underwriting/stress-test", invalid, JsonOpts);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
