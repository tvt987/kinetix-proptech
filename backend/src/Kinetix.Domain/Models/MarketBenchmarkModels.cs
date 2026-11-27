namespace Kinetix.Domain.Models;

public sealed record SaigonDistrictTelemetry(
    string Id,
    string Code,
    string NameEn,
    string NameVi,
    string ZoneTagEn,
    string ZoneTagVi,
    long PricePerSqmVnd,
    int PricePerSqmUsd,
    decimal GrossRentalYieldPct,
    decimal NetRentalYieldPct,
    decimal OccupancyPct,
    decimal FiveYearAppreciationCagrPct,
    int CommuteToCbdMin,
    string NearestMetroStationEn,
    string NearestMetroStationVi,
    int MetroTransitMin,
    string CatalystHeadlineEn,
    string CatalystHeadlineVi,
    IReadOnlyList<string> CatalystTagsEn,
    int SupplyScarcityScore,
    int ForeignQuotaDemandPct,
    bool IsKinetixHome
);

public sealed record SaigonMarketSummaryResponse(
    string City,
    string ReferenceQuarter,
    int FxRateVndPerUsd,
    int DistrictCount,
    long AveragePricePerSqmVnd,
    decimal AverageNetYieldPct,
    decimal AverageAppreciationPct,
    string HighestYieldDistrictId,
    string HighestAppreciationDistrictId,
    string FastestCommuteDistrictId,
    IReadOnlyList<SaigonDistrictTelemetry> Districts
);

public enum BenchmarkAssetClassId
{
    KinetixProperty,
    VnBankDeposit,
    SjcGold,
    Sp500Usd
}

public sealed record AssetBenchmarkRequest(
    long InitialCapitalVnd,
    int HorizonYears = 10,
    decimal LtvPct = 70m,
    decimal MortgageInterestRatePct = 7.2m,
    int LoanTermYears = 20,
    decimal PropertyAppreciationPct = 8.4m,
    decimal PropertyGrossYieldPct = 6.8m,
    decimal BankDepositRatePct = 5.8m,
    decimal GoldAnnualReturnPct = 8.5m,
    decimal Sp500UsdReturnPct = 9.5m,
    decimal VndDepreciationPct = 2.2m,
    bool IncludeFxHedge = true
);

public sealed record AssetYearPoint(
    int Year,
    long KinetixPropertyVnd,
    long VnBankDepositVnd,
    long SjcGoldVnd,
    long Sp500UsdVnd
);

public sealed record AssetClassMetrics(
    BenchmarkAssetClassId Id,
    string LabelEn,
    string LabelVi,
    long InitialCapitalVnd,
    long EndingWealthVnd,
    long TotalNetProfitVnd,
    decimal EquityMultiple,
    decimal NetIrrPct,
    decimal AnnualVolatilityPct,
    decimal SharpeRatio,
    string LiquidityTier,
    int InflationHedgeScore,
    IReadOnlyList<long> YearlyWealthVnd
);

public sealed record AssetBenchmarkResponse(
    long InitialCapitalVnd,
    long ImpliedPropertyValueVnd,
    long ImpliedLoanPrincipalVnd,
    decimal LtvPct,
    int HorizonYears,
    decimal RiskFreeRatePct,
    decimal PropertyAppreciationPct,
    decimal PropertyGrossYieldPct,
    decimal EffectiveSp500VndReturnPct,
    BenchmarkAssetClassId WinnerAssetId,
    long PropertyAlphaVsBankVnd,
    long PropertyAlphaVsGoldVnd,
    long PropertyAlphaVsSp500Vnd,
    IReadOnlyList<AssetClassMetrics> Assets,
    IReadOnlyList<AssetYearPoint> Trajectory
);
