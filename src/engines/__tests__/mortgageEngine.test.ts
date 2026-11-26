import { describe, expect, it } from 'vitest';
import {
  analyzeMortgageAndRoi,
  buildInvestmentDossierJson,
  buildInvestmentDossierMarkdown,
  calculateMonthlyPMT,
  generateAmortizationSchedule,
} from '../mortgageEngine';
import { RESIDENCES } from '../../data/residences';

describe('mortgageEngine — PMT & Amortization Accuracy', () => {
  it('computes exact standard annuity monthly PMT for a 20-year 8% loan', () => {
    // Classic textbook test: $100,000 at 6% over 30 years => $599.55/mo
    const pmt = calculateMonthlyPMT(100_000, 6, 30);
    expect(pmt).toBeCloseTo(599.5505, 2);
  });

  it('computes exact VND mortgage PMT for 14B VND @ 7.5% over 20 years', () => {
    const pmt = calculateMonthlyPMT(14_000_000_000, 7.5, 20);
    // 14,000,000,000 * 0.00625 * (1.00625)^240 / ((1.00625)^240 - 1) ≈ 112,783,045 VND
    expect(pmt).toBeGreaterThan(112_700_000);
    expect(pmt).toBeLessThan(112_850_000);
  });

  it('handles 0% interest rate gracefully without division by zero', () => {
    const pmt = calculateMonthlyPMT(12_000_000_000, 0, 10);
    expect(pmt).toBe(100_000_000);
  });

  it('returns 0 PMT when principal or term is non-positive', () => {
    expect(calculateMonthlyPMT(0, 7.5, 20)).toBe(0);
    expect(calculateMonthlyPMT(-1000, 7.5, 20)).toBe(0);
    expect(calculateMonthlyPMT(10_000_000, 7.5, 0)).toBe(0);
  });

  it('amortizes loan principal down to exact 0 ending balance in final year', () => {
    const principal = 16_940_000_000;
    const schedule = generateAmortizationSchedule(principal, 7.2, 20);

    expect(schedule).toHaveLength(20);
    expect(schedule[0].openingBalanceVnd).toBe(principal);
    expect(schedule[schedule.length - 1].endingBalanceVnd).toBe(0);

    // Cumulative principal paid must equal original principal within rounding tolerance
    const totalPrincipalPaid = schedule.reduce((sum, row) => sum + row.principalPaidVnd, 0);
    expect(Math.abs(totalPrincipalPaid - principal)).toBeLessThan(50);
  });

  it('shows strictly decreasing annual interest and strictly increasing principal paydown', () => {
    const schedule = generateAmortizationSchedule(20_000_000_000, 8.5, 15);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].interestPaidVnd).toBeLessThan(schedule[i - 1].interestPaidVnd);
      expect(schedule[i].principalPaidVnd).toBeGreaterThan(schedule[i - 1].principalPaidVnd);
    }
  });

  it('maintains balance continuity between consecutive years', () => {
    const schedule = generateAmortizationSchedule(15_000_000_000, 6.8, 25);
    for (let i = 1; i < schedule.length; i++) {
      expect(Math.abs(schedule[i].openingBalanceVnd - schedule[i - 1].endingBalanceVnd)).toBeLessThanOrEqual(2);
    }
  });
});

describe('mortgageEngine — Rental Yield, 10-Year Projection & Dossier Export', () => {
  const sampleInputs = {
    propertyPriceVnd: 24_200_000_000,
    downPaymentPct: 30,
    loanTermYears: 20,
    annualInterestRatePct: 7.2,
    estimatedMonthlyRentVnd: 152_000_000,
    monthlyMaintenanceFeeVnd: 132 * 40_000,
    annualAppreciationPct: 6.0,
  };

  it('computes accurate gross and net rental yields with fee, vacancy, and tax deductions', () => {
    const res = analyzeMortgageAndRoi(sampleInputs);
    // Gross annual rent = 152M * 12 = 1.824B => 1.824 / 24.2 = 7.537%
    expect(res.grossRentalYieldPct).toBeCloseTo(7.537, 2);
    expect(res.netRentalYieldPct).toBeLessThan(res.grossRentalYieldPct);
    expect(res.netRentalYieldPct).toBeGreaterThan(5.5);
    expect(res.annualOperatingCostsVnd).toBeGreaterThan(0);
  });

  it('computes exact down payment and loan principal split', () => {
    const res = analyzeMortgageAndRoi(sampleInputs);
    expect(res.downPaymentVnd).toBe(Math.round(24_200_000_000 * 0.3));
    expect(res.loanPrincipalVnd).toBe(24_200_000_000 - res.downPaymentVnd);
    expect(res.totalInterestVnd).toBeGreaterThan(0);
    expect(res.totalPaymentsVnd).toBe(res.loanPrincipalVnd + res.totalInterestVnd);
  });

  it('generates 10-year equity projection with compounding property value and zero debt after short loan term', () => {
    const shortLoan = analyzeMortgageAndRoi({ ...sampleInputs, loanTermYears: 7 });
    expect(shortLoan.tenYearProjection).toHaveLength(10);

    // Year 7 loan is fully paid off -> Year 8, 9, 10 remaining debt must be 0
    expect(shortLoan.tenYearProjection[6].remainingDebtVnd).toBe(0);
    expect(shortLoan.tenYearProjection[7].remainingDebtVnd).toBe(0);
    expect(shortLoan.tenYearProjection[9].remainingDebtVnd).toBe(0);

    // Year 10 property value matches compound appreciation
    const expectedYr10Value = Math.round(sampleInputs.propertyPriceVnd * Math.pow(1.06, 10));
    expect(shortLoan.tenYearProjection[9].propertyValueVnd).toBe(expectedYr10Value);

    // Net equity increases monotonically every year
    for (let i = 1; i < 10; i++) {
      expect(shortLoan.tenYearProjection[i].netEquityVnd).toBeGreaterThan(
        shortLoan.tenYearProjection[i - 1].netEquityVnd
      );
    }
  });

  it('increases monthly cash flow when down payment increases', () => {
    const lowDown = analyzeMortgageAndRoi({ ...sampleInputs, downPaymentPct: 20 });
    const highDown = analyzeMortgageAndRoi({ ...sampleInputs, downPaymentPct: 60 });
    expect(highDown.monthlyNetCashFlowVnd).toBeGreaterThan(lowDown.monthlyNetCashFlowVnd);
    expect(highDown.monthlyPaymentVnd).toBeLessThan(lowDown.monthlyPaymentVnd);
  });

  it('exports valid Markdown and JSON investment dossiers containing key metrics', () => {
    const unit = RESIDENCES[4];
    const analysis = analyzeMortgageAndRoi(sampleInputs);

    const md = buildInvestmentDossierMarkdown(analysis, sampleInputs, 'VND', 'en', unit);
    expect(md).toContain('# KINETIX PROPTECH');
    expect(md).toContain(unit.code);
    expect(md).toContain('10-Year Equity Projection');
    expect(md).toContain('Amortization Schedule');

    const jsonStr = buildInvestmentDossierJson(analysis, sampleInputs, 'USD', unit);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.platform).toBe('Kinetix PropTech');
    expect(parsed.residence.code).toBe(unit.code);
    expect(parsed.tenYearProjection).toHaveLength(10);
    expect(parsed.amortizationSchedule).toHaveLength(20);
  });
});
