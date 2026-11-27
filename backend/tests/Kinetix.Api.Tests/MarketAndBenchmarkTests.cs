using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kinetix.Domain.Models;
using Kinetix.Domain.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kinetix.Api.Tests;

public sealed class MarketAndBenchmarkTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private readonly HttpClient _client;
    private readonly SaigonMarketCatalog _catalog = new();
    private readonly AssetBenchmarkEngine _benchmarkEngine = new(new MortgageUnderwritingEngine());

    public MarketAndBenchmarkTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetSaigonDistricts_ReturnsAll6LuxuryCorridorsWithCompleteTelemetry()
    {
        var resp = await _client.GetAsync("/api/v1/market/saigon-districts");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var summary = await resp.Content.ReadFromJsonAsync<SaigonMarketSummaryResponse>(JsonOpts);
        Assert.NotNull(summary);
        Assert.Equal(6, summary.DistrictCount);
        Assert.Equal(6, summary.Districts.Count);
        Assert.Equal("thao-dien", summary.HighestYieldDistrictId);
        Assert.Equal("thu-thiem", summary.HighestAppreciationDistrictId);
        Assert.Equal("ben-nghe", summary.FastestCommuteDistrictId);
        Assert.Equal(SaigonMarketCatalog.FxRateVndPerUsd, summary.FxRateVndPerUsd);
    }

    [Fact]
    public async Task GetSaigonDistricts_SupportsSortByYieldAppreciationPriceAndCommute()
    {
        var byYield = await _client.GetFromJsonAsync<SaigonMarketSummaryResponse>("/api/v1/market/saigon-districts?sortBy=yield", JsonOpts);
        Assert.NotNull(byYield);
        Assert.Equal("thao-dien", byYield.Districts[0].Id);
        Assert.Equal("ben-nghe", byYield.Districts[^1].Id);

        var byPrice = await _client.GetFromJsonAsync<SaigonMarketSummaryResponse>("/api/v1/market/saigon-districts?sortBy=price", JsonOpts);
        Assert.NotNull(byPrice);
        Assert.Equal("ben-nghe", byPrice.Districts[0].Id);

        var byAppreciation = await _client.GetFromJsonAsync<SaigonMarketSummaryResponse>("/api/v1/market/saigon-districts?sortBy=appreciation", JsonOpts);
        Assert.NotNull(byAppreciation);
        Assert.Equal("thu-thiem", byAppreciation.Districts[0].Id);

        var byCommute = await _client.GetFromJsonAsync<SaigonMarketSummaryResponse>("/api/v1/market/saigon-districts?sortBy=commute", JsonOpts);
        Assert.NotNull(byCommute);
        Assert.Equal("ben-nghe", byCommute.Districts[0].Id);
        Assert.Equal("phu-my-hung", byCommute.Districts[^1].Id);
    }

    [Fact]
    public async Task GetSaigonDistricts_Returns400OnUnsupportedSortBy()
    {
        var resp = await _client.GetAsync("/api/v1/market/saigon-districts?sortBy=invalidMetric");
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public void SaigonCatalog_ThuThiemIsMarkedKinetixHome_AndAllUsdPricesMatchFxRate()
    {
        var districts = _catalog.GetAll();
        var homes = districts.Where(d => d.IsKinetixHome).ToList();
        Assert.Single(homes);
        Assert.Equal("thu-thiem", homes[0].Id);

        Assert.All(districts, d =>
        {
            var expectedUsd = (int)Math.Round((double)d.PricePerSqmVnd / SaigonMarketCatalog.FxRateVndPerUsd, MidpointRounding.AwayFromZero);
            Assert.Equal(expectedUsd, d.PricePerSqmUsd);
            Assert.True(d.GrossRentalYieldPct > d.NetRentalYieldPct);
            Assert.InRange(d.OccupancyPct, 90m, 99m);
            Assert.True(d.CommuteToCbdMin > 0);
        });
    }

    [Fact]
    public void AssetBenchmark_CompoundsBankDepositAtExact5Point8PercentOver10Years()
    {
        const long capital = 10_000_000_000L;
        var res = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(capital));
        var bank = res.Assets.Single(a => a.Id == BenchmarkAssetClassId.VnBankDeposit);

        var expected = (long)Math.Round(capital * Math.Pow(1.058d, 10), MidpointRounding.AwayFromZero);
        Assert.Equal(expected, bank.EndingWealthVnd);
        Assert.Equal(5.80m, bank.NetIrrPct);
        Assert.Equal(0m, bank.SharpeRatio);
        Assert.Equal(1.76m, bank.EquityMultiple);
    }

    [Fact]
    public void AssetBenchmark_CompoundsSjcGoldAtExact8Point5PercentOver10Years()
    {
        const long capital = 10_000_000_000L;
        var res = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(capital));
        var gold = res.Assets.Single(a => a.Id == BenchmarkAssetClassId.SjcGold);

        var expected = (long)Math.Round(capital * Math.Pow(1.085d, 10), MidpointRounding.AwayFromZero);
        Assert.Equal(expected, gold.EndingWealthVnd);
        Assert.Equal(8.50m, gold.NetIrrPct);
        Assert.Equal(2.26m, gold.EquityMultiple);
        Assert.True(gold.SharpeRatio > 0m);
    }

    [Fact]
    public void AssetBenchmark_CompoundsSp500WithAndWithoutVndFxHedge()
    {
        const long capital = 15_000_000_000L;
        var hedged = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(capital, IncludeFxHedge: true));
        var unhedged = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(capital, IncludeFxHedge: false));

        var spHedged = hedged.Assets.Single(a => a.Id == BenchmarkAssetClassId.Sp500Usd);
        var spUnhedged = unhedged.Assets.Single(a => a.Id == BenchmarkAssetClassId.Sp500Usd);

        Assert.Equal(11.91m, hedged.EffectiveSp500VndReturnPct);
        Assert.Equal(9.50m, unhedged.EffectiveSp500VndReturnPct);
        Assert.True(spHedged.EndingWealthVnd > spUnhedged.EndingWealthVnd);
        Assert.True(spHedged.SharpeRatio > spUnhedged.SharpeRatio);
    }

    [Fact]
    public void AssetBenchmark_LeveragedProperty70LtvOutperformsAllPeersUnderThuThiemCatalyst()
    {
        var res = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(
            InitialCapitalVnd: 15_000_000_000L,
            LtvPct: 70m,
            PropertyAppreciationPct: 8.4m,
            PropertyGrossYieldPct: 6.8m
        ));

        Assert.Equal(50_000_000_000L, res.ImpliedPropertyValueVnd);
        Assert.Equal(35_000_000_000L, res.ImpliedLoanPrincipalVnd);
        Assert.Equal(BenchmarkAssetClassId.KinetixProperty, res.WinnerAssetId);
        Assert.True(res.PropertyAlphaVsBankVnd > 0L);
        Assert.True(res.PropertyAlphaVsGoldVnd > 0L);
        Assert.True(res.PropertyAlphaVsSp500Vnd > 0L);
    }

    [Fact]
    public void AssetBenchmark_DepressedPropertyAppreciationReflectsLeverageDrag_Sp500Wins()
    {
        var res = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(
            InitialCapitalVnd: 15_000_000_000L,
            LtvPct: 70m,
            MortgageInterestRatePct: 9.5m,
            PropertyAppreciationPct: 2.0m,
            PropertyGrossYieldPct: 5.0m
        ));

        Assert.Equal(BenchmarkAssetClassId.Sp500Usd, res.WinnerAssetId);
        Assert.True(res.PropertyAlphaVsSp500Vnd < 0L);
    }

    [Fact]
    public void AssetBenchmark_TrajectoryStartsAtExactInitialCapitalAndSpansYear0To10()
    {
        const long capital = 20_000_000_000L;
        var res = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(capital));

        Assert.Equal(11, res.Trajectory.Count);
        Assert.Equal(0, res.Trajectory[0].Year);
        Assert.Equal(10, res.Trajectory[^1].Year);
        Assert.Equal(capital, res.Trajectory[0].KinetixPropertyVnd);
        Assert.Equal(capital, res.Trajectory[0].VnBankDepositVnd);
        Assert.Equal(capital, res.Trajectory[0].SjcGoldVnd);
        Assert.Equal(capital, res.Trajectory[0].Sp500UsdVnd);
    }

    [Fact]
    public void AssetBenchmark_ScalesLinearlyAcross5BTo30BCapitalRangeWithInvariantIrr()
    {
        var low = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(5_000_000_000L));
        var high = _benchmarkEngine.ComputeBenchmark(new AssetBenchmarkRequest(30_000_000_000L));

        var lowProp = low.Assets.Single(a => a.Id == BenchmarkAssetClassId.KinetixProperty);
        var highProp = high.Assets.Single(a => a.Id == BenchmarkAssetClassId.KinetixProperty);

        var ratio = (double)highProp.EndingWealthVnd / lowProp.EndingWealthVnd;
        Assert.InRange(ratio, 5.99d, 6.01d);
        Assert.Equal(lowProp.NetIrrPct, highProp.NetIrrPct);
        Assert.Equal(lowProp.SharpeRatio, highProp.SharpeRatio);
    }

    [Fact]
    public async Task PostAssetBenchmark_Endpoint_Returns200WithAll4AssetClassesAnd11TrajectoryPoints()
    {
        var req = new AssetBenchmarkRequest(
            InitialCapitalVnd: 15_000_000_000L,
            HorizonYears: 10,
            LtvPct: 70m,
            MortgageInterestRatePct: 7.2m,
            PropertyAppreciationPct: 8.4m,
            PropertyGrossYieldPct: 6.8m
        );

        var resp = await _client.PostAsJsonAsync("/api/v1/investment/asset-benchmark", req, JsonOpts);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var result = await resp.Content.ReadFromJsonAsync<AssetBenchmarkResponse>(JsonOpts);
        Assert.NotNull(result);
        Assert.Equal(4, result.Assets.Count);
        Assert.Equal(11, result.Trajectory.Count);
        Assert.Equal(BenchmarkAssetClassId.KinetixProperty, result.WinnerAssetId);
    }

    [Fact]
    public async Task PostAssetBenchmark_Endpoint_Returns400OnInvalidCapitalOrLtv()
    {
        var badCapital = new AssetBenchmarkRequest(InitialCapitalVnd: 500_000_000L);
        var resp1 = await _client.PostAsJsonAsync("/api/v1/investment/asset-benchmark", badCapital, JsonOpts);
        Assert.Equal(HttpStatusCode.BadRequest, resp1.StatusCode);

        var badLtv = new AssetBenchmarkRequest(InitialCapitalVnd: 15_000_000_000L, LtvPct: 95m);
        var resp2 = await _client.PostAsJsonAsync("/api/v1/investment/asset-benchmark", badLtv, JsonOpts);
        Assert.Equal(HttpStatusCode.BadRequest, resp2.StatusCode);
    }
}
