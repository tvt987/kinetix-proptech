namespace Kinetix.Domain.Models;

public enum BedroomTier
{
    OneBr,
    TwoBr,
    ThreeBr,
    Penthouse
}

public enum ResidenceOrientation
{
    RiverPanoramic,
    SunsetCbd,
    Botanical
}

public enum UnitAvailabilityStatus
{
    Available,
    Reserved,
    Sold
}

public sealed record ResidenceUnit(
    string Id,
    string Code,
    string NameEn,
    string NameVi,
    int Floor,
    string Wing,
    BedroomTier Tier,
    int Bedrooms,
    int Bathrooms,
    decimal AreaSqm,
    decimal TerraceSqm,
    decimal CeilingHeightM,
    ResidenceOrientation Orientation,
    int CompassDeg,
    int RiverViewScore,
    UnitAvailabilityStatus Status,
    long PriceVnd,
    long EstMonthlyRentVnd,
    long MaintenanceFeePerSqmVnd,
    bool PrivateLift,
    int ParkingSlots,
    string HandoverQuarter
)
{
    public long MonthlyMaintenanceFeeVnd => (long)Math.Round(AreaSqm * MaintenanceFeePerSqmVnd, MidpointRounding.AwayFromZero);

    public decimal GrossRentalYieldPct =>
        PriceVnd > 0
            ? Math.Round(((decimal)EstMonthlyRentVnd * 12m / PriceVnd) * 100m, 2, MidpointRounding.AwayFromZero)
            : 0m;
}
