using Kinetix.Domain.Models;

namespace Kinetix.Domain.Services;

public sealed class SaigonMarketCatalog
{
    public const int FxRateVndPerUsd = 25_400;
    public const string ReferenceQuarter = "Q4 2026";

    private readonly IReadOnlyList<SaigonDistrictTelemetry> _districts;

    public SaigonMarketCatalog()
    {
        _districts =
        [
            CreateDistrict(
                id: "thu-thiem",
                code: "TT-01",
                nameEn: "Thu Thiem Peninsula",
                nameVi: "Bán Đảo Thủ Thiêm",
                zoneTagEn: "International Financial Center · The Kinetix Home",
                zoneTagVi: "Trung Tâm Tài Chính Quốc Tế · The Kinetix Home",
                pricePerSqmVnd: 198_000_000L,
                grossRentalYieldPct: 6.8m,
                netRentalYieldPct: 5.4m,
                occupancyPct: 94.2m,
                fiveYearAppreciationCagrPct: 8.4m,
                commuteToCbdMin: 4,
                nearestMetroStationEn: "Ba Son Station (Metro L1) & Thu Thiem Bridge-4",
                nearestMetroStationVi: "Ga Ba Son (Metro L1) & Cầu Thủ Thiêm 4",
                metroTransitMin: 5,
                catalystHeadlineEn: "Thu Thiem Bridge-4, Riverfront Pedestrian Bridge & IFC Masterplan",
                catalystHeadlineVi: "Cầu Thủ Thiêm 4, Cầu Đi Bộ Sông Sài Gòn & Trung Tâm Tài Chính Quốc Tế",
                catalystTagsEn: ["Thu Thiem Bridge-4", "International Financial Center", "4-Min Ba Son Bridge"],
                supplyScarcityScore: 95,
                foreignQuotaDemandPct: 98,
                isKinetixHome: true
            ),
            CreateDistrict(
                id: "ben-nghe",
                code: "D1-BN",
                nameEn: "District 1 Ben Nghe",
                nameVi: "Quận 1 · Bến Nghé",
                zoneTagEn: "Historic Financial & Diplomatic Core",
                zoneTagVi: "Lõi Di Sản Tài Chính & Ngoại Giao",
                pricePerSqmVnd: 285_000_000L,
                grossRentalYieldPct: 5.4m,
                netRentalYieldPct: 4.2m,
                occupancyPct: 96.5m,
                fiveYearAppreciationCagrPct: 5.8m,
                commuteToCbdMin: 2,
                nearestMetroStationEn: "Opera House & Ben Thanh Hub (Metro L1)",
                nearestMetroStationVi: "Ga Nhà Hát TP & Ga Bến Thành (Metro L1)",
                metroTransitMin: 3,
                catalystHeadlineEn: "Ben Thanh Metro Line-1 Central Interchange & Heritage Land Scarcity",
                catalystHeadlineVi: "Ga Trung Tâm Metro Line-1 Bến Thành & Khan Hiếm Quỹ Đất Di Sản Quận 1",
                catalystTagsEn: ["Ben Thanh Metro Hub", "Zero New Land Supply", "Grade-A Diplomatic Core"],
                supplyScarcityScore: 99,
                foreignQuotaDemandPct: 96,
                isKinetixHome: false
            ),
            CreateDistrict(
                id: "ba-son",
                code: "BS-MN",
                nameEn: "Ba Son Marina",
                nameVi: "Bến Du Thuyền Ba Son",
                zoneTagEn: "Branded Heritage Waterfront · L1 Underground",
                zoneTagVi: "Bờ Sông Hàng Hiệu Quận 1 · Ga Ngầm L1",
                pricePerSqmVnd: 262_000_000L,
                grossRentalYieldPct: 6.1m,
                netRentalYieldPct: 4.8m,
                occupancyPct: 95.0m,
                fiveYearAppreciationCagrPct: 7.2m,
                commuteToCbdMin: 3,
                nearestMetroStationEn: "Ba Son Underground Station (Direct Metro L1)",
                nearestMetroStationVi: "Ga Ngầm Ba Son (Metro Line-1 trực tiếp)",
                metroTransitMin: 2,
                catalystHeadlineEn: "Direct Ba Son Underground Metro Access, Cable-Stayed Bridge & Yacht Marina",
                catalystHeadlineVi: "Kết Nối Trực Tiếp Ga Ngầm Ba Son, Cầu Ba Son & Bến Du Thuyền Ven Sông",
                catalystTagsEn: ["Ba Son Underground L1", "Private Yacht Marina", "Branded Residences"],
                supplyScarcityScore: 97,
                foreignQuotaDemandPct: 97,
                isKinetixHome: false
            ),
            CreateDistrict(
                id: "binh-thanh",
                code: "BT-LM",
                nameEn: "Binh Thanh Landmark",
                nameVi: "Bình Thạnh · Landmark",
                zoneTagEn: "Skyscraper River Park & Corporate Corridor",
                zoneTagVi: "Trục Công Viên Ven Sông & Tháp Biểu Tượng",
                pricePerSqmVnd: 146_000_000L,
                grossRentalYieldPct: 6.9m,
                netRentalYieldPct: 5.5m,
                occupancyPct: 93.8m,
                fiveYearAppreciationCagrPct: 6.9m,
                commuteToCbdMin: 8,
                nearestMetroStationEn: "Tan Cang & Van Thanh Stations (Metro L1)",
                nearestMetroStationVi: "Ga Tân Cảng & Ga Văn Thánh (Metro L1)",
                metroTransitMin: 4,
                catalystHeadlineEn: "Tan Cang Metro Line-1 Viaduct & 14ha Riverside Expat Leasing Hub",
                catalystHeadlineVi: "Ga Trung Chuyển Metro Line-1 Tân Cảng & Cụm Thuê Chuyên Gia Quốc Tế",
                catalystTagsEn: ["Tan Cang Metro L1", "14ha Riverside Park", "High Corporate Liquidity"],
                supplyScarcityScore: 84,
                foreignQuotaDemandPct: 89,
                isKinetixHome: false
            ),
            CreateDistrict(
                id: "thao-dien",
                code: "TD-RV",
                nameEn: "Thao Dien Riverside",
                nameVi: "Thảo Điền Ven Sông",
                zoneTagEn: "Expat River Bend & International School Enclave",
                zoneTagVi: "Bán Đảo Quốc Tế & Chuỗi Trường Song Ngữ",
                pricePerSqmVnd: 138_000_000L,
                grossRentalYieldPct: 7.2m,
                netRentalYieldPct: 5.8m,
                occupancyPct: 92.6m,
                fiveYearAppreciationCagrPct: 7.6m,
                commuteToCbdMin: 12,
                nearestMetroStationEn: "Thao Dien & An Phu Stations (Metro L1)",
                nearestMetroStationVi: "Ga Thảo Điền & Ga An Phú (Metro L1)",
                metroTransitMin: 3,
                catalystHeadlineEn: "Metro Line-1 9-Min Express to CBD & Highest Expat Net Rental Yield",
                catalystHeadlineVi: "Tuyến Metro Line-1 Rút Ngắn 9 Phút Vào Quận 1 & Lợi Suất Thuê Chuyên Gia Đỉnh",
                catalystTagsEn: ["Thao Dien Metro L1", "5.8% Net Rental Yield", "International School Belt"],
                supplyScarcityScore: 88,
                foreignQuotaDemandPct: 94,
                isKinetixHome: false
            ),
            CreateDistrict(
                id: "phu-my-hung",
                code: "PMH-7",
                nameEn: "Phu My Hung",
                nameVi: "Phú Mỹ Hưng · Quận 7",
                zoneTagEn: "Southern Master-Planned Diplomatic Township",
                zoneTagVi: "Đô Thị Kiểu Mẫu Nam Sài Gòn & Cầu Thủ Thiêm 4",
                pricePerSqmVnd: 122_000_000L,
                grossRentalYieldPct: 6.4m,
                netRentalYieldPct: 5.1m,
                occupancyPct: 91.4m,
                fiveYearAppreciationCagrPct: 6.5m,
                commuteToCbdMin: 16,
                nearestMetroStationEn: "Thu Thiem Bridge-4 Arterial Link (D7 to Thu Thiem)",
                nearestMetroStationVi: "Trục Kết Nối Cầu Thủ Thiêm 4 (Q7 ↔ Thủ Thiêm)",
                metroTransitMin: 6,
                catalystHeadlineEn: "Thu Thiem Bridge-4 Direct 6-Min Link & Crescent Lake Diplomatic Ecosystem",
                catalystHeadlineVi: "Cầu Thủ Thiêm 4 Rút Ngắn Di Chuyển Sang Thủ Thiêm Còn 6 Phút & Hệ Sinh Thái Hồ Bán Nguyệt",
                catalystTagsEn: ["Thu Thiem Bridge-4", "Crescent Lake SECC", "Expat Family Township"],
                supplyScarcityScore: 86,
                foreignQuotaDemandPct: 87,
                isKinetixHome: false
            )
        ];
    }

    private static SaigonDistrictTelemetry CreateDistrict(
        string id,
        string code,
        string nameEn,
        string nameVi,
        string zoneTagEn,
        string zoneTagVi,
        long pricePerSqmVnd,
        decimal grossRentalYieldPct,
        decimal netRentalYieldPct,
        decimal occupancyPct,
        decimal fiveYearAppreciationCagrPct,
        int commuteToCbdMin,
        string nearestMetroStationEn,
        string nearestMetroStationVi,
        int metroTransitMin,
        string catalystHeadlineEn,
        string catalystHeadlineVi,
        IReadOnlyList<string> catalystTagsEn,
        int supplyScarcityScore,
        int foreignQuotaDemandPct,
        bool isKinetixHome) =>
        new(
            Id: id,
            Code: code,
            NameEn: nameEn,
            NameVi: nameVi,
            ZoneTagEn: zoneTagEn,
            ZoneTagVi: zoneTagVi,
            PricePerSqmVnd: pricePerSqmVnd,
            PricePerSqmUsd: (int)Math.Round((double)pricePerSqmVnd / FxRateVndPerUsd, MidpointRounding.AwayFromZero),
            GrossRentalYieldPct: grossRentalYieldPct,
            NetRentalYieldPct: netRentalYieldPct,
            OccupancyPct: occupancyPct,
            FiveYearAppreciationCagrPct: fiveYearAppreciationCagrPct,
            CommuteToCbdMin: commuteToCbdMin,
            NearestMetroStationEn: nearestMetroStationEn,
            NearestMetroStationVi: nearestMetroStationVi,
            MetroTransitMin: metroTransitMin,
            CatalystHeadlineEn: catalystHeadlineEn,
            CatalystHeadlineVi: catalystHeadlineVi,
            CatalystTagsEn: catalystTagsEn,
            SupplyScarcityScore: supplyScarcityScore,
            ForeignQuotaDemandPct: foreignQuotaDemandPct,
            IsKinetixHome: isKinetixHome
        );

    public IReadOnlyList<SaigonDistrictTelemetry> GetAll() => _districts;

    public SaigonMarketSummaryResponse GetMarketSummary(string? sortBy = null)
    {
        IReadOnlyList<SaigonDistrictTelemetry> ordered = sortBy?.Trim().ToLowerInvariant() switch
        {
            null or "" => _districts,
            "yield" => _districts.OrderByDescending(d => d.NetRentalYieldPct).ToList(),
            "price" => _districts.OrderByDescending(d => d.PricePerSqmVnd).ToList(),
            "appreciation" => _districts.OrderByDescending(d => d.FiveYearAppreciationCagrPct).ToList(),
            "commute" => _districts.OrderBy(d => d.CommuteToCbdMin).ToList(),
            _ => throw new ArgumentException($"Unsupported sortBy value '{sortBy}'. Allowed: yield, price, appreciation, commute.", nameof(sortBy))
        };

        var avgPrice = (long)Math.Round(_districts.Average(d => (double)d.PricePerSqmVnd), MidpointRounding.AwayFromZero);
        var avgYield = Math.Round(_districts.Average(d => d.NetRentalYieldPct), 2, MidpointRounding.AwayFromZero);
        var avgAppreciation = Math.Round(_districts.Average(d => d.FiveYearAppreciationCagrPct), 2, MidpointRounding.AwayFromZero);

        var highestYield = _districts.OrderByDescending(d => d.NetRentalYieldPct).First();
        var highestAppreciation = _districts.OrderByDescending(d => d.FiveYearAppreciationCagrPct).First();
        var fastestCommute = _districts.OrderBy(d => d.CommuteToCbdMin).First();

        return new SaigonMarketSummaryResponse(
            City: "Ho Chi Minh City",
            ReferenceQuarter: ReferenceQuarter,
            FxRateVndPerUsd: FxRateVndPerUsd,
            DistrictCount: _districts.Count,
            AveragePricePerSqmVnd: avgPrice,
            AverageNetYieldPct: avgYield,
            AverageAppreciationPct: avgAppreciation,
            HighestYieldDistrictId: highestYield.Id,
            HighestAppreciationDistrictId: highestAppreciation.Id,
            FastestCommuteDistrictId: fastestCommute.Id,
            Districts: ordered
        );
    }
}
