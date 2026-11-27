import { describe, expect, it } from 'vitest';
import {
  computeDistrictHeatIntensity,
  getDistrictById,
  SAIGON_DISTRICTS,
  SAIGON_TRANSIT_STATIONS,
  sortSaigonDistricts,
  summarizeSaigonMarket,
} from '../saigonDistrictEngine';
import {
  ASSET_VOLATILITY_PCT,
  BENCHMARK_DEFAULTS,
  computeAssetBenchmark,
  computeFxHedgedReturnPct,
  computeSharpeRatio,
} from '../assetBenchmarkEngine';
import { VND_PER_USD } from '../currencyEngine';

describe('saigonDistrictEngine — HCMC Luxury Corridor Telemetry', () => {
  it('contains all 6 premier Ho Chi Minh City residential corridors with unique IDs and codes', () => {
    expect(SAIGON_DISTRICTS).toHaveLength(6);
    const ids = new Set(SAIGON_DISTRICTS.map((d) => d.id));
    const codes = new Set(SAIGON_DISTRICTS.map((d) => d.code));
    expect(ids.size).toBe(6);
    expect(codes.size).toBe(6);
    expect(ids).toContain('thu-thiem');
    expect(ids).toContain('ben-nghe');
    expect(ids).toContain('thao-dien');
    expect(ids).toContain('phu-my-hung');
    expect(ids).toContain('ba-son');
    expect(ids).toContain('binh-thanh');
  });

  it('marks Thu Thiem Peninsula exclusively as The Kinetix Residences home corridor', () => {
    const homes = SAIGON_DISTRICTS.filter((d) => d.isKinetixHome);
    expect(homes).toHaveLength(1);
    expect(homes[0].id).toBe('thu-thiem');
    expect(homes[0].fiveYearAppreciationCagrPct).toBe(8.4);
  });

  it('maintains exact USD/m² parity against institutional VND_PER_USD FX rate', () => {
    for (const d of SAIGON_DISTRICTS) {
      expect(d.pricePerSqmUsd).toBe(Math.round(d.pricePerSqmVnd / VND_PER_USD));
      expect(d.pricePerSqmVnd).toBeGreaterThan(100_000_000);
      expect(d.pricePerSqmUsd).toBeGreaterThan(4_000);
    }
  });

  it('enforces Gross Yield > Net Yield and realistic 90-99% occupancy across all districts', () => {
    for (const d of SAIGON_DISTRICTS) {
      expect(d.grossRentalYieldPct).toBeGreaterThan(d.netRentalYieldPct);
      expect(d.netRentalYieldPct).toBeGreaterThan(3.5);
      expect(d.occupancyPct).toBeGreaterThanOrEqual(90);
      expect(d.occupancyPct).toBeLessThanOrEqual(99);
      expect(d.commuteToCbdMin).toBeGreaterThan(0);
    }
  });

  it('sorts districts accurately by YIELD, PRICE, APPRECIATION, and COMMUTE without mutating source', () => {
    const byYield = sortSaigonDistricts('YIELD');
    expect(byYield[0].id).toBe('thao-dien');
    expect(byYield[byYield.length - 1].id).toBe('ben-nghe');

    const byPrice = sortSaigonDistricts('PRICE');
    expect(byPrice[0].id).toBe('ben-nghe');
    expect(byPrice[byPrice.length - 1].id).toBe('phu-my-hung');

    const byAppreciation = sortSaigonDistricts('APPRECIATION');
    expect(byAppreciation[0].id).toBe('thu-thiem');

    const byCommute = sortSaigonDistricts('COMMUTE');
    expect(byCommute[0].id).toBe('ben-nghe');
    expect(byCommute[byCommute.length - 1].id).toBe('phu-my-hung');

    // Original order preserved
    expect(SAIGON_DISTRICTS[0].id).toBe('thu-thiem');
  });

  it('normalizes choropleth heat intensity strictly within [0.22, 1.00] for all metrics', () => {
    for (const metric of ['YIELD', 'PRICE', 'APPRECIATION'] as const) {
      const intensities = SAIGON_DISTRICTS.map((d) => computeDistrictHeatIntensity(d, metric));
      expect(Math.min(...intensities)).toBeCloseTo(0.22, 2);
      expect(Math.max(...intensities)).toBeCloseTo(1.0, 2);
    }
  });

  it('summarizes market averages and identifies corridor leaders accurately', () => {
    const summary = summarizeSaigonMarket();
    expect(summary.districtCount).toBe(6);
    expect(summary.highestYieldDistrict.id).toBe('thao-dien');
    expect(summary.highestAppreciationDistrict.id).toBe('thu-thiem');
    expect(summary.fastestCommuteDistrict.id).toBe('ben-nghe');
    expect(summary.averageNetYieldPct).toBeGreaterThan(4.5);
    expect(summary.averagePricePerSqmVnd).toBeGreaterThan(150_000_000);
  });

  it('resolves districts by ID with deterministic fallback to Thu Thiem', () => {
    expect(getDistrictById('ba-son').code).toBe('BS-MN');
    expect(getDistrictById('phu-my-hung').commuteToCbdMin).toBe(16);
  });

  it('includes Metro Line-1 stations and Bridge-4 / Ba Son infrastructure markers within SVG viewport', () => {
    expect(SAIGON_TRANSIT_STATIONS.length).toBeGreaterThanOrEqual(8);
    for (const st of SAIGON_TRANSIT_STATIONS) {
      expect(st.x).toBeGreaterThan(0);
      expect(st.x).toBeLessThan(700);
      expect(st.y).toBeGreaterThan(0);
      expect(st.y).toBeLessThan(440);
    }
  });
});

describe('assetBenchmarkEngine — 10-Year Multi-Asset Wealth Comparator', () => {
  it('computes exact FX-hedged S&P 500 VND return via Fisher/multiplicative formula', () => {
    // (1 + 0.095) * (1 + 0.022) - 1 = 0.11909 -> 11.91%
    expect(computeFxHedgedReturnPct(9.5, 2.2, true)).toBeCloseTo(11.91, 2);
    expect(computeFxHedgedReturnPct(9.5, 2.2, false)).toBe(9.5);
  });

  it('computes textbook Sharpe ratios with risk-free baseline equal to 0.00', () => {
    expect(computeSharpeRatio(5.8, 5.8, 0.8)).toBe(0);
    expect(computeSharpeRatio(8.5, 5.8, 14.5)).toBeCloseTo(0.19, 2);
    expect(computeSharpeRatio(11.91, 5.8, 16.2)).toBeCloseTo(0.38, 2);
    expect(computeSharpeRatio(15.0, 5.8, 0)).toBe(0);
  });

  it('produces 11 trajectory points (Year 0 to Year 10) anchored at exact initial capital', () => {
    const capital = 15_000_000_000;
    const res = computeAssetBenchmark({ initialCapitalVnd: capital });

    expect(res.trajectory).toHaveLength(11);
    expect(res.trajectory[0]).toEqual({
      year: 0,
      kinetixPropertyVnd: capital,
      vnBankDepositVnd: capital,
      sjcGoldVnd: capital,
      sp500UsdVnd: capital,
    });
    expect(res.trajectory[10].year).toBe(10);
  });

  it('derives exact implied property value and loan principal at 70% LTV', () => {
    const res = computeAssetBenchmark({ initialCapitalVnd: 15_000_000_000, ltvPct: 70 });
    expect(res.impliedPropertyValueVnd).toBe(50_000_000_000);
    expect(res.impliedLoanPrincipalVnd).toBe(35_000_000_000);
    expect(res.ltvPct).toBe(70);
  });

  it('compounds Vietnam Bank Term Deposit at exact 5.8%/yr over 10 years', () => {
    const capital = 10_000_000_000;
    const res = computeAssetBenchmark({ initialCapitalVnd: capital });
    const bank = res.assets.find((a) => a.id === 'VN_BANK_DEPOSIT')!;

    const expected = Math.round(capital * Math.pow(1.058, 10));
    expect(bank.endingWealthVnd).toBe(expected);
    expect(bank.netIrrPct).toBe(5.8);
    expect(bank.sharpeRatio).toBe(0);
    expect(bank.equityMultiple).toBeCloseTo(1.76, 2);
  });

  it('compounds SJC Physical Gold at exact 8.5%/yr over 10 years', () => {
    const capital = 10_000_000_000;
    const res = computeAssetBenchmark({ initialCapitalVnd: capital });
    const gold = res.assets.find((a) => a.id === 'SJC_GOLD')!;

    const expected = Math.round(capital * Math.pow(1.085, 10));
    expect(gold.endingWealthVnd).toBe(expected);
    expect(gold.netIrrPct).toBe(8.5);
    expect(gold.equityMultiple).toBeCloseTo(2.26, 2);
    expect(gold.sharpeRatio).toBeCloseTo((8.5 - 5.8) / ASSET_VOLATILITY_PCT.SJC_GOLD, 2);
  });

  it('compounds S&P 500 USD Index with 2.2%/yr VND FX hedge tailwind and responds to FX toggle', () => {
    const capital = 10_000_000_000;
    const hedged = computeAssetBenchmark({ initialCapitalVnd: capital, includeFxHedge: true });
    const unhedged = computeAssetBenchmark({ initialCapitalVnd: capital, includeFxHedge: false });

    const spHedged = hedged.assets.find((a) => a.id === 'SP500_USD')!;
    const spUnhedged = unhedged.assets.find((a) => a.id === 'SP500_USD')!;

    const expectedHedged = Math.round(capital * Math.pow(1.095 * 1.022, 10));
    const expectedUnhedged = Math.round(capital * Math.pow(1.095, 10));

    expect(spHedged.endingWealthVnd).toBe(expectedHedged);
    expect(spUnhedged.endingWealthVnd).toBe(expectedUnhedged);
    expect(spHedged.endingWealthVnd).toBeGreaterThan(spUnhedged.endingWealthVnd);
    expect(spHedged.netIrrPct).toBeCloseTo(11.91, 2);
    expect(spUnhedged.netIrrPct).toBe(9.5);
  });

  it('demonstrates Kinetix 70% LTV Sky-Residence outperforming Bank, Gold, and S&P 500 under Thu Thiem catalyst', () => {
    const thuThiem = getDistrictById('thu-thiem');
    const res = computeAssetBenchmark({
      initialCapitalVnd: 15_000_000_000,
      propertyAppreciationPct: thuThiem.fiveYearAppreciationCagrPct,
      propertyGrossYieldPct: thuThiem.grossRentalYieldPct,
    });

    const prop = res.assets.find((a) => a.id === 'KINETIX_PROPERTY')!;
    const sp500 = res.assets.find((a) => a.id === 'SP500_USD')!;

    expect(res.winnerAssetId).toBe('KINETIX_PROPERTY');
    expect(res.propertyAlphaVsBankVnd).toBeGreaterThan(0);
    expect(res.propertyAlphaVsGoldVnd).toBeGreaterThan(0);
    expect(res.propertyAlphaVsSp500Vnd).toBeGreaterThan(0);
    expect(prop.netIrrPct).toBeGreaterThan(sp500.netIrrPct);
    expect(prop.sharpeRatio).toBeGreaterThan(sp500.sharpeRatio);
  });

  it('honestly reflects leverage drag when property appreciation is depressed (2%/yr) — S&P 500 wins', () => {
    const res = computeAssetBenchmark({
      initialCapitalVnd: 15_000_000_000,
      propertyAppreciationPct: 2.0,
      propertyGrossYieldPct: 5.0,
      mortgageInterestRatePct: 9.5,
    });

    expect(res.winnerAssetId).toBe('SP500_USD');
    expect(res.propertyAlphaVsSp500Vnd).toBeLessThan(0);
  });

  it('scales wealth linearly across buyer down-payment capital range (5B VND to 30B VND)', () => {
    const low = computeAssetBenchmark({ initialCapitalVnd: 5_000_000_000 });
    const high = computeAssetBenchmark({ initialCapitalVnd: 30_000_000_000 });

    // 30B is exactly 6x 5B -> ending wealth must scale 6x while Net IRR and Sharpe stay invariant!
    const lowProp = low.assets.find((a) => a.id === 'KINETIX_PROPERTY')!;
    const highProp = high.assets.find((a) => a.id === 'KINETIX_PROPERTY')!;

    expect(highProp.endingWealthVnd / lowProp.endingWealthVnd).toBeCloseTo(6.0, 2);
    expect(highProp.netIrrPct).toBeCloseTo(lowProp.netIrrPct, 1);
    expect(highProp.sharpeRatio).toBeCloseTo(lowProp.sharpeRatio, 2);
  });

  it('ranks non-property asset trajectories monotonically strictly increasing year over year', () => {
    const res = computeAssetBenchmark({ initialCapitalVnd: 20_000_000_000 });
    for (let i = 1; i < res.trajectory.length; i += 1) {
      expect(res.trajectory[i].vnBankDepositVnd).toBeGreaterThan(res.trajectory[i - 1].vnBankDepositVnd);
      expect(res.trajectory[i].sjcGoldVnd).toBeGreaterThan(res.trajectory[i - 1].sjcGoldVnd);
      expect(res.trajectory[i].sp500UsdVnd).toBeGreaterThan(res.trajectory[i - 1].sp500UsdVnd);
    }
  });

  it('differentiates corridor wealth outcomes: Thu Thiem higher appreciation beats Ben Nghe over 10Y', () => {
    const thuThiem = getDistrictById('thu-thiem');
    const benNghe = getDistrictById('ben-nghe');

    const ttBench = computeAssetBenchmark({
      initialCapitalVnd: 15_000_000_000,
      propertyAppreciationPct: thuThiem.fiveYearAppreciationCagrPct,
      propertyGrossYieldPct: thuThiem.grossRentalYieldPct,
    });
    const bnBench = computeAssetBenchmark({
      initialCapitalVnd: 15_000_000_000,
      propertyAppreciationPct: benNghe.fiveYearAppreciationCagrPct,
      propertyGrossYieldPct: benNghe.grossRentalYieldPct,
    });

    const ttProp = ttBench.assets.find((a) => a.id === 'KINETIX_PROPERTY')!;
    const bnProp = bnBench.assets.find((a) => a.id === 'KINETIX_PROPERTY')!;

    expect(ttProp.endingWealthVnd).toBeGreaterThan(bnProp.endingWealthVnd);
    expect(ttProp.netIrrPct).toBeGreaterThan(bnProp.netIrrPct);
  });

  it('guards extreme inputs cleanly without NaN or Infinity', () => {
    const res = computeAssetBenchmark({
      initialCapitalVnd: 500_000, // below floor -> clamped to 1B
      horizonYears: 30, // clamped to 20
      ltvPct: 95, // clamped to 85
      mortgageInterestRatePct: -2, // clamped to 0
    });

    expect(res.initialCapitalVnd).toBe(1_000_000_000);
    expect(res.horizonYears).toBe(20);
    expect(res.ltvPct).toBe(85);
    for (const a of res.assets) {
      expect(Number.isFinite(a.endingWealthVnd)).toBe(true);
      expect(Number.isFinite(a.netIrrPct)).toBe(true);
      expect(Number.isFinite(a.sharpeRatio)).toBe(true);
    }
  });

  it('returns exactly 4 institutional asset classes matching required identifiers and defaults', () => {
    const res = computeAssetBenchmark({ initialCapitalVnd: 12_000_000_000 });
    expect(res.assets).toHaveLength(4);
    expect(res.riskFreeRatePct).toBe(BENCHMARK_DEFAULTS.bankDepositRatePct);
    const ids = res.assets.map((a) => a.id);
    expect(ids).toContain('KINETIX_PROPERTY');
    expect(ids).toContain('VN_BANK_DEPOSIT');
    expect(ids).toContain('SJC_GOLD');
    expect(ids).toContain('SP500_USD');
  });

  it('matches unleveraged 0% LTV property purchase with zero loan principal', () => {
    const res = computeAssetBenchmark({
      initialCapitalVnd: 20_000_000_000,
      ltvPct: 0,
    });
    expect(res.impliedPropertyValueVnd).toBe(20_000_000_000);
    expect(res.impliedLoanPrincipalVnd).toBe(0);
    const prop = res.assets.find((a) => a.id === 'KINETIX_PROPERTY')!;
    expect(prop.endingWealthVnd).toBeGreaterThan(20_000_000_000);
    expect(prop.netIrrPct).toBeGreaterThan(8.0);
  });
});
