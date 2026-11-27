import type {
  CorridorHeatMetric,
  SaigonDistrictId,
  SaigonDistrictProfile,
} from '../types/proptech';
import { VND_PER_USD } from './currencyEngine';

export interface SaigonTransitStation {
  id: string;
  nameVi: string;
  nameEn: string;
  line: 'METRO_L1' | 'BRIDGE_4' | 'BA_SON';
  x: number;
  y: number;
}

export interface SaigonMarketSummary {
  districtCount: number;
  averagePricePerSqmVnd: number;
  averageNetYieldPct: number;
  averageAppreciationPct: number;
  highestYieldDistrict: SaigonDistrictProfile;
  highestAppreciationDistrict: SaigonDistrictProfile;
  fastestCommuteDistrict: SaigonDistrictProfile;
}

function toUsdPerSqm(vndPerSqm: number): number {
  return Math.round(vndPerSqm / VND_PER_USD);
}

/**
 * Institutional Q4 2026 Ho Chi Minh City Luxury Residential Corridor Telemetry
 * Calibrated for the 6 prime urban corridors along the Saigon River, Metro Line-1,
 * and Thu Thiem Bridge-4 appreciation spine.
 */
export const SAIGON_DISTRICTS: SaigonDistrictProfile[] = [
  {
    id: 'thu-thiem',
    code: 'TT-01',
    nameVi: 'Bán Đảo Thủ Thiêm',
    nameEn: 'Thu Thiem Peninsula',
    zoneTagVi: 'Trung Tâm Tài Chính Quốc Tế · The Kinetix Home',
    zoneTagEn: 'International Financial Center · The Kinetix Home',
    pricePerSqmVnd: 198_000_000,
    pricePerSqmUsd: toUsdPerSqm(198_000_000),
    grossRentalYieldPct: 6.8,
    netRentalYieldPct: 5.4,
    occupancyPct: 94.2,
    fiveYearAppreciationCagrPct: 8.4,
    commuteToCbdMin: 4,
    nearestMetroStationVi: 'Ga Ba Son (Metro L1) & Cầu Thủ Thiêm 4',
    nearestMetroStationEn: 'Ba Son Station (Metro L1) & Thu Thiem Bridge-4',
    metroTransitMin: 5,
    catalystHeadlineVi: 'Cầu Thủ Thiêm 4, Cầu Đi Bộ Sông Sài Gòn & Trung Tâm Tài Chính Quốc Tế',
    catalystHeadlineEn: 'Thu Thiem Bridge-4, Riverfront Pedestrian Bridge & IFC Masterplan',
    catalystTagsVi: ['Cầu Thủ Thiêm 4', 'TT Tài Chính Quốc Tế', 'Cầu Ba Son 4 Phút'],
    catalystTagsEn: ['Thu Thiem Bridge-4', 'International Financial Center', '4-Min Ba Son Bridge'],
    supplyScarcityScore: 95,
    foreignQuotaDemandPct: 98,
    isKinetixHome: true,
    map: {
      cx: 454,
      cy: 254,
      polygon: '356,192 496,174 566,224 548,312 436,334 342,292',
      labelX: 456,
      labelY: 250,
      anchor: 'middle',
    },
  },
  {
    id: 'ben-nghe',
    code: 'D1-BN',
    nameVi: 'Quận 1 · Bến Nghé',
    nameEn: 'District 1 Ben Nghe',
    zoneTagVi: 'Lõi Di Sản Tài Chính & Ngoại Giao',
    zoneTagEn: 'Historic Financial & Diplomatic Core',
    pricePerSqmVnd: 285_000_000,
    pricePerSqmUsd: toUsdPerSqm(285_000_000),
    grossRentalYieldPct: 5.4,
    netRentalYieldPct: 4.2,
    occupancyPct: 96.5,
    fiveYearAppreciationCagrPct: 5.8,
    commuteToCbdMin: 2,
    nearestMetroStationVi: 'Ga Nhà Hát TP & Ga Bến Thành (Metro L1)',
    nearestMetroStationEn: 'Opera House & Ben Thanh Hub (Metro L1)',
    metroTransitMin: 3,
    catalystHeadlineVi: 'Ga Trung Tâm Metro Line-1 Bến Thành & Khan Hiếm Quỹ Đất Di Sản Quận 1',
    catalystHeadlineEn: 'Ben Thanh Metro Line-1 Central Interchange & Heritage Land Scarcity',
    catalystTagsVi: ['Ga Bến Thành Metro L1', 'Lõi Di Sản Quận 1', 'Hạng A Ngoại Giao'],
    catalystTagsEn: ['Ben Thanh Metro Hub', 'Zero New Land Supply', 'Grade-A Diplomatic Core'],
    supplyScarcityScore: 99,
    foreignQuotaDemandPct: 96,
    isKinetixHome: false,
    map: {
      cx: 222,
      cy: 266,
      polygon: '132,226 306,228 302,314 140,316',
      labelX: 214,
      labelY: 256,
      anchor: 'middle',
    },
  },
  {
    id: 'ba-son',
    code: 'BS-MN',
    nameVi: 'Bến Du Thuyền Ba Son',
    nameEn: 'Ba Son Marina',
    zoneTagVi: 'Bờ Sông Hàng Hiệu Quận 1 · Ga Ngầm L1',
    zoneTagEn: 'Branded Heritage Waterfront · L1 Underground',
    pricePerSqmVnd: 262_000_000,
    pricePerSqmUsd: toUsdPerSqm(262_000_000),
    grossRentalYieldPct: 6.1,
    netRentalYieldPct: 4.8,
    occupancyPct: 95.0,
    fiveYearAppreciationCagrPct: 7.2,
    commuteToCbdMin: 3,
    nearestMetroStationVi: 'Ga Ngầm Ba Son (Metro Line-1 trực tiếp)',
    nearestMetroStationEn: 'Ba Son Underground Station (Direct Metro L1)',
    metroTransitMin: 2,
    catalystHeadlineVi: 'Kết Nối Trực Tiếp Ga Ngầm Ba Son, Cầu Ba Son & Bến Du Thuyền Ven Sông',
    catalystHeadlineEn: 'Direct Ba Son Underground Metro Access, Cable-Stayed Bridge & Yacht Marina',
    catalystTagsVi: ['Ga Ngầm Ba Son', 'Bến Du Thuyền', 'Branded Residences'],
    catalystTagsEn: ['Ba Son Underground L1', 'Private Yacht Marina', 'Branded Residences'],
    supplyScarcityScore: 97,
    foreignQuotaDemandPct: 97,
    isKinetixHome: false,
    map: {
      cx: 256,
      cy: 192,
      polygon: '176,164 334,164 316,220 178,218',
      labelX: 244,
      labelY: 192,
      anchor: 'middle',
    },
  },
  {
    id: 'binh-thanh',
    code: 'BT-LM',
    nameVi: 'Bình Thạnh · Landmark',
    nameEn: 'Binh Thanh Landmark',
    zoneTagVi: 'Trục Công Viên Ven Sông & Tháp Biểu Tượng',
    zoneTagEn: 'Skyscraper River Park & Corporate Corridor',
    pricePerSqmVnd: 146_000_000,
    pricePerSqmUsd: toUsdPerSqm(146_000_000),
    grossRentalYieldPct: 6.9,
    netRentalYieldPct: 5.5,
    occupancyPct: 93.8,
    fiveYearAppreciationCagrPct: 6.9,
    commuteToCbdMin: 8,
    nearestMetroStationVi: 'Ga Tân Cảng & Ga Văn Thánh (Metro L1)',
    nearestMetroStationEn: 'Tan Cang & Van Thanh Stations (Metro L1)',
    metroTransitMin: 4,
    catalystHeadlineVi: 'Ga Trung Chuyển Metro Line-1 Tân Cảng & Cụm Thuê Chuyên Gia Quốc Tế',
    catalystHeadlineEn: 'Tan Cang Metro Line-1 Viaduct & 14ha Riverside Expat Leasing Hub',
    catalystTagsVi: ['Ga Tân Cảng L1', 'Công Viên 14ha', 'Thanh Khoản Thuê Cao'],
    catalystTagsEn: ['Tan Cang Metro L1', '14ha Riverside Park', 'High Corporate Liquidity'],
    supplyScarcityScore: 84,
    foreignQuotaDemandPct: 89,
    isKinetixHome: false,
    map: {
      cx: 264,
      cy: 112,
      polygon: '164,66 324,62 372,118 346,160 192,158',
      labelX: 264,
      labelY: 108,
      anchor: 'middle',
    },
  },
  {
    id: 'thao-dien',
    code: 'TD-RV',
    nameVi: 'Thảo Điền Ven Sông',
    nameEn: 'Thao Dien Riverside',
    zoneTagVi: 'Bán Đảo Quốc Tế & Chuỗi Trường Song Ngữ',
    zoneTagEn: 'Expat River Bend & International School Enclave',
    pricePerSqmVnd: 138_000_000,
    pricePerSqmUsd: toUsdPerSqm(138_000_000),
    grossRentalYieldPct: 7.2,
    netRentalYieldPct: 5.8,
    occupancyPct: 92.6,
    fiveYearAppreciationCagrPct: 7.6,
    commuteToCbdMin: 12,
    nearestMetroStationVi: 'Ga Thảo Điền & Ga An Phú (Metro L1)',
    nearestMetroStationEn: 'Thao Dien & An Phu Stations (Metro L1)',
    metroTransitMin: 3,
    catalystHeadlineVi: 'Tuyến Metro Line-1 Rút Ngắn 9 Phút Vào Quận 1 & Lợi Suất Thuê Chuyên Gia Đỉnh',
    catalystHeadlineEn: 'Metro Line-1 9-Min Express to CBD & Highest Expat Net Rental Yield',
    catalystTagsVi: ['Ga Thảo Điền L1', 'Lợi Suất Thuê 5.8%', 'Trường Quốc Tế Anh/Mỹ'],
    catalystTagsEn: ['Thao Dien Metro L1', '5.8% Net Rental Yield', 'International School Belt'],
    supplyScarcityScore: 88,
    foreignQuotaDemandPct: 94,
    isKinetixHome: false,
    map: {
      cx: 536,
      cy: 88,
      polygon: '458,38 594,34 638,94 596,148 474,142 444,96',
      labelX: 540,
      labelY: 76,
      anchor: 'middle',
    },
  },
  {
    id: 'phu-my-hung',
    code: 'PMH-7',
    nameVi: 'Phú Mỹ Hưng · Quận 7',
    nameEn: 'Phu My Hung',
    zoneTagVi: 'Đô Thị Kiểu Mẫu Nam Sài Gòn & Cầu Thủ Thiêm 4',
    zoneTagEn: 'Southern Master-Planned Diplomatic Township',
    pricePerSqmVnd: 122_000_000,
    pricePerSqmUsd: toUsdPerSqm(122_000_000),
    grossRentalYieldPct: 6.4,
    netRentalYieldPct: 5.1,
    occupancyPct: 91.4,
    fiveYearAppreciationCagrPct: 6.5,
    commuteToCbdMin: 16,
    nearestMetroStationVi: 'Trục Kết Nối Cầu Thủ Thiêm 4 (Q7 ↔ Thủ Thiêm)',
    nearestMetroStationEn: 'Thu Thiem Bridge-4 Arterial Link (D7 to Thu Thiem)',
    metroTransitMin: 6,
    catalystHeadlineVi: 'Cầu Thủ Thiêm 4 Rút Ngắn Di Chuyển Sang Thủ Thiêm Còn 6 Phút & Hệ Sinh Thái Hồ Bán Nguyệt',
    catalystHeadlineEn: 'Thu Thiem Bridge-4 Direct 6-Min Link & Crescent Lake Diplomatic Ecosystem',
    catalystTagsVi: ['Cầu Thủ Thiêm 4', 'Hồ Bán Nguyệt', 'Cộng Đồng Chuyên Gia Hàn/Nhật'],
    catalystTagsEn: ['Thu Thiem Bridge-4', 'Crescent Lake SECC', 'Expat Family Township'],
    supplyScarcityScore: 86,
    foreignQuotaDemandPct: 87,
    isKinetixHome: false,
    map: {
      cx: 318,
      cy: 388,
      polygon: '188,350 426,358 446,420 198,422',
      labelX: 316,
      labelY: 386,
      anchor: 'middle',
    },
  },
];

export const SAIGON_TRANSIT_STATIONS: SaigonTransitStation[] = [
  { id: 'st-benthanh', nameVi: 'Ga Bến Thành', nameEn: 'Ben Thanh L1', line: 'METRO_L1', x: 174, y: 298 },
  { id: 'st-opera', nameVi: 'Nhà Hát TP', nameEn: 'Opera House', line: 'METRO_L1', x: 256, y: 290 },
  { id: 'st-bason', nameVi: 'Ba Son L1', nameEn: 'Ba Son L1', line: 'METRO_L1', x: 312, y: 204 },
  { id: 'st-tancang', nameVi: 'Tân Cảng L1', nameEn: 'Tan Cang L1', line: 'METRO_L1', x: 344, y: 144 },
  { id: 'st-thaodien', nameVi: 'Thảo Điền L1', nameEn: 'Thao Dien L1', line: 'METRO_L1', x: 492, y: 126 },
  { id: 'st-anphu', nameVi: 'An Phú L1', nameEn: 'An Phu L1', line: 'METRO_L1', x: 608, y: 112 },
  { id: 'br-thuthiem4', nameVi: 'Cầu Thủ Thiêm 4', nameEn: 'Bridge-4', line: 'BRIDGE_4', x: 404, y: 344 },
  { id: 'br-bason', nameVi: 'Cầu Ba Son', nameEn: 'Ba Son Bridge', line: 'BA_SON', x: 346, y: 206 },
];

export function getDistrictById(id: SaigonDistrictId): SaigonDistrictProfile {
  return SAIGON_DISTRICTS.find((d) => d.id === id) ?? SAIGON_DISTRICTS[0];
}

export function sortSaigonDistricts(
  metric: 'YIELD' | 'PRICE' | 'APPRECIATION' | 'COMMUTE',
  districts: SaigonDistrictProfile[] = SAIGON_DISTRICTS
): SaigonDistrictProfile[] {
  return [...districts].sort((a, b) => {
    switch (metric) {
      case 'YIELD':
        return b.netRentalYieldPct - a.netRentalYieldPct;
      case 'PRICE':
        return b.pricePerSqmVnd - a.pricePerSqmVnd;
      case 'APPRECIATION':
        return b.fiveYearAppreciationCagrPct - a.fiveYearAppreciationCagrPct;
      case 'COMMUTE':
        return a.commuteToCbdMin - b.commuteToCbdMin;
      default:
        return 0;
    }
  });
}

/**
 * Returns normalized intensity [0.22 .. 1.0] for architectural choropleth rendering.
 */
export function computeDistrictHeatIntensity(
  district: SaigonDistrictProfile,
  metric: CorridorHeatMetric,
  allDistricts: SaigonDistrictProfile[] = SAIGON_DISTRICTS
): number {
  const valueOf = (d: SaigonDistrictProfile) => {
    if (metric === 'YIELD') return d.netRentalYieldPct;
    if (metric === 'PRICE') return d.pricePerSqmVnd;
    return d.fiveYearAppreciationCagrPct;
  };

  const vals = allDistricts.map(valueOf);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (max <= min) return 0.6;

  const norm = (valueOf(district) - min) / (max - min);
  return Number((0.22 + norm * 0.78).toFixed(3));
}

export function summarizeSaigonMarket(
  districts: SaigonDistrictProfile[] = SAIGON_DISTRICTS
): SaigonMarketSummary {
  const count = Math.max(1, districts.length);
  const avgPrice = Math.round(
    districts.reduce((s, d) => s + d.pricePerSqmVnd, 0) / count
  );
  const avgNetYield = Number(
    (districts.reduce((s, d) => s + d.netRentalYieldPct, 0) / count).toFixed(2)
  );
  const avgAppreciation = Number(
    (districts.reduce((s, d) => s + d.fiveYearAppreciationCagrPct, 0) / count).toFixed(2)
  );

  const highestYieldDistrict = sortSaigonDistricts('YIELD', districts)[0];
  const highestAppreciationDistrict = sortSaigonDistricts('APPRECIATION', districts)[0];
  const fastestCommuteDistrict = sortSaigonDistricts('COMMUTE', districts)[0];

  return {
    districtCount: districts.length,
    averagePricePerSqmVnd: avgPrice,
    averageNetYieldPct: avgNetYield,
    averageAppreciationPct: avgAppreciation,
    highestYieldDistrict,
    highestAppreciationDistrict,
    fastestCommuteDistrict,
  };
}
