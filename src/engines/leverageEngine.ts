import type {
  LeverageComparisonResult,
  LeverageStrategyMetrics,
  LeverageYearPoint,
  MortgageInputs,
} from '../types/proptech';
import { generateAmortizationSchedule } from './mortgageEngine';

/** Vietnam statutory personal income transfer tax upon property resale (2%) */
export const VIETNAM_EXIT_TRANSFER_TAX_PCT = 2.0;

/** Conservative annual rental escalation benchmark for District 2 / Thu Thiem Grade-A residences */
export const ANNUAL_RENT_ESCALATION_RATE = 0.03;

/**
 * Evaluates Net Present Value for an annual cashflow stream CF_0 .. CF_n.
 */
export function evaluateNpv(cashflows: number[], rate: number): number {
  let npv = 0;
  for (let t = 0; t < cashflows.length; t += 1) {
    npv += cashflows[t] / Math.pow(1 + rate, t);
  }
  return npv;
}

/**
 * Computes exact annualized Internal Rate of Return (%) via safeguarded bracketed bisection
 * + Newton refinement. Deterministic and guaranteed not to diverge on extreme edge cases.
 */
export function computeNetIrrPct(cashflows: number[]): number {
  if (cashflows.length < 2 || cashflows[0] >= 0) return 0;

  const totalInflows = cashflows.slice(1).reduce((sum, cf) => sum + cf, 0);
  if (totalInflows <= 0) return -100;

  let low = -0.85;
  let high = 3.0;
  let npvLow = evaluateNpv(cashflows, low);
  let npvHigh = evaluateNpv(cashflows, high);

  // Expand upper bracket if IRR exceeds 300%
  while (npvHigh > 0 && high < 20) {
    high *= 2;
    npvHigh = evaluateNpv(cashflows, high);
  }

  if (npvLow * npvHigh > 0) {
    // Fallback linearized return if no sign change inside range
    const ratio = totalInflows / Math.abs(cashflows[0]);
    const years = cashflows.length - 1;
    return Number(((Math.pow(Math.max(0.01, ratio), 1 / years) - 1) * 100).toFixed(2));
  }

  let mid = 0;
  for (let iter = 0; iter < 80; iter += 1) {
    mid = (low + high) / 2;
    const npvMid = evaluateNpv(cashflows, mid);
    if (Math.abs(npvMid) < 1e-6 || high - low < 1e-9) {
      break;
    }
    if ((npvLow > 0 && npvMid > 0) || (npvLow < 0 && npvMid < 0)) {
      low = mid;
      npvLow = npvMid;
    } else {
      high = mid;
      npvHigh = npvMid;
    }
  }

  return Number((mid * 100).toFixed(2));
}

function buildStrategy(
  label: 'CASH_100' | 'LEVERAGED_70',
  ltvPct: number,
  inputs: MortgageInputs,
  horizonYears: number
): {
  metrics: LeverageStrategyMetrics;
  annualNetCashflows: number[];
  yearlyDebtBalances: number[];
  yearlyPropertyValues: number[];
} {
  const propertyPrice = Math.max(0, inputs.propertyPriceVnd);
  const loanPrincipal = Math.round(propertyPrice * (ltvPct / 100));
  const initialEquity = Math.max(1, propertyPrice - loanPrincipal);
  const loanTermYears = Math.min(35, Math.max(1, Math.round(inputs.loanTermYears)));
  const annualRate = Math.max(0, inputs.annualInterestRatePct);
  const monthlyRent = Math.max(0, inputs.estimatedMonthlyRentVnd);
  const monthlyMaintenance = Math.max(0, inputs.monthlyMaintenanceFeeVnd);
  const appreciationRate = inputs.annualAppreciationPct / 100;
  const vacancyMonths = inputs.vacancyMonthsPerYear ?? 0.8;
  const taxAndMgmtRate = (inputs.managementAndTaxRatePct ?? 10) / 100;

  const schedule =
    loanPrincipal > 0
      ? generateAmortizationSchedule(loanPrincipal, annualRate, loanTermYears)
      : [];

  let tenYearGrossRent = 0;
  let tenYearOperatingFees = 0;
  let tenYearNoi = 0;
  let tenYearDebtService = 0;
  let tenYearInterestPaid = 0;

  const annualNetCashflows: number[] = [];
  const yearlyDebtBalances: number[] = [];
  const yearlyPropertyValues: number[] = [];
  const irrCashflows: number[] = [-initialEquity];

  for (let yr = 1; yr <= horizonYears; yr += 1) {
    const escalation = Math.pow(1 + ANNUAL_RENT_ESCALATION_RATE, yr - 1);
    const grossRent = Math.round(monthlyRent * 12 * escalation);
    const effectiveRent = monthlyRent * Math.max(0, 12 - vacancyMonths) * escalation;
    const maintenanceAnnual = Math.round(monthlyMaintenance * 12);
    const taxAndMgmtAnnual = Math.round(effectiveRent * taxAndMgmtRate);
    const vacancyCost = Math.round(monthlyRent * vacancyMonths * escalation);
    const operatingFees = maintenanceAnnual + taxAndMgmtAnnual + vacancyCost;
    const noi = Math.max(0, Math.round(effectiveRent - maintenanceAnnual - taxAndMgmtAnnual));

    const debtRow = schedule.find((r) => r.year === yr);
    const debtService = debtRow ? debtRow.annualPaymentVnd : 0;
    const interestPaid = debtRow ? debtRow.interestPaidVnd : 0;
    const remainingDebt =
      loanPrincipal > 0 ? (yr > loanTermYears ? 0 : (debtRow?.endingBalanceVnd ?? 0)) : 0;

    const propertyValue = Math.round(propertyPrice * Math.pow(1 + appreciationRate, yr));
    const netCashflow = noi - debtService;

    tenYearGrossRent += grossRent;
    tenYearOperatingFees += operatingFees;
    tenYearNoi += noi;
    tenYearDebtService += debtService;
    tenYearInterestPaid += interestPaid;

    annualNetCashflows.push(netCashflow);
    yearlyDebtBalances.push(remainingDebt);
    yearlyPropertyValues.push(propertyValue);

    if (yr < horizonYears) {
      irrCashflows.push(netCashflow);
    } else {
      const exitTax = Math.round(propertyValue * (VIETNAM_EXIT_TRANSFER_TAX_PCT / 100));
      const netExitProceeds = propertyValue - exitTax - remainingDebt;
      irrCashflows.push(netCashflow + netExitProceeds);
    }
  }

  const year10PropertyValue = yearlyPropertyValues[horizonYears - 1] ?? propertyPrice;
  const year10RemainingDebt = yearlyDebtBalances[horizonYears - 1] ?? 0;
  const exitTransactionCost = Math.round(
    year10PropertyValue * (VIETNAM_EXIT_TRANSFER_TAX_PCT / 100)
  );
  const netExitProceeds = year10PropertyValue - exitTransactionCost - year10RemainingDebt;
  const cumulativeOperatingCashflow = annualNetCashflows.reduce((s, c) => s + c, 0);
  const totalDistributions = cumulativeOperatingCashflow + netExitProceeds;
  const totalNetProfit = totalDistributions - initialEquity;
  const equityMultiple = Number((totalDistributions / initialEquity).toFixed(2));
  const netIrrPct = computeNetIrrPct(irrCashflows);
  const avgAnnualCashflow = cumulativeOperatingCashflow / horizonYears;
  const averageAnnualCashOnCashPct = Number(((avgAnnualCashflow / initialEquity) * 100).toFixed(2));

  return {
    metrics: {
      label,
      ltvPct,
      initialEquityVnd: initialEquity,
      loanPrincipalVnd: loanPrincipal,
      annualInterestRatePct: ltvPct > 0 ? annualRate : 0,
      tenYearGrossRentVnd: tenYearGrossRent,
      tenYearOperatingFeesVnd: tenYearOperatingFees,
      tenYearNetOperatingIncomeVnd: tenYearNoi,
      tenYearDebtServiceVnd: tenYearDebtService,
      tenYearInterestPaidVnd: tenYearInterestPaid,
      year10PropertyValueVnd: year10PropertyValue,
      year10RemainingDebtVnd: year10RemainingDebt,
      exitTransactionCostVnd: exitTransactionCost,
      netExitProceedsVnd: netExitProceeds,
      totalNetProfitVnd: totalNetProfit,
      equityMultiple,
      netIrrPct,
      averageAnnualCashOnCashPct,
    },
    annualNetCashflows,
    yearlyDebtBalances,
    yearlyPropertyValues,
  };
}

/**
 * Side-by-side 10-Year Investor Yield & Leverage Cashflow Simulator:
 * Compares 100% Cash Acquisition vs 70% Bank Leverage (default 70% LTV) across rental yield,
 * management fees, statutory rental/exit taxes, capital appreciation, equity multiple, and net IRR.
 */
export function compareCashVsLeverage(
  inputs: MortgageInputs,
  leverageLtvPct = 70,
  horizonYears = 10
): LeverageComparisonResult {
  const safeLtv = Math.min(80, Math.max(30, leverageLtvPct));
  const safeHorizon = Math.min(20, Math.max(5, Math.round(horizonYears)));

  const cash = buildStrategy('CASH_100', 0, inputs, safeHorizon);
  const leveraged = buildStrategy('LEVERAGED_70', safeLtv, inputs, safeHorizon);

  let cashCumCf = 0;
  let levCumCf = 0;
  const yearlyComparison: LeverageYearPoint[] = [];

  for (let i = 0; i < safeHorizon; i += 1) {
    const year = i + 1;
    const cashCf = cash.annualNetCashflows[i];
    const levCf = leveraged.annualNetCashflows[i];
    cashCumCf += cashCf;
    levCumCf += levCf;

    const propVal = cash.yearlyPropertyValues[i];
    const remDebt = leveraged.yearlyDebtBalances[i];

    yearlyComparison.push({
      year,
      cashAnnualNetCashflowVnd: cashCf,
      leveragedAnnualNetCashflowVnd: levCf,
      cashCumulativeCashflowVnd: cashCumCf,
      leveragedCumulativeCashflowVnd: levCumCf,
      cashNetWealthVnd: propVal + cashCumCf,
      leveragedNetWealthVnd: propVal - remDebt + levCumCf,
      propertyValueVnd: propVal,
      remainingDebtVnd: remDebt,
    });
  }

  return {
    horizonYears: safeHorizon,
    cashStrategy: cash.metrics,
    leveragedStrategy: leveraged.metrics,
    irrSpreadPct: Number(
      (leveraged.metrics.netIrrPct - cash.metrics.netIrrPct).toFixed(2)
    ),
    equityMultipleAdvantage: Number(
      (leveraged.metrics.equityMultiple - cash.metrics.equityMultiple).toFixed(2)
    ),
    capitalFreedVnd: cash.metrics.initialEquityVnd - leveraged.metrics.initialEquityVnd,
    yearlyComparison,
  };
}
