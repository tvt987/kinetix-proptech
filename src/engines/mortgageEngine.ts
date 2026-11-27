import type {
  AmortizationYearRow,
  Currency,
  DtiSafetyTier,
  EquityProjectionPoint,
  InterestStressScenario,
  InterestStressTestSummary,
  Language,
  MortgageAnalysisResult,
  MortgageInputs,
  Residence,
} from '../types/proptech';
import { convertVndToUsd, formatCurrency } from './currencyEngine';

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

/**
 * Standard private-banking Debt-to-Income (DTI) safety classification:
 * <= 35%: Bank-grade safe
 * <= 50%: Moderate stretch / liquidity buffer advised
 * > 50%: Elevated risk exceeding conservative underwriting threshold
 */
export function classifyDtiSafety(dtiRatioPct: number): DtiSafetyTier {
  if (!Number.isFinite(dtiRatioPct) || dtiRatioPct <= 35) return 'SAFE';
  if (dtiRatioPct <= 50) return 'CAUTION';
  return 'HIGH_RISK';
}

/**
 * Computes floating-rate interest shock scenarios (+0%, +2%, +4% plus custom active shock)
 * showing monthly payment delta, total interest shock, net cash flow impact, and DTI safety tier.
 */
export function computeInterestRateStressTest(
  inputs: MortgageInputs,
  activeShockPct: number,
  monthlyIncomeVnd: number
): InterestStressTestSummary {
  const safeShock = Math.max(0, Math.min(8, Number.isFinite(activeShockPct) ? activeShockPct : 0));
  const safeIncome = Math.max(1, Number.isFinite(monthlyIncomeVnd) ? monthlyIncomeVnd : 1);

  const baseAnalysis = analyzeMortgageAndRoi(inputs);
  const monthlyNetRentVnd = baseAnalysis.netAnnualRentVnd / 12;

  const evaluateScenario = (shockPct: number): InterestStressScenario => {
    const effectiveRatePct = Math.max(0, inputs.annualInterestRatePct + shockPct);
    const stressed =
      shockPct === 0
        ? baseAnalysis
        : analyzeMortgageAndRoi({
            ...inputs,
            annualInterestRatePct: effectiveRatePct,
          });

    const deltaMonthlyPaymentVnd = Math.max(0, stressed.monthlyPaymentVnd - baseAnalysis.monthlyPaymentVnd);
    const deltaTotalInterestVnd = Math.max(0, stressed.totalInterestVnd - baseAnalysis.totalInterestVnd);
    const monthlyNetCashFlowVnd = Math.round(monthlyNetRentVnd - stressed.monthlyPaymentVnd);
    const dtiRatioPct = (stressed.monthlyPaymentVnd / safeIncome) * 100;

    return {
      shockPct,
      effectiveRatePct,
      monthlyPaymentVnd: stressed.monthlyPaymentVnd,
      deltaMonthlyPaymentVnd,
      totalInterestVnd: stressed.totalInterestVnd,
      deltaTotalInterestVnd,
      monthlyNetCashFlowVnd,
      dtiRatioPct,
      dtiSafetyTier: classifyDtiSafety(dtiRatioPct),
    };
  };

  const benchmarkScenarios = [0, 2, 4].map((shock) => evaluateScenario(shock));
  const matchingBenchmark = benchmarkScenarios.find((s) => Math.abs(s.shockPct - safeShock) < 0.001);
  const activeScenario = matchingBenchmark ?? evaluateScenario(safeShock);

  return {
    monthlyIncomeVnd: Math.round(safeIncome),
    activeShockPct: safeShock,
    activeScenario,
    benchmarkScenarios,
  };
}

/**
 * Escapes a single CSV field cleanly and mitigates spreadsheet formula injection (OWASP CWE-1236)
 * for text cells starting with =, +, -, @, tab, or carriage return.
 */
export function escapeCsvCell(value: string | number, protectFormula = true): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  let text = String(value ?? '');
  if (protectFormula && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Generates an Excel-ready UTF-8 BOM (\uFEFF) CSV export containing:
 * 1) Underwriting summary metadata
 * 2) Interest-rate stress test (+0%, +2%, +4%) & DTI safety ratings
 * 3) 10-Year Cashflow & Net Equity Projection
 * 4) Complete Year-by-Year Amortization Schedule
 */
export function buildInvestmentCashflowCsv(
  analysis: MortgageAnalysisResult,
  inputs: MortgageInputs,
  stressSummary: InterestStressTestSummary,
  currency: Currency,
  lang: Language,
  residence: Residence | null
): string {
  const unitLabel = residence
    ? `${residence.code} - ${lang === 'vi' ? residence.nameVi : residence.nameEn} (F${residence.floor})`
    : lang === 'vi'
      ? 'Tài Sản BĐS Tùy Chỉnh'
      : 'Custom Property Asset';

  const toAmount = (vnd: number): number =>
    currency === 'USD' ? Math.round(convertVndToUsd(vnd)) : Math.round(vnd);
  const unitSuffix = currency === 'USD' ? 'USD' : 'VND';

  const row = (cells: Array<string | number>) => cells.map((c) => escapeCsvCell(c)).join(',');

  const lines: string[] = [
    row(['KINETIX PROPTECH v2.0 VIP PRO — INVESTMENT CASHFLOW & AMORTIZATION LEDGER']),
    row([lang === 'vi' ? 'Tài Sản' : 'Asset', unitLabel]),
    row([lang === 'vi' ? 'Đơn Vị Tiền Tệ' : 'Display Currency', unitSuffix]),
    row([lang === 'vi' ? 'Giá Trị BĐS' : 'Property Valuation', toAmount(analysis.propertyPriceVnd), formatCurrency(analysis.propertyPriceVnd, currency, lang)]),
    row([lang === 'vi' ? 'Vốn Tự Có (%)' : 'Down Payment (%)', inputs.downPaymentPct, toAmount(analysis.downPaymentVnd)]),
    row([lang === 'vi' ? 'Dư Nợ Vay' : 'Loan Principal', toAmount(analysis.loanPrincipalVnd)]),
    row([lang === 'vi' ? 'Thời Hạn Vay (Năm)' : 'Loan Tenure (Years)', inputs.loanTermYears]),
    row([lang === 'vi' ? 'Lãi Suất Cơ Sở (%/năm)' : 'Base Interest Rate (% p.a.)', Number(inputs.annualInterestRatePct.toFixed(2))]),
    row([lang === 'vi' ? 'Trả Góp Hàng Tháng (PMT)' : 'Base Monthly PMT', toAmount(analysis.monthlyPaymentVnd)]),
    row([lang === 'vi' ? 'Lợi Suất Thuê Gộp (%)' : 'Gross Rental Yield (%)', Number(analysis.grossRentalYieldPct.toFixed(2))]),
    row([lang === 'vi' ? 'Lợi Suất Thuê Ròng (%)' : 'Net Rental Yield (%)', Number(analysis.netRentalYieldPct.toFixed(2))]),
    row([lang === 'vi' ? 'Tổng ROI 10 Năm (%)' : '10-Year Total Wealth ROI (%)', Number(analysis.tenYearTotalRoiPct.toFixed(2))]),
    '',
    row([lang === 'vi' ? 'PHÂN TÍCH STRESS TEST LÃI SUẤT THẢ NỔI & DTI' : 'FLOATING-RATE STRESS TEST & DTI SAFETY MATRIX']),
    row([
      lang === 'vi' ? 'Kịch Bản Sốc Lãi' : 'Rate Shock',
      lang === 'vi' ? 'Lãi Suất Hiệu Lực (%)' : 'Effective Rate (%)',
      lang === 'vi' ? `Trả Góp/Tháng (${unitSuffix})` : `Monthly PMT (${unitSuffix})`,
      lang === 'vi' ? `Chênh Lệch/Tháng (${unitSuffix})` : `Monthly Delta (${unitSuffix})`,
      lang === 'vi' ? `Dòng Tiền Ròng/Tháng (${unitSuffix})` : `Monthly Net Cash Flow (${unitSuffix})`,
      lang === 'vi' ? 'Tỷ Lệ DTI (%)' : 'DTI Ratio (%)',
      lang === 'vi' ? 'Xếp Hạng An Toàn' : 'Safety Rating',
    ]),
    ...stressSummary.benchmarkScenarios.map((sc) =>
      row([
        sc.shockPct === 0 ? 'Base (+0.0%)' : `Shock +${sc.shockPct.toFixed(1)}%`,
        Number(sc.effectiveRatePct.toFixed(2)),
        toAmount(sc.monthlyPaymentVnd),
        toAmount(sc.deltaMonthlyPaymentVnd),
        toAmount(sc.monthlyNetCashFlowVnd),
        Number(sc.dtiRatioPct.toFixed(1)),
        sc.dtiSafetyTier,
      ])
    ),
    '',
    row([lang === 'vi' ? 'DỰ PHÓNG DÒNG TIỀN & VỐN CHỦ SỞ HỮU 10 NĂM' : '10-YEAR EQUITY & RENTAL CASHFLOW PROJECTION']),
    row([
      lang === 'vi' ? 'Năm' : 'Year',
      lang === 'vi' ? `Giá Trị Tài Sản (${unitSuffix})` : `Projected Value (${unitSuffix})`,
      lang === 'vi' ? `Dư Nợ Còn Lại (${unitSuffix})` : `Remaining Debt (${unitSuffix})`,
      lang === 'vi' ? `Vốn Chủ Sở Hữu (${unitSuffix})` : `Net Equity (${unitSuffix})`,
      lang === 'vi' ? `Tiền Thuê Tích Lũy (${unitSuffix})` : `Cumulative Net Rent (${unitSuffix})`,
      lang === 'vi' ? `Tổng Tài Sản (${unitSuffix})` : `Total Wealth (${unitSuffix})`,
      lang === 'vi' ? 'Tổng ROI (%)' : 'Total ROI (%)',
    ]),
    ...analysis.tenYearProjection.map((pt) =>
      row([
        pt.year,
        toAmount(pt.propertyValueVnd),
        toAmount(pt.remainingDebtVnd),
        toAmount(pt.netEquityVnd),
        toAmount(pt.cumulativeNetRentVnd),
        toAmount(pt.totalWealthVnd),
        Number(pt.roiPct.toFixed(2)),
      ])
    ),
    '',
    row([lang === 'vi' ? 'BẢNG KHẤU HAO DƯ NỢ CHI TIẾT THEO NĂM' : 'YEAR-BY-YEAR AMORTIZATION SCHEDULE']),
    row([
      lang === 'vi' ? 'Năm' : 'Year',
      lang === 'vi' ? `Dư Nợ Đầu Kỳ (${unitSuffix})` : `Opening Balance (${unitSuffix})`,
      lang === 'vi' ? `Tổng Trả Năm (${unitSuffix})` : `Annual Payment (${unitSuffix})`,
      lang === 'vi' ? `Trả Gốc (${unitSuffix})` : `Principal Paid (${unitSuffix})`,
      lang === 'vi' ? `Trả Lãi (${unitSuffix})` : `Interest Paid (${unitSuffix})`,
      lang === 'vi' ? `Dư Nợ Cuối Kỳ (${unitSuffix})` : `Ending Balance (${unitSuffix})`,
    ]),
    ...analysis.amortizationSchedule.map((r) =>
      row([
        r.year,
        toAmount(r.openingBalanceVnd),
        toAmount(r.annualPaymentVnd),
        toAmount(r.principalPaidVnd),
        toAmount(r.interestPaidVnd),
        toAmount(r.endingBalanceVnd),
      ])
    ),
  ];

  // Explicit UTF-8 BOM so Vietnamese characters render flawlessly in Microsoft Excel
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
