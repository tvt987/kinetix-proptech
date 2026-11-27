using Kinetix.Domain.Models;

namespace Kinetix.Domain.Services;

public sealed class ResidenceCatalog
{
    private static readonly IReadOnlyList<ResidenceUnit> Units =
    [
        new("knx-18a", "K-18A", "Botanical Atelier 1BR", "Botanical Atelier 1BR", 18, "SOUTH", BedroomTier.OneBr, 1, 1, 72m, 9.5m, 3.3m, ResidenceOrientation.Botanical, 135, 81, UnitAvailabilityStatus.Available, 11_400_000_000L, 74_000_000L, 38_000L, false, 1, "Q4 2027"),
        new("knx-21b", "K-21B", "Saigon Horizon 1BR+", "Saigon Horizon 1BR+", 21, "NORTH", BedroomTier.OneBr, 1, 1, 78m, 10.2m, 3.3m, ResidenceOrientation.SunsetCbd, 255, 86, UnitAvailabilityStatus.Reserved, 12_950_000_000L, 82_000_000L, 38_000L, false, 1, "Q4 2027"),
        new("knx-24a", "K-24A", "Riverbend Residence 2BR", "Riverbend Residence 2BR", 24, "NORTH", BedroomTier.TwoBr, 2, 2, 118m, 14.5m, 3.4m, ResidenceOrientation.RiverPanoramic, 220, 92, UnitAvailabilityStatus.Available, 20_600_000_000L, 128_000_000L, 40_000L, false, 1, "Q4 2027"),
        new("knx-26c", "K-26C", "Emerald Canopy 2BR", "Emerald Canopy 2BR", 26, "SOUTH", BedroomTier.TwoBr, 2, 2, 124m, 15.8m, 3.4m, ResidenceOrientation.Botanical, 148, 84, UnitAvailabilityStatus.Sold, 21_400_000_000L, 132_000_000L, 40_000L, false, 1, "Q4 2027"),
        new("knx-28a", "K-28A", "Skyline Corner Suite 2BR", "Skyline Corner Suite 2BR", 28, "NORTH", BedroomTier.TwoBr, 2, 2, 132m, 16.4m, 3.5m, ResidenceOrientation.SunsetCbd, 262, 94, UnitAvailabilityStatus.Available, 24_200_000_000L, 152_000_000L, 40_000L, true, 2, "Q4 2027"),
        new("knx-30b", "K-30B", "Bronze Loggia 2BR Signature", "Bronze Loggia 2BR Signature", 30, "NORTH", BedroomTier.TwoBr, 2, 2, 138m, 18.0m, 3.5m, ResidenceOrientation.RiverPanoramic, 210, 95, UnitAvailabilityStatus.Available, 26_500_000_000L, 165_000_000L, 42_000L, true, 2, "Q1 2028"),
        new("knx-32a", "K-32A", "Grand Riverfront 3BR", "Grand Riverfront 3BR", 32, "NORTH", BedroomTier.ThreeBr, 3, 3, 188m, 22.0m, 3.6m, ResidenceOrientation.RiverPanoramic, 225, 97, UnitAvailabilityStatus.Available, 37_800_000_000L, 230_000_000L, 44_000L, true, 2, "Q1 2028"),
        new("knx-34b", "K-34B", "Sunset Sanctuary 3BR", "Sunset Sanctuary 3BR", 34, "SOUTH", BedroomTier.ThreeBr, 3, 3, 196m, 24.5m, 3.6m, ResidenceOrientation.SunsetCbd, 270, 96, UnitAvailabilityStatus.Reserved, 40_500_000_000L, 242_000_000L, 44_000L, true, 2, "Q1 2028"),
        new("knx-36a", "K-36A", "The Atelier Horizon 3BR", "The Atelier Horizon 3BR", 36, "NORTH", BedroomTier.ThreeBr, 3, 3, 208m, 26.0m, 3.7m, ResidenceOrientation.RiverPanoramic, 215, 98, UnitAvailabilityStatus.Available, 44_800_000_000L, 272_000_000L, 45_000L, true, 2, "Q2 2028"),
        new("knx-38a", "K-38A", "Sovereign Sky Villa 3BR", "Sovereign Sky Villa 3BR", 38, "CROWN", BedroomTier.ThreeBr, 3, 4, 226m, 31.0m, 3.9m, ResidenceOrientation.RiverPanoramic, 230, 99, UnitAvailabilityStatus.Sold, 51_200_000_000L, 305_000_000L, 48_000L, true, 3, "Q2 2028"),
        new("knx-40p", "K-40P", "Obsidian Sky Penthouse", "Obsidian Sky Penthouse", 40, "CROWN", BedroomTier.Penthouse, 4, 4, 288m, 54.0m, 6.8m, ResidenceOrientation.SunsetCbd, 258, 99, UnitAvailabilityStatus.Available, 68_500_000_000L, 410_000_000L, 52_000L, true, 3, "Q2 2028"),
        new("knx-42p", "K-42P", "The Kinetix Crown Duplex Penthouse", "The Kinetix Crown Duplex Penthouse", 42, "CROWN", BedroomTier.Penthouse, 4, 5, 332m, 68.0m, 6.8m, ResidenceOrientation.RiverPanoramic, 225, 100, UnitAvailabilityStatus.Available, 79_800_000_000L, 475_000_000L, 55_000L, true, 4, "Q2 2028")
    ];

    public IReadOnlyList<ResidenceUnit> GetAll() => Units;

    public ResidenceUnit? GetById(string id) =>
        Units.FirstOrDefault(u => string.Equals(u.Id, id, StringComparison.OrdinalIgnoreCase));

    public IReadOnlyList<ResidenceUnit> Query(
        BedroomTier? tier = null,
        UnitAvailabilityStatus? status = null,
        ResidenceOrientation? orientation = null,
        int? minFloor = null,
        long? maxPriceVnd = null,
        IReadOnlySet<string>? activelyHeldUnitIds = null)
    {
        var projected = Units.Select(u =>
            activelyHeldUnitIds is not null &&
            activelyHeldUnitIds.Contains(u.Id) &&
            u.Status == UnitAvailabilityStatus.Available
                ? u with { Status = UnitAvailabilityStatus.Reserved }
                : u);

        if (tier.HasValue)
            projected = projected.Where(u => u.Tier == tier.Value);

        if (status.HasValue)
            projected = projected.Where(u => u.Status == status.Value);

        if (orientation.HasValue)
            projected = projected.Where(u => u.Orientation == orientation.Value);

        if (minFloor.HasValue)
            projected = projected.Where(u => u.Floor >= minFloor.Value);

        if (maxPriceVnd.HasValue)
            projected = projected.Where(u => u.PriceVnd <= maxPriceVnd.Value);

        return projected.ToList();
    }
}
