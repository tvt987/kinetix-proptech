namespace Kinetix.Domain.Models;

public enum DtiSafetyTier
{
    Safe,
    Caution,
    HighRisk
}

public sealed record UnderwritingStressTestRequest(
    long PropertyPriceVnd,
    decimal DownPaymentPct,
    int LoanTermYears,
    decimal AnnualInterestRatePct,
    long EstimatedMonthlyRentVnd,
    long MonthlyMaintenanceFeeVnd,
    decimal AnnualAppreciationPct,
    long MonthlyIncomeVnd,
    decimal ActiveRateShockPct = 2.0m,
    decimal VacancyMonthsPerYear = 0.8m,
    decimal ManagementAndTaxRatePct = 10.0m,
    decimal LeverageLtvPct = 70.0m
);

public sealed record AmortizationYearRow(
    int Year,
    long OpeningBalanceVnd,
    long AnnualPaymentVnd,
    long PrincipalPaidVnd,
    long InterestPaidVnd,
    long EndingBalanceVnd,
    long CumulativeInterestVnd,
    long CumulativePrincipalVnd
);

public sealed record ReducingBalanceSummary(
    long FirstMonthPaymentVnd,
    long FinalMonthPaymentVnd,
    long AverageMonthlyPaymentVnd,
    long TotalPaymentsVnd,
    long TotalInterestVnd,
    long InterestSavingsVsAnnuityVnd,
    IReadOnlyList<AmortizationYearRow> Schedule
);

public sealed record InterestStressScenario(
    decimal ShockPct,
    decimal EffectiveRatePct,
    long MonthlyPaymentVnd,
    long DeltaMonthlyPaymentVnd,
    long TotalInterestVnd,
    long DeltaTotalInterestVnd,
    long MonthlyNetCashFlowVnd,
    decimal DtiRatioPct,
    DtiSafetyTier DtiSafetyTier
);

public sealed record LeverageStrategySummary(
    string Label,
    decimal LtvPct,
    long InitialEquityVnd,
    long LoanPrincipalVnd,
    long TenYearGrossRentVnd,
    long TenYearOperatingFeesVnd,
    long TenYearInterestPaidVnd,
    long Year10PropertyValueVnd,
    long Year10RemainingDebtVnd,
    long NetExitProceedsVnd,
    long TotalNetProfitVnd,
    decimal EquityMultiple,
    decimal NetIrrPct
);

public sealed record CashVsLeverageComparison(
    int HorizonYears,
    LeverageStrategySummary CashStrategy,
    LeverageStrategySummary LeveragedStrategy,
    decimal IrrSpreadPct,
    long CapitalFreedVnd
);

public sealed record UnderwritingStressTestResponse(
    long PropertyPriceVnd,
    long DownPaymentVnd,
    long LoanPrincipalVnd,
    long BaseMonthlyAnnuityPmtVnd,
    long TotalAnnuityInterestVnd,
    decimal GrossRentalYieldPct,
    decimal NetRentalYieldPct,
    long MonthlyNetCashFlowVnd,
    ReducingBalanceSummary ReducingBalance,
    InterestStressScenario ActiveStressScenario,
    IReadOnlyList<InterestStressScenario> BenchmarkScenarios,
    IReadOnlyList<AmortizationYearRow> FixedAnnuitySchedule,
    CashVsLeverageComparison TenYearLeverageComparison
);
