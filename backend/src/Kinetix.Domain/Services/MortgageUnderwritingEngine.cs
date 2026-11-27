using Kinetix.Domain.Models;

namespace Kinetix.Domain.Services;

public sealed class MortgageUnderwritingEngine
{
    public const double VietnamExitTransferTaxRate = 0.02;
    public const double AnnualRentEscalationRate = 0.03;

    /// <summary>
    /// Standard bank fixed-rate annuity PMT formula:
    /// PMT = P * r * (1 + r)^n / ((1 + r)^n - 1)
    /// </summary>
    public double CalculateMonthlyAnnuityPmt(long principalVnd, decimal annualInterestRatePct, int loanTermYears)
    {
        if (principalVnd <= 0 || loanTermYears <= 0)
            return 0d;

        var totalMonths = loanTermYears * 12;
        if (annualInterestRatePct <= 0m)
            return (double)principalVnd / totalMonths;

        var monthlyRate = (double)annualInterestRatePct / 100d / 12d;
        var growthFactor = Math.Pow(1d + monthlyRate, totalMonths);
        return principalVnd * monthlyRate * growthFactor / (growthFactor - 1d);
    }

    /// <summary>
    /// Generates an exact fixed-annuity year-by-year amortization schedule guaranteeing zero ending balance.
    /// </summary>
    public IReadOnlyList<AmortizationYearRow> GenerateFixedAnnuitySchedule(
        long principalVnd,
        decimal annualInterestRatePct,
        int loanTermYears)
    {
        if (principalVnd <= 0 || loanTermYears <= 0)
            return [];

        var totalMonths = loanTermYears * 12;
        var monthlyRate = annualInterestRatePct > 0m ? (double)annualInterestRatePct / 100d / 12d : 0d;
        var scheduledPmt = CalculateMonthlyAnnuityPmt(principalVnd, annualInterestRatePct, loanTermYears);

        double balance = principalVnd;
        double cumulativeInterest = 0d;
        double cumulativePrincipal = 0d;
        var rows = new List<AmortizationYearRow>(loanTermYears);

        for (var year = 1; year <= loanTermYears; year++)
        {
            var openingBalance = balance;
            double yearPrincipal = 0d;
            double yearInterest = 0d;
            double yearPayment = 0d;

            for (var m = 1; m <= 12; m++)
            {
                var monthIndex = (year - 1) * 12 + m;
                if (monthIndex > totalMonths || balance <= 0d)
                    break;

                var interestForMonth = balance * monthlyRate;
                var principalForMonth = scheduledPmt - interestForMonth;
                var actualPayment = scheduledPmt;

                if (monthIndex == totalMonths || principalForMonth >= balance)
                {
                    principalForMonth = balance;
                    actualPayment = principalForMonth + interestForMonth;
                }

                balance = Math.Max(0d, balance - principalForMonth);
                if (monthIndex == totalMonths)
                    balance = 0d;

                yearPrincipal += principalForMonth;
                yearInterest += interestForMonth;
                yearPayment += actualPayment;
            }

            cumulativeInterest += yearInterest;
            cumulativePrincipal += yearPrincipal;

            rows.Add(new AmortizationYearRow(
                Year: year,
                OpeningBalanceVnd: (long)Math.Round(openingBalance, MidpointRounding.AwayFromZero),
                AnnualPaymentVnd: (long)Math.Round(yearPayment, MidpointRounding.AwayFromZero),
                PrincipalPaidVnd: (long)Math.Round(yearPrincipal, MidpointRounding.AwayFromZero),
                InterestPaidVnd: (long)Math.Round(yearInterest, MidpointRounding.AwayFromZero),
                EndingBalanceVnd: year == loanTermYears ? 0L : (long)Math.Round(balance, MidpointRounding.AwayFromZero),
                CumulativeInterestVnd: (long)Math.Round(cumulativeInterest, MidpointRounding.AwayFromZero),
                CumulativePrincipalVnd: (long)Math.Round(cumulativePrincipal, MidpointRounding.AwayFromZero)
            ));
        }

        return rows;
    }

    /// <summary>
    /// Generates an exact Vietnam commercial bank reducing-balance (fixed monthly principal) schedule,
    /// where monthly principal = P / N and interest declines monotonically every month.
    /// </summary>
    public ReducingBalanceSummary GenerateReducingBalanceSchedule(
        long principalVnd,
        decimal annualInterestRatePct,
        int loanTermYears,
        long fixedAnnuityTotalInterestVnd)
    {
        if (principalVnd <= 0 || loanTermYears <= 0)
            return new ReducingBalanceSummary(0, 0, 0, 0, 0, 0, []);

        var totalMonths = loanTermYears * 12;
        var monthlyRate = annualInterestRatePct > 0m ? (double)annualInterestRatePct / 100d / 12d : 0d;
        var baseMonthlyPrincipal = (double)principalVnd / totalMonths;

        double balance = principalVnd;
        double cumulativeInterest = 0d;
        double cumulativePrincipal = 0d;
        double totalPayments = 0d;
        double firstMonthPayment = 0d;
        double finalMonthPayment = 0d;
        var rows = new List<AmortizationYearRow>(loanTermYears);

        for (var year = 1; year <= loanTermYears; year++)
        {
            var openingBalance = balance;
            double yearPrincipal = 0d;
            double yearInterest = 0d;
            double yearPayment = 0d;

            for (var m = 1; m <= 12; m++)
            {
                var monthIndex = (year - 1) * 12 + m;
                if (monthIndex > totalMonths || balance <= 0d)
                    break;

                var interestForMonth = balance * monthlyRate;
                var principalForMonth = monthIndex == totalMonths ? balance : baseMonthlyPrincipal;
                var actualPayment = principalForMonth + interestForMonth;

                if (monthIndex == 1) firstMonthPayment = actualPayment;
                if (monthIndex == totalMonths) finalMonthPayment = actualPayment;

                balance = monthIndex == totalMonths ? 0d : Math.Max(0d, balance - principalForMonth);

                yearPrincipal += principalForMonth;
                yearInterest += interestForMonth;
                yearPayment += actualPayment;
                totalPayments += actualPayment;
            }

            cumulativeInterest += yearInterest;
            cumulativePrincipal += yearPrincipal;

            rows.Add(new AmortizationYearRow(
                Year: year,
                OpeningBalanceVnd: (long)Math.Round(openingBalance, MidpointRounding.AwayFromZero),
                AnnualPaymentVnd: (long)Math.Round(yearPayment, MidpointRounding.AwayFromZero),
                PrincipalPaidVnd: (long)Math.Round(yearPrincipal, MidpointRounding.AwayFromZero),
                InterestPaidVnd: (long)Math.Round(yearInterest, MidpointRounding.AwayFromZero),
                EndingBalanceVnd: year == loanTermYears ? 0L : (long)Math.Round(balance, MidpointRounding.AwayFromZero),
                CumulativeInterestVnd: (long)Math.Round(cumulativeInterest, MidpointRounding.AwayFromZero),
                CumulativePrincipalVnd: (long)Math.Round(cumulativePrincipal, MidpointRounding.AwayFromZero)
            ));
        }

        var totalInterestRounded = (long)Math.Round(cumulativeInterest, MidpointRounding.AwayFromZero);
        var totalPaymentsRounded = (long)Math.Round(totalPayments, MidpointRounding.AwayFromZero);

        return new ReducingBalanceSummary(
            FirstMonthPaymentVnd: (long)Math.Round(firstMonthPayment, MidpointRounding.AwayFromZero),
            FinalMonthPaymentVnd: (long)Math.Round(finalMonthPayment, MidpointRounding.AwayFromZero),
            AverageMonthlyPaymentVnd: (long)Math.Round(totalPayments / totalMonths, MidpointRounding.AwayFromZero),
            TotalPaymentsVnd: totalPaymentsRounded,
            TotalInterestVnd: totalInterestRounded,
            InterestSavingsVsAnnuityVnd: Math.Max(0L, fixedAnnuityTotalInterestVnd - totalInterestRounded),
            Schedule: rows
        );
    }

    public DtiSafetyTier ClassifyDtiSafety(decimal dtiRatioPct)
    {
        if (dtiRatioPct <= 35m) return DtiSafetyTier.Safe;
        if (dtiRatioPct <= 50m) return DtiSafetyTier.Caution;
        return DtiSafetyTier.HighRisk;
    }

    public UnderwritingStressTestResponse EvaluateUnderwriting(UnderwritingStressTestRequest req)
    {
        var downPct = Math.Clamp(req.DownPaymentPct, 5m, 95m);
        var termYears = Math.Clamp(req.LoanTermYears, 1, 35);
        var baseRate = Math.Max(0m, req.AnnualInterestRatePct);
        var activeShock = Math.Clamp(req.ActiveRateShockPct, 0m, 8m);
        var safeIncome = Math.Max(1L, req.MonthlyIncomeVnd);

        var downPaymentVnd = (long)Math.Round(req.PropertyPriceVnd * (downPct / 100m), MidpointRounding.AwayFromZero);
        var loanPrincipalVnd = Math.Max(0L, req.PropertyPriceVnd - downPaymentVnd);

        var basePmtExact = CalculateMonthlyAnnuityPmt(loanPrincipalVnd, baseRate, termYears);
        var basePmtRounded = (long)Math.Round(basePmtExact, MidpointRounding.AwayFromZero);
        var baseTotalPayments = (long)Math.Round(basePmtExact * termYears * 12d, MidpointRounding.AwayFromZero);
        var baseTotalInterest = Math.Max(0L, baseTotalPayments - loanPrincipalVnd);
        var fixedSchedule = GenerateFixedAnnuitySchedule(loanPrincipalVnd, baseRate, termYears);
        var reducingBalance = GenerateReducingBalanceSchedule(loanPrincipalVnd, baseRate, termYears, baseTotalInterest);

        // Rental Yield Math
        var grossAnnualRent = req.EstimatedMonthlyRentVnd * 12m;
        var effectiveAnnualRent = req.EstimatedMonthlyRentVnd * Math.Max(0m, 12m - req.VacancyMonthsPerYear);
        var annualMaintenance = req.MonthlyMaintenanceFeeVnd * 12m;
        var annualTaxAndMgmt = effectiveAnnualRent * (req.ManagementAndTaxRatePct / 100m);
        var netAnnualRent = Math.Max(0m, effectiveAnnualRent - annualMaintenance - annualTaxAndMgmt);
        var monthlyNetRent = (double)netAnnualRent / 12d;

        var grossYieldPct = req.PropertyPriceVnd > 0
            ? Math.Round((grossAnnualRent / req.PropertyPriceVnd) * 100m, 2, MidpointRounding.AwayFromZero)
            : 0m;
        var netYieldPct = req.PropertyPriceVnd > 0
            ? Math.Round((netAnnualRent / req.PropertyPriceVnd) * 100m, 2, MidpointRounding.AwayFromZero)
            : 0m;

        InterestStressScenario BuildScenario(decimal shockPct)
        {
            var effRate = Math.Max(0m, baseRate + shockPct);
            var pmtExact = shockPct == 0m
                ? basePmtExact
                : CalculateMonthlyAnnuityPmt(loanPrincipalVnd, effRate, termYears);
            var pmtRounded = (long)Math.Round(pmtExact, MidpointRounding.AwayFromZero);
            var totalPayments = (long)Math.Round(pmtExact * termYears * 12d, MidpointRounding.AwayFromZero);
            var totalInterest = Math.Max(0L, totalPayments - loanPrincipalVnd);
            var netCashflow = (long)Math.Round(monthlyNetRent - pmtExact, MidpointRounding.AwayFromZero);
            var dtiPct = Math.Round(((decimal)pmtRounded / safeIncome) * 100m, 2, MidpointRounding.AwayFromZero);

            return new InterestStressScenario(
                ShockPct: shockPct,
                EffectiveRatePct: effRate,
                MonthlyPaymentVnd: pmtRounded,
                DeltaMonthlyPaymentVnd: Math.Max(0L, pmtRounded - basePmtRounded),
                TotalInterestVnd: totalInterest,
                DeltaTotalInterestVnd: Math.Max(0L, totalInterest - baseTotalInterest),
                MonthlyNetCashFlowVnd: netCashflow,
                DtiRatioPct: dtiPct,
                DtiSafetyTier: ClassifyDtiSafety(dtiPct)
            );
        }

        var benchmarks = new[] { 0m, 2m, 4m }.Select(BuildScenario).ToList();
        var activeScenario = benchmarks.FirstOrDefault(s => Math.Abs(s.ShockPct - activeShock) < 0.001m)
            ?? BuildScenario(activeShock);

        var leverageComparison = CompareCashVsLeverage(req, Math.Clamp(req.LeverageLtvPct, 30m, 80m), 10);

        return new UnderwritingStressTestResponse(
            PropertyPriceVnd: req.PropertyPriceVnd,
            DownPaymentVnd: downPaymentVnd,
            LoanPrincipalVnd: loanPrincipalVnd,
            BaseMonthlyAnnuityPmtVnd: basePmtRounded,
            TotalAnnuityInterestVnd: baseTotalInterest,
            GrossRentalYieldPct: grossYieldPct,
            NetRentalYieldPct: netYieldPct,
            MonthlyNetCashFlowVnd: (long)Math.Round(monthlyNetRent - basePmtExact, MidpointRounding.AwayFromZero),
            ReducingBalance: reducingBalance,
            ActiveStressScenario: activeScenario,
            BenchmarkScenarios: benchmarks,
            FixedAnnuitySchedule: fixedSchedule,
            TenYearLeverageComparison: leverageComparison
        );
    }

    public CashVsLeverageComparison CompareCashVsLeverage(
        UnderwritingStressTestRequest req,
        decimal leverageLtvPct = 70m,
        int horizonYears = 10)
    {
        var cash = BuildLeverageStrategy("CASH_100", 0m, req, horizonYears);
        var leveraged = BuildLeverageStrategy("LEVERAGED_70", leverageLtvPct, req, horizonYears);

        return new CashVsLeverageComparison(
            HorizonYears: horizonYears,
            CashStrategy: cash,
            LeveragedStrategy: leveraged,
            IrrSpreadPct: Math.Round(leveraged.NetIrrPct - cash.NetIrrPct, 2, MidpointRounding.AwayFromZero),
            CapitalFreedVnd: cash.InitialEquityVnd - leveraged.InitialEquityVnd
        );
    }

    private LeverageStrategySummary BuildLeverageStrategy(
        string label,
        decimal ltvPct,
        UnderwritingStressTestRequest req,
        int horizonYears)
    {
        var loanPrincipal = (long)Math.Round(req.PropertyPriceVnd * (ltvPct / 100m), MidpointRounding.AwayFromZero);
        var initialEquity = Math.Max(1L, req.PropertyPriceVnd - loanPrincipal);
        var termYears = Math.Clamp(req.LoanTermYears, 1, 35);
        var schedule = loanPrincipal > 0
            ? GenerateFixedAnnuitySchedule(loanPrincipal, req.AnnualInterestRatePct, termYears)
            : [];

        long tenYearGrossRent = 0;
        long tenYearOpFees = 0;
        long tenYearInterest = 0;
        long cumulativeOperatingCf = 0;

        var cashflows = new List<double>(horizonYears + 1) { -initialEquity };
        var appreciationRate = (double)req.AnnualAppreciationPct / 100d;
        var vacancyMonths = (double)req.VacancyMonthsPerYear;
        var taxAndMgmtRate = (double)req.ManagementAndTaxRatePct / 100d;

        long finalPropVal = req.PropertyPriceVnd;
        long finalDebt = 0;

        for (var yr = 1; yr <= horizonYears; yr++)
        {
            var esc = Math.Pow(1d + AnnualRentEscalationRate, yr - 1);
            var grossRent = (long)Math.Round(req.EstimatedMonthlyRentVnd * 12d * esc, MidpointRounding.AwayFromZero);
            var effRent = req.EstimatedMonthlyRentVnd * Math.Max(0d, 12d - vacancyMonths) * esc;
            var maint = req.MonthlyMaintenanceFeeVnd * 12L;
            var taxAndMgmt = (long)Math.Round(effRent * taxAndMgmtRate, MidpointRounding.AwayFromZero);
            var vacancyCost = (long)Math.Round(req.EstimatedMonthlyRentVnd * vacancyMonths * esc, MidpointRounding.AwayFromZero);
            var noi = Math.Max(0L, (long)Math.Round(effRent - maint - taxAndMgmt, MidpointRounding.AwayFromZero));

            var debtRow = schedule.FirstOrDefault(r => r.Year == yr);
            var debtService = debtRow?.AnnualPaymentVnd ?? 0L;
            var interestPaid = debtRow?.InterestPaidVnd ?? 0L;
            var remainingDebt = loanPrincipal > 0 ? (yr > termYears ? 0L : debtRow?.EndingBalanceVnd ?? 0L) : 0L;
            var propVal = (long)Math.Round(req.PropertyPriceVnd * Math.Pow(1d + appreciationRate, yr), MidpointRounding.AwayFromZero);
            var netCf = noi - debtService;

            tenYearGrossRent += grossRent;
            tenYearOpFees += maint + taxAndMgmt + vacancyCost;
            tenYearInterest += interestPaid;
            cumulativeOperatingCf += netCf;
            finalPropVal = propVal;
            finalDebt = remainingDebt;

            if (yr < horizonYears)
            {
                cashflows.Add(netCf);
            }
            else
            {
                var exitTax = (long)Math.Round(propVal * VietnamExitTransferTaxRate, MidpointRounding.AwayFromZero);
                var netExit = propVal - exitTax - remainingDebt;
                cashflows.Add(netCf + netExit);
            }
        }

        var finalExitTax = (long)Math.Round(finalPropVal * VietnamExitTransferTaxRate, MidpointRounding.AwayFromZero);
        var netExitProceeds = finalPropVal - finalExitTax - finalDebt;
        var totalDistributions = cumulativeOperatingCf + netExitProceeds;
        var totalNetProfit = totalDistributions - initialEquity;
        var equityMultiple = Math.Round((decimal)totalDistributions / initialEquity, 2, MidpointRounding.AwayFromZero);
        var netIrrPct = ComputeNetIrrPct(cashflows);

        return new LeverageStrategySummary(
            Label: label,
            LtvPct: ltvPct,
            InitialEquityVnd: initialEquity,
            LoanPrincipalVnd: loanPrincipal,
            TenYearGrossRentVnd: tenYearGrossRent,
            TenYearOperatingFeesVnd: tenYearOpFees,
            TenYearInterestPaidVnd: tenYearInterest,
            Year10PropertyValueVnd: finalPropVal,
            Year10RemainingDebtVnd: finalDebt,
            NetExitProceedsVnd: netExitProceeds,
            TotalNetProfitVnd: totalNetProfit,
            EquityMultiple: equityMultiple,
            NetIrrPct: netIrrPct
        );
    }

    public static decimal ComputeNetIrrPct(IReadOnlyList<double> cashflows)
    {
        if (cashflows.Count < 2 || cashflows[0] >= 0d)
            return 0m;

        double EvaluateNpv(double rate)
        {
            double npv = 0d;
            for (var t = 0; t < cashflows.Count; t++)
                npv += cashflows[t] / Math.Pow(1d + rate, t);
            return npv;
        }

        var low = -0.85d;
        var high = 3.0d;
        var npvLow = EvaluateNpv(low);
        var npvHigh = EvaluateNpv(high);

        while (npvHigh > 0d && high < 20d)
        {
            high *= 2d;
            npvHigh = EvaluateNpv(high);
        }

        if (npvLow * npvHigh > 0d)
            return 0m;

        var mid = 0d;
        for (var i = 0; i < 80; i++)
        {
            mid = (low + high) / 2d;
            var npvMid = EvaluateNpv(mid);
            if (Math.Abs(npvMid) < 1e-6 || high - low < 1e-9)
                break;

            if ((npvLow > 0d && npvMid > 0d) || (npvLow < 0d && npvMid < 0d))
            {
                low = mid;
                npvLow = npvMid;
            }
            else
            {
                high = mid;
                npvHigh = npvMid;
            }
        }

        return Math.Round((decimal)(mid * 100d), 2, MidpointRounding.AwayFromZero);
    }
}
