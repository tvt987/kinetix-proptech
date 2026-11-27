using Kinetix.Domain.Models;

namespace Kinetix.Domain.Services;

public sealed class AssetBenchmarkEngine
{
    private const double VacancyMonthsPerYear = 0.8d;
    private const double RentalTaxAndMgmtRate = 0.10d;
    private const double AnnualMaintenanceRatio = 0.003d;

    private const decimal PropertyVolatilityPct = 11.8m;
    private const decimal BankVolatilityPct = 0.8m;
    private const decimal GoldVolatilityPct = 14.5m;
    private const decimal Sp500VolatilityPct = 16.2m;

    private readonly MortgageUnderwritingEngine _underwritingEngine;

    public AssetBenchmarkEngine(MortgageUnderwritingEngine underwritingEngine)
    {
        _underwritingEngine = underwritingEngine;
    }

    public static decimal ComputeSharpeRatio(decimal netIrrPct, decimal riskFreeRatePct, decimal annualVolatilityPct)
    {
        if (annualVolatilityPct <= 0m)
            return 0m;

        var excessReturn = netIrrPct - riskFreeRatePct;
        if (Math.Abs(excessReturn) < 0.000001m)
            return 0m;

        return Math.Round(excessReturn / annualVolatilityPct, 2, MidpointRounding.AwayFromZero);
    }

    public static decimal ComputeFxHedgedReturnPct(decimal usdReturnPct, decimal vndDepreciationPct, bool includeFxHedge)
    {
        var rUsd = (double)usdReturnPct / 100d;
        var rFx = includeFxHedge ? (double)vndDepreciationPct / 100d : 0d;
        return Math.Round((decimal)(((1d + rUsd) * (1d + rFx) - 1d) * 100d), 2, MidpointRounding.AwayFromZero);
    }

    public AssetBenchmarkResponse ComputeBenchmark(AssetBenchmarkRequest req)
    {
        var initialCapital = Math.Max(1_000_000_000L, req.InitialCapitalVnd);
        var horizonYears = Math.Clamp(req.HorizonYears, 1, 20);
        var ltvPct = Math.Clamp(req.LtvPct, 0m, 85m);
        var mortgageRatePct = Math.Max(0m, req.MortgageInterestRatePct);
        var loanTermYears = Math.Clamp(req.LoanTermYears, 5, 35);
        var propAppreciationPct = req.PropertyAppreciationPct;
        var propGrossYieldPct = Math.Max(0m, req.PropertyGrossYieldPct);
        var bankRatePct = Math.Max(0m, req.BankDepositRatePct);
        var goldRatePct = req.GoldAnnualReturnPct;
        var sp500UsdRatePct = req.Sp500UsdReturnPct;
        var vndDepPct = req.VndDepreciationPct;

        var riskFreeRatePct = bankRatePct;
        var equityFraction = Math.Max(0.15d, 1d - (double)ltvPct / 100d);
        var impliedPropertyValue = (long)Math.Round(initialCapital / equityFraction, MidpointRounding.AwayFromZero);
        var impliedLoanPrincipal = Math.Max(0L, impliedPropertyValue - initialCapital);

        var schedule = impliedLoanPrincipal > 0L
            ? _underwritingEngine.GenerateFixedAnnuitySchedule(impliedLoanPrincipal, mortgageRatePct, loanTermYears)
            : [];

        var effectiveSp500VndReturnPct = ComputeFxHedgedReturnPct(sp500UsdRatePct, vndDepPct, req.IncludeFxHedge);

        var monthlyGrossRentBase = impliedPropertyValue * ((double)propGrossYieldPct / 100d) / 12d;
        var annualMaintenanceBase = impliedPropertyValue * AnnualMaintenanceRatio;

        var propertyYearly = new List<long>(horizonYears + 1) { initialCapital };
        var bankYearly = new List<long>(horizonYears + 1) { initialCapital };
        var goldYearly = new List<long>(horizonYears + 1) { initialCapital };
        var sp500Yearly = new List<long>(horizonYears + 1) { initialCapital };

        var propertyIrrCashflows = new List<double>(horizonYears + 1) { -initialCapital };
        long cumulativePropertyCashflow = 0L;

        var sp500CompoundBase = (1d + (double)sp500UsdRatePct / 100d) * (1d + (req.IncludeFxHedge ? (double)vndDepPct / 100d : 0d));

        for (var yr = 1; yr <= horizonYears; yr++)
        {
            // 1. Kinetix Leveraged Sky-Residence
            var escalation = Math.Pow(1d + MortgageUnderwritingEngine.AnnualRentEscalationRate, yr - 1);
            var effectiveRent = monthlyGrossRentBase * Math.Max(0d, 12d - VacancyMonthsPerYear) * escalation;
            var taxAndMgmt = effectiveRent * RentalTaxAndMgmtRate;
            var noi = Math.Max(0d, effectiveRent - annualMaintenanceBase - taxAndMgmt);

            var debtRow = schedule.FirstOrDefault(r => r.Year == yr);
            var debtService = debtRow?.AnnualPaymentVnd ?? 0L;
            var remainingDebt = impliedLoanPrincipal > 0L
                ? (yr > loanTermYears ? 0L : debtRow?.EndingBalanceVnd ?? 0L)
                : 0L;

            var annualNetCashflow = (long)Math.Round(noi - debtService, MidpointRounding.AwayFromZero);
            cumulativePropertyCashflow += annualNetCashflow;

            var propertyValue = (long)Math.Round(
                impliedPropertyValue * Math.Pow(1d + (double)propAppreciationPct / 100d, yr),
                MidpointRounding.AwayFromZero
            );
            var exitTax = (long)Math.Round(
                propertyValue * MortgageUnderwritingEngine.VietnamExitTransferTaxRate,
                MidpointRounding.AwayFromZero
            );
            var netRealizableWealth = Math.Max(0L, propertyValue - exitTax - remainingDebt + cumulativePropertyCashflow);
            propertyYearly.Add(netRealizableWealth);

            if (yr < horizonYears)
            {
                propertyIrrCashflows.Add(annualNetCashflow);
            }
            else
            {
                var netExitProceeds = propertyValue - exitTax - remainingDebt;
                propertyIrrCashflows.Add(annualNetCashflow + netExitProceeds);
            }

            // 2. Vietnam Bank Term Deposit
            var bankWealth = (long)Math.Round(initialCapital * Math.Pow(1d + (double)bankRatePct / 100d, yr), MidpointRounding.AwayFromZero);
            bankYearly.Add(bankWealth);

            // 3. SJC Physical Gold
            var goldWealth = (long)Math.Round(initialCapital * Math.Pow(1d + (double)goldRatePct / 100d, yr), MidpointRounding.AwayFromZero);
            goldYearly.Add(goldWealth);

            // 4. S&P 500 USD Index (+ VND FX Hedge)
            var sp500Wealth = (long)Math.Round(initialCapital * Math.Pow(sp500CompoundBase, yr), MidpointRounding.AwayFromZero);
            sp500Yearly.Add(sp500Wealth);
        }

        var propertyEnding = propertyYearly[^1];
        var bankEnding = bankYearly[^1];
        var goldEnding = goldYearly[^1];
        var sp500Ending = sp500Yearly[^1];

        var propertyNetIrr = MortgageUnderwritingEngine.ComputeNetIrrPct(propertyIrrCashflows);
        var bankNetIrr = Math.Round(bankRatePct, 2, MidpointRounding.AwayFromZero);
        var goldNetIrr = Math.Round(goldRatePct, 2, MidpointRounding.AwayFromZero);
        var sp500NetIrr = effectiveSp500VndReturnPct;

        AssetClassMetrics BuildMetrics(
            BenchmarkAssetClassId id,
            string labelEn,
            string labelVi,
            long endingWealth,
            decimal netIrr,
            decimal volatilityPct,
            string liquidityTier,
            int inflationHedgeScore,
            IReadOnlyList<long> yearly) =>
            new(
                Id: id,
                LabelEn: labelEn,
                LabelVi: labelVi,
                InitialCapitalVnd: initialCapital,
                EndingWealthVnd: endingWealth,
                TotalNetProfitVnd: endingWealth - initialCapital,
                EquityMultiple: Math.Round((decimal)endingWealth / initialCapital, 2, MidpointRounding.AwayFromZero),
                NetIrrPct: netIrr,
                AnnualVolatilityPct: volatilityPct,
                SharpeRatio: ComputeSharpeRatio(netIrr, riskFreeRatePct, volatilityPct),
                LiquidityTier: liquidityTier,
                InflationHedgeScore: inflationHedgeScore,
                YearlyWealthVnd: yearly
            );

        var assets = new List<AssetClassMetrics>
        {
            BuildMetrics(
                BenchmarkAssetClassId.KinetixProperty,
                "Kinetix Leveraged Sky-Residence",
                "Kinetix Sky-Residence (70% LTV)",
                propertyEnding,
                propertyNetIrr,
                PropertyVolatilityPct,
                "LOW",
                94,
                propertyYearly
            ),
            BuildMetrics(
                BenchmarkAssetClassId.Sp500Usd,
                "S&P 500 USD Index (+FX Hedge)",
                "Chỉ Số S&P 500 USD (+FX Hedge)",
                sp500Ending,
                sp500NetIrr,
                Sp500VolatilityPct,
                "HIGH",
                82,
                sp500Yearly
            ),
            BuildMetrics(
                BenchmarkAssetClassId.SjcGold,
                "SJC Physical Gold",
                "Vàng Miếng SJC Vật Chất",
                goldEnding,
                goldNetIrr,
                GoldVolatilityPct,
                "HIGH",
                88,
                goldYearly
            ),
            BuildMetrics(
                BenchmarkAssetClassId.VnBankDeposit,
                "Vietnam Bank Term Deposit",
                "Tiền Gửi Kỳ Hạn Ngân Hàng VN",
                bankEnding,
                bankNetIrr,
                BankVolatilityPct,
                "HIGH",
                42,
                bankYearly
            )
        };

        var winner = assets.OrderByDescending(a => a.EndingWealthVnd).First();

        var trajectory = new List<AssetYearPoint>(horizonYears + 1);
        for (var yr = 0; yr <= horizonYears; yr++)
        {
            trajectory.Add(new AssetYearPoint(
                Year: yr,
                KinetixPropertyVnd: propertyYearly[yr],
                VnBankDepositVnd: bankYearly[yr],
                SjcGoldVnd: goldYearly[yr],
                Sp500UsdVnd: sp500Yearly[yr]
            ));
        }

        return new AssetBenchmarkResponse(
            InitialCapitalVnd: initialCapital,
            ImpliedPropertyValueVnd: impliedPropertyValue,
            ImpliedLoanPrincipalVnd: impliedLoanPrincipal,
            LtvPct: ltvPct,
            HorizonYears: horizonYears,
            RiskFreeRatePct: riskFreeRatePct,
            PropertyAppreciationPct: propAppreciationPct,
            PropertyGrossYieldPct: propGrossYieldPct,
            EffectiveSp500VndReturnPct: effectiveSp500VndReturnPct,
            WinnerAssetId: winner.Id,
            PropertyAlphaVsBankVnd: propertyEnding - bankEnding,
            PropertyAlphaVsGoldVnd: propertyEnding - goldEnding,
            PropertyAlphaVsSp500Vnd: propertyEnding - sp500Ending,
            Assets: assets,
            Trajectory: trajectory
        );
    }
}
