using Kinetix.Domain.Models;

namespace Kinetix.Domain.Services;

/// <summary>
/// Astronomical solar geometry & building-envelope thermal load model calibrated for
/// The Kinetix Residences, Thu Thiem Peninsula, Ho Chi Minh City (10.7725° N, 106.7219° E, UTC+7).
/// </summary>
public sealed class SaigonSolarEngine
{
    public const double SaigonLatitudeDeg = 10.7725;
    public const double SaigonLongitudeDeg = 106.7219;
    public const double VietnamStdMeridianDeg = 105.0;
    public const double DefaultLowEVlt = 0.62;

    private const double DegToRad = Math.PI / 180.0;
    private const double RadToDeg = 180.0 / Math.PI;

    private static (int DayOfYear, double DeclinationDeg) GetSeasonParameters(SolarSeason season) =>
        season switch
        {
            SolarSeason.VernalEquinox => (80, 0.0),
            SolarSeason.SummerSolstice => (172, 23.44),
            SolarSeason.AutumnEquinox => (265, 0.0),
            SolarSeason.WinterSolstice => (355, -23.44),
            _ => (80, 0.0)
        };

    public static double NormalizeAzimuthDeg(double deg) => ((deg % 360.0) + 360.0) % 360.0;

    public static string AzimuthToCardinal(double deg)
    {
        string[] dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        var index = (int)Math.Round(NormalizeAzimuthDeg(deg) / 45.0, MidpointRounding.AwayFromZero) % 8;
        return dirs[index];
    }

    public static double ComputeEquationOfTimeMinutes(int dayOfYear)
    {
        var b = 2.0 * Math.PI * (dayOfYear - 81) / 365.0;
        return 9.87 * Math.Sin(2.0 * b) - 7.53 * Math.Cos(b) - 1.5 * Math.Sin(b);
    }

    public SolarExposureResult ComputeExposure(SolarExposureRequest request)
    {
        var localHour = Math.Clamp(request.LocalHour, 6.0, 18.0);
        var overhangDepthM = Math.Clamp(request.OverhangDepthM, 0.0, 6.0);
        var ceilingHeightM = Math.Clamp(request.CeilingHeightM, 2.4, 8.0);
        var glazingShgc = Math.Clamp(request.GlazingShgc, 0.15, 0.85);
        var facadeAz = NormalizeAzimuthDeg(request.FacadeAzimuthDeg);

        var (dayOfYear, declinationDeg) = GetSeasonParameters(request.Season);
        var current = EvaluateInstant(localHour, dayOfYear, declinationDeg, facadeAz, overhangDepthM, ceilingHeightM, glazingShgc);

        var solarNoonAlt = Math.Round(90.0 - Math.Abs(SaigonLatitudeDeg - declinationDeg), 1, MidpointRounding.AwayFromZero);
        var solarNoonCardinal = declinationDeg > SaigonLatitudeDeg ? "N" : "S";

        var profile = new List<SolarHourlyPoint>(13);
        for (var h = 6; h <= 18; h++)
        {
            var pt = EvaluateInstant(h, dayOfYear, declinationDeg, facadeAz, overhangDepthM, ceilingHeightM, glazingShgc);
            profile.Add(new SolarHourlyPoint(
                LocalHour: h,
                AltitudeDeg: pt.AltitudeDeg,
                AzimuthDeg: pt.AzimuthDeg,
                ExteriorIrradianceWm2: pt.ExteriorIrradianceWm2,
                InteriorSolarGainWm2: pt.InteriorSolarGainWm2,
                DaylightLux: pt.DaylightLux,
                DirectSunHit: pt.DirectSunHit
            ));
        }

        return new SolarExposureResult(
            LatitudeDeg: SaigonLatitudeDeg,
            LongitudeDeg: SaigonLongitudeDeg,
            Season: request.Season,
            DayOfYear: dayOfYear,
            LocalHour: localHour,
            TrueSolarHour: Math.Round(current.TrueSolarHour, 2, MidpointRounding.AwayFromZero),
            DeclinationDeg: declinationDeg,
            SolarAltitudeDeg: current.AltitudeDeg,
            SolarAzimuthDeg: current.AzimuthDeg,
            FacadeAzimuthDeg: facadeAz,
            FacadeCardinal: AzimuthToCardinal(facadeAz),
            RelativeAzimuthDeg: current.RelativeAzimuthDeg,
            IncidenceAngleDeg: current.IncidenceAngleDeg,
            DirectSunHit: current.DirectSunHit,
            ShadedFraction: current.ShadedFraction,
            PenetrationDepthM: current.PenetrationDepthM,
            DirectNormalIrradianceWm2: current.DniWm2,
            ExteriorFacadeIrradianceWm2: current.ExteriorIrradianceWm2,
            InteriorSolarGainWm2: current.InteriorSolarGainWm2,
            NaturalDaylightLux: current.DaylightLux,
            DaylightComfortTier: ClassifyDaylightComfort(current.DaylightLux),
            ThermalLoadTier: ClassifyThermalLoad(current.ExteriorIrradianceWm2, localHour),
            SolarNoonAltitudeDeg: solarNoonAlt,
            SolarNoonCardinal: solarNoonCardinal,
            DailyProfile: profile
        );
    }

    private static DaylightComfortTier ClassifyDaylightComfort(int lux)
    {
        if (lux < 180) return DaylightComfortTier.TwilightLow;
        if (lux < 350) return DaylightComfortTier.AmbientDiffuse;
        if (lux <= 1850) return DaylightComfortTier.OptimalDaylight;
        return DaylightComfortTier.BrightDirectGlare;
    }

    private static ThermalLoadTier ClassifyThermalLoad(int exteriorWm2, double localHour)
    {
        if (exteriorWm2 < 140) return ThermalLoadTier.CoolMorning;
        if (exteriorWm2 < 340) return ThermalLoadTier.Balanced;
        if (exteriorWm2 < 540 || localHour < 13.5) return ThermalLoadTier.ElevatedSolarGain;
        return ThermalLoadTier.PeakWestLoad;
    }

    private static (
        double TrueSolarHour,
        double AltitudeDeg,
        double AzimuthDeg,
        double RelativeAzimuthDeg,
        double IncidenceAngleDeg,
        bool DirectSunHit,
        double ShadedFraction,
        double PenetrationDepthM,
        int DniWm2,
        int ExteriorIrradianceWm2,
        int InteriorSolarGainWm2,
        int DaylightLux
    ) EvaluateInstant(
        double localHour,
        int dayOfYear,
        double declinationDeg,
        double facadeAz,
        double overhangDepthM,
        double ceilingHeightM,
        double glazingShgc)
    {
        var longitudeOffsetMin = (SaigonLongitudeDeg - VietnamStdMeridianDeg) * 4.0;
        var eotMin = ComputeEquationOfTimeMinutes(dayOfYear);
        var trueSolarHour = localHour + (longitudeOffsetMin + eotMin) / 60.0;

        var hourAngleRad = 15.0 * (trueSolarHour - 12.0) * DegToRad;
        var latRad = SaigonLatitudeDeg * DegToRad;
        var decRad = declinationDeg * DegToRad;

        var sinAlt = Math.Clamp(
            Math.Sin(latRad) * Math.Sin(decRad) +
            Math.Cos(latRad) * Math.Cos(decRad) * Math.Cos(hourAngleRad),
            -1.0,
            1.0
        );
        var rawAltDeg = Math.Asin(sinAlt) * RadToDeg;
        var altDeg = Math.Max(0.0, rawAltDeg);
        var altRad = altDeg * DegToRad;

        var sinAzComponent = -Math.Cos(decRad) * Math.Sin(hourAngleRad);
        var cosAzComponent =
            Math.Sin(decRad) * Math.Cos(latRad) -
            Math.Cos(decRad) * Math.Sin(latRad) * Math.Cos(hourAngleRad);
        var azDeg = NormalizeAzimuthDeg(Math.Atan2(sinAzComponent, cosAzComponent) * RadToDeg);

        var relAzDeg = ((azDeg - facadeAz + 540.0) % 360.0) - 180.0;
        var relAzRad = relAzDeg * DegToRad;
        var cosRelAz = Math.Cos(relAzRad);
        var cosIncidence = Math.Cos(altRad) * cosRelAz;
        var directSunHit = altDeg > 0.5 && cosIncidence > 0.01;
        var incidenceAngleDeg = directSunHit
            ? Math.Acos(Math.Clamp(cosIncidence, -1.0, 1.0)) * RadToDeg
            : 90.0;

        double dni = 0.0;
        double verticalDirect = 0.0;
        double verticalDiffuse = 0.0;
        double shadedFraction = 1.0;
        double penetrationDepthM = 0.0;

        if (altDeg > 0.5)
        {
            var airMass = 1.0 / (Math.Sin(altRad) + 0.50572 * Math.Pow(altDeg + 6.07995, -1.6364));
            dni = 1353.0 * Math.Pow(0.7, Math.Pow(airMass, 0.678));

            var directHorizontal = dni * Math.Sin(altRad);
            var diffuseHorizontal = 0.14 * directHorizontal + 38.0 * Math.Sin(altRad);
            verticalDiffuse = 0.5 * diffuseHorizontal + 0.07 * (directHorizontal + diffuseHorizontal);

            if (directSunHit)
            {
                verticalDirect = dni * cosIncidence;
                var tanProfile = Math.Tan(altRad) / Math.Max(0.05, cosRelAz);
                var shadowDrop = overhangDepthM * tanProfile;
                shadedFraction = Math.Clamp(shadowDrop / Math.Max(1.5, ceilingHeightM), 0.0, 1.0);
                penetrationDepthM = Math.Clamp(ceilingHeightM / Math.Max(0.08, tanProfile) - overhangDepthM, 0.0, 7.5);
            }
        }

        var exteriorWm2 = (int)Math.Round(verticalDirect + verticalDiffuse, MidpointRounding.AwayFromZero);
        var interiorGainWm2 = (int)Math.Round((verticalDirect * (1.0 - shadedFraction) + verticalDiffuse) * glazingShgc, MidpointRounding.AwayFromZero);
        var lux = altDeg > 0.5
            ? (int)Math.Round(DefaultLowEVlt * (verticalDirect * 105.0 * (1.0 - shadedFraction) * 0.14 + verticalDiffuse * 120.0 * 0.085), MidpointRounding.AwayFromZero)
            : 45;

        return (
            trueSolarHour,
            Math.Round(altDeg, 1, MidpointRounding.AwayFromZero),
            Math.Round(azDeg, 1, MidpointRounding.AwayFromZero),
            Math.Round(relAzDeg, 1, MidpointRounding.AwayFromZero),
            Math.Round(incidenceAngleDeg, 1, MidpointRounding.AwayFromZero),
            directSunHit,
            Math.Round(shadedFraction, 2, MidpointRounding.AwayFromZero),
            Math.Round(penetrationDepthM, 2, MidpointRounding.AwayFromZero),
            (int)Math.Round(dni, MidpointRounding.AwayFromZero),
            exteriorWm2,
            interiorGainWm2,
            lux
        );
    }
}
