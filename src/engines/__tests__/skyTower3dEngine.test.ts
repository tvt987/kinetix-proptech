import { describe, expect, it } from 'vitest';
import { RESIDENCES } from '../../data/residences';
import {
  SAIGON_TOWER_LAT_DEG,
  SKY_TOWER_TOTAL_STORIES,
  SKY_TOWER_UNITS,
  applyEscrowLockTransition,
  computeCameraPreset,
  computeMetroTrainState,
  computeSaigonSolarState,
  computeStoryElevationM,
  computeTowerTotalHeightM,
  computeTowerTotalWorldY,
  computeUnitSolarMetrics,
  computeXRayFloorplateLayout,
  evaluateMetroViaductPoint,
  formatSolarClock,
  getEffectiveUnitStatus,
  getSkyTowerUnitByCode,
  getSkyTowerUnitByResidenceId,
  lerpHexColor,
  storyToWorldY,
  type EscrowLockRegistry,
} from '../skyTower3dEngine';

describe('skyTower3dEngine — 28-story Saigon Riverfront Tower manifest', () => {
  it('defines a 28-story luxury tower with 12 selectable 3D units including signature codes', () => {
    expect(SKY_TOWER_TOTAL_STORIES).toBe(28);
    expect(SKY_TOWER_UNITS).toHaveLength(12);

    const codes = SKY_TOWER_UNITS.map((u) => u.unitCode);
    for (const required of ['U-08A', 'U-12B', 'U-16A', 'U-20C', 'U-24PH', 'U-28SKY']) {
      expect(codes).toContain(required);
    }
  });

  it('maps every 3D Sky-Tower unit 1-to-1 to a valid existing Residence record', () => {
    const validIds = new Set(RESIDENCES.map((r) => r.id));
    const mappedIds = new Set<string>();
    for (const unit of SKY_TOWER_UNITS) {
      expect(validIds.has(unit.residenceId)).toBe(true);
      mappedIds.add(unit.residenceId);
    }
    expect(mappedIds.size).toBe(SKY_TOWER_UNITS.length);
  });

  it('computes strictly increasing architectural floor elevations and Three.js worldY across stories 1..28', () => {
    let prevM = 0;
    let prevY = 0;
    for (let story = 1; story <= SKY_TOWER_TOTAL_STORIES; story += 1) {
      const m = computeStoryElevationM(story);
      const y = storyToWorldY(story);
      expect(m).toBeGreaterThan(prevM);
      expect(y).toBeGreaterThan(prevY);
      prevM = m;
      prevY = y;
    }
    expect(computeTowerTotalHeightM()).toBeGreaterThan(computeStoryElevationM(28));
    expect(computeTowerTotalWorldY()).toBeGreaterThan(storyToWorldY(28));
  });

  it('assigns crown floors 24..28 taller slab-to-slab ceiling height than standard floors', () => {
    const standardStep = computeStoryElevationM(12) - computeStoryElevationM(11);
    const crownStep = computeStoryElevationM(26) - computeStoryElevationM(25);
    expect(standardStep).toBeCloseTo(3.6, 2);
    expect(crownStep).toBeCloseTo(4.4, 2);
  });

  it('covers all three architectural facade orientations and all three unit statuses', () => {
    const orientations = new Set(SKY_TOWER_UNITS.map((u) => u.orientationLabel));
    expect(orientations).toEqual(new Set(['SE River', 'SW Sunset', 'NE Landmark 81']));

    const statuses = new Set(SKY_TOWER_UNITS.map((u) => u.baseStatus));
    expect(statuses).toEqual(new Set(['Available', 'Reserved', 'Sold']));
  });

  it('assigns valid balcony sightline scores (80..100), positive prices, and realistic rental yields', () => {
    for (const u of SKY_TOWER_UNITS) {
      expect(u.sightlineScore).toBeGreaterThanOrEqual(80);
      expect(u.sightlineScore).toBeLessThanOrEqual(100);
      expect(u.priceVnd).toBeGreaterThan(10_000_000_000);
      expect(u.priceUsd).toBeGreaterThan(400_000);
      expect(u.rentalYieldPct).toBeGreaterThan(6.5);
      expect(u.rentalYieldPct).toBeLessThan(9.0);
    }
  });

  it('looks up units cleanly by unitCode and by mapped residenceId', () => {
    const byCode = getSkyTowerUnitByCode('U-24PH');
    expect(byCode).toBeDefined();
    expect(byCode?.residenceId).toBe('knx-40p');

    const byRes = getSkyTowerUnitByResidenceId('knx-42p');
    expect(byRes?.unitCode).toBe('U-28SKY');
    expect(getSkyTowerUnitByCode('U-99X')).toBeUndefined();
  });

  it('places balcony POV coordinates outside the tower perimeter and oriented outward along facade azimuth', () => {
    for (const u of SKY_TOWER_UNITS) {
      const radialDist = Math.hypot(u.balconyWorldPos.x, u.balconyWorldPos.z);
      expect(radialDist).toBeGreaterThan(2.2);
      const lookDist = Math.hypot(
        u.balconyLookTarget.x - u.balconyWorldPos.x,
        u.balconyLookTarget.z - u.balconyWorldPos.z
      );
      expect(lookDist).toBeGreaterThan(20);
      expect(u.balconyWorldPos.y).toBeGreaterThan(u.worldY);
    }
  });
});

describe('skyTower3dEngine — Saigon tropical solar physics (10.78°N)', () => {
  it('anchors latitude at 10.78°N and clamps out-of-range hours to 06:00..18:30', () => {
    const early = computeSaigonSolarState(2.0);
    const late = computeSaigonSolarState(23.0);
    expect(early.latitudeDeg).toBe(SAIGON_TOWER_LAT_DEG);
    expect(early.hour).toBe(6.0);
    expect(early.clockLabel).toBe('06:00');
    expect(late.hour).toBe(18.5);
    expect(late.clockLabel).toBe('18:30');
  });

  it('produces an eastern low sun at 06:00 Dawn casting long shadows westward', () => {
    const dawn = computeSaigonSolarState(6.0);
    expect(dawn.phase).toBe('DAWN');
    expect(dawn.azimuthDeg).toBeGreaterThan(75);
    expect(dawn.azimuthDeg).toBeLessThan(105);
    expect(dawn.sunVector.x).toBeGreaterThan(0.8); // East (+X)
    expect(dawn.shadowAngleDeg).toBeGreaterThan(255);
    expect(dawn.shadowAngleDeg).toBeLessThan(285);
    expect(dawn.shadowLengthFactor).toBeGreaterThan(4);
  });

  it('achieves high tropical zenith (>78° elevation) and high color temp (~5800K) at 12:30 Noon', () => {
    const noon = computeSaigonSolarState(12.5);
    expect(noon.phase).toBe('SOLAR_NOON');
    expect(noon.elevationDeg).toBeGreaterThan(78);
    expect(noon.sunVector.y).toBeGreaterThan(0.97);
    expect(noon.colorTemperatureK).toBeGreaterThanOrEqual(5600);
    expect(noon.shadowLengthFactor).toBeLessThan(0.3);
    expect(noon.emissiveWindowFactor).toBeLessThan(0.1);
  });

  it('transitions to warm Golden Hour (~2550K) with western low sun and illuminated interiors at 17:30', () => {
    const sunset = computeSaigonSolarState(17.5);
    expect(sunset.phase).toBe('GOLDEN_HOUR');
    expect(sunset.azimuthDeg).toBeGreaterThan(260);
    expect(sunset.azimuthDeg).toBeLessThan(285);
    expect(sunset.sunVector.x).toBeLessThan(-0.85); // West (-X)
    expect(sunset.elevationDeg).toBeGreaterThan(5);
    expect(sunset.elevationDeg).toBeLessThan(16);
    expect(sunset.colorTemperatureK).toBeLessThan(2800);
    expect(sunset.emissiveWindowFactor).toBeGreaterThan(0.7);
  });

  it('keeps sunVector normalized to unit length across the entire daylight arc', () => {
    for (const h of [6.0, 8.5, 10.25, 12.5, 15.0, 17.5, 18.5]) {
      const s = computeSaigonSolarState(h);
      const len = Math.hypot(s.sunVector.x, s.sunVector.y, s.sunVector.z);
      expect(len).toBeCloseTo(1.0, 3);
      expect(s.sunPosition.y).toBeGreaterThan(0);
    }
  });

  it('formats decimal hours cleanly into HH:MM clock labels', () => {
    expect(formatSolarClock(6)).toBe('06:00');
    expect(formatSolarClock(12.5)).toBe('12:30');
    expect(formatSolarClock(17.5)).toBe('17:30');
    expect(formatSolarClock(18.5)).toBe('18:30');
  });

  it('interpolates hex colors deterministically across endpoints and midpoint', () => {
    expect(lerpHexColor('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(lerpHexColor('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(lerpHexColor('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('computes higher morning Solar Heat Gain on SE River unit than SW Sunset unit at 09:00', () => {
    const solar = computeSaigonSolarState(9.0);
    const seUnit = getSkyTowerUnitByCode('U-16A')!;
    const swUnit = getSkyTowerUnitByCode('U-24PH')!;

    const seMetrics = computeUnitSolarMetrics(seUnit, solar);
    const swMetrics = computeUnitSolarMetrics(swUnit, solar);

    expect(seMetrics.directSunlight).toBe(true);
    expect(swMetrics.directSunlight).toBe(false);
    expect(swMetrics.balconyShadePct).toBe(100);
    expect(seMetrics.solarHeatGainKwM2).toBeGreaterThan(swMetrics.solarHeatGainKwM2);
  });

  it('computes higher late-afternoon Solar Heat Gain on SW Sunset unit than NE Landmark 81 unit at 16:30', () => {
    const solar = computeSaigonSolarState(16.5);
    const swUnit = getSkyTowerUnitByCode('U-24PH')!;
    const neUnit = getSkyTowerUnitByCode('U-20C')!;

    const swMetrics = computeUnitSolarMetrics(swUnit, solar);
    const neMetrics = computeUnitSolarMetrics(neUnit, solar);

    expect(swMetrics.directSunlight).toBe(true);
    expect(neMetrics.directSunlight).toBe(false);
    expect(swMetrics.solarHeatGainKwM2).toBeGreaterThan(neMetrics.solarHeatGainKwM2);
    expect(swMetrics.balconyShadePct).toBeLessThan(100);
    expect(neMetrics.balconyShadePct).toBe(100);
  });

  it('achieves high overhang Balcony Shade % near Solar Noon even on sunlit facades', () => {
    const noon = computeSaigonSolarState(12.25);
    const unit = getSkyTowerUnitByCode('U-28SKY')!;
    const metrics = computeUnitSolarMetrics(unit, noon);
    expect(metrics.balconyShadePct).toBeGreaterThanOrEqual(85);
    expect(metrics.solarHeatGainKwM2).toBeLessThan(0.18);
  });

  it('ensures Low-E glazing transmitted heat gain is strictly lower than exterior facade irradiance', () => {
    const afternoon = computeSaigonSolarState(16.0);
    for (const unit of SKY_TOWER_UNITS) {
      const m = computeUnitSolarMetrics(unit, afternoon);
      expect(m.solarHeatGainKwM2).toBeLessThanOrEqual(m.exteriorIrradianceKwM2);
      expect(m.balconyShadePct).toBeGreaterThanOrEqual(0);
      expect(m.balconyShadePct).toBeLessThanOrEqual(100);
    }
  });
});

describe('skyTower3dEngine — Metro Line-1 viaduct kinematics', () => {
  it('models 3 articulated train carriages aligned along the elevated viaduct at y > 3', () => {
    const state = computeMetroTrainState(5.2);
    expect(state.cars).toHaveLength(3);
    for (const car of state.cars) {
      expect(car.y).toBeGreaterThan(3.0);
      expect(Number.isFinite(car.yawRad)).toBe(true);
    }
    const spacing01 = Math.hypot(
      state.cars[0].x - state.cars[1].x,
      state.cars[0].z - state.cars[1].z
    );
    expect(spacing01).toBeGreaterThan(2.5);
    expect(spacing01).toBeLessThan(4.0);
  });

  it('reverses train travel direction and next station label across the 26-second loop', () => {
    const outbound = computeMetroTrainState(4.0);
    const inbound = computeMetroTrainState(17.0);

    expect(outbound.direction).toBe(1);
    expect(inbound.direction).toBe(-1);
    expect(outbound.nextStationEn).toContain('Thao Dien');
    expect(inbound.nextStationEn).toContain('Ba Son');
  });

  it('decelerates train into BOARDING / APPROACHING_STATION speed near the riverfront station', () => {
    // At t = 7.4s (forward), rawU ≈ 0.14 right at the Sky Station
    const boarding = computeMetroTrainState(7.4);
    const cruising = computeMetroTrainState(1.2);
    expect(boarding.speedKmh).toBeLessThan(cruising.speedKmh);
    expect(['BOARDING', 'APPROACHING_STATION']).toContain(boarding.stationState);
    expect(cruising.stationState).toBe('CRUISING');
  });

  it('evaluates smooth continuous viaduct guideway points across u in [-1, 1]', () => {
    const pLeft = evaluateMetroViaductPoint(-1);
    const pMid = evaluateMetroViaductPoint(0);
    const pRight = evaluateMetroViaductPoint(1);
    expect(pLeft.x).toBeLessThan(pMid.x);
    expect(pMid.x).toBeLessThan(pRight.x);
    expect(pLeft.y).toBe(pRight.y);
  });
});

describe('skyTower3dEngine — X-Ray floorplate & camera presets', () => {
  it('builds X-Ray floorplate geometry with structural core, dual elevator shafts, 8 columns, and 4 glowing rooms', () => {
    const unit = getSkyTowerUnitByCode('U-24PH')!;
    const layout = computeXRayFloorplateLayout(unit);

    expect(layout.unitCode).toBe('U-24PH');
    expect(layout.story).toBe(24);
    expect(layout.structuralCore.elevatorShafts).toHaveLength(2);
    expect(layout.perimeterColumns).toHaveLength(8);
    expect(layout.rooms).toHaveLength(4);
    expect(layout.rooms.find((r) => r.id === 'salon')?.areaSqm).toBe(78);
  });

  it('tapers X-Ray floorplate footprint at crown floors >= 24 compared to lower floors', () => {
    const lower = computeXRayFloorplateLayout(getSkyTowerUnitByCode('U-08A')!);
    const crown = computeXRayFloorplateLayout(getSkyTowerUnitByCode('U-28SKY')!);
    expect(crown.slabWidth).toBeLessThan(lower.slabWidth);
    expect(crown.slabDepth).toBeLessThan(lower.slabDepth);
  });

  it('solves distinct camera presets for ORBIT, BALCONY_POV, and XRAY modes', () => {
    const unit = getSkyTowerUnitByCode('U-24PH')!;
    const orbit = computeCameraPreset('ORBIT', unit, 0.55, 0.32, 29);
    const pov = computeCameraPreset('BALCONY_POV', unit, 0.55, 0.32, 29);
    const xray = computeCameraPreset('XRAY', unit, 0.55, 0.32, 29);

    expect(pov.position).toEqual(unit.balconyWorldPos);
    expect(pov.target).toEqual(unit.balconyLookTarget);
    expect(pov.fov).toBeGreaterThan(orbit.fov);
    // X-Ray zooms closer to the selected floor slab than full-tower Orbit
    const orbitDist = Math.hypot(orbit.position.x - orbit.target.x, orbit.position.z - orbit.target.z);
    const xrayDist = Math.hypot(xray.position.x - xray.target.x, xray.position.z - xray.target.z);
    expect(xrayDist).toBeLessThan(orbitDist);
  });

  it('tracks selected unit height smoothly in ORBIT mode so higher floors raise the camera focus', () => {
    const lowUnit = getSkyTowerUnitByCode('U-08A')!;
    const highUnit = getSkyTowerUnitByCode('U-28SKY')!;
    const lowCam = computeCameraPreset('ORBIT', lowUnit, 0.5, 0.3, 28);
    const highCam = computeCameraPreset('ORBIT', highUnit, 0.5, 0.3, 28);
    expect(highCam.target.y).toBeGreaterThan(lowCam.target.y);
    expect(highCam.position.y).toBeGreaterThan(lowCam.position.y);
  });
});

describe('skyTower3dEngine — Idempotent 409 Escrow lock state machine', () => {
  it('transitions an Available unit to Reserved with 201 LOCKED_CREATED on first lock', () => {
    const reg: EscrowLockRegistry = {};
    const res = applyEscrowLockTransition(reg, 'U-24PH', 'buyer-alpha-key', '2026-11-28T09:00:00Z');

    expect(res.httpStatus).toBe(201);
    expect(res.outcome).toBe('LOCKED_CREATED');
    expect(res.effectiveStatus).toBe('Reserved');
    expect(res.holdToken).toMatch(/^ESC-409-U24PH-/);
    expect(getEffectiveUnitStatus(getSkyTowerUnitByCode('U-24PH')!, res.nextRegistry)).toBe('Reserved');
  });

  it('returns 200 IDEMPOTENT_REPLAY with identical holdToken when retried with the same Idempotency-Key', () => {
    const first = applyEscrowLockTransition({}, 'U-16A', 'idem-same-123', '2026-11-28T09:00:00Z');
    const replay = applyEscrowLockTransition(first.nextRegistry, 'U-16A', 'idem-same-123', '2026-11-28T09:01:00Z');

    expect(replay.httpStatus).toBe(200);
    expect(replay.outcome).toBe('IDEMPOTENT_REPLAY');
    expect(replay.holdToken).toBe(first.holdToken);
    expect(replay.effectiveStatus).toBe('Reserved');
  });

  it('returns 409 CONFLICT_LOCKED when a contending buyer attempts to lock an already-held unit', () => {
    const first = applyEscrowLockTransition({}, 'U-28SKY', 'buyer-1', '2026-11-28T09:00:00Z');
    const conflict = applyEscrowLockTransition(first.nextRegistry, 'U-28SKY', 'buyer-2', '2026-11-28T09:00:02Z');

    expect(conflict.httpStatus).toBe(409);
    expect(conflict.outcome).toBe('CONFLICT_LOCKED');
    expect(conflict.holdToken).toBe(first.holdToken);
    expect(conflict.nextRegistry['U-28SKY'].idempotencyKey).toBe('buyer-1');
  });

  it('returns 409 CONFLICT_SOLD for Sold units and 409 CONFLICT_LOCKED for pre-Reserved units', () => {
    const soldRes = applyEscrowLockTransition({}, 'U-22A', 'buyer-3', '2026-11-28T09:00:00Z');
    expect(soldRes.httpStatus).toBe(409);
    expect(soldRes.outcome).toBe('CONFLICT_SOLD');
    expect(soldRes.effectiveStatus).toBe('Sold');

    const preReservedRes = applyEscrowLockTransition({}, 'U-12B', 'buyer-4', '2026-11-28T09:00:00Z');
    expect(preReservedRes.httpStatus).toBe(409);
    expect(preReservedRes.outcome).toBe('CONFLICT_LOCKED');
    expect(preReservedRes.effectiveStatus).toBe('Reserved');
  });

  it('returns 404 NOT_FOUND for unknown unit codes without mutating registry', () => {
    const initial: EscrowLockRegistry = {};
    const res = applyEscrowLockTransition(initial, 'U-999Z', 'buyer-x', '2026-11-28T09:00:00Z');
    expect(res.httpStatus).toBe(404);
    expect(res.outcome).toBe('NOT_FOUND');
    expect(res.nextRegistry).toBe(initial);
  });
});
