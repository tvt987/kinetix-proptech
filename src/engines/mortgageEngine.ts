import type {
  AmortizationYearRow,
  Currency,
  EquityProjectionPoint,
  Language,
  MortgageAnalysisResult,
  MortgageInputs,
  Residence,
} from '../types/proptech';
import { formatCurrency } from './currencyEngine';

/**
 * Standard fixed-rate annuity PMT formula:
 * PMT = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateMonthlyPMT(
  principal: number,
  annualInterestRatePct: number,
  loanTermYears: number
): number {
  if (principal <= 0 || loanTermYears <= 0) return 0;
  const totalMonths = Math.round(loanTermYears * 12);
  if (annualInterestRatePct <= 0) {
    return principal / totalMonths;
  }
  const monthlyRate = annualInterestRatePct / 100 / 12;
  const growthFactor = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * monthlyRate * growthFactor) / (growthFactor - 1);
}

/**
 * Generates an exact month-by-month amortized loan schedule aggregated by year.
 * Guarantees exact 0 ending balance in the final year without floating-point drift.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualInterestRatePct: number,
  loanTermYears: number
): AmortizationYearRow[] {
  if (principal <= 0 || loanTermYears <= 0) return [];

  const totalMonths = Math.round(loanTermYears * 12);
  const monthlyRate = annualInterestRatePct > 0 ? annualInterestRatePct / 100 / 12 : 0;
  const scheduledPmt = calculateMonthlyPMT(principal, annualInterestRatePct, loanTermYears);

  let balance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  const rows: AmortizationYearRow[] = [];

  for (let year = 1; year <= loanTermYears; year++) {
    const openingBalance = balance;
    let yearPrincipal = 0;
    let yearInterest = 0;
    let yearPayment = 0;

    for (let m = 1; m <= 12; m++) {
      const monthIndex = (year - 1) * 12 + m;
      if (monthIndex > totalMonths || balance <= 0) break;

      const interestForMonth = balance * monthlyRate;
      let principalForMonth = scheduledPmt - interestForMonth;
      let actualPayment = scheduledPmt;

      // Exact final-month settlement to guarantee 0 ending balance
      if (monthIndex === totalMonths || principalForMonth >= balance) {
        principalForMonth = balance;
        actualPayment = principalForMonth + interestForMonth;
      }

      balance = Math.max(0, balance - principalForMonth);
      if (monthIndex === totalMonths) {
        balance = 0;
      }

      yearPrincipal += principalForMonth;
      yearInterest += interestForMonth;
      yearPayment += actualPayment;
    }

    cumulativeInterest += yearInterest;
    cumulativePrincipal += yearPrincipal;

    rows.push({
      year,
      openingBalanceVnd: Math.round(openingBalance),
      annualPaymentVnd: Math.round(yearPayment),
      principalPaidVnd: Math.round(yearPrincipal),
      interestPaidVnd: Math.round(yearInterest),
      endingBalanceVnd: year === loanTermYears ? 0 : Math.round(balance),
      cumulativeInterestVnd: Math.round(cumulativeInterest),
      cumulativePrincipalVnd: Math.round(cumulativePrincipal),
    });
  }

  return rows;
}

/**
 * Computes complete institutional mortgage + rental yield + 10-year equity analysis.
 */
export function analyzeMortgageAndRoi(inputs: MortgageInputs): MortgageAnalysisResult {
  const propertyPrice = Math.max(0, inputs.propertyPriceVnd);
  const downPct = Math.min(95, Math.max(5, inputs.downPaymentPct));
  const loanTermYears = Math.min(35, Math.max(1, Math.round(inputs.loanTermYears)));
  const annualRate = Math.max(0, inputs.annualInterestRatePct);
  const monthlyRent = Math.max(0, inputs.estimatedMonthlyRentVnd);
  const monthlyMaintenance = Math.max(0, inputs.monthlyMaintenanceFeeVnd);
  const appreciationRate = inputs.annualAppreciationPct / 100;
  const vacancyMonths = inputs.vacancyMonthsPerYear ?? 0.8;
  const taxAndMgmtRate = (inputs.managementAndTaxRatePct ?? 10) / 100;

  const downPaymentVnd = Math.round(propertyPrice * (downPct / 100));
  const loanPrincipalVnd = Math.max(0, propertyPrice - downPaymentVnd);

  const monthlyPaymentExact = calculateMonthlyPMT(loanPrincipalVnd, annualRate, loanTermYears);
  const amortizationSchedule = generateAmortizationSchedule(loanPrincipalVnd, annualRate, loanTermYears);

  const totalPaymentsVnd = Math.round(monthlyPaymentExact * loanTermYears * 12);
  const totalInterestVnd = Math.max(0, totalPaymentsVnd - loanPrincipalVnd);
  const interestToPrincipalRatio = loanPrincipalVnd > 0 ? totalInterestVnd / loanPrincipalVnd : 0;

  // Rental Yield Math
  const grossAnnualRentVnd = Math.round(monthlyRent * 12);
  const effectiveAnnualRentVnd = monthlyRent * Math.max(0, 12 - vacancyMonths);
  const annualMaintenanceVnd = monthlyMaintenance * 12;
  const annualTaxAndMgmtVnd = effectiveAnnualRentVnd * taxAndMgmtRate;
  const annualOperatingCostsVnd = Math.round(
    annualMaintenanceVnd + annualTaxAndMgmtVnd + monthlyRent * vacancyMonths
  );
  const netAnnualRentVnd = Math.max(
    0,
    Math.round(effectiveAnnualRentVnd - annualMaintenanceVnd - annualTaxAndMgmtVnd)
  );

  const grossRentalYieldPct = propertyPrice > 0 ? (grossAnnualRentVnd / propertyPrice) * 100 : 0;
  const netRentalYieldPct = propertyPrice > 0 ? (netAnnualRentVnd / propertyPrice) * 100 : 0;

  const monthlyNetRentVnd = netAnnualRentVnd / 12;
  const monthlyNetCashFlowVnd = Math.round(monthlyNetRentVnd - monthlyPaymentExact);
  const annualNetCashFlowVnd = netAnnualRentVnd - monthlyPaymentExact * 12;
  const cashOnCashReturnPct = downPaymentVnd > 0 ? (annualNetCashFlowVnd / downPaymentVnd) * 100 : 0;

  // 10-Year Equity & Wealth Projection (Years 0 to 10)
  const tenYearProjection: EquityProjectionPoint[] = [];
  let cumulativeNetRent = 0;

  for (let yr = 1; yr <= 10; yr++) {
    const propertyValue = Math.round(propertyPrice * Math.pow(1 + appreciationRate, yr));
    const debtRow = amortizationSchedule.find((r) => r.year === yr);
    const remainingDebt = yr > loanTermYears ? 0 : (debtRow?.endingBalanceVnd ?? 0);
    const netEquity = Math.max(0, propertyValue - remainingDebt);
    // Conservative 3% annual rental escalation
    const yearNetRent = Math.round(netAnnualRentVnd * Math.pow(1.03, yr - 1));
    cumulativeNetRent += yearNetRent;

    const totalWealth = netEquity + cumulativeNetRent;
    const roiPct = downPaymentVnd > 0 ? ((totalWealth - downPaymentVnd) / downPaymentVnd) * 100 : 0;

    tenYearProjection.push({
      year: yr,
      propertyValueVnd: propertyValue,
      remainingDebtVnd: remainingDebt,
      netEquityVnd: netEquity,
      cumulativeNetRentVnd: cumulativeNetRent,
      totalWealthVnd: totalWealth,
      roiPct,
    });
  }

  const yr10 = tenYearProjection[tenYearProjection.length - 1];
  const tenYearEquityGainVnd = yr10 ? yr10.netEquityVnd - downPaymentVnd : 0;
  const tenYearTotalRoiPct = yr10 ? yr10.roiPct : 0;

  return {
    propertyPriceVnd: propertyPrice,
    downPaymentVnd,
    loanPrincipalVnd,
    monthlyPaymentVnd: Math.round(monthlyPaymentExact),
    totalPaymentsVnd,
    totalInterestVnd,
    interestToPrincipalRatio,
    grossAnnualRentVnd,
    annualOperatingCostsVnd,
    netAnnualRentVnd,
    grossRentalYieldPct,
    netRentalYieldPct,
    monthlyNetCashFlowVnd,
    cashOnCashReturnPct,
    tenYearEquityGainVnd,
    tenYearTotalRoiPct,
    amortizationSchedule,
    tenYearProjection,
  };
}

/**
 * Generates an executive Markdown investment dossier for 1-click export.
 */
export function buildInvestmentDossierMarkdown(
  analysis: MortgageAnalysisResult,
  inputs: MortgageInputs,
  currency: Currency,
  lang: Language,
  residence: Residence | null
): string {
  const fmt = (v: number) => formatCurrency(v, currency, lang);
  const title = residence
    ? `${residence.code} — ${lang === 'vi' ? residence.nameVi : residence.nameEn} (Floor ${residence.floor})`
    : lang === 'vi'
      ? 'Tài Sản BĐS Tùy Chỉnh'
      : 'Custom Property Underwriting';

  const lines = [
    `# KINETIX PROPTECH — INVESTMENT UNDERWRITING DOSSIER`,
    ``,
    `- **Asset:** ${title}`,
    `- **Valuation:** ${fmt(analysis.propertyPriceVnd)}`,
    `- **Down Payment (${inputs.downPaymentPct}%):** ${fmt(analysis.downPaymentVnd)}`,
    `- **Loan Principal:** ${fmt(analysis.loanPrincipalVnd)}`,
    `- **Terms:** ${inputs.loanTermYears} years @ ${inputs.annualInterestRatePct.toFixed(2)}% p.a.`,
    `- **Appreciation Forecast:** ${inputs.annualAppreciationPct.toFixed(1)}% / year`,
    ``,
    `## Key Financial Metrics`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Monthly Mortgage Payment (PMT) | ${fmt(analysis.monthlyPaymentVnd)} |`,
    `| Total Interest Paid | ${fmt(analysis.totalInterestVnd)} |`,
    `| Gross Rental Yield | ${analysis.grossRentalYieldPct.toFixed(2)}% |`,
    `| Net Rental Yield (Post-Fee & Tax) | ${analysis.netRentalYieldPct.toFixed(2)}% |`,
    `| Monthly Net Cash Flow | ${fmt(analysis.monthlyNetCashFlowVnd)} |`,
    `| Cash-on-Cash Return | ${analysis.cashOnCashReturnPct.toFixed(2)}% |`,
    `| Year 10 Net Equity Gain | ${fmt(analysis.tenYearEquityGainVnd)} |`,
    `| 10-Year Total Wealth ROI | ${analysis.tenYearTotalRoiPct.toFixed(1)}% |`,
    ``,
    `## 10-Year Equity Projection`,
    ``,
    `| Year | Projected Value | Remaining Debt | Net Equity | Cumulative Net Rent | Total ROI |`,
    `| ---: | ---: | ---: | ---: | ---: | ---: |`,
    ...analysis.tenYearProjection.map(
      (pt) =>
        `| Yr ${pt.year} | ${fmt(pt.propertyValueVnd)} | ${fmt(pt.remainingDebtVnd)} | ${fmt(pt.netEquityVnd)} | ${fmt(pt.cumulativeNetRentVnd)} | ${pt.roiPct.toFixed(1)}% |`
    ),
    ``,
    `## Amortization Schedule (Summary)`,
    ``,
    `| Year | Opening Balance | Annual Payment | Principal Paid | Interest Paid | Ending Balance |`,
    `| ---: | ---: | ---: | ---: | ---: | ---: |`,
    ...analysis.amortizationSchedule.map(
      (r) =>
        `| Yr ${r.year} | ${fmt(r.openingBalanceVnd)} | ${fmt(r.annualPaymentVnd)} | ${fmt(r.principalPaidVnd)} | ${fmt(r.interestPaidVnd)} | ${fmt(r.endingBalanceVnd)} |`
    ),
    ``,
    `---`,
    `*Generated by Kinetix PropTech FinTech Engine · Powered by TVT Studio*`,
  ];

  return lines.join('\n');
}

export function buildInvestmentDossierJson(
  analysis: MortgageAnalysisResult,
  inputs: MortgageInputs,
  currency: Currency,
  residence: Residence | null
): string {
  return JSON.stringify(
    {
      platform: 'Kinetix PropTech',
      generatedBy: 'TVT Studio',
      displayCurrency: currency,
      residence: residence
        ? {
            id: residence.id,
            code: residence.code,
            name: residence.nameEn,
            floor: residence.floor,
            areaSqm: residence.areaSqm,
            orientation: residence.orientation,
          }
        : null,
      inputs,
      summary: {
        downPaymentVnd: analysis.downPaymentVnd,
        loanPrincipalVnd: analysis.loanPrincipalVnd,
        monthlyPaymentVnd: analysis.monthlyPaymentVnd,
        totalInterestVnd: analysis.totalInterestVnd,
        grossRentalYieldPct: Number(analysis.grossRentalYieldPct.toFixed(2)),
        netRentalYieldPct: Number(analysis.netRentalYieldPct.toFixed(2)),
        monthlyNetCashFlowVnd: analysis.monthlyNetCashFlowVnd,
        cashOnCashReturnPct: Number(analysis.cashOnCashReturnPct.toFixed(2)),
        tenYearEquityGainVnd: analysis.tenYearEquityGainVnd,
        tenYearTotalRoiPct: Number(analysis.tenYearTotalRoiPct.toFixed(2)),
      },
      tenYearProjection: analysis.tenYearProjection,
      amortizationSchedule: analysis.amortizationSchedule,
    },
    null,
    2
  );
}
