import React, { useMemo, useState } from 'react';
import type {
  DaylightComfortTier,
  Language,
  Residence,
  SolarSeason,
  ThermalLoadTier,
} from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import {
  computeSolarExposure,
  formatHourToClock,
  ORIENTATION_PRESETS,
  SOLAR_SEASONS,
} from '../engines/solarPathEngine';
import { CompassIcon, SunIcon } from './Icons';

interface SolarDaylightLabProps {
  selectedResidence: Residence;
  lang: Language;
  copy: CopyBundle['solar'];
}

const SEASON_ORDER: SolarSeason[] = [
  'VERNAL_EQUINOX',
  'SUMMER_SOLSTICE',
  'AUTUMN_EQUINOX',
  'WINTER_SOLSTICE',
];

const THERMAL_BADGE_STYLE: Record<ThermalLoadTier, { bg: string; border: string; text: string }> = {
  COOL_MORNING: {
    bg: 'var(--status-available-bg)',
    border: 'var(--status-available-border)',
    text: 'var(--status-available)',
  },
  BALANCED: {
    bg: 'var(--accent-soft)',
    border: 'var(--border-strong)',
    text: 'var(--accent)',
  },
  ELEVATED_SOLAR_GAIN: {
    bg: 'var(--status-reserved-bg)',
    border: 'var(--status-reserved-border)',
    text: 'var(--status-reserved)',
  },
  PEAK_WEST_LOAD: {
    bg: 'var(--status-sold-bg)',
    border: 'var(--status-sold-border)',
    text: 'var(--status-sold)',
  },
};

const COMFORT_BADGE_STYLE: Record<DaylightComfortTier, { bg: string; border: string; text: string }> = {
  OPTIMAL_DAYLIGHT: {
    bg: 'var(--status-available-bg)',
    border: 'var(--status-available-border)',
    text: 'var(--status-available)',
  },
  AMBIENT_DIFFUSE: {
    bg: 'var(--accent-soft)',
    border: 'var(--border-strong)',
    text: 'var(--accent)',
  },
  BRIGHT_DIRECT_GLARE: {
    bg: 'var(--status-reserved-bg)',
    border: 'var(--status-reserved-border)',
    text: 'var(--status-reserved)',
  },
  TWILIGHT_LOW: {
    bg: 'var(--bg-elevated)',
    border: 'var(--border-subtle)',
    text: 'var(--text-secondary)',
  },
};

const DEG_TO_RAD = Math.PI / 180;

export const SolarDaylightLab: React.FC<SolarDaylightLabProps> = ({
  selectedResidence,
  lang,
  copy,
}) => {
  const [localHour, setLocalHour] = useState<number>(15.0);
  const [season, setSeason] = useState<SolarSeason>('VERNAL_EQUINOX');
  const [orientationPreset, setOrientationPreset] = useState<
    'UNIT' | 'EAST' | 'SOUTH_EAST' | 'WEST' | 'NORTH'
  >('UNIT');

  const activeFacadeAzimuthDeg = useMemo(() => {
    const preset = ORIENTATION_PRESETS.find((p) => p.id === orientationPreset);
    return preset?.azimuthDeg ?? selectedResidence.compassDeg;
  }, [orientationPreset, selectedResidence.compassDeg]);

  const solar = useMemo(
    () =>
      computeSolarExposure({
        localHour,
        season,
        facadeAzimuthDeg: activeFacadeAzimuthDeg,
        overhangDepthM: selectedResidence.tier === 'PENTHOUSE' ? 2.6 : 2.2,
        ceilingHeightM: selectedResidence.ceilingHeightM,
        glazingShgc: 0.36,
      }),
    [localHour, season, activeFacadeAzimuthDeg, selectedResidence]
  );

  // Polar Compass Geometry
  const cx = 270;
  const cy = 205;
  const outerR = 166;
  const innerFloorR = 82;

  const projectPolar = (azimuthDeg: number, altitudeDeg: number) => {
    const r = outerR * (1 - Math.max(0, Math.min(90, altitudeDeg)) / 90);
    const rad = azimuthDeg * DEG_TO_RAD;
    return {
      x: cx + r * Math.sin(rad),
      y: cy - r * Math.cos(rad),
    };
  };

  // Seasonal Sun-Path Arc (points above horizon)
  const sunArcPoints = solar.dailyProfile
    .filter((pt) => pt.altitudeDeg > 0.2)
    .map((pt) => ({ ...pt, ...projectPolar(pt.azimuthDeg, pt.altitudeDeg) }));

  const sunArcPath = sunArcPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const currentSunPt = projectPolar(solar.solarAzimuthDeg, solar.solarAltitudeDeg);
  const facadeRad = solar.facadeAzimuthDeg * DEG_TO_RAD;
  const facadeTip = {
    x: cx + (innerFloorR + 28) * Math.sin(facadeRad),
    y: cy - (innerFloorR + 28) * Math.cos(facadeRad),
  };

  // Floorplan coordinate transform: original blueprint bounds 18..362 (w=344, cx=190) x 18..276 (h=258, cy=147)
  // Scale to fit nicely inside inner circle (diameter ~122px)
  const fpScale = 0.32;
  const fpRotationDeg = solar.facadeAzimuthDeg - 180;

  // Compute directional sunlight penetration polygon in unrotated floorplan space
  // Glazing edge sits at y = 224 (between terrace and living/master rooms), spans x = 28..352
  const beamPolygonPoints = useMemo(() => {
    if (!solar.directSunHit || solar.penetrationDepthM <= 0.05) return '';
    const relRad = solar.relativeAzimuthDeg * DEG_TO_RAD;
    // Scale 7.5m max penetration to ~165 floorplan SVG units inward (-Y direction)
    const penetrationUnits = Math.min(182, (solar.penetrationDepthM / 7.5) * 182);
    const dx = Math.sin(relRad) * penetrationUnits * 0.72;
    const dy = -Math.max(24, Math.cos(relRad) * penetrationUnits);

    const xLeft = 28;
    const xRight = 352;
    const yGlass = 224;

    const tipLeftX = Math.max(20, Math.min(360, xLeft + dx));
    const tipRightX = Math.max(20, Math.min(360, xRight + dx));
    const tipY = Math.max(24, yGlass + dy);

    return `${xLeft},${yGlass} ${xRight},${yGlass} ${tipRightX.toFixed(1)},${tipY.toFixed(1)} ${tipLeftX.toFixed(1)},${tipY.toFixed(1)}`;
  }, [solar.directSunHit, solar.penetrationDepthM, solar.relativeAzimuthDeg]);

  // Hourly thermal profile chart geometry
  const pW = 520;
  const pH = 148;
  const pPadL = 24;
  const pPadR = 14;
  const pPadT = 16;
  const pPadB = 24;
  const pInnerW = pW - pPadL - pPadR;
  const pInnerH = pH - pPadT - pPadB;

  const maxIrr = Math.max(
    400,
    ...solar.dailyProfile.map((s) => s.exteriorIrradianceWm2)
  );
  const xForHour = (h: number) => pPadL + ((h - 6) / 12) * pInnerW;
  const yForIrr = (wm2: number) => pPadT + pInnerH - (wm2 / maxIrr) * pInnerH;

  const extIrrPath = solar.dailyProfile
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${xForHour(pt.localHour).toFixed(1)} ${yForIrr(pt.exteriorIrradianceWm2).toFixed(1)}`)
    .join(' ');
  const extAreaPath = `${extIrrPath} L ${xForHour(18).toFixed(1)} ${(pPadT + pInnerH).toFixed(1)} L ${xForHour(6).toFixed(1)} ${(pPadT + pInnerH).toFixed(1)} Z`;

  const intGainPath = solar.dailyProfile
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${xForHour(pt.localHour).toFixed(1)} ${yForIrr(pt.interiorSolarGainWm2).toFixed(1)}`)
    .join(' ');

  const thermalStyle = THERMAL_BADGE_STYLE[solar.thermalLoadTier];
  const comfortStyle = COMFORT_BADGE_STYLE[solar.daylightComfortTier];

  return (
    <section
      id="solar-lab"
      data-testid="solar-daylight-lab"
      className="no-print border-t py-16 lg:py-22"
      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial Chapter 02 Header */}
        <div
          className="mb-10 flex flex-col justify-between gap-5 border-b pb-7 lg:flex-row lg:items-end"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                02
              </span>
              <span className="h-px w-8" style={{ backgroundColor: 'var(--accent)' }} />
              <span
                className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.22em] uppercase"
                style={{ color: 'var(--accent)' }}
              >
                {copy.eyebrow}
              </span>
            </div>
            <h2
              className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
              style={{ color: 'var(--text-heading)' }}
            >
              {copy.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              {copy.subtitle}
            </p>
          </div>

          <div
            className="inline-flex self-start items-center gap-2 border px-3.5 py-2 lg:self-end"
            style={{
              borderColor: 'var(--border-strong)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <CompassIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <span className="font-mono-tabular text-[11px] font-semibold tracking-[0.14em]" style={{ color: 'var(--text-heading)' }}>
              {copy.coordsBadge}
            </span>
          </div>
        </div>

        {/* Main 12-Col Architectural Solar Instrument Layout */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start">
          {/* Left 7 Columns: Interactive Compass Rose & Floorplan Sunlight Beam SVG */}
          <div
            className="min-w-0 border-t-2 border-r border-b border-l p-5 sm:p-6 lg:col-span-7"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderTopColor: 'var(--cta-bg)',
              borderRightColor: 'var(--border-subtle)',
              borderBottomColor: 'var(--border-subtle)',
              borderLeftColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Top Status Strip */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3.5" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <SunIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {copy.syncedUnitPrefix}: {selectedResidence.code} · {solar.facadeAzimuthDeg}° {solar.facadeCardinal}
                </span>
              </div>
              <span
                className="font-mono-tabular inline-flex items-center rounded-sm border px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase"
                style={{
                  borderColor: solar.directSunHit ? 'var(--status-reserved-border)' : 'var(--status-available-border)',
                  backgroundColor: solar.directSunHit ? 'var(--status-reserved-bg)' : 'var(--status-available-bg)',
                  color: solar.directSunHit ? 'var(--status-reserved)' : 'var(--status-available)',
                }}
              >
                {solar.directSunHit ? copy.beamActiveBadge : copy.beamShadedBadge}
              </span>
            </div>

            {/* Interactive SVG Compass + Floorplan Sunlight Beam */}
            <div
              className="architectural-grid relative overflow-hidden border"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--blueprint-bg)',
              }}
            >
              <svg
                viewBox="0 0 540 410"
                className="h-auto w-full select-none"
                role="img"
                aria-label={copy.compassCaption}
              >
                <defs>
                  <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#E6B655" stopOpacity="0.95" />
                    <stop offset="45%" stopColor="#B48A3E" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#B48A3E" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="sunBeamFill" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#E3A93B" stopOpacity="0.58" />
                    <stop offset="65%" stopColor="#D69E36" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#B48A3E" stopOpacity="0.04" />
                  </linearGradient>
                  <clipPath id="floorplanInnerClip">
                    <circle cx={cx} cy={cy} r={innerFloorR - 2} />
                  </clipPath>
                </defs>

                {/* Altitude Concentric Rings (0°, 30°, 60°) */}
                <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--blueprint-wall)" strokeOpacity="0.28" strokeWidth="1.2" />
                <circle cx={cx} cy={cy} r={outerR * (2 / 3)} fill="none" stroke="var(--blueprint-wall)" strokeOpacity="0.14" strokeDasharray="3 4" />
                <circle cx={cx} cy={cy} r={outerR * (1 / 3)} fill="none" stroke="var(--blueprint-wall)" strokeOpacity="0.14" strokeDasharray="3 4" />

                {/* Saigon River Arc Reference (SW/W sector 205°-275°) */}
                <path
                  d={`M ${(cx + (outerR + 12) * Math.sin(205 * DEG_TO_RAD)).toFixed(1)} ${(cy - (outerR + 12) * Math.cos(205 * DEG_TO_RAD)).toFixed(1)} A ${outerR + 12} ${outerR + 12} 0 0 1 ${(cx + (outerR + 12) * Math.sin(275 * DEG_TO_RAD)).toFixed(1)} ${(cy - (outerR + 12) * Math.cos(275 * DEG_TO_RAD)).toFixed(1)}`}
                  fill="none"
                  stroke="var(--chart-rent)"
                  strokeWidth="3.5"
                  strokeOpacity="0.45"
                  strokeLinecap="round"
                />
                <text
                  x={cx - outerR - 8}
                  y={cy + 98}
                  textAnchor="end"
                  fill="var(--chart-rent)"
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  SAIGON RIVER
                </text>

                {/* Compass Degree Ticks every 15° */}
                {Array.from({ length: 24 }, (_, idx) => {
                  const deg = idx * 15;
                  const rad = deg * DEG_TO_RAD;
                  const isMajor = deg % 90 === 0;
                  const tickIn = isMajor ? outerR - 8 : outerR - 4;
                  return (
                    <line
                      key={deg}
                      x1={cx + tickIn * Math.sin(rad)}
                      y1={cy - tickIn * Math.cos(rad)}
                      x2={cx + outerR * Math.sin(rad)}
                      y2={cy - outerR * Math.cos(rad)}
                      stroke="var(--blueprint-wall)"
                      strokeOpacity={isMajor ? 0.55 : 0.22}
                      strokeWidth={isMajor ? 1.4 : 0.9}
                    />
                  );
                })}

                {/* Crosshair Axes */}
                <line x1={cx} y1={cy - outerR} x2={cx} y2={cy + outerR} stroke="var(--blueprint-wall)" strokeOpacity="0.1" />
                <line x1={cx - outerR} y1={cy} x2={cx + outerR} y2={cy} stroke="var(--blueprint-wall)" strokeOpacity="0.1" />

                {/* Cardinal Direction Labels */}
                {[
                  { label: 'N 0°', x: cx, y: cy - outerR - 12, anchor: 'middle' as const },
                  { label: 'E 90°', x: cx + outerR + 14, y: cy + 3, anchor: 'start' as const },
                  { label: 'S 180°', x: cx, y: cy + outerR + 18, anchor: 'middle' as const },
                  { label: 'W 270°', x: cx - outerR - 14, y: cy + 3, anchor: 'end' as const },
                ].map((dir) => (
                  <text
                    key={dir.label}
                    x={dir.x}
                    y={dir.y}
                    textAnchor={dir.anchor}
                    fill="var(--text-heading)"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {dir.label}
                  </text>
                ))}

                {/* Altitude Ring Annotations */}
                <text x={cx + 5} y={cy - outerR * (2 / 3) + 11} fill="var(--text-muted)" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
                  30°
                </text>
                <text x={cx + 5} y={cy - outerR * (1 / 3) + 11} fill="var(--text-muted)" fontSize="8.5" fontFamily="JetBrains Mono, monospace">
                  60°
                </text>

                {/* Seasonal Sun-Path Arc (06:00 -> 18:00) */}
                {sunArcPath && (
                  <path
                    d={sunArcPath}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.2"
                    strokeDasharray="5 4"
                    strokeOpacity="0.85"
                  />
                )}

                {/* Hourly Solar Track Dots */}
                {sunArcPoints.map((pt) => (
                  <g key={pt.localHour}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={Math.abs(pt.localHour - localHour) < 0.3 ? 3.5 : 2.1}
                      fill="var(--accent)"
                      fillOpacity={Math.abs(pt.localHour - localHour) < 0.3 ? 1 : 0.65}
                    />
                    {pt.localHour % 3 === 0 && (
                      <text
                        x={pt.x}
                        y={pt.y - 7}
                        textAnchor="middle"
                        fill="var(--text-muted)"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pt.localHour}h
                      </text>
                    )}
                  </g>
                ))}

                {/* Central Residence Floorplan Medallion */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={innerFloorR}
                  fill="var(--bg-secondary)"
                  stroke="var(--blueprint-wall)"
                  strokeWidth="1.5"
                  strokeOpacity="0.45"
                />

                {/* Rotated Residence Floorplan + Dynamic Sunlight Beam */}
                <g clipPath="url(#floorplanInnerClip)">
                  <g
                    transform={`translate(${cx}, ${cy}) rotate(${fpRotationDeg}) scale(${fpScale}) translate(-190, -147)`}
                  >
                    {selectedResidence.floorplanRooms.map((room) => (
                      <rect
                        key={room.id}
                        x={room.x}
                        y={room.y}
                        width={room.w}
                        height={room.h}
                        fill={
                          room.zone === 'terrace'
                            ? 'var(--accent-soft)'
                            : room.zone === 'living'
                              ? 'var(--blueprint-bg)'
                              : 'var(--bg-primary)'
                        }
                        stroke="var(--blueprint-wall)"
                        strokeWidth="2.6"
                        strokeOpacity="0.65"
                      />
                    ))}

                    {/* Balcony Glazing Rim Highlight */}
                    <line
                      x1="20"
                      y1="224"
                      x2="360"
                      y2="224"
                      stroke="var(--accent)"
                      strokeWidth="5"
                      strokeOpacity="0.95"
                    />

                    {/* Direct Sunlight Penetration Beam Polygon */}
                    {beamPolygonPoints && (
                      <polygon
                        data-testid="solar-beam-polygon"
                        points={beamPolygonPoints}
                        fill="url(#sunBeamFill)"
                        stroke="#D49B35"
                        strokeWidth="2"
                        strokeOpacity="0.7"
                      />
                    )}
                  </g>
                </g>

                {/* Balcony Normal Heading Vector */}
                <line
                  x1={cx + innerFloorR * Math.sin(facadeRad)}
                  y1={cy - innerFloorR * Math.cos(facadeRad)}
                  x2={facadeTip.x}
                  y2={facadeTip.y}
                  stroke="var(--cta-bg)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx={facadeTip.x} cy={facadeTip.y} r="3.5" fill="var(--cta-bg)" />

                {/* Sun Ray Line Connecting Sun Disk to Floorplan Center */}
                {solar.solarAltitudeDeg > 0.5 && (
                  <line
                    x1={currentSunPt.x}
                    y1={currentSunPt.y}
                    x2={cx}
                    y2={cy}
                    stroke="#D49B35"
                    strokeWidth={solar.directSunHit ? '2.2' : '1.2'}
                    strokeDasharray={solar.directSunHit ? '6 3' : '3 4'}
                    strokeOpacity={solar.directSunHit ? '0.9' : '0.45'}
                  />
                )}

                {/* Live Solar Disk Marker */}
                <g
                  data-testid="solar-sun-marker"
                  data-azimuth={solar.solarAzimuthDeg}
                  data-altitude={solar.solarAltitudeDeg}
                >
                  <circle
                    cx={currentSunPt.x}
                    cy={currentSunPt.y}
                    r={solar.solarAltitudeDeg > 0.5 ? 20 : 10}
                    fill="url(#sunGlowGrad)"
                  />
                  <circle
                    cx={currentSunPt.x}
                    cy={currentSunPt.y}
                    r="7.5"
                    fill={solar.solarAltitudeDeg > 0.5 ? '#D49B35' : '#6C788C'}
                    stroke="var(--bg-secondary)"
                    strokeWidth="2"
                  />
                </g>

                {/* Bottom Corner Drafting Telemetry Legend */}
                <g transform="translate(14, 382)">
                  <text fill="var(--text-muted)" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                    {formatHourToClock(solar.localHour)} ICT · ALT {solar.solarAltitudeDeg.toFixed(1)}° · AZ {solar.solarAzimuthDeg.toFixed(1)}° · BALCONY {solar.facadeAzimuthDeg}° ({solar.facadeCardinal})
                  </text>
                </g>
              </svg>
            </div>

            {/* Hourly 06:00–18:00 Thermal Load Curve */}
            <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                    {copy.profileTitle}
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.profileSubtitle}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10.5px]" style={{ color: 'var(--text-secondary)' }}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    Exterior W/m²
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--status-available)' }} />
                    Low-E Interior W/m²
                  </span>
                </div>
              </div>

              <svg viewBox={`0 0 ${pW} ${pH}`} className="h-auto w-full select-none" role="img" aria-label={copy.profileTitle}>
                <defs>
                  <linearGradient id="solarIrrArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B48A3E" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#B48A3E" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {[0.33, 0.66, 1].map((frac) => (
                  <line
                    key={frac}
                    x1={pPadL}
                    y1={pPadT + pInnerH * (1 - frac)}
                    x2={pW - pPadR}
                    y2={pPadT + pInnerH * (1 - frac)}
                    stroke="var(--border-subtle)"
                    strokeDasharray="3 4"
                  />
                ))}
                <path d={extAreaPath} fill="url(#solarIrrArea)" />
                <path d={extIrrPath} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
                <path d={intGainPath} fill="none" stroke="var(--status-available)" strokeWidth="1.9" strokeDasharray="4 3" />

                {/* Active Slider Hour Vertical Cursor */}
                <line
                  x1={xForHour(localHour)}
                  y1={pPadT}
                  x2={xForHour(localHour)}
                  y2={pPadT + pInnerH}
                  stroke="var(--cta-bg)"
                  strokeWidth="1.6"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={xForHour(localHour)}
                  cy={yForIrr(solar.exteriorFacadeIrradianceWm2)}
                  r="4"
                  fill="var(--accent)"
                  stroke="var(--bg-secondary)"
                  strokeWidth="1.8"
                />

                {[6, 8, 10, 12, 14, 16, 18].map((h) => (
                  <text
                    key={h}
                    x={xForHour(h)}
                    y={pH - 6}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {String(h).padStart(2, '0')}:00
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Right 5 Columns: Solar Controls + 6 Physics Telemetry Tiles */}
          <div className="min-w-0 space-y-5 lg:col-span-5">
            {/* Control Folio */}
            <div
              className="border-t-2 border-r border-b border-l p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderTopColor: 'var(--accent)',
                borderRightColor: 'var(--border-subtle)',
                borderBottomColor: 'var(--border-subtle)',
                borderLeftColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {/* Time-of-Day Slider (06:00 - 18:00) */}
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <label htmlFor="solar-time-slider" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.timeSliderLabel}
                  </label>
                  <span
                    data-testid="solar-clock-readout"
                    className="font-mono-tabular text-lg font-semibold"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    {formatHourToClock(localHour)}
                  </span>
                </div>
                <input
                  id="solar-time-slider"
                  data-testid="solar-hour-slider"
                  type="range"
                  min={6}
                  max={18}
                  step={0.25}
                  value={localHour}
                  onChange={(e) => setLocalHour(Number(e.target.value))}
                  className="kinetix-slider"
                />
                <div className="font-mono-tabular mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>06:00</span>
                  <span>09:00</span>
                  <span>12:00</span>
                  <span>15:00</span>
                  <span>18:00</span>
                </div>

                {/* Quick Time Presets */}
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {[
                    { hour: 7.5, label: copy.presetMorning },
                    { hour: 12.0, label: copy.presetNoon },
                    { hour: 15.5, label: copy.presetAfternoon },
                    { hour: 17.25, label: copy.presetSunset },
                  ].map((preset) => {
                    const active = Math.abs(localHour - preset.hour) < 0.15;
                    return (
                      <button
                        key={preset.hour}
                        type="button"
                        onClick={() => setLocalHour(preset.hour)}
                        className="font-mono-tabular cursor-pointer rounded-sm border px-2 py-1.5 text-[10px] font-semibold transition-colors"
                        style={{
                          borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-primary)',
                          color: active ? 'var(--cta-ink)' : 'var(--text-secondary)',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Solstice / Equinox Season Selector */}
              <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="mb-2.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {copy.seasonLabel}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SEASON_ORDER.map((key) => {
                    const cfg = SOLAR_SEASONS[key];
                    const active = season === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSeason(key)}
                        className="cursor-pointer rounded-sm border px-3 py-2 text-left transition-colors"
                        style={{
                          borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-primary)',
                          color: active ? 'var(--cta-ink)' : 'var(--text-primary)',
                        }}
                      >
                        <div className="text-xs font-semibold">
                          {lang === 'vi' ? cfg.labelVi : cfg.labelEn}
                        </div>
                        <div
                          className="font-mono-tabular mt-0.5 text-[10px]"
                          style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
                        >
                          {lang === 'vi' ? cfg.dateLabelVi : cfg.dateLabelEn} · δ {cfg.declinationDeg >= 0 ? '+' : ''}
                          {cfg.declinationDeg.toFixed(1)}°
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Balcony Orientation Override */}
              <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="mb-2.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {copy.orientationLabel}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ORIENTATION_PRESETS.map((preset) => {
                    const active = orientationPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setOrientationPreset(preset.id)}
                        className="font-mono-tabular cursor-pointer rounded-sm border px-2.5 py-1.5 text-[10.5px] font-semibold transition-colors"
                        style={{
                          borderColor: active ? 'var(--border-strong)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-primary)',
                          color: active ? 'var(--text-heading)' : 'var(--text-secondary)',
                        }}
                      >
                        {preset.id === 'UNIT'
                          ? `${lang === 'vi' ? preset.labelVi : preset.labelEn} (${selectedResidence.compassDeg}°)`
                          : lang === 'vi'
                            ? preset.labelVi
                            : preset.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 6 Architectural Physics Telemetry Tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.altitudeLabel}
                </div>
                <div className="font-mono-tabular mt-1 text-xl font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {solar.solarAltitudeDeg.toFixed(1)}°
                </div>
                <div className="font-mono-tabular mt-0.5 text-[10px]" style={{ color: 'var(--accent)' }}>
                  {copy.noonPeakPrefix}: {solar.solarNoonAltitudeDeg.toFixed(1)}° {solar.solarNoonCardinal}
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.azimuthLabel}
                </div>
                <div className="font-mono-tabular mt-1 text-xl font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {solar.solarAzimuthDeg.toFixed(1)}°
                </div>
                <div className="font-mono-tabular mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Δ Facade {solar.relativeAzimuthDeg >= 0 ? '+' : ''}
                  {solar.relativeAzimuthDeg.toFixed(0)}°
                </div>
              </div>

              <div
                className="border p-3.5"
                style={{
                  borderColor: thermalStyle.border,
                  backgroundColor: thermalStyle.bg,
                }}
              >
                <div className="text-[10.5px]" style={{ color: thermalStyle.text }}>
                  {copy.thermalLoadLabel}
                </div>
                <div
                  data-testid="solar-thermal-wm2"
                  className="font-mono-tabular mt-1 text-xl font-bold"
                  style={{ color: thermalStyle.text }}
                >
                  {solar.exteriorFacadeIrradianceWm2} W/m²
                </div>
                <div className="mt-0.5 text-[10px] font-semibold" style={{ color: thermalStyle.text }}>
                  {copy.thermalTiers[solar.thermalLoadTier]}
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.interiorGainLabel}
                </div>
                <div className="font-mono-tabular mt-1 text-xl font-semibold" style={{ color: 'var(--status-available)' }}>
                  {solar.interiorSolarGainWm2} W/m²
                </div>
                <div className="font-mono-tabular mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Shade {(solar.shadedFraction * 100).toFixed(0)}% · SHGC 0.36
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.penetrationLabel}
                </div>
                <div className="font-mono-tabular mt-1 text-xl font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {solar.penetrationDepthM.toFixed(2)} m
                </div>
                <div className="font-mono-tabular mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Ceiling {selectedResidence.ceilingHeightM.toFixed(1)}m
                </div>
              </div>

              <div
                className="border p-3.5"
                style={{
                  borderColor: comfortStyle.border,
                  backgroundColor: comfortStyle.bg,
                }}
              >
                <div className="text-[10.5px]" style={{ color: comfortStyle.text }}>
                  {copy.daylightLuxLabel}
                </div>
                <div
                  data-testid="solar-lux-value"
                  className="font-mono-tabular mt-1 text-xl font-bold"
                  style={{ color: comfortStyle.text }}
                >
                  {solar.naturalDaylightLux.toLocaleString('en-US')} lux
                </div>
                <div className="mt-0.5 text-[10px] font-semibold" style={{ color: comfortStyle.text }}>
                  {copy.comfortTiers[solar.daylightComfortTier]}
                </div>
              </div>
            </div>

            {/* Glazing & Overhang Engineering Note */}
            <div
              className="border-l-2 border-t border-r border-b px-4 py-3 text-xs leading-relaxed"
              style={{
                borderLeftColor: 'var(--accent)',
                borderTopColor: 'var(--border-subtle)',
                borderRightColor: 'var(--border-subtle)',
                borderBottomColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              {copy.lowESpecNote}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolarDaylightLab;
