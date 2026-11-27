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
  shortlistOnly?: boolean;
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

export type DtiSafetyTier = 'SAFE' | 'CAUTION' | 'HIGH_RISK';

export interface InterestStressScenario {
  shockPct: number; // e.g. 0, 2, 4
  effectiveRatePct: number;
  monthlyPaymentVnd: number;
  deltaMonthlyPaymentVnd: number;
  totalInterestVnd: number;
  deltaTotalInterestVnd: number;
  monthlyNetCashFlowVnd: number;
  dtiRatioPct: number;
  dtiSafetyTier: DtiSafetyTier;
}

export interface InterestStressTestSummary {
  monthlyIncomeVnd: number;
  activeShockPct: number;
  activeScenario: InterestStressScenario;
  benchmarkScenarios: InterestStressScenario[];
}

export interface DepositHoldRecord {
  holdId: string;
  residenceId: string;
  residenceCode: string;
  amountVnd: number;
  transferMemo: string;
  passCode?: string;
  createdAtIso: string;
  bankBin: string;
  accountNumber: string;
  accountName: string;
}

export type SolarSeason =
  | 'VERNAL_EQUINOX'
  | 'SUMMER_SOLSTICE'
  | 'AUTUMN_EQUINOX'
  | 'WINTER_SOLSTICE';

export type DaylightComfortTier =
  | 'OPTIMAL_DAYLIGHT'
  | 'BRIGHT_DIRECT_GLARE'
  | 'AMBIENT_DIFFUSE'
  | 'TWILIGHT_LOW';

export type ThermalLoadTier =
  | 'COOL_MORNING'
  | 'BALANCED'
  | 'ELEVATED_SOLAR_GAIN'
  | 'PEAK_WEST_LOAD';

export interface SolarExposureInput {
  /** Local clock hour in Ho Chi Minh City (UTC+7), 6.0 to 18.0 */
  localHour: number;
  season: SolarSeason;
  /** Facade / balcony outward normal azimuth in degrees clockwise from True North (0=N, 90=E, 180=S, 270=W) */
  facadeAzimuthDeg: number;
  /** Architectural loggia overhang depth in meters (default 2.2m) */
  overhangDepthM?: number;
  /** Clear interior ceiling height in meters (default 3.5m) */
  ceilingHeightM?: number;
  /** Triple Low-E glazing SHGC (default 0.36) */
  glazingShgc?: number;
}

export interface SolarHourlySample {
  localHour: number;
  altitudeDeg: number;
  azimuthDeg: number;
  exteriorIrradianceWm2: number;
  interiorSolarGainWm2: number;
  daylightLux: number;
  directSunHit: boolean;
}

export interface SolarExposureResult {
  latitudeDeg: number;
  longitudeDeg: number;
  season: SolarSeason;
  dayOfYear: number;
  localHour: number;
  trueSolarHour: number;
  declinationDeg: number;
  solarAltitudeDeg: number;
  solarAzimuthDeg: number;
  facadeAzimuthDeg: number;
  facadeCardinal: string;
  relativeAzimuthDeg: number;
  incidenceAngleDeg: number;
  directSunHit: boolean;
  shadedFraction: number;
  penetrationDepthM: number;
  directNormalIrradianceWm2: number;
  exteriorFacadeIrradianceWm2: number;
  interiorSolarGainWm2: number;
  naturalDaylightLux: number;
  daylightComfortTier: DaylightComfortTier;
  thermalLoadTier: ThermalLoadTier;
  solarNoonAltitudeDeg: number;
  solarNoonCardinal: 'N' | 'S';
  dailyProfile: SolarHourlySample[];
}

export interface LeverageYearPoint {
  year: number;
  cashAnnualNetCashflowVnd: number;
  leveragedAnnualNetCashflowVnd: number;
  cashCumulativeCashflowVnd: number;
  leveragedCumulativeCashflowVnd: number;
  cashNetWealthVnd: number;
  leveragedNetWealthVnd: number;
  propertyValueVnd: number;
  remainingDebtVnd: number;
}

export interface LeverageStrategyMetrics {
  label: 'CASH_100' | 'LEVERAGED_70';
  ltvPct: number;
  initialEquityVnd: number;
  loanPrincipalVnd: number;
  annualInterestRatePct: number;
  tenYearGrossRentVnd: number;
  tenYearOperatingFeesVnd: number;
  tenYearNetOperatingIncomeVnd: number;
  tenYearDebtServiceVnd: number;
  tenYearInterestPaidVnd: number;
  year10PropertyValueVnd: number;
  year10RemainingDebtVnd: number;
  exitTransactionCostVnd: number;
  netExitProceedsVnd: number;
  totalNetProfitVnd: number;
  equityMultiple: number;
  netIrrPct: number;
  averageAnnualCashOnCashPct: number;
}

export interface LeverageComparisonResult {
  horizonYears: number;
  cashStrategy: LeverageStrategyMetrics;
  leveragedStrategy: LeverageStrategyMetrics;
  irrSpreadPct: number;
  equityMultipleAdvantage: number;
  capitalFreedVnd: number;
  yearlyComparison: LeverageYearPoint[];
}
