export type Language = 'vi' | 'en';
export type Currency = 'VND' | 'USD';
export type ThemeMode = 'dark' | 'light';

export type BedroomTier = '1BR' | '2BR' | '3BR' | 'PENTHOUSE';
export type Orientation = 'RIVER_PANORAMIC' | 'SUNSET_CBD' | 'BOTANICAL';
export type UnitStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type SortOption = 'PRICE_ASC' | 'PRICE_DESC' | 'FLOOR_DESC' | 'YIELD_DESC' | 'AREA_DESC';

export interface FloorplanRoom {
  id: string;
  labelVi: string;
  labelEn: string;
  areaSqm: number;
  dimensions: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zone: 'living' | 'bedroom' | 'kitchen' | 'bath' | 'terrace' | 'foyer';
}

export interface GalleryImage {
  src: string;
  captionVi: string;
  captionEn: string;
  tagVi: string;
  tagEn: string;
}

export interface Residence {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  floor: number;
  wing: 'NORTH' | 'SOUTH' | 'CROWN';
  tier: BedroomTier;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  terraceSqm: number;
  ceilingHeightM: number;
  orientation: Orientation;
  compassDeg: number;
  riverViewScore: number; // 0-100
  status: UnitStatus;
  priceVnd: number; // exact VND
  estMonthlyRentVnd: number;
  maintenanceFeePerSqmVnd: number; // VND/m2/month
  privateLift: boolean;
  parkingSlots: number;
  handoverQuarter: string;
  highlightsVi: string[];
  highlightsEn: string[];
  heroImage: string;
  gallery: GalleryImage[];
  floorplanRooms: FloorplanRoom[];
}

export interface ResidenceFilterState {
  tier: BedroomTier | 'ALL';
  orientation: Orientation | 'ALL';
  status: UnitStatus | 'ALL';
  floor: number | null;
  maxPriceVnd: number;
  sortBy: SortOption;
}

export interface MortgageInputs {
  propertyPriceVnd: number;
  downPaymentPct: number; // 20 - 70
  loanTermYears: number; // 5 - 30
  annualInterestRatePct: number; // 5.5 - 12.5
  estimatedMonthlyRentVnd: number;
  monthlyMaintenanceFeeVnd: number;
  annualAppreciationPct: number; // e.g. 6.0
  vacancyMonthsPerYear?: number; // default 0.8
  managementAndTaxRatePct?: number; // default 10 (5% VAT + 5% PIT Vietnam standard rental tax)
}

export interface AmortizationYearRow {
  year: number;
  openingBalanceVnd: number;
  annualPaymentVnd: number;
  principalPaidVnd: number;
  interestPaidVnd: number;
  endingBalanceVnd: number;
  cumulativeInterestVnd: number;
  cumulativePrincipalVnd: number;
}

export interface EquityProjectionPoint {
  year: number;
  propertyValueVnd: number;
  remainingDebtVnd: number;
  netEquityVnd: number;
  cumulativeNetRentVnd: number;
  totalWealthVnd: number;
  roiPct: number;
}

export interface MortgageAnalysisResult {
  propertyPriceVnd: number;
  downPaymentVnd: number;
  loanPrincipalVnd: number;
  monthlyPaymentVnd: number;
  totalPaymentsVnd: number;
  totalInterestVnd: number;
  interestToPrincipalRatio: number;
  grossAnnualRentVnd: number;
  annualOperatingCostsVnd: number;
  netAnnualRentVnd: number;
  grossRentalYieldPct: number;
  netRentalYieldPct: number;
  monthlyNetCashFlowVnd: number;
  cashOnCashReturnPct: number;
  tenYearEquityGainVnd: number;
  tenYearTotalRoiPct: number;
  amortizationSchedule: AmortizationYearRow[];
  tenYearProjection: EquityProjectionPoint[];
}

export type ViewingFormat = 'GALLERY_ONSITE' | 'PRIVATE_3D_TOUR';

export interface ViewingBookingInput {
  residenceId: string;
  residenceCode: string;
  dateIso: string;
  timeSlot: string;
  format: ViewingFormat;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes?: string;
}

export interface VipPassRecord extends ViewingBookingInput {
  passCode: string; // KNX-2026-XXXX
  advisorName: string;
  advisorTitleVi: string;
  advisorTitleEn: string;
  issuedAtIso: string;
  qrMatrix: boolean[][];
}
