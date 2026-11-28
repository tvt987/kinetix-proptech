/**
 * Kinetix PropTech v5.0 — Pure Deterministic 3D Saigon Sky-Tower, Sun-Path & Metro Twin Engine.
 * Zero Three.js / DOM dependencies so all kinematics, solar physics, sightlines,
 * X-Ray floorplate layouts, and idempotent 409 escrow transitions are 100% unit-testable.
 */

export const SAIGON_TOWER_LAT_DEG = 10.78;
export const SAIGON_TOWER_LON_DEG = 106.72;
export const SKY_TOWER_TOTAL_STORIES = 28;
export const TOWER_WORLD_SCALE = 1 / 5.4; // 1 Three.js world unit = 5.4 meters
export const TOWER_PODIUM_HEIGHT_M = 11.2;
export const STANDARD_FLOOR_HEIGHT_M = 3.6;
export const CROWN_FLOOR_HEIGHT_M = 4.4;
export const TOWER_FOOTPRINT_WIDTH = 5.6;
export const TOWER_FOOTPRINT_DEPTH = 4.4;

export type SkyTowerFacadeSide = 'SE_RIVER' | 'SW_SUNSET' | 'NE_LANDMARK81';
export type SkyTowerUnitStatus = 'Available' | 'Reserved' | 'Sold';
export type SkyTowerCameraMode = 'ORBIT' | 'BALCONY_POV' | 'XRAY';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SkyTowerUnit {
  unitCode: string;
  residenceId: string;
  residenceCode: string;
  nameEn: string;
  nameVi: string;
  story: number; // 1..28
  floorHeightM: number; // Architectural slab elevation in meters
  worldY: number; // Three.js Y coordinate of floor slab center
  slabThicknessWorld: number;
  facadeSide: SkyTowerFacadeSide;
  orientationLabel: 'SE River' | 'SW Sunset' | 'NE Landmark 81';
  orientationLabelVi: string;
  facadeAzimuthDeg: number; // Clockwise from True North (0=N, 90=E, 180=S, 270=W)
  sightlineLabel: string;
  sightlineLabelVi: string;
  sightlineScore: number; // 0..100
  baseStatus: SkyTowerUnitStatus;
  tier: '1BR' | '2BR' | '3BR' | 'PENTHOUSE';
  bedrooms: number;
  areaSqm: number;
  terraceSqm: number;
  overhangDepthM: number;
  ceilingHeightM: number;
  priceVnd: number;
  priceUsd: number;
  rentalYieldPct: number;
  balconyWorldPos: Vec3;
  balconyLookTarget: Vec3;
  featuredQuickPick: boolean;
}

export type SaigonSolarPhase =
  | 'DAWN'
  | 'MORNING'
  | 'SOLAR_NOON'
  | 'AFTERNOON'
  | 'GOLDEN_HOUR'
  | 'DUSK';

export interface SaigonSolarState {
  hour: number; // Clamped 6.0..18.5
  clockLabel: string; // HH:MM
  phase: SaigonSolarPhase;
  latitudeDeg: number;
  elevationDeg: number;
  azimuthDeg: number; // Clockwise from North
  sunVector: Vec3; // Normalized unit vector from origin toward sun (+X=E, +Y=Up, -Z=N, +Z=S)
  sunPosition: Vec3; // World position on sky arc
  shadowAngleDeg: number; // Horizontal bearing shadows are cast toward
  shadowLengthFactor: number; // Ratio of shadow length to object height
  colorTemperatureK: number; // 2400K..5800K
  sunColorHex: string;
  skyTopColorHex: string;
  skyHorizonColorHex: string;
  ambientColorHex: string;
  fogColorHex: string;
  riverTintHex: string;
  sunIntensity: number;
  ambientIntensity: number;
  emissiveWindowFactor: number; // 0..1 warm interior glow at sunset/dusk
}

export interface UnitSolarTelemetry {
  unitCode: string;
  hour: number;
  directSunlight: boolean;
  incidenceAngleDeg: number;
  solarHeatGainKwM2: number; // kW/m^2 interior transmitted heat gain through Low-E glass
  exteriorIrradianceKwM2: number;
  balconyShadePct: number; // 0..100% shaded fraction
  thermalRating: 'SHADED_COOL' | 'OPTIMAL' | 'WARM_GLOW' | 'PEAK_SOLAR';
}

export interface MetroCarPose {
  index: number;
  x: number;
  y: number;
  z: number;
  yawRad: number;
}

export interface MetroTrainState {
  timeSeconds: number;
  cycleProgress: number; // 0..1 along loop
  direction: 1 | -1;
  speedKmh: number;
  stationState: 'CRUISING' | 'APPROACHING_STATION' | 'BOARDING';
  nextStationEn: string;
  nextStationVi: string;
  headPosition: Vec3;
  headlightGlow: number;
  cars: MetroCarPose[];
}

export interface XRayRoomVolume {
  id: string;
  labelEn: string;
  labelVi: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  colorHex: string;
  glowHex: string;
  areaSqm: number;
}

export interface XRayFloorplateLayout {
  unitCode: string;
  story: number;
  worldY: number;
  slabWidth: number;
  slabDepth: number;
  structuralCore: {
    width: number;
    depth: number;
    height: number;
    colorHex: string;
    elevatorShafts: Array<{ x: number; z: number }>;
  };
  perimeterColumns: Array<{ x: number; z: number }>;
  rooms: XRayRoomVolume[];
}

export interface CameraPresetPose {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface EscrowLockRecord {
  unitCode: string;
  residenceId: string;
  holdToken: string;
  idempotencyKey: string;
  lockedAtIso: string;
}

export type EscrowLockRegistry = Record<string, EscrowLockRecord>;

export type EscrowLockOutcome =
  | 'LOCKED_CREATED'
  | 'IDEMPOTENT_REPLAY'
  | 'CONFLICT_LOCKED'
  | 'CONFLICT_SOLD'
  | 'NOT_FOUND';

export interface EscrowLockTransitionResult {
  httpStatus: 201 | 200 | 409 | 404;
  outcome: EscrowLockOutcome;
  unitCode: string;
  effectiveStatus: SkyTowerUnitStatus;
  holdToken: string | null;
  messageEn: string;
  messageVi: string;
  nextRegistry: EscrowLockRegistry;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const VND_PER_USD = 25_400;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toByte = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`.toUpperCase();
}

export function lerpHexColor(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

/**
 * Deterministic architectural elevation in meters for story 1..28.
 * Stories 1..23 use standard 3.6m slab-to-slab; crown stories 24..28 use 4.4m double-volume heights.
 */
export function computeStoryElevationM(story: number): number {
  const s = clamp(Math.round(story), 1, SKY_TOWER_TOTAL_STORIES);
  const standardStories = Math.min(s - 1, 22);
  const crownStories = Math.max(0, s - 23);
  return Number(
    (
      TOWER_PODIUM_HEIGHT_M +
      standardStories * STANDARD_FLOOR_HEIGHT_M +
      crownStories * CROWN_FLOOR_HEIGHT_M
    ).toFixed(2)
  );
}

export function storyToWorldY(story: number): number {
  return Number((computeStoryElevationM(story) * TOWER_WORLD_SCALE).toFixed(3));
}

export function computeTowerTotalHeightM(): number {
  return Number((computeStoryElevationM(SKY_TOWER_TOTAL_STORIES) + 6.4).toFixed(2));
}

export function computeTowerTotalWorldY(): number {
  return Number((computeTowerTotalHeightM() * TOWER_WORLD_SCALE).toFixed(3));
}

/**
 * Computes exact balcony terrace world coordinates & outward river/skyline sightline vector.
 */
function computeBalconyCameraGeometry(
  story: number,
  facadeSide: SkyTowerFacadeSide,
  azimuthDeg: number
): { balconyWorldPos: Vec3; balconyLookTarget: Vec3 } {
  const floorY = storyToWorldY(story);
  const eyeY = Number((floorY + 0.56).toFixed(3));
  const azRad = azimuthDeg * DEG_TO_RAD;
  const dirX = Math.sin(azRad);
  const dirZ = -Math.cos(azRad);

  // Crown setback above story 23 narrows footprint slightly for sculptural taper
  const crownScale = story >= 24 ? 0.88 : 1.0;
  const halfW = (TOWER_FOOTPRINT_WIDTH * crownScale) / 2;
  const halfD = (TOWER_FOOTPRINT_DEPTH * crownScale) / 2;

  let bx = 0;
  let bz = 0;
  if (facadeSide === 'SE_RIVER') {
    bx = halfW * 0.62 + 0.95;
    bz = halfD + 1.15;
  } else if (facadeSide === 'SW_SUNSET') {
    bx = -(halfW * 0.62 + 0.95);
    bz = halfD + 1.15;
  } else {
    // NE_LANDMARK81
    bx = halfW + 1.18;
    bz = -(halfD * 0.45 + 0.72);
  }

  const lookDist = 36;
  // Natural penthouse terrace gaze angled toward the riverfront Metro viaduct, yachts & far skyline
  const gazeDrop = 5.2 + (story / SKY_TOWER_TOTAL_STORIES) * 6.8;

  return {
    balconyWorldPos: {
      x: Number(bx.toFixed(3)),
      y: eyeY,
      z: Number(bz.toFixed(3)),
    },
    balconyLookTarget: {
      x: Number((bx + dirX * lookDist).toFixed(3)),
      y: Number(Math.max(1.8, eyeY - gazeDrop).toFixed(3)),
      z: Number((bz + dirZ * lookDist).toFixed(3)),
    },
  };
}

interface RawUnitSpec {
  unitCode: string;
  residenceId: string;
  residenceCode: string;
  nameEn: string;
  nameVi: string;
  story: number;
  facadeSide: SkyTowerFacadeSide;
  baseStatus: SkyTowerUnitStatus;
  tier: '1BR' | '2BR' | '3BR' | 'PENTHOUSE';
  bedrooms: number;
  areaSqm: number;
  terraceSqm: number;
  overhangDepthM: number;
  ceilingHeightM: number;
  priceVnd: number;
  rentalYieldPct: number;
  sightlineScore: number;
  featuredQuickPick: boolean;
}

const FACADE_METADATA: Record<
  SkyTowerFacadeSide,
  {
    orientationLabel: 'SE River' | 'SW Sunset' | 'NE Landmark 81';
    orientationLabelVi: string;
    azimuthDeg: number;
    sightlineLabel: string;
    sightlineLabelVi: string;
  }
> = {
  SE_RIVER: {
    orientationLabel: 'SE River',
    orientationLabelVi: 'Đông Nam · Sông Sài Gòn',
    azimuthDeg: 138,
    sightlineLabel: 'Saigon River & Metro Line-1',
    sightlineLabelVi: 'Sông Sài Gòn & Tuyến Metro Số 1',
  },
  SW_SUNSET: {
    orientationLabel: 'SW Sunset',
    orientationLabelVi: 'Tây Nam · Hoàng Hôn Q.1',
    azimuthDeg: 232,
    sightlineLabel: 'District 1 Sunset & Ba Son Bridge',
    sightlineLabelVi: 'Hoàng Hôn Quận 1 & Cầu Ba Son',
  },
  NE_LANDMARK81: {
    orientationLabel: 'NE Landmark 81',
    orientationLabelVi: 'Đông Bắc · Landmark 81',
    azimuthDeg: 48,
    sightlineLabel: 'Landmark 81 & Thao Dien Bend',
    sightlineLabelVi: 'Landmark 81 & Khúc Cua Thảo Điền',
  },
};

const RAW_UNITS: RawUnitSpec[] = [
  {
    unitCode: 'U-06B',
    residenceId: 'knx-18a',
    residenceCode: 'K-18A',
    nameEn: 'Riverfront Atelier 1BR',
    nameVi: 'Atelier Ven Sông 1PN',
    story: 6,
    facadeSide: 'SE_RIVER',
    baseStatus: 'Available',
    tier: '1BR',
    bedrooms: 1,
    areaSqm: 72,
    terraceSqm: 9.5,
    overhangDepthM: 2.1,
    ceilingHeightM: 3.3,
    priceVnd: 11_400_000_000,
    rentalYieldPct: 7.8,
    sightlineScore: 84,
    featuredQuickPick: false,
  },
  {
    unitCode: 'U-08A',
    residenceId: 'knx-24a',
    residenceCode: 'K-24A',
    nameEn: 'Saigon Riverbend Suite 2BR',
    nameVi: 'Suite Khúc Cua Sông 2PN',
    story: 8,
    facadeSide: 'SE_RIVER',
    baseStatus: 'Available',
    tier: '2BR',
    bedrooms: 2,
    areaSqm: 118,
    terraceSqm: 14.5,
    overhangDepthM: 2.3,
    ceilingHeightM: 3.4,
    priceVnd: 20_600_000_000,
    rentalYieldPct: 7.4,
    sightlineScore: 89,
    featuredQuickPick: true,
  },
  {
    unitCode: 'U-10A',
    residenceId: 'knx-26c',
    residenceCode: 'K-26C',
    nameEn: 'Emerald Canopy 2BR',
    nameVi: 'Vườn Xanh Sinh Thái 2PN',
    story: 10,
    facadeSide: 'NE_LANDMARK81',
    baseStatus: 'Sold',
    tier: '2BR',
    bedrooms: 2,
    areaSqm: 124,
    terraceSqm: 15.8,
    overhangDepthM: 2.2,
    ceilingHeightM: 3.4,
    priceVnd: 21_400_000_000,
    rentalYieldPct: 7.3,
    sightlineScore: 88,
    featuredQuickPick: false,
  },
  {
    unitCode: 'U-12B',
    residenceId: 'knx-21b',
    residenceCode: 'K-21B',
    nameEn: 'District 1 Horizon Suite 2BR',
    nameVi: 'Chân Trời Quận 1 · 2PN',
    story: 12,
    facadeSide: 'SW_SUNSET',
    baseStatus: 'Reserved',
    tier: '2BR',
    bedrooms: 2,
    areaSqm: 126,
    terraceSqm: 15.2,
    overhangDepthM: 2.4,
    ceilingHeightM: 3.4,
    priceVnd: 22_950_000_000,
    rentalYieldPct: 7.5,
    sightlineScore: 91,
    featuredQuickPick: true,
  },
  {
    unitCode: 'U-14C',
    residenceId: 'knx-28a',
    residenceCode: 'K-28A',
    nameEn: 'Sky Garden Corner 2BR',
    nameVi: 'Căn Góc Vườn Treo 2PN',
    story: 14,
    facadeSide: 'SE_RIVER',
    baseStatus: 'Available',
    tier: '2BR',
    bedrooms: 2,
    areaSqm: 132,
    terraceSqm: 18.0,
    overhangDepthM: 2.6,
    ceilingHeightM: 3.5,
    priceVnd: 24_200_000_000,
    rentalYieldPct: 7.5,
    sightlineScore: 93,
    featuredQuickPick: false,
  },
  {
    unitCode: 'U-16A',
    residenceId: 'knx-30b',
    residenceCode: 'K-30B',
    nameEn: 'Bronze Loggia Signature 2BR',
    nameVi: 'Logia Đồng Champagne 2PN',
    story: 16,
    facadeSide: 'SE_RIVER',
    baseStatus: 'Available',
    tier: '2BR',
    bedrooms: 2,
    areaSqm: 138,
    terraceSqm: 18.4,
    overhangDepthM: 2.5,
    ceilingHeightM: 3.5,
    priceVnd: 26_500_000_000,
    rentalYieldPct: 7.4,
    sightlineScore: 95,
    featuredQuickPick: true,
  },
  {
    unitCode: 'U-18B',
    residenceId: 'knx-34b',
    residenceCode: 'K-34B',
    nameEn: 'Sunset Sanctuary 3BR',
    nameVi: 'Thánh Địa Hoàng Hôn 3PN',
    story: 18,
    facadeSide: 'SW_SUNSET',
    baseStatus: 'Reserved',
    tier: '3BR',
    bedrooms: 3,
    areaSqm: 196,
    terraceSqm: 24.5,
    overhangDepthM: 2.5,
    ceilingHeightM: 3.6,
    priceVnd: 40_500_000_000,
    rentalYieldPct: 7.1,
    sightlineScore: 95,
    featuredQuickPick: false,
  },
  {
    unitCode: 'U-20C',
    residenceId: 'knx-32a',
    residenceCode: 'K-32A',
    nameEn: 'Landmark 81 Vista 3BR',
    nameVi: 'Tầm Nhìn Landmark 81 · 3PN',
    story: 20,
    facadeSide: 'NE_LANDMARK81',
    baseStatus: 'Available',
    tier: '3BR',
    bedrooms: 3,
    areaSqm: 188,
    terraceSqm: 22.0,
    overhangDepthM: 2.4,
    ceilingHeightM: 3.6,
    priceVnd: 37_800_000_000,
    rentalYieldPct: 7.3,
    sightlineScore: 96,
    featuredQuickPick: true,
  },
  {
    unitCode: 'U-22A',
    residenceId: 'knx-38a',
    residenceCode: 'K-38A',
    nameEn: 'Sovereign Sky Villa 3BR',
    nameVi: 'Biệt Thự Trên Không 3PN',
    story: 22,
    facadeSide: 'SE_RIVER',
    baseStatus: 'Sold',
    tier: '3BR',
    bedrooms: 3,
    areaSqm: 226,
    terraceSqm: 31.0,
    overhangDepthM: 2.7,
    ceilingHeightM: 3.9,
    priceVnd: 51_200_000_000,
    rentalYieldPct: 7.1,
    sightlineScore: 97,
    featuredQuickPick: false,
  },
  {
    unitCode: 'U-24PH',
    residenceId: 'knx-40p',
    residenceCode: 'K-40P',
    nameEn: 'Obsidian Sky Penthouse',
    nameVi: 'Penthouse Thông Tầng Obsidian',
    story: 24,
    facadeSide: 'SW_SUNSET',
    baseStatus: 'Available',
    tier: 'PENTHOUSE',
    bedrooms: 4,
    areaSqm: 288,
    terraceSqm: 54.0,
    overhangDepthM: 3.0,
    ceilingHeightM: 6.2,
    priceVnd: 68_500_000_000,
    rentalYieldPct: 7.2,
    sightlineScore: 98,
    featuredQuickPick: true,
  },
  {
    unitCode: 'U-26PH',
    residenceId: 'knx-36a',
    residenceCode: 'K-36A',
    nameEn: 'Atelier River Crown 3BR',
    nameVi: 'Vương Miện Sông Sài Gòn 3PN',
    story: 26,
    facadeSide: 'SE_RIVER',
    baseStatus: 'Available',
    tier: '3BR',
    bedrooms: 3,
    areaSqm: 208,
    terraceSqm: 28.0,
    overhangDepthM: 2.8,
    ceilingHeightM: 4.0,
    priceVnd: 44_800_000_000,
    rentalYieldPct: 7.3,
    sightlineScore: 99,
    featuredQuickPick: false,
  },
  {
    unitCode: 'U-28SKY',
    residenceId: 'knx-42p',
    residenceCode: 'K-42P',
    nameEn: 'Kinetix Crown Sky Duplex',
    nameVi: 'Dinh Thự Đỉnh Tháp Crown Duplex',
    story: 28,
    facadeSide: 'SE_RIVER',
    baseStatus: 'Available',
    tier: 'PENTHOUSE',
    bedrooms: 4,
    areaSqm: 332,
    terraceSqm: 68.0,
    overhangDepthM: 3.2,
    ceilingHeightM: 6.8,
    priceVnd: 79_800_000_000,
    rentalYieldPct: 7.1,
    sightlineScore: 100,
    featuredQuickPick: true,
  },
];

export const SKY_TOWER_UNITS: SkyTowerUnit[] = RAW_UNITS.map((spec) => {
  const meta = FACADE_METADATA[spec.facadeSide];
  const floorHeightM = computeStoryElevationM(spec.story);
  const worldY = storyToWorldY(spec.story);
  const geom = computeBalconyCameraGeometry(spec.story, spec.facadeSide, meta.azimuthDeg);
  return {
    unitCode: spec.unitCode,
    residenceId: spec.residenceId,
    residenceCode: spec.residenceCode,
    nameEn: spec.nameEn,
    nameVi: spec.nameVi,
    story: spec.story,
    floorHeightM,
    worldY,
    slabThicknessWorld: spec.story >= 24 ? 0.72 : 0.58,
    facadeSide: spec.facadeSide,
    orientationLabel: meta.orientationLabel,
    orientationLabelVi: meta.orientationLabelVi,
    facadeAzimuthDeg: meta.azimuthDeg,
    sightlineLabel: meta.sightlineLabel,
    sightlineLabelVi: meta.sightlineLabelVi,
    sightlineScore: spec.sightlineScore,
    baseStatus: spec.baseStatus,
    tier: spec.tier,
    bedrooms: spec.bedrooms,
    areaSqm: spec.areaSqm,
    terraceSqm: spec.terraceSqm,
    overhangDepthM: spec.overhangDepthM,
    ceilingHeightM: spec.ceilingHeightM,
    priceVnd: spec.priceVnd,
    priceUsd: Math.round(spec.priceVnd / VND_PER_USD),
    rentalYieldPct: spec.rentalYieldPct,
    balconyWorldPos: geom.balconyWorldPos,
    balconyLookTarget: geom.balconyLookTarget,
    featuredQuickPick: spec.featuredQuickPick,
  };
});

export function getSkyTowerUnitByCode(unitCode: string): SkyTowerUnit | undefined {
  return SKY_TOWER_UNITS.find((u) => u.unitCode === unitCode);
}

export function getSkyTowerUnitByResidenceId(residenceId: string): SkyTowerUnit | undefined {
  return SKY_TOWER_UNITS.find((u) => u.residenceId === residenceId);
}

export function getEffectiveUnitStatus(
  unit: SkyTowerUnit,
  registry: EscrowLockRegistry
): SkyTowerUnitStatus {
  if (unit.baseStatus === 'Sold') return 'Sold';
  if (registry[unit.unitCode]) return 'Reserved';
  return unit.baseStatus;
}

export function formatSolarClock(hour: number): string {
  const clamped = clamp(hour, 0, 24);
  const totalMin = Math.round(clamped * 60);
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Astronomical Saigon solar physics solver (10.78°N, dry-season equinox/spring declination).
 * Computes sun elevation/azimuth, 3D orbital vector, shadow bearing, sky/sun color temperatures,
 * and twilight interior glow factor across 06:00 Dawn → 12:30 Noon → 17:30 Golden Sunset → 18:30 Dusk.
 */
export function computeSaigonSolarState(rawHour: number): SaigonSolarState {
  const hour = Number(clamp(Number.isFinite(rawHour) ? rawHour : 10.25, 6.0, 18.5).toFixed(2));
  const latRad = SAIGON_TOWER_LAT_DEG * DEG_TO_RAD;
  // Dry-season tropical Saigon declination (+2.5°): sun peaks slightly south of zenith (~81.7° at 12:15)
  const declinationDeg = 2.5;
  const decRad = declinationDeg * DEG_TO_RAD;
  // Saigon solar noon occurs near 12:12 local UTC+7 (106.72°E vs 105°E meridian)
  const trueSolarHour = hour - 0.15;
  const hourAngleRad = 15.0 * (trueSolarHour - 12.0) * DEG_TO_RAD;

  const sinEl = clamp(
    Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad),
    -1,
    1
  );
  const rawElevationDeg = Math.asin(sinEl) * RAD_TO_DEG;
  const elevationDeg = Number(Math.max(1.2, rawElevationDeg).toFixed(2));

  const sinAzComp = -Math.cos(decRad) * Math.sin(hourAngleRad);
  const cosAzComp =
    Math.sin(decRad) * Math.cos(latRad) -
    Math.cos(decRad) * Math.sin(latRad) * Math.cos(hourAngleRad);
  const azimuthDeg = Number((((Math.atan2(sinAzComp, cosAzComp) * RAD_TO_DEG) % 360) + 360) % 360);

  const elRad = elevationDeg * DEG_TO_RAD;
  const azRad = azimuthDeg * DEG_TO_RAD;

  // Three.js world vector: +X = East, +Y = Up, -Z = North, +Z = South
  const sunVector: Vec3 = {
    x: Number((Math.cos(elRad) * Math.sin(azRad)).toFixed(4)),
    y: Number(Math.sin(elRad).toFixed(4)),
    z: Number((-Math.cos(elRad) * Math.cos(azRad)).toFixed(4)),
  };

  const sunOrbitRadius = 64;
  const sunPosition: Vec3 = {
    x: Number((sunVector.x * sunOrbitRadius).toFixed(2)),
    y: Number((Math.max(3.5, sunVector.y * sunOrbitRadius)).toFixed(2)),
    z: Number((sunVector.z * sunOrbitRadius).toFixed(2)),
  };

  const shadowAngleDeg = Number(((azimuthDeg + 180) % 360).toFixed(1));
  const shadowLengthFactor = Number(
    clamp(1 / Math.tan(Math.max(elevationDeg, 8) * DEG_TO_RAD), 0.14, 7.1).toFixed(2)
  );

  // Classify solar phase
  let phase: SaigonSolarPhase;
  if (hour < 7.25) phase = 'DAWN';
  else if (hour < 11.25) phase = 'MORNING';
  else if (hour < 13.75) phase = 'SOLAR_NOON';
  else if (hour < 16.5) phase = 'AFTERNOON';
  else if (hour < 18.0) phase = 'GOLDEN_HOUR';
  else phase = 'DUSK';

  // Piecewise color temperature & atmospheric daylight/golden-hour palette
  // Keyframes: 6.0 Dawn | 9.5 Crisp Morning | 12.5 Solar Noon | 15.8 Warm Afternoon | 17.5 Golden Sunset | 18.5 Blue Dusk
  const keyframes = [
    {
      h: 6.0,
      kelvin: 2700,
      sun: '#FFAE6D',
      skyTop: '#5680A8',
      skyHorizon: '#F7D2B0',
      ambient: '#D8C7BE',
      fog: '#EFE0D1',
      river: '#3D6C88',
      sunInt: 1.35,
      ambInt: 0.72,
      glow: 0.45,
    },
    {
      h: 9.5,
      kelvin: 5200,
      sun: '#FFF5E0',
      skyTop: '#5A96C8',
      skyHorizon: '#EAE6DC',
      ambient: '#E8ECF2',
      fog: '#E7E4DC',
      river: '#2C6A8A',
      sunInt: 2.35,
      ambInt: 0.92,
      glow: 0.08,
    },
    {
      h: 12.5,
      kelvin: 5800,
      sun: '#FFFDF7',
      skyTop: '#4A8BC2',
      skyHorizon: '#E6EFF6',
      ambient: '#EEF3F9',
      fog: '#E5EDF2',
      river: '#266B8E',
      sunInt: 2.65,
      ambInt: 1.0,
      glow: 0.04,
    },
    {
      h: 15.8,
      kelvin: 4600,
      sun: '#FFE6BF',
      skyTop: '#5487B4',
      skyHorizon: '#F0DEC5',
      ambient: '#E5DDD0',
      fog: '#EBE0D0',
      river: '#316582',
      sunInt: 2.25,
      ambInt: 0.88,
      glow: 0.16,
    },
    {
      h: 17.5,
      kelvin: 2550,
      sun: '#FF9442',
      skyTop: '#334E78',
      skyHorizon: '#F29C58',
      ambient: '#C49A84',
      fog: '#E1AA7D',
      river: '#4D5C75',
      sunInt: 2.05,
      ambInt: 0.68,
      glow: 0.78,
    },
    {
      h: 18.5,
      kelvin: 3100,
      sun: '#E57A4B',
      skyTop: '#1A2B4C',
      skyHorizon: '#8A5D68',
      ambient: '#6B7796',
      fog: '#484D66',
      river: '#233452',
      sunInt: 0.72,
      ambInt: 0.52,
      glow: 1.0,
    },
  ];

  let k0 = keyframes[0];
  let k1 = keyframes[keyframes.length - 1];
  for (let i = 0; i < keyframes.length - 1; i += 1) {
    if (hour >= keyframes[i].h && hour <= keyframes[i + 1].h) {
      k0 = keyframes[i];
      k1 = keyframes[i + 1];
      break;
    }
  }
  const span = Math.max(0.0001, k1.h - k0.h);
  const alpha = clamp((hour - k0.h) / span, 0, 1);

  return {
    hour,
    clockLabel: formatSolarClock(hour),
    phase,
    latitudeDeg: SAIGON_TOWER_LAT_DEG,
    elevationDeg,
    azimuthDeg: Number(azimuthDeg.toFixed(1)),
    sunVector,
    sunPosition,
    shadowAngleDeg,
    shadowLengthFactor,
    colorTemperatureK: Math.round(lerp(k0.kelvin, k1.kelvin, alpha)),
    sunColorHex: lerpHexColor(k0.sun, k1.sun, alpha),
    skyTopColorHex: lerpHexColor(k0.skyTop, k1.skyTop, alpha),
    skyHorizonColorHex: lerpHexColor(k0.skyHorizon, k1.skyHorizon, alpha),
    ambientColorHex: lerpHexColor(k0.ambient, k1.ambient, alpha),
    fogColorHex: lerpHexColor(k0.fog, k1.fog, alpha),
    riverTintHex: lerpHexColor(k0.river, k1.river, alpha),
    sunIntensity: Number(lerp(k0.sunInt, k1.sunInt, alpha).toFixed(2)),
    ambientIntensity: Number(lerp(k0.ambInt, k1.ambInt, alpha).toFixed(2)),
    emissiveWindowFactor: Number(lerp(k0.glow, k1.glow, alpha).toFixed(2)),
  };
}

/**
 * Computes unit-specific Solar Heat Gain (kW/m²) and Balcony Shade %
 * using triple Low-E glazing SHGC (0.36) and cantilevered loggia overhang shading geometry.
 */
export function computeUnitSolarMetrics(
  unit: SkyTowerUnit,
  solar: SaigonSolarState
): UnitSolarTelemetry {
  const relAzDeg = ((solar.azimuthDeg - unit.facadeAzimuthDeg + 540) % 360) - 180;
  const relAzRad = relAzDeg * DEG_TO_RAD;
  const elRad = Math.max(0.5, solar.elevationDeg) * DEG_TO_RAD;
  const cosRelAz = Math.cos(relAzRad);
  const cosIncidence = Math.cos(elRad) * cosRelAz;
  const directSunlight = solar.elevationDeg > 1.5 && cosIncidence > 0.02;

  const incidenceAngleDeg = directSunlight
    ? Number((Math.acos(clamp(cosIncidence, -1, 1)) * RAD_TO_DEG).toFixed(1))
    : 90.0;

  // Kasten-Young air mass & Meinel clear-sky Direct Normal Irradiance (kW/m²)
  const elDeg = Math.max(1.2, solar.elevationDeg);
  const airMass = 1 / (Math.sin(elRad) + 0.50572 * Math.pow(elDeg + 6.07995, -1.6364));
  const dniKwM2 = 1.353 * Math.pow(0.7, Math.pow(airMass, 0.678));
  const dhiKwM2 = (0.14 * dniKwM2 + 0.038) * Math.sin(elRad);
  const diffuseVerticalKwM2 = 0.5 * dhiKwM2 + 0.07 * (dniKwM2 * Math.sin(elRad) + dhiKwM2);

  let directVerticalKwM2 = 0;
  let balconyShadeFraction = 1.0;

  if (directSunlight) {
    directVerticalKwM2 = dniKwM2 * cosIncidence;
    const tanProfile = Math.tan(elRad) / Math.max(0.08, cosRelAz);
    const shadowDropM = unit.overhangDepthM * tanProfile;
    balconyShadeFraction = clamp(shadowDropM / Math.max(2.0, unit.ceilingHeightM), 0, 1);
  }

  const lowEShgc = 0.36;
  const exteriorIrradianceKwM2 = Number((directVerticalKwM2 + diffuseVerticalKwM2).toFixed(3));
  const solarHeatGainKwM2 = Number(
    ((directVerticalKwM2 * (1 - balconyShadeFraction) + diffuseVerticalKwM2) * lowEShgc).toFixed(3)
  );
  const balconyShadePct = Math.round(balconyShadeFraction * 100);

  let thermalRating: UnitSolarTelemetry['thermalRating'];
  if (!directSunlight || balconyShadePct >= 85) {
    thermalRating = 'SHADED_COOL';
  } else if (solarHeatGainKwM2 < 0.14) {
    thermalRating = 'OPTIMAL';
  } else if (solarHeatGainKwM2 < 0.24) {
    thermalRating = 'WARM_GLOW';
  } else {
    thermalRating = 'PEAK_SOLAR';
  }

  return {
    unitCode: unit.unitCode,
    hour: solar.hour,
    directSunlight,
    incidenceAngleDeg,
    solarHeatGainKwM2,
    exteriorIrradianceKwM2,
    balconyShadePct,
    thermalRating,
  };
}

/**
 * Metro Line-1 Elevated Viaduct geometry helper (diagonal riverside viaduct spanning Saigon River edge).
 * Parameter u in [-1, 1] maps from SW Ba Son bank to NE Thao Dien Sky Station.
 */
export function evaluateMetroViaductPoint(u: number): { x: number; y: number; z: number; yawRad: number } {
  const clampedU = clamp(u, -1.15, 1.15);
  const x = clampedU * 38;
  // Gentle architectural S-curve sweeping cleanly in front of the riverfront podium
  const z = 11.4 - clampedU * 4.2 + Math.sin(clampedU * 1.45) * 1.1;
  const y = 3.25; // Elevated ~17.5m above Saigon river datum

  const dxdU = 38;
  const dzdU = -4.2 + Math.cos(clampedU * 1.45) * 1.45 * 1.1;
  const yawRad = Math.atan2(dxdU, dzdU);

  return {
    x: Number(x.toFixed(3)),
    y,
    z: Number(z.toFixed(3)),
    yawRad: Number(yawRad.toFixed(4)),
  };
}

/**
 * Pure deterministic Metro Line-1 3-car Hitachi train kinematics along the elevated riverfront viaduct.
 * Includes smooth acceleration/deceleration through An Phu / Ba Son Sky Station.
 */
export function computeMetroTrainState(timeSeconds: number): MetroTrainState {
  const t = Number.isFinite(timeSeconds) && timeSeconds >= 0 ? timeSeconds : 0;
  const cycleDurationSec = 26;
  const cycleProgress = (t % cycleDurationSec) / cycleDurationSec;

  // Forward pass [0..0.5) goes SW -> NE; return pass [0.5..1.0) goes NE -> SW
  const forward = cycleProgress < 0.5;
  const direction: 1 | -1 = forward ? 1 : -1;
  const halfPhase = forward ? cycleProgress * 2 : (cycleProgress - 0.5) * 2;

  // Smooth ease near ends with brief boarding glide near station (halfPhase ~ 0.52)
  const rawU = forward ? -1.0 + halfPhase * 2.0 : 1.0 - halfPhase * 2.0;
  const stationDist = Math.abs(rawU - 0.14);

  let speedKmh = 72;
  let stationState: MetroTrainState['stationState'] = 'CRUISING';
  if (stationDist < 0.08) {
    stationState = 'BOARDING';
    speedKmh = Math.round(16 + (stationDist / 0.08) * 20);
  } else if (stationDist < 0.24) {
    stationState = 'APPROACHING_STATION';
    speedKmh = Math.round(36 + ((stationDist - 0.08) / 0.16) * 36);
  }

  const carSpacingU = 0.082;
  const cars: MetroCarPose[] = [0, 1, 2].map((idx) => {
    const carU = rawU - direction * idx * carSpacingU;
    const pt = evaluateMetroViaductPoint(carU);
    return {
      index: idx,
      x: pt.x,
      y: pt.y + 0.42,
      z: pt.z,
      yawRad: forward ? pt.yawRad : Number((pt.yawRad + Math.PI).toFixed(4)),
    };
  });

  const head = cars[0];
  return {
    timeSeconds: Number(t.toFixed(3)),
    cycleProgress: Number(cycleProgress.toFixed(4)),
    direction,
    speedKmh,
    stationState,
    nextStationEn: forward ? 'Thao Dien · An Phu' : 'Ba Son · Ben Thanh',
    nextStationVi: forward ? 'Ga Thảo Điền · An Phú' : 'Ga Ba Son · Bến Thành',
    headPosition: { x: head.x, y: head.y, z: head.z },
    headlightGlow: Number((0.75 + 0.25 * Math.sin(t * 2.4)).toFixed(3)),
    cars,
  };
}

/**
 * Generates deterministic 3D architectural BIM cutaway volumes for X-Ray Floorplate mode.
 */
export function computeXRayFloorplateLayout(unit: SkyTowerUnit): XRayFloorplateLayout {
  const crownScale = unit.story >= 24 ? 0.88 : 1.0;
  const slabWidth = Number((TOWER_FOOTPRINT_WIDTH * crownScale).toFixed(2));
  const slabDepth = Number((TOWER_FOOTPRINT_DEPTH * crownScale).toFixed(2));
  const roomH = unit.tier === 'PENTHOUSE' ? 0.56 : 0.44;
  const isPenthouse = unit.tier === 'PENTHOUSE';

  const coreW = Number((slabWidth * 0.28).toFixed(2));
  const coreD = Number((slabDepth * 0.34).toFixed(2));

  const halfW = slabWidth / 2 - 0.22;
  const halfD = slabDepth / 2 - 0.22;
  const perimeterColumns = [
    { x: -halfW, z: -halfD },
    { x: 0, z: -halfD },
    { x: halfW, z: -halfD },
    { x: halfW, z: 0 },
    { x: halfW, z: halfD },
    { x: 0, z: halfD },
    { x: -halfW, z: halfD },
    { x: -halfW, z: 0 },
  ].map((p) => ({ x: Number(p.x.toFixed(2)), z: Number(p.z.toFixed(2)) }));

  const rooms: XRayRoomVolume[] = [
    {
      id: 'salon',
      labelEn: isPenthouse ? '6.8m Double-Height Salon' : 'Riverfront Living Salon',
      labelVi: isPenthouse ? 'Đại Sảnh Thông Tầng 6.8m' : 'Phòng Khách Hướng Sông',
      x: 0.45,
      z: 0.85,
      width: Number((slabWidth * 0.48).toFixed(2)),
      depth: Number((slabDepth * 0.36).toFixed(2)),
      height: roomH,
      colorHex: '#C9A055',
      glowHex: '#F3D28B',
      areaSqm: isPenthouse ? 78 : 42,
    },
    {
      id: 'master',
      labelEn: 'River Master Suite',
      labelVi: 'Phòng Ngủ Master Ven Sông',
      x: -1.35,
      z: 0.65,
      width: Number((slabWidth * 0.32).toFixed(2)),
      depth: Number((slabDepth * 0.38).toFixed(2)),
      height: roomH * 0.9,
      colorHex: '#157356',
      glowHex: '#34D399',
      areaSqm: isPenthouse ? 46 : 28,
    },
    {
      id: 'kitchen',
      labelEn: 'Calacatta Culinary Pavilion',
      labelVi: 'Bếp Đảo Đá Calacatta',
      x: 1.35,
      z: -0.95,
      width: Number((slabWidth * 0.32).toFixed(2)),
      depth: Number((slabDepth * 0.32).toFixed(2)),
      height: roomH * 0.86,
      colorHex: '#2C5E8A',
      glowHex: '#60A5FA',
      areaSqm: isPenthouse ? 34 : 18,
    },
    {
      id: 'terrace',
      labelEn: isPenthouse ? 'Private Sky Infinity Terrace' : 'Cantilevered Sky Loggia',
      labelVi: isPenthouse ? 'Hồ Bơi Vô Cực & Sân Thượng' : 'Logia Toàn Cảnh Sông',
      x: 0,
      z: Number((slabDepth * 0.56).toFixed(2)),
      width: Number((slabWidth * 0.86).toFixed(2)),
      depth: Number((isPenthouse ? 1.15 : 0.78).toFixed(2)),
      height: 0.18,
      colorHex: '#0EA5E9',
      glowHex: '#38BDF8',
      areaSqm: unit.terraceSqm,
    },
  ];

  return {
    unitCode: unit.unitCode,
    story: unit.story,
    worldY: unit.worldY,
    slabWidth,
    slabDepth,
    structuralCore: {
      width: coreW,
      depth: coreD,
      height: computeTowerTotalWorldY(),
      colorHex: '#0EA5E9',
      elevatorShafts: [
        { x: -coreW * 0.22, z: -coreD * 0.14 },
        { x: coreW * 0.22, z: -coreD * 0.14 },
      ],
    },
    perimeterColumns,
    rooms,
  };
}

/**
 * Computes smooth deterministic camera destination pose for ORBIT, BALCONY_POV, and XRAY modes.
 */
export function computeCameraPreset(
  mode: SkyTowerCameraMode,
  unit: SkyTowerUnit,
  orbitAzimuthRad: number,
  orbitElevationRad: number,
  orbitDistance: number
): CameraPresetPose {
  if (mode === 'BALCONY_POV') {
    return {
      position: { ...unit.balconyWorldPos },
      target: { ...unit.balconyLookTarget },
      fov: 56,
    };
  }

  if (mode === 'XRAY') {
    const dist = clamp(orbitDistance * 0.56, 16.5, 25);
    const el = clamp(orbitElevationRad, 0.28, 0.78);
    const targetY = clamp(unit.worldY - 0.15, 5.8, 17.8);
    return {
      position: {
        x: Number((Math.sin(orbitAzimuthRad) * Math.cos(el) * dist + 1.5).toFixed(3)),
        y: Number((targetY + Math.sin(el) * dist * 0.68).toFixed(3)),
        z: Number((Math.cos(orbitAzimuthRad) * Math.cos(el) * dist).toFixed(3)),
      },
      target: { x: 1.5, y: Number(targetY.toFixed(3)), z: 0 },
      fov: 42,
    };
  }

  // ORBIT mode: frames the full 28-story tower (podium to crown arch) + Saigon River + Metro viaduct above bottom dock
  const dist = clamp(orbitDistance, 22, 52);
  const el = clamp(orbitElevationRad, 0.14, 0.72);
  const focusY = Number((8.1 + (unit.worldY - 12.0) * 0.12).toFixed(3));
  // Slight +X target shift leaves crisp architectural breathing room on the right for the Escrow HUD
  const targetX = 2.6;

  return {
    position: {
      x: Number((targetX + Math.sin(orbitAzimuthRad) * Math.cos(el) * dist).toFixed(3)),
      y: Number((focusY + Math.sin(el) * dist).toFixed(3)),
      z: Number((Math.cos(orbitAzimuthRad) * Math.cos(el) * dist).toFixed(3)),
    },
    target: { x: targetX, y: focusY, z: 2.8 },
    fov: 45,
  };
}

function createHoldToken(unitCode: string, idempotencyKey: string): string {
  let hash = 2166136261;
  const seed = `${unitCode}:${idempotencyKey}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = (hash >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
  return `ESC-409-${unitCode.replace(/[^A-Z0-9]/g, '')}-${suffix}`;
}

/**
 * Deterministic idempotent Escrow Lock state transition matching Kinetix .NET 10 UnitEscrowLocker:
 * - Available & unlocked → 201 LOCKED_CREATED (flips unit to Reserved)
 * - Same idempotencyKey on existing lock → 200 IDEMPOTENT_REPLAY
 * - Different idempotencyKey on locked/Reserved unit → 409 CONFLICT_LOCKED
 * - Sold unit → 409 CONFLICT_SOLD
 */
export function applyEscrowLockTransition(
  registry: EscrowLockRegistry,
  unitCode: string,
  idempotencyKey: string,
  nowIso: string
): EscrowLockTransitionResult {
  const unit = getSkyTowerUnitByCode(unitCode);
  if (!unit) {
    return {
      httpStatus: 404,
      outcome: 'NOT_FOUND',
      unitCode,
      effectiveStatus: 'Sold',
      holdToken: null,
      messageEn: `Unit ${unitCode} not found in tower manifest.`,
      messageVi: `Không tìm thấy căn ${unitCode} trong danh mục tháp.`,
      nextRegistry: registry,
    };
  }

  const trimmedKey = idempotencyKey.trim();

  if (unit.baseStatus === 'Sold') {
    return {
      httpStatus: 409,
      outcome: 'CONFLICT_SOLD',
      unitCode,
      effectiveStatus: 'Sold',
      holdToken: null,
      messageEn: `409 Conflict — ${unitCode} has already closed and cannot be placed in escrow.`,
      messageVi: `409 Xung Đột — Căn ${unitCode} đã giao dịch hoàn tất, không thể khóa ký quỹ.`,
      nextRegistry: registry,
    };
  }

  const existing = registry[unitCode];
  if (existing) {
    if (existing.idempotencyKey === trimmedKey) {
      return {
        httpStatus: 200,
        outcome: 'IDEMPOTENT_REPLAY',
        unitCode,
        effectiveStatus: 'Reserved',
        holdToken: existing.holdToken,
        messageEn: `200 Idempotent Replay — Active escrow lock ${existing.holdToken} confirmed.`,
        messageVi: `200 Lặp Lại An Toàn — Đã xác nhận khóa ký quỹ ${existing.holdToken}.`,
        nextRegistry: registry,
      };
    }

    return {
      httpStatus: 409,
      outcome: 'CONFLICT_LOCKED',
      unitCode,
      effectiveStatus: 'Reserved',
      holdToken: existing.holdToken,
      messageEn: `409 Conflict — ${unitCode} is already locked under escrow ${existing.holdToken}.`,
      messageVi: `409 Xung Đột — Căn ${unitCode} đã được khóa ký quỹ theo mã ${existing.holdToken}.`,
      nextRegistry: registry,
    };
  }

  if (unit.baseStatus === 'Reserved') {
    return {
      httpStatus: 409,
      outcome: 'CONFLICT_LOCKED',
      unitCode,
      effectiveStatus: 'Reserved',
      holdToken: `ESC-PRE-${unitCode.replace(/[^A-Z0-9]/g, '')}`,
      messageEn: `409 Conflict — ${unitCode} is currently held in an active private escrow window.`,
      messageVi: `409 Xung Đột — Căn ${unitCode} đang được giữ chỗ trong phiên ký quỹ ưu tiên.`,
      nextRegistry: registry,
    };
  }

  const holdToken = createHoldToken(unitCode, trimmedKey || nowIso);
  const record: EscrowLockRecord = {
    unitCode,
    residenceId: unit.residenceId,
    holdToken,
    idempotencyKey: trimmedKey || holdToken,
    lockedAtIso: nowIso,
  };

  return {
    httpStatus: 201,
    outcome: 'LOCKED_CREATED',
    unitCode,
    effectiveStatus: 'Reserved',
    holdToken,
    messageEn: `201 Escrow Locked — 72h priority hold ${holdToken} secured for ${unitCode}.`,
    messageVi: `201 Đã Khóa Ký Quỹ — Giữ chỗ ưu tiên 72h mã ${holdToken} cho căn ${unitCode}.`,
    nextRegistry: {
      ...registry,
      [unitCode]: record,
    },
  };
}
