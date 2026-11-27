import type {
  DaylightComfortTier,
  SolarExposureInput,
  SolarExposureResult,
  SolarHourlySample,
  SolarSeason,
  ThermalLoadTier,
} from '../types/proptech';

/** The Kinetix Residences · Thu Thiem Peninsula, Ho Chi Minh City (UTC+7) */
export const SAIGON_LATITUDE_DEG = 10.7725;
export const SAIGON_LONGITUDE_DEG = 106.7219;
export const VIETNAM_STD_MERIDIAN_DEG = 105.0;

export const DEFAULT_OVERHANG_DEPTH_M = 2.2;
export const DEFAULT_CEILING_HEIGHT_M = 3.5;
export const DEFAULT_LOW_E_SHGC = 0.36;
export const DEFAULT_LOW_E_VLT = 0.62;

export interface SolarSeasonConfig {
  id: SolarSeason;
  dayOfYear: number;
  declinationDeg: number;
  dateLabelVi: string;
  dateLabelEn: string;
  labelVi: string;
  labelEn: string;
}

export const SOLAR_SEASONS: Record<SolarSeason, SolarSeasonConfig> = {
  VERNAL_EQUINOX: {
    id: 'VERNAL_EQUINOX',
    dayOfYear: 80,
    declinationDeg: 0.0,
    dateLabelVi: '20 Tháng 03',
    dateLabelEn: 'Mar 20',
    labelVi: 'Xuân Phân',
    labelEn: 'Vernal Equinox',
  },
  SUMMER_SOLSTICE: {
    id: 'SUMMER_SOLSTICE',
    dayOfYear: 172,
    declinationDeg: 23.44,
    dateLabelVi: '21 Tháng 06',
    dateLabelEn: 'Jun 21',
    labelVi: 'Hạ Chí',
    labelEn: 'Summer Solstice',
  },
  AUTUMN_EQUINOX: {
    id: 'AUTUMN_EQUINOX',
    dayOfYear: 265,
    declinationDeg: 0.0,
    dateLabelVi: '22 Tháng 09',
    dateLabelEn: 'Sep 22',
    labelVi: 'Thu Phân',
    labelEn: 'Autumn Equinox',
  },
  WINTER_SOLSTICE: {
    id: 'WINTER_SOLSTICE',
    dayOfYear: 355,
    declinationDeg: -23.44,
    dateLabelVi: '21 Tháng 12',
    dateLabelEn: 'Dec 21',
    labelVi: 'Đông Chí',
    labelEn: 'Winter Solstice',
  },
};

export interface OrientationPreset {
  id: 'UNIT' | 'EAST' | 'SOUTH_EAST' | 'WEST' | 'NORTH';
  azimuthDeg: number | null;
  labelVi: string;
  labelEn: string;
}

export const ORIENTATION_PRESETS: OrientationPreset[] = [
  { id: 'UNIT', azimuthDeg: null, labelVi: 'Theo Căn Đang Chọn', labelEn: 'Selected Unit' },
  { id: 'EAST', azimuthDeg: 90, labelVi: 'Đông (90°)', labelEn: 'East (90°)' },
  { id: 'SOUTH_EAST', azimuthDeg: 135, labelVi: 'Đông Nam (135°)', labelEn: 'South-East (135°)' },
  { id: 'WEST', azimuthDeg: 270, labelVi: 'Tây (270°)', labelEn: 'West (270°)' },
  { id: 'NORTH', azimuthDeg: 0, labelVi: 'Bắc (0°)', labelEn: 'North (0°)' },
];

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function normalizeAzimuthDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  return ((deg % 360) + 360) % 360;
}

export function azimuthToCardinal(deg: number): string {
  const normalized = normalizeAzimuthDeg(deg);
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return dirs[index];
}

export function formatHourToClock(localHour: number): string {
  const clamped = clamp(localHour, 0, 24);
  const totalMinutes = Math.round(clamped * 60);
  const hh = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Equation of Time (in minutes) using the standard Spencer/NOAA Fourier approximation.
 */
export function computeEquationOfTimeMinutes(dayOfYear: number): number {
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * Evaluates instantaneous solar position (altitude & clockwise azimuth from True North)
 * at Ho Chi Minh City (10.7725° N, 106.7219° E, UTC+7).
 */
export function computeSaigonSolarPosition(
  localHour: number,
  season: SolarSeason
): {
  dayOfYear: number;
  declinationDeg: number;
  trueSolarHour: number;
  solarAltitudeDeg: number;
  solarAzimuthDeg: number;
} {
  const config = SOLAR_SEASONS[season];
  const clampedHour = clamp(localHour, 5.0, 19.0);
  const longitudeOffsetMin = (SAIGON_LONGITUDE_DEG - VIETNAM_STD_MERIDIAN_DEG) * 4.0;
  const eotMin = computeEquationOfTimeMinutes(config.dayOfYear);
  const trueSolarHour = clampedHour + (longitudeOffsetMin + eotMin) / 60.0;

  const hourAngleRad = 15.0 * (trueSolarHour - 12.0) * DEG_TO_RAD;
  const latRad = SAIGON_LATITUDE_DEG * DEG_TO_RAD;
  const decRad = config.declinationDeg * DEG_TO_RAD;

  const sinAlt = clamp(
    Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngleRad),
    -1,
    1
  );
  const altitudeDeg = Math.asin(sinAlt) * RAD_TO_DEG;

  // Quadrant-unambiguous clockwise azimuth from True North (0=N, 90=E, 180=S, 270=W)
  const sinAzComponent = -Math.cos(decRad) * Math.sin(hourAngleRad);
  const cosAzComponent =
    Math.sin(decRad) * Math.cos(latRad) -
    Math.cos(decRad) * Math.sin(latRad) * Math.cos(hourAngleRad);
  const azimuthDeg = normalizeAzimuthDeg(Math.atan2(sinAzComponent, cosAzComponent) * RAD_TO_DEG);

  return {
    dayOfYear: config.dayOfYear,
    declinationDeg: config.declinationDeg,
    trueSolarHour,
    solarAltitudeDeg: altitudeDeg,
    solarAzimuthDeg: azimuthDeg,
  };
}

export function classifyDaylightComfort(lux: number): DaylightComfortTier {
  if (lux < 180) return 'TWILIGHT_LOW';
  if (lux < 350) return 'AMBIENT_DIFFUSE';
  if (lux <= 1850) return 'OPTIMAL_DAYLIGHT';
  return 'BRIGHT_DIRECT_GLARE';
}

export function classifyThermalLoad(
  exteriorIrradianceWm2: number,
  localHour: number
): ThermalLoadTier {
  if (exteriorIrradianceWm2 < 140) return 'COOL_MORNING';
  if (exteriorIrradianceWm2 < 340) return 'BALANCED';
  if (exteriorIrradianceWm2 < 540 || localHour < 13.5) return 'ELEVATED_SOLAR_GAIN';
  return 'PEAK_WEST_LOAD';
}

function evaluateSingleInstant(
  localHour: number,
  season: SolarSeason,
  facadeAzimuthDeg: number,
  overhangDepthM: number,
  ceilingHeightM: number,
  glazingShgc: number
) {
  const pos = computeSaigonSolarPosition(localHour, season);
  const facadeAz = normalizeAzimuthDeg(facadeAzimuthDeg);
  const relativeAzimuthDeg = ((pos.solarAzimuthDeg - facadeAz + 540) % 360) - 180;
  const relAzRad = relativeAzimuthDeg * DEG_TO_RAD;
  const altDegClamped = Math.max(0, pos.solarAltitudeDeg);
  const altRad = altDegClamped * DEG_TO_RAD;

  const cosRelAz = Math.cos(relAzRad);
  const cosIncidence = Math.cos(altRad) * cosRelAz;
  const directSunHit = altDegClamped > 0.5 && cosIncidence > 0.01;
  const incidenceAngleDeg = directSunHit
    ? Math.acos(clamp(cosIncidence, -1, 1)) * RAD_TO_DEG
    : 90;

  let dni = 0;
  let verticalDirect = 0;
  let verticalDiffuse = 0;
  let shadedFraction = 1;
  let penetrationDepthM = 0;

  if (altDegClamped > 0.5) {
    // Kasten-Young air mass & Meinel clear-sky Direct Normal Irradiance
    const airMass =
      1 / (Math.sin(altRad) + 0.50572 * Math.pow(altDegClamped + 6.07995, -1.6364));
    dni = 1353 * Math.pow(0.7, Math.pow(airMass, 0.678));

    const directHorizontal = dni * Math.sin(altRad);
    const diffuseHorizontal = 0.14 * directHorizontal + 38 * Math.sin(altRad);

    // Vertical sky view factor (0.5) + Thu Thiem river/ground albedo reflection (0.14)
    verticalDiffuse = 0.5 * diffuseHorizontal + 0.07 * (directHorizontal + diffuseHorizontal);

    if (directSunHit) {
      verticalDirect = dni * cosIncidence;
      const tanProfile = Math.tan(altRad) / Math.max(0.05, cosRelAz);
      const shadowDropM = overhangDepthM * tanProfile;
      shadedFraction = clamp(shadowDropM / Math.max(1.5, ceilingHeightM), 0, 1);
      const rawPenetration = ceilingHeightM / Math.max(0.08, tanProfile) - overhangDepthM;
      penetrationDepthM = clamp(rawPenetration, 0, 7.5);
    }
  }

  const exteriorFacadeIrradianceWm2 = Math.round(verticalDirect + verticalDiffuse);
  const interiorSolarGainWm2 = Math.round(
    (verticalDirect * (1 - shadedFraction) + verticalDiffuse) * glazingShgc
  );

  const rawLux =
    altDegClamped > 0.5
      ? DEFAULT_LOW_E_VLT *
        (verticalDirect * 105 * (1 - shadedFraction) * 0.14 + verticalDiffuse * 120 * 0.085)
      : 45;
  const naturalDaylightLux = Math.round(rawLux);

  return {
    ...pos,
    solarAltitudeDeg: Number(altDegClamped.toFixed(1)),
    solarAzimuthDeg: Number(pos.solarAzimuthDeg.toFixed(1)),
    facadeAzimuthDeg: facadeAz,
    relativeAzimuthDeg: Number(relativeAzimuthDeg.toFixed(1)),
    incidenceAngleDeg: Number(incidenceAngleDeg.toFixed(1)),
    directSunHit,
    shadedFraction: Number(shadedFraction.toFixed(2)),
    penetrationDepthM: Number(penetrationDepthM.toFixed(2)),
    directNormalIrradianceWm2: Math.round(dni),
    exteriorFacadeIrradianceWm2,
    interiorSolarGainWm2,
    naturalDaylightLux,
  };
}

/**
 * Computes full Saigon Sun-Path & Daylight Orientation telemetry for a residence facade,
 * including the 06:00–18:00 hourly thermal/daylight profile.
 */
export function computeSolarExposure(input: SolarExposureInput): SolarExposureResult {
  const localHour = clamp(input.localHour, 6.0, 18.0);
  const overhangDepthM = clamp(input.overhangDepthM ?? DEFAULT_OVERHANG_DEPTH_M, 0, 6);
  const ceilingHeightM = clamp(input.ceilingHeightM ?? DEFAULT_CEILING_HEIGHT_M, 2.4, 8.0);
  const glazingShgc = clamp(input.glazingShgc ?? DEFAULT_LOW_E_SHGC, 0.15, 0.85);
  const facadeAz = normalizeAzimuthDeg(input.facadeAzimuthDeg);

  const current = evaluateSingleInstant(
    localHour,
    input.season,
    facadeAz,
    overhangDepthM,
    ceilingHeightM,
    glazingShgc
  );

  const seasonCfg = SOLAR_SEASONS[input.season];
  const solarNoonAltitudeDeg = Number(
    (90 - Math.abs(SAIGON_LATITUDE_DEG - seasonCfg.declinationDeg)).toFixed(1)
  );
  const solarNoonCardinal: 'N' | 'S' =
    seasonCfg.declinationDeg > SAIGON_LATITUDE_DEG ? 'N' : 'S';

  const dailyProfile: SolarHourlySample[] = [];
  for (let h = 6; h <= 18; h += 1) {
    const sample = evaluateSingleInstant(
      h,
      input.season,
      facadeAz,
      overhangDepthM,
      ceilingHeightM,
      glazingShgc
    );
    dailyProfile.push({
      localHour: h,
      altitudeDeg: sample.solarAltitudeDeg,
      azimuthDeg: sample.solarAzimuthDeg,
      exteriorIrradianceWm2: sample.exteriorFacadeIrradianceWm2,
      interiorSolarGainWm2: sample.interiorSolarGainWm2,
      daylightLux: sample.naturalDaylightLux,
      directSunHit: sample.directSunHit,
    });
  }

  return {
    latitudeDeg: SAIGON_LATITUDE_DEG,
    longitudeDeg: SAIGON_LONGITUDE_DEG,
    season: input.season,
    dayOfYear: current.dayOfYear,
    localHour,
    trueSolarHour: Number(current.trueSolarHour.toFixed(2)),
    declinationDeg: current.declinationDeg,
    solarAltitudeDeg: current.solarAltitudeDeg,
    solarAzimuthDeg: current.solarAzimuthDeg,
    facadeAzimuthDeg: facadeAz,
    facadeCardinal: azimuthToCardinal(facadeAz),
    relativeAzimuthDeg: current.relativeAzimuthDeg,
    incidenceAngleDeg: current.incidenceAngleDeg,
    directSunHit: current.directSunHit,
    shadedFraction: current.shadedFraction,
    penetrationDepthM: current.penetrationDepthM,
    directNormalIrradianceWm2: current.directNormalIrradianceWm2,
    exteriorFacadeIrradianceWm2: current.exteriorFacadeIrradianceWm2,
    interiorSolarGainWm2: current.interiorSolarGainWm2,
    naturalDaylightLux: current.naturalDaylightLux,
    daylightComfortTier: classifyDaylightComfort(current.naturalDaylightLux),
    thermalLoadTier: classifyThermalLoad(current.exteriorFacadeIrradianceWm2, localHour),
    solarNoonAltitudeDeg,
    solarNoonCardinal,
    dailyProfile,
  };
}
