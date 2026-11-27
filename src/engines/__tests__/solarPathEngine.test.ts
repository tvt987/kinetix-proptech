import { describe, expect, it } from 'vitest';
import {
  azimuthToCardinal,
  classifyDaylightComfort,
  classifyThermalLoad,
  computeEquationOfTimeMinutes,
  computeSaigonSolarPosition,
  computeSolarExposure,
  formatHourToClock,
  normalizeAzimuthDeg,
  SAIGON_LATITUDE_DEG,
  SAIGON_LONGITUDE_DEG,
} from '../solarPathEngine';
import {
  compareCashVsLeverage,
  computeNetIrrPct,
  evaluateNpv,
} from '../leverageEngine';
import type { MortgageInputs } from '../../types/proptech';

const SAMPLE_PENTHOUSE_INPUTS: MortgageInputs = {
  propertyPriceVnd: 68_500_000_000,
  downPaymentPct: 30,
  loanTermYears: 20,
  annualInterestRatePct: 7.2,
  estimatedMonthlyRentVnd: 410_000_000,
  monthlyMaintenanceFeeVnd: 14_976_000,
  annualAppreciationPct: 6.0,
};

describe('Saigon Solar Path & Daylight Orientation Engine (10.7725°N, 106.7219°E)', () => {
  it('verifies Vernal Equinox solar noon altitude (~79.2°) and due South azimuth in HCMC', () => {
    const res = computeSolarExposure({
      localHour: 12.0,
      season: 'VERNAL_EQUINOX',
      facadeAzimuthDeg: 180,
    });
    expect(res.latitudeDeg).toBeCloseTo(SAIGON_LATITUDE_DEG, 4);
    expect(res.longitudeDeg).toBeCloseTo(SAIGON_LONGITUDE_DEG, 4);
    expect(res.solarNoonAltitudeDeg).toBeCloseTo(79.2, 0.2);
    expect(res.solarAltitudeDeg).toBeGreaterThan(78.0);
    expect(res.solarAltitudeDeg).toBeLessThanOrEqual(79.5);
    expect(res.solarNoonCardinal).toBe('S');
    expect(res.solarAzimuthDeg).toBeGreaterThan(165);
    expect(res.solarAzimuthDeg).toBeLessThan(195);
  });

  it('verifies tropical HCMC Summer Solstice sun passes NORTH of zenith at solar noon (~77.3°)', () => {
    const res = computeSolarExposure({
      localHour: 12.0,
      season: 'SUMMER_SOLSTICE',
      facadeAzimuthDeg: 0,
    });
    expect(res.solarNoonAltitudeDeg).toBeCloseTo(77.3, 0.2);
    expect(res.solarNoonCardinal).toBe('N');
    expect(res.solarAltitudeDeg).toBeGreaterThan(76.0);
    // Azimuth near True North (either > 340° or < 20°)
    const nearNorth = res.solarAzimuthDeg >= 340 || res.solarAzimuthDeg <= 20;
    expect(nearNorth).toBe(true);
  });

  it('verifies Winter Solstice solar noon altitude (~55.8°) due South in HCMC', () => {
    const res = computeSolarExposure({
      localHour: 12.0,
      season: 'WINTER_SOLSTICE',
      facadeAzimuthDeg: 180,
    });
    expect(res.solarNoonAltitudeDeg).toBeCloseTo(55.8, 0.2);
    expect(res.solarNoonCardinal).toBe('S');
    expect(res.solarAltitudeDeg).toBeGreaterThan(54.5);
    expect(res.solarAltitudeDeg).toBeLessThan(56.5);
    expect(res.solarAzimuthDeg).toBeGreaterThan(170);
    expect(res.solarAzimuthDeg).toBeLessThan(195);
  });

  it('tracks sun rising in the East in the morning and setting in the West in the afternoon', () => {
    const morning = computeSaigonSolarPosition(8.0, 'VERNAL_EQUINOX');
    const afternoon = computeSaigonSolarPosition(16.0, 'VERNAL_EQUINOX');

    expect(morning.solarAzimuthDeg).toBeGreaterThan(75);
    expect(morning.solarAzimuthDeg).toBeLessThan(110);
    expect(afternoon.solarAzimuthDeg).toBeGreaterThan(250);
    expect(afternoon.solarAzimuthDeg).toBeLessThan(285);
    expect(morning.solarAltitudeDeg).toBeGreaterThan(20);
    expect(afternoon.solarAltitudeDeg).toBeGreaterThan(20);
  });

  it('produces strictly higher exterior W/m² thermal load on West facade vs East facade at 15:30', () => {
    const west = computeSolarExposure({
      localHour: 15.5,
      season: 'VERNAL_EQUINOX',
      facadeAzimuthDeg: 270,
    });
    const east = computeSolarExposure({
      localHour: 15.5,
      season: 'VERNAL_EQUINOX',
      facadeAzimuthDeg: 90,
    });

    expect(west.directSunHit).toBe(true);
    expect(east.directSunHit).toBe(false);
    expect(west.exteriorFacadeIrradianceWm2).toBeGreaterThan(east.exteriorFacadeIrradianceWm2 * 3);
    expect(west.interiorSolarGainWm2).toBeGreaterThan(east.interiorSolarGainWm2);
    expect(west.penetrationDepthM).toBeGreaterThan(0);
    expect(east.penetrationDepthM).toBe(0);
  });

  it('produces strictly higher exterior W/m² thermal load on East facade vs West facade at 08:30', () => {
    const east = computeSolarExposure({
      localHour: 8.5,
      season: 'VERNAL_EQUINOX',
      facadeAzimuthDeg: 90,
    });
    const west = computeSolarExposure({
      localHour: 8.5,
      season: 'VERNAL_EQUINOX',
      facadeAzimuthDeg: 270,
    });

    expect(east.directSunHit).toBe(true);
    expect(west.directSunHit).toBe(false);
    expect(east.exteriorFacadeIrradianceWm2).toBeGreaterThan(west.exteriorFacadeIrradianceWm2 * 3);
    expect(east.naturalDaylightLux).toBeGreaterThan(west.naturalDaylightLux);
  });

  it('reduces interior solar heat gain and penetration depth as loggia overhang increases', () => {
    const shallowBalcony = computeSolarExposure({
      localHour: 15.5,
      season: 'AUTUMN_EQUINOX',
      facadeAzimuthDeg: 258,
      overhangDepthM: 0.6,
      ceilingHeightM: 3.6,
    });
    const deepLoggia = computeSolarExposure({
      localHour: 15.5,
      season: 'AUTUMN_EQUINOX',
      facadeAzimuthDeg: 258,
      overhangDepthM: 3.4,
      ceilingHeightM: 3.6,
    });

    expect(deepLoggia.shadedFraction).toBeGreaterThan(shallowBalcony.shadedFraction);
    expect(deepLoggia.interiorSolarGainWm2).toBeLessThan(shallowBalcony.interiorSolarGainWm2);
    expect(deepLoggia.penetrationDepthM).toBeLessThan(shallowBalcony.penetrationDepthM);
  });

  it('attenuates interior solar heat gain via triple Low-E SHGC glazing compared to exterior load', () => {
    const res = computeSolarExposure({
      localHour: 15.0,
      season: 'WINTER_SOLSTICE',
      facadeAzimuthDeg: 255,
      glazingShgc: 0.36,
    });

    expect(res.exteriorFacadeIrradianceWm2).toBeGreaterThan(300);
    expect(res.interiorSolarGainWm2).toBeLessThan(res.exteriorFacadeIrradianceWm2 * 0.45);
    expect(res.interiorSolarGainWm2).toBeGreaterThan(0);
  });

  it('generates a complete 13-point hourly profile spanning 06:00 through 18:00', () => {
    const res = computeSolarExposure({
      localHour: 14.0,
      season: 'SUMMER_SOLSTICE',
      facadeAzimuthDeg: 225,
    });

    expect(res.dailyProfile).toHaveLength(13);
    expect(res.dailyProfile[0].localHour).toBe(6);
    expect(res.dailyProfile[12].localHour).toBe(18);
    // Peak solar altitude occurs near solar noon (11:00–13:00)
    const noonAlt = Math.max(
      res.dailyProfile[5].altitudeDeg,
      res.dailyProfile[6].altitudeDeg,
      res.dailyProfile[7].altitudeDeg
    );
    expect(noonAlt).toBeGreaterThan(res.dailyProfile[1].altitudeDeg);
    expect(noonAlt).toBeGreaterThan(res.dailyProfile[11].altitudeDeg);
  });

  it('handles pre-sunrise Winter Solstice 06:00 safely without NaN or negative irradiance', () => {
    const res = computeSolarExposure({
      localHour: 6.0,
      season: 'WINTER_SOLSTICE',
      facadeAzimuthDeg: 90,
    });

    expect(res.solarAltitudeDeg).toBe(0);
    expect(res.directSunHit).toBe(false);
    expect(res.exteriorFacadeIrradianceWm2).toBe(0);
    expect(res.interiorSolarGainWm2).toBe(0);
    expect(res.daylightComfortTier).toBe('TWILIGHT_LOW');
  });

  it('normalizes arbitrary azimuth degrees and formats cardinal & clock labels cleanly', () => {
    expect(normalizeAzimuthDeg(-90)).toBe(270);
    expect(normalizeAzimuthDeg(450)).toBe(90);
    expect(azimuthToCardinal(0)).toBe('N');
    expect(azimuthToCardinal(90)).toBe('E');
    expect(azimuthToCardinal(135)).toBe('SE');
    expect(azimuthToCardinal(225)).toBe('SW');
    expect(azimuthToCardinal(270)).toBe('W');
    expect(formatHourToClock(6.5)).toBe('06:30');
    expect(formatHourToClock(15.75)).toBe('15:45');
  });

  it('classifies Equation of Time, daylight lux tiers, and thermal load tiers accurately', () => {
    const eotMarch = computeEquationOfTimeMinutes(80);
    const eotNov = computeEquationOfTimeMinutes(305);
    expect(eotMarch).toBeLessThan(0);
    expect(eotNov).toBeGreaterThan(10);

    expect(classifyDaylightComfort(90)).toBe('TWILIGHT_LOW');
    expect(classifyDaylightComfort(260)).toBe('AMBIENT_DIFFUSE');
    expect(classifyDaylightComfort(950)).toBe('OPTIMAL_DAYLIGHT');
    expect(classifyDaylightComfort(2600)).toBe('BRIGHT_DIRECT_GLARE');

    expect(classifyThermalLoad(80, 9.0)).toBe('COOL_MORNING');
    expect(classifyThermalLoad(240, 11.0)).toBe('BALANCED');
    expect(classifyThermalLoad(620, 10.0)).toBe('ELEVATED_SOLAR_GAIN');
    expect(classifyThermalLoad(620, 15.5)).toBe('PEAK_WEST_LOAD');
  });
});

describe('10-Year Cash vs 70% Bank Leverage Yield & Net IRR Simulator', () => {
  it('solves exact IRR where NPV(IRR) equals zero within 1 VND tolerance', () => {
    const cfs = [-10_000_000_000, 800_000_000, 850_000_000, 900_000_000, 14_500_000_000];
    const irrPct = computeNetIrrPct(cfs);
    expect(irrPct).toBeGreaterThan(14);
    expect(irrPct).toBeLessThan(20);
    const npvAtIrr = evaluateNpv(cfs, irrPct / 100);
    expect(Math.abs(npvAtIrr)).toBeLessThan(5_000_000); // < 0.05% of 10B principal
  });

  it('compares 100% Cash vs 70% Bank Leverage across 10 years with exact capital freed', () => {
    const cmp = compareCashVsLeverage(SAMPLE_PENTHOUSE_INPUTS, 70, 10);

    expect(cmp.horizonYears).toBe(10);
    expect(cmp.yearlyComparison).toHaveLength(10);
    expect(cmp.cashStrategy.ltvPct).toBe(0);
    expect(cmp.cashStrategy.initialEquityVnd).toBe(SAMPLE_PENTHOUSE_INPUTS.propertyPriceVnd);
    expect(cmp.cashStrategy.loanPrincipalVnd).toBe(0);
    expect(cmp.cashStrategy.tenYearInterestPaidVnd).toBe(0);

    expect(cmp.leveragedStrategy.ltvPct).toBe(70);
    expect(cmp.leveragedStrategy.loanPrincipalVnd).toBe(Math.round(68_500_000_000 * 0.7));
    expect(cmp.leveragedStrategy.initialEquityVnd).toBe(68_500_000_000 - cmp.leveragedStrategy.loanPrincipalVnd);
    expect(cmp.capitalFreedVnd).toBe(cmp.leveragedStrategy.loanPrincipalVnd);
  });

  it('applies identical rental gross income and operating fees to both Cash and Leveraged acquisitions', () => {
    const cmp = compareCashVsLeverage(SAMPLE_PENTHOUSE_INPUTS, 70, 10);
    expect(cmp.cashStrategy.tenYearGrossRentVnd).toBe(cmp.leveragedStrategy.tenYearGrossRentVnd);
    expect(cmp.cashStrategy.tenYearOperatingFeesVnd).toBe(cmp.leveragedStrategy.tenYearOperatingFeesVnd);
    expect(cmp.cashStrategy.tenYearNetOperatingIncomeVnd).toBe(
      cmp.leveragedStrategy.tenYearNetOperatingIncomeVnd
    );
    expect(cmp.cashStrategy.year10PropertyValueVnd).toBe(
      cmp.leveragedStrategy.year10PropertyValueVnd
    );
    expect(cmp.cashStrategy.exitTransactionCostVnd).toBe(
      cmp.leveragedStrategy.exitTransactionCostVnd
    );
  });

  it('demonstrates positive Leverage Alpha (higher Net IRR & Equity Multiple) when asset return exceeds borrowing cost', () => {
    const cmp = compareCashVsLeverage(
      {
        ...SAMPLE_PENTHOUSE_INPUTS,
        annualInterestRatePct: 6.5,
        annualAppreciationPct: 7.0,
      },
      70,
      10
    );

    expect(cmp.leveragedStrategy.netIrrPct).toBeGreaterThan(cmp.cashStrategy.netIrrPct);
    expect(cmp.irrSpreadPct).toBeGreaterThan(0);
    expect(cmp.leveragedStrategy.equityMultiple).toBeGreaterThan(cmp.cashStrategy.equityMultiple);
    expect(cmp.equityMultipleAdvantage).toBeGreaterThan(0);
  });

  it('demonstrates negative Leverage Alpha when borrowing rate exceeds unlevered total return', () => {
    const cmp = compareCashVsLeverage(
      {
        ...SAMPLE_PENTHOUSE_INPUTS,
        annualInterestRatePct: 14.5,
        annualAppreciationPct: 2.0,
      },
      70,
      10
    );

    expect(cmp.leveragedStrategy.netIrrPct).toBeLessThan(cmp.cashStrategy.netIrrPct);
    expect(cmp.irrSpreadPct).toBeLessThan(0);
  });

  it('reduces Year-10 remaining debt to zero when loan tenure is 10 years or shorter', () => {
    const cmp = compareCashVsLeverage(
      {
        ...SAMPLE_PENTHOUSE_INPUTS,
        loanTermYears: 10,
      },
      70,
      10
    );

    expect(cmp.leveragedStrategy.year10RemainingDebtVnd).toBe(0);
    expect(cmp.leveragedStrategy.netExitProceedsVnd).toBe(cmp.cashStrategy.netExitProceedsVnd);
  });

  it('tracks monotonically growing cash cumulative cashflow and property valuation over 10 years', () => {
    const cmp = compareCashVsLeverage(SAMPLE_PENTHOUSE_INPUTS, 70, 10);
    for (let i = 1; i < cmp.yearlyComparison.length; i += 1) {
      expect(cmp.yearlyComparison[i].propertyValueVnd).toBeGreaterThan(
        cmp.yearlyComparison[i - 1].propertyValueVnd
      );
      expect(cmp.yearlyComparison[i].cashCumulativeCashflowVnd).toBeGreaterThan(
        cmp.yearlyComparison[i - 1].cashCumulativeCashflowVnd
      );
      expect(cmp.yearlyComparison[i].remainingDebtVnd).toBeLessThan(
        cmp.yearlyComparison[i - 1].remainingDebtVnd
      );
    }
  });

  it('returns safe zero/floor IRR on degenerate or invalid cashflow streams', () => {
    expect(computeNetIrrPct([])).toBe(0);
    expect(computeNetIrrPct([1_000_000, 500_000])).toBe(0);
    expect(computeNetIrrPct([-1_000_000, 0, 0])).toBe(-100);
  });
});
