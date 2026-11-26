import { describe, expect, it } from 'vitest';
import { RESIDENCES } from '../../data/residences';
import {
  buildComparisonMetrics,
  computeResidenceGrossYieldPct,
  computeResidenceMonthlyMaintenance,
  computeResidenceNetYieldPct,
  computeResidencePricePerSqm,
  filterAndSortResidences,
} from '../residenceEngine';
import type { ResidenceFilterState } from '../../types/proptech';

const DEFAULT_FILTERS: ResidenceFilterState = {
  tier: 'ALL',
  orientation: 'ALL',
  status: 'ALL',
  floor: null,
  maxPriceVnd: 90_000_000_000,
  sortBy: 'FLOOR_DESC',
};

describe('residenceEngine — Inventory Integrity, Filtering & Sorting', () => {
  it('contains exactly 12 curated luxury residences spanning Floors 18 to 42', () => {
    expect(RESIDENCES).toHaveLength(12);
    const floors = RESIDENCES.map((r) => r.floor);
    expect(Math.min(...floors)).toBe(18);
    expect(Math.max(...floors)).toBe(42);
  });

  it('filters accurately by bedroom tier (PENTHOUSE)', () => {
    const result = filterAndSortResidences(RESIDENCES, { ...DEFAULT_FILTERS, tier: 'PENTHOUSE' });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.tier === 'PENTHOUSE')).toBe(true);
  });

  it('filters accurately by orientation (RIVER_PANORAMIC) and status (AVAILABLE)', () => {
    const result = filterAndSortResidences(RESIDENCES, {
      ...DEFAULT_FILTERS,
      orientation: 'RIVER_PANORAMIC',
      status: 'AVAILABLE',
    });
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.every((r) => r.orientation === 'RIVER_PANORAMIC' && r.status === 'AVAILABLE')).toBe(true);
  });

  it('filters accurately by specific floor selected from tower elevation', () => {
    const result = filterAndSortResidences(RESIDENCES, { ...DEFAULT_FILTERS, floor: 36 });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('K-36A');
  });

  it('filters accurately by maximum price ceiling', () => {
    const result = filterAndSortResidences(RESIDENCES, {
      ...DEFAULT_FILTERS,
      maxPriceVnd: 25_000_000_000,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.priceVnd <= 25_000_000_000)).toBe(true);
  });

  it('sorts accurately by PRICE_ASC, PRICE_DESC, FLOOR_DESC, AREA_DESC, and YIELD_DESC', () => {
    const asc = filterAndSortResidences(RESIDENCES, { ...DEFAULT_FILTERS, sortBy: 'PRICE_ASC' });
    const desc = filterAndSortResidences(RESIDENCES, { ...DEFAULT_FILTERS, sortBy: 'PRICE_DESC' });
    const floorDesc = filterAndSortResidences(RESIDENCES, { ...DEFAULT_FILTERS, sortBy: 'FLOOR_DESC' });
    const areaDesc = filterAndSortResidences(RESIDENCES, { ...DEFAULT_FILTERS, sortBy: 'AREA_DESC' });
    const yieldDesc = filterAndSortResidences(RESIDENCES, { ...DEFAULT_FILTERS, sortBy: 'YIELD_DESC' });

    expect(asc[0].priceVnd).toBeLessThanOrEqual(asc[asc.length - 1].priceVnd);
    expect(desc[0].priceVnd).toBeGreaterThanOrEqual(desc[desc.length - 1].priceVnd);
    expect(floorDesc[0].floor).toBe(42);
    expect(areaDesc[0].areaSqm).toBe(332);
    expect(computeResidenceNetYieldPct(yieldDesc[0])).toBeGreaterThanOrEqual(
      computeResidenceNetYieldPct(yieldDesc[yieldDesc.length - 1])
    );
  });

  it('computes unit price/m2, maintenance fees, and gross/net yield cleanly', () => {
    const unit = RESIDENCES[0]; // 72m2, 11.4B VND, 38k/m2
    expect(computeResidencePricePerSqm(unit)).toBe(Math.round(11_400_000_000 / 72));
    expect(computeResidenceMonthlyMaintenance(unit)).toBe(72 * 38_000);
    expect(computeResidenceGrossYieldPct(unit)).toBeGreaterThan(computeResidenceNetYieldPct(unit));
  });

  it('builds side-by-side comparison metrics and flags best price/m2 and highest net yield', () => {
    const trio = [RESIDENCES[0], RESIDENCES[4], RESIDENCES[11]]; // 1BR, 2BR, Floor 42 Penthouse
    const rows = buildComparisonMetrics(trio, {
      downPaymentPct: 30,
      loanTermYears: 20,
      annualInterestRatePct: 7.2,
    });

    expect(rows).toHaveLength(3);
    expect(rows.filter((r) => r.isBestPricePerSqm)).toHaveLength(1);
    expect(rows.filter((r) => r.isHighestNetYield)).toHaveLength(1);
    expect(rows[0].isBestPricePerSqm).toBe(true); // 1BR floor 18 has lowest price/m2
    expect(rows.every((r) => r.monthlyMortgageVnd > 0)).toBe(true);
  });
});
