import type { Residence, ResidenceFilterState } from '../types/proptech';
import { analyzeMortgageAndRoi } from './mortgageEngine';

export function computeResidencePricePerSqm(residence: Residence): number {
  if (residence.areaSqm <= 0) return 0;
  return Math.round(residence.priceVnd / residence.areaSqm);
}

export function computeResidenceMonthlyMaintenance(residence: Residence): number {
  return Math.round(residence.areaSqm * residence.maintenanceFeePerSqmVnd);
}

export function computeResidenceNetYieldPct(residence: Residence): number {
  const analysis = analyzeMortgageAndRoi({
    propertyPriceVnd: residence.priceVnd,
    downPaymentPct: 30,
    loanTermYears: 20,
    annualInterestRatePct: 7.5,
    estimatedMonthlyRentVnd: residence.estMonthlyRentVnd,
    monthlyMaintenanceFeeVnd: computeResidenceMonthlyMaintenance(residence),
    annualAppreciationPct: 6.0,
  });
  return analysis.netRentalYieldPct;
}

export function computeResidenceGrossYieldPct(residence: Residence): number {
  if (residence.priceVnd <= 0) return 0;
  return ((residence.estMonthlyRentVnd * 12) / residence.priceVnd) * 100;
}

export function filterAndSortResidences(
  residences: Residence[],
  filters: ResidenceFilterState,
  shortlistIds?: string[]
): Residence[] {
  const shortlistSet = shortlistIds ? new Set(shortlistIds) : null;
  const filtered = residences.filter((unit) => {
    if (filters.shortlistOnly && shortlistSet && !shortlistSet.has(unit.id)) return false;
    if (filters.tier !== 'ALL' && unit.tier !== filters.tier) return false;
    if (filters.orientation !== 'ALL' && unit.orientation !== filters.orientation) return false;
    if (filters.status !== 'ALL' && unit.status !== filters.status) return false;
    if (filters.floor !== null && unit.floor !== filters.floor) return false;
    if (unit.priceVnd > filters.maxPriceVnd) return false;
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (filters.sortBy) {
      case 'PRICE_ASC':
        return a.priceVnd - b.priceVnd;
      case 'PRICE_DESC':
        return b.priceVnd - a.priceVnd;
      case 'FLOOR_DESC':
        return b.floor - a.floor || a.priceVnd - b.priceVnd;
      case 'AREA_DESC':
        return b.areaSqm - a.areaSqm;
      case 'YIELD_DESC':
        return computeResidenceNetYieldPct(b) - computeResidenceNetYieldPct(a);
      default:
        return 0;
    }
  });

  return sorted;
}

export interface ComparisonMetricsRow {
  residence: Residence;
  pricePerSqmVnd: number;
  monthlyMaintenanceVnd: number;
  monthlyMortgageVnd: number;
  netYieldPct: number;
  grossYieldPct: number;
  isBestPricePerSqm: boolean;
  isHighestNetYield: boolean;
}

export function buildComparisonMetrics(
  residences: Residence[],
  assumptions: {
    downPaymentPct: number;
    loanTermYears: number;
    annualInterestRatePct: number;
  }
): ComparisonMetricsRow[] {
  if (residences.length === 0) return [];

  const baseRows = residences.map((residence) => {
    const monthlyMaintenanceVnd = computeResidenceMonthlyMaintenance(residence);
    const analysis = analyzeMortgageAndRoi({
      propertyPriceVnd: residence.priceVnd,
      downPaymentPct: assumptions.downPaymentPct,
      loanTermYears: assumptions.loanTermYears,
      annualInterestRatePct: assumptions.annualInterestRatePct,
      estimatedMonthlyRentVnd: residence.estMonthlyRentVnd,
      monthlyMaintenanceFeeVnd: monthlyMaintenanceVnd,
      annualAppreciationPct: 6.0,
    });

    return {
      residence,
      pricePerSqmVnd: computeResidencePricePerSqm(residence),
      monthlyMaintenanceVnd,
      monthlyMortgageVnd: analysis.monthlyPaymentVnd,
      netYieldPct: analysis.netRentalYieldPct,
      grossYieldPct: analysis.grossRentalYieldPct,
    };
  });

  const minPricePerSqm = Math.min(...baseRows.map((r) => r.pricePerSqmVnd));
  const maxNetYield = Math.max(...baseRows.map((r) => r.netYieldPct));

  return baseRows.map((row) => ({
    ...row,
    isBestPricePerSqm: baseRows.length > 1 && row.pricePerSqmVnd === minPricePerSqm,
    isHighestNetYield: baseRows.length > 1 && Math.abs(row.netYieldPct - maxNetYield) < 0.001,
  }));
}
