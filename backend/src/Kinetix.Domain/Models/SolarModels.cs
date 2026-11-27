namespace Kinetix.Domain.Models;

public enum SolarSeason
{
    VernalEquinox,
    SummerSolstice,
    AutumnEquinox,
    WinterSolstice
}

public enum DaylightComfortTier
{
    OptimalDaylight,
    BrightDirectGlare,
    AmbientDiffuse,
    TwilightLow
}

public enum ThermalLoadTier
{
    CoolMorning,
    Balanced,
    ElevatedSolarGain,
    PeakWestLoad
}

public sealed record SolarExposureRequest(
    double LocalHour,
    SolarSeason Season,
    double FacadeAzimuthDeg,
    double OverhangDepthM = 2.2,
    double CeilingHeightM = 3.5,
    double GlazingShgc = 0.36
);

public sealed record SolarHourlyPoint(
    int LocalHour,
    double AltitudeDeg,
    double AzimuthDeg,
    int ExteriorIrradianceWm2,
    int InteriorSolarGainWm2,
    int DaylightLux,
    bool DirectSunHit
);

public sealed record SolarExposureResult(
    double LatitudeDeg,
    double LongitudeDeg,
    SolarSeason Season,
    int DayOfYear,
    double LocalHour,
    double TrueSolarHour,
    double DeclinationDeg,
    double SolarAltitudeDeg,
    double SolarAzimuthDeg,
    double FacadeAzimuthDeg,
    string FacadeCardinal,
    double RelativeAzimuthDeg,
    double IncidenceAngleDeg,
    bool DirectSunHit,
    double ShadedFraction,
    double PenetrationDepthM,
    int DirectNormalIrradianceWm2,
    int ExteriorFacadeIrradianceWm2,
    int InteriorSolarGainWm2,
    int NaturalDaylightLux,
    DaylightComfortTier DaylightComfortTier,
    ThermalLoadTier ThermalLoadTier,
    double SolarNoonAltitudeDeg,
    string SolarNoonCardinal,
    IReadOnlyList<SolarHourlyPoint> DailyProfile
);
