import type {
  AssetBenchmarkInputs,
  AssetBenchmarkResult,
  AssetClassId,
  AssetClassSummary,
  AssetYearPoint,
} from '../types/proptech';
import { generateAmortizationSchedule } from './mortgageEngine';
import {
  ANNUAL_RENT_ESCALATION_RATE,
  computeNetIrrPct,
  VIETNAM_EXIT_TRANSFER_TAX_PCT,
} from './leverageEngine';

export const BENCHMARK_DEFAULTS = {
  horizonYears: 10,
  ltvPct: 70,
  mortgageInterestRatePct: 7.2,
  loanTermYears: 20,
  propertyAppreciationPct: 8.4,
  propertyGrossYieldPct: 6.8,
  bankDepositRatePct: 5.8,
  goldAnnualReturnPct: 8.5,
  sp500UsdReturnPct: 9.5,
  vndDepreciationPct: 2.2,
  vacancyMonthsPerYear: 0.8,
  rentalTaxAndMgmtRatePct: 10.0,
  annualMaintenanceRatioPct: 0.3,
} as const;

/** Institutional annualized volatility benchmarks (historical 10Y annualized std dev %) */
export const ASSET_VOLATILITY_PCT: Record<AssetClassId, number> = {
  KINETIX_PROPERTY: 11.8,
  VN_BANK_DEPOSIT: 0.8,
  SJC_GOLD: 14.5,
  SP500_USD: 16.2,
};

/**
 * Computes institutional Sharpe Ratio: (Net IRR - Risk-Free Rate) / Annual Volatility.
 * Uses Vietnam Bank Term Deposit rate as the local risk-free benchmark (Sharpe = 0.00).
 */
export function computeSharpeRatio(
  netIrrPct: number,
  riskFreeRatePct: number,
  annualVolatilityPct: number
): number {
  if (annualVolatilityPct <= 0) return 0;
  const excessReturn = netIrrPct - riskFreeRatePct;
  if (Math.abs(excessReturn) < 1e-6) return 0;
  return Number((excessReturn / annualVolatilityPct).toFixed(2));
}

/**
 * Computes effective VND-denominated compound annual return for a USD equity index
 * incorporating historical VND depreciation vs USD: (1 + r_usd) * (1 + fx) - 1.
 */
export function computeFxHedgedReturnPct(
  usdReturnPct: number,
  vndDepreciationPct: number,
  includeFxHedge = true
): number {
  const rUsd = usdReturnPct / 100;
  const rFx = includeFxHedge ? vndDepreciationPct / 100 : 0;
  return Number((((1 + rUsd) * (1 + rFx) - 1) * 100).toFixed(2));
}

/**
 * 10-Year Multi-Asset Wealth Benchmark Comparator:
 * Compares deploying the buyer's exact Down Payment Capital (5B - 30B VND) across:
 *   1. Kinetix Leveraged Sky-Residence (70% LTV + Rental Cashflow + 2% exit tax)
 *   2. Vietnam Bank Term Deposit (5.8%/yr compounding)
 *   3. SJC Physical Gold (8.5%/yr historical CAGR)
 *   4. S&P 500 USD Index (9.5%/yr + VND FX hedge)
 */
export function computeAssetBenchmark(inputs: AssetBenchmarkInputs): AssetBenchmarkResult {
  const initialCapitalVnd = Math.max(
    1_000_000_000,
    Math.round(Number.isFinite(inputs.initialCapitalVnd) ? inputs.initialCapitalVnd : 15_000_000_000)
  );
  const horizonYears = Math.min(20, Math.max(1, Math.round(inputs.horizonYears ?? BENCHMARK_DEFAULTS.horizonYears)));
  const ltvPct = Math.min(85, Math.max(0, inputs.ltvPct ?? BENCHMARK_DEFAULTS.ltvPct));
  const mortgageRatePct = Math.max(0, inputs.mortgageInterestRatePct ?? BENCHMARK_DEFAULTS.mortgageInterestRatePct);
  const loanTermYears = Math.min(35, Math.max(5, Math.round(inputs.loanTermYears ?? BENCHMARK_DEFAULTS.loanTermYears)));
  const propertyAppreciationPct = inputs.propertyAppreciationPct ?? BENCHMARK_DEFAULTS.propertyAppreciationPct;
  const propertyGrossYieldPct = Math.max(0, inputs.propertyGrossYieldPct ?? BENCHMARK_DEFAULTS.propertyGrossYieldPct);
  const bankDepositRatePct = Math.max(0, inputs.bankDepositRatePct ?? BENCHMARK_DEFAULTS.bankDepositRatePct);
  const goldAnnualReturnPct = inputs.goldAnnualReturnPct ?? BENCHMARK_DEFAULTS.goldAnnualReturnPct;
  const sp500UsdReturnPct = inputs.sp500UsdReturnPct ?? BENCHMARK_DEFAULTS.sp500UsdReturnPct;
  const vndDepreciationPct = inputs.vndDepreciationPct ?? BENCHMARK_DEFAULTS.vndDepreciationPct;
  const includeFxHedge = inputs.includeFxHedge ?? true;

  const riskFreeRatePct = bankDepositRatePct;
  const equityFraction = Math.max(0.15, 1 - ltvPct / 100);
  const impliedPropertyValueVnd = Math.round(initialCapitalVnd / equityFraction);
  const impliedLoanPrincipalVnd = Math.max(0, impliedPropertyValueVnd - initialCapitalVnd);

  const schedule =
    impliedLoanPrincipalVnd > 0
      ? generateAmortizationSchedule(impliedLoanPrincipalVnd, mortgageRatePct, loanTermYears)
      : [];

  const effectiveSp500VndReturnPct = computeFxHedgedReturnPct(
    sp500UsdReturnPct,
    vndDepreciationPct,
    includeFxHedge
  );

  const monthlyGrossRentBase = (impliedPropertyValueVnd * (propertyGrossYieldPct / 100)) / 12;
  const annualMaintenanceBase = impliedPropertyValueVnd * (BENCHMARK_DEFAULTS.annualMaintenanceRatioPct / 100);
  const vacancyMonths = BENCHMARK_DEFAULTS.vacancyMonthsPerYear;
  const taxAndMgmtRate = BENCHMARK_DEFAULTS.rentalTaxAndMgmtRatePct / 100;

  const propertyYearly: number[] = [initialCapitalVnd];
  const bankYearly: number[] = [initialCapitalVnd];
  const goldYearly: number[] = [initialCapitalVnd];
  const sp500Yearly: number[] = [initialCapitalVnd];

  const propertyIrrCashflows: number[] = [-initialCapitalVnd];
  let cumulativePropertyCashflow = 0;

  for (let yr = 1; yr <= horizonYears; yr += 1) {
    // 1. Kinetix Leveraged Sky-Residence
    const escalation = Math.pow(1 + ANNUAL_RENT_ESCALATION_RATE, yr - 1);
    const effectiveRent = monthlyGrossRentBase * Math.max(0, 12 - vacancyMonths) * escalation;
    const taxAndMgmt = effectiveRent * taxAndMgmtRate;
    const noi = Math.max(0, effectiveRent - annualMaintenanceBase - taxAndMgmt);

    const debtRow = schedule.find((r) => r.year === yr);
    const debtService = debtRow ? debtRow.annualPaymentVnd : 0;
    const remainingDebt =
      impliedLoanPrincipalVnd > 0 ? (yr > loanTermYears ? 0 : (debtRow?.endingBalanceVnd ?? 0)) : 0;

    const annualNetCashflow = Math.round(noi - debtService);
    cumulativePropertyCashflow += annualNetCashflow;

    const propertyValue = Math.round(
      impliedPropertyValueVnd * Math.pow(1 + propertyAppreciationPct / 100, yr)
    );
    const exitTax = Math.round(propertyValue * (VIETNAM_EXIT_TRANSFER_TAX_PCT / 100));
    const netRealizablePropertyWealth = Math.max(
      0,
      propertyValue - exitTax - remainingDebt + cumulativePropertyCashflow
    );
    propertyYearly.push(netRealizablePropertyWealth);

    if (yr < horizonYears) {
      propertyIrrCashflows.push(annualNetCashflow);
    } else {
      const netExitProceeds = propertyValue - exitTax - remainingDebt;
      propertyIrrCashflows.push(annualNetCashflow + netExitProceeds);
    }

    // 2. Vietnam Bank Term Deposit (5.8%/yr)
    const bankWealth = Math.round(initialCapitalVnd * Math.pow(1 + bankDepositRatePct / 100, yr));
    bankYearly.push(bankWealth);

    // 3. SJC Physical Gold (8.5%/yr)
    const goldWealth = Math.round(initialCapitalVnd * Math.pow(1 + goldAnnualReturnPct / 100, yr));
    goldYearly.push(goldWealth);

    // 4. S&P 500 USD Index (9.5%/yr + VND FX hedge)
    const sp500Factor =
      (1 + sp500UsdReturnPct / 100) * (1 + (includeFxHedge ? vndDepreciationPct / 100 : 0));
    const sp500Wealth = Math.round(initialCapitalVnd * Math.pow(sp500Factor, yr));
    sp500Yearly.push(sp500Wealth);
  }

  const propertyEnding = propertyYearly[horizonYears];
  const bankEnding = bankYearly[horizonYears];
  const goldEnding = goldYearly[horizonYears];
  const sp500Ending = sp500Yearly[horizonYears];

  const propertyNetIrr = computeNetIrrPct(propertyIrrCashflows);
  const bankNetIrr = Number(bankDepositRatePct.toFixed(2));
  const goldNetIrr = Number(goldAnnualReturnPct.toFixed(2));
  const sp500NetIrr = effectiveSp500VndReturnPct;

  const buildSummary = (
    id: AssetClassId,
    labelVi: string,
    labelEn: string,
    subtitleVi: string,
    subtitleEn: string,
    endingWealthVnd: number,
    netIrrPct: number,
    liquidityTier: 'HIGH' | 'MEDIUM' | 'LOW',
    inflationHedgeScore: number,
    yearlyWealthVnd: number[]
  ): AssetClassSummary => {
    const vol = ASSET_VOLATILITY_PCT[id];
    return {
      id,
      labelVi,
      labelEn,
      subtitleVi,
      subtitleEn,
      initialCapitalVnd,
      endingWealthVnd,
      totalNetProfitVnd: endingWealthVnd - initialCapitalVnd,
      equityMultiple: Number((endingWealthVnd / initialCapitalVnd).toFixed(2)),
      netIrrPct,
      annualVolatilityPct: vol,
      sharpeRatio: computeSharpeRatio(netIrrPct, riskFreeRatePct, vol),
      liquidityTier,
      inflationHedgeScore,
      yearlyWealthVnd,
    };
  };

  const assets: AssetClassSummary[] = [
    buildSummary(
      'KINETIX_PROPERTY',
      'Kinetix Sky-Residence (70% LTV)',
      'Kinetix Leveraged Sky-Residence',
      `${ltvPct}% LTV + Dòng tiền thuê ròng · Thuế thoái vốn 2%`,
      `${ltvPct}% LTV + Net Rental Cashflow · 2% Exit Tax`,
      propertyEnding,
      propertyNetIrr,
      'LOW',
      94,
      propertyYearly
    ),
    buildSummary(
      'SP500_USD',
      'Chỉ Số S&P 500 USD (+FX Hedge)',
      'S&P 500 USD Index (+FX Hedge)',
      includeFxHedge
        ? `${sp500UsdReturnPct}% USD/năm + ${vndDepreciationPct}% phòng hộ tỷ giá VND`
        : `${sp500UsdReturnPct}% USD/năm (không tính trượt giá VND)`,
      includeFxHedge
        ? `${sp500UsdReturnPct}%/yr USD + ${vndDepreciationPct}%/yr VND FX Hedge`
        : `${sp500UsdReturnPct}%/yr USD Unhedged`,
      sp500Ending,
      sp500NetIrr,
      'HIGH',
      82,
      sp500Yearly
    ),
    buildSummary(
      'SJC_GOLD',
      'Vàng Miếng SJC Vật Chất',
      'SJC Physical Gold',
      `Tăng trưởng lịch sử ${goldAnnualReturnPct}%/năm · Phòng thủ lạm phát`,
      `${goldAnnualReturnPct}%/yr Historical CAGR · Inflation Store`,
      goldEnding,
      goldNetIrr,
      'HIGH',
      88,
      goldYearly
    ),
    buildSummary(
      'VN_BANK_DEPOSIT',
      'Tiền Gửi Kỳ Hạn Ngân Hàng VN',
      'Vietnam Bank Term Deposit',
      `Lãi suất gộp ${bankDepositRatePct}%/năm · Chuẩn Phi Rủi Ro (Rf)`,
      `${bankDepositRatePct}%/yr Compounded · Risk-Free Baseline (Rf)`,
      bankEnding,
      bankNetIrr,
      'HIGH',
      42,
      bankYearly
    ),
  ];

  const winner = assets.reduce((best, curr) =>
    curr.endingWealthVnd > best.endingWealthVnd ? curr : best
  );

  const trajectory: AssetYearPoint[] = [];
  for (let yr = 0; yr <= horizonYears; yr += 1) {
    trajectory.push({
      year: yr,
      kinetixPropertyVnd: propertyYearly[yr],
      vnBankDepositVnd: bankYearly[yr],
      sjcGoldVnd: goldYearly[yr],
      sp500UsdVnd: sp500Yearly[yr],
    });
  }

  return {
    initialCapitalVnd,
    impliedPropertyValueVnd,
    impliedLoanPrincipalVnd,
    ltvPct,
    horizonYears,
    riskFreeRatePct,
    propertyAppreciationPct,
    propertyGrossYieldPct,
    effectiveSp500VndReturnPct,
    winnerAssetId: winner.id,
    propertyAlphaVsBankVnd: propertyEnding - bankEnding,
    propertyAlphaVsGoldVnd: propertyEnding - goldEnding,
    propertyAlphaVsSp500Vnd: propertyEnding - sp500Ending,
    assets,
    trajectory,
  };
}
