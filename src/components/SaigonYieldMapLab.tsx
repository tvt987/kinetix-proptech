import React, { useMemo, useState } from 'react';
import type {
  AssetClassId,
  CorridorHeatMetric,
  Currency,
  Language,
  SaigonDistrictId,
} from '../types/proptech';
import {
  computeDistrictHeatIntensity,
  getDistrictById,
  SAIGON_DISTRICTS,
  SAIGON_TRANSIT_STATIONS,
  summarizeSaigonMarket,
} from '../engines/saigonDistrictEngine';
import {
  BENCHMARK_DEFAULTS,
  computeAssetBenchmark,
} from '../engines/assetBenchmarkEngine';
import { formatCurrency } from '../engines/currencyEngine';
import { ChartLineIcon, CompassIcon, MapPinIcon, TransitIcon } from './Icons';

interface SaigonYieldMapLabProps {
  currency: Currency;
  lang: Language;
  simulatorDownPaymentVnd: number;
  simulatorInterestRatePct: number;
  simulatorLoanTermYears: number;
}

const CAPITAL_MIN_VND = 5_000_000_000;
const CAPITAL_MAX_VND = 30_000_000_000;
const CAPITAL_STEP_VND = 500_000_000;
const CAPITAL_PRESETS = [
  5_000_000_000,
  10_000_000_000,
  15_000_000_000,
  20_000_000_000,
  30_000_000_000,
];

const ASSET_COLORS: Record<AssetClassId, { stroke: string; badgeBg: string; dash?: string }> = {
  KINETIX_PROPERTY: {
    stroke: 'var(--chart-property)',
    badgeBg: 'var(--accent-soft)',
  },
  SP500_USD: {
    stroke: 'var(--chart-rent)',
    badgeBg: 'rgba(44, 94, 138, 0.11)',
  },
  SJC_GOLD: {
    stroke: 'var(--accent)',
    badgeBg: 'var(--status-reserved-bg)',
    dash: '6 3',
  },
  VN_BANK_DEPOSIT: {
    stroke: 'var(--chart-equity)',
    badgeBg: 'var(--status-available-bg)',
    dash: '3 3',
  },
};

function clampCapital(vnd: number): number {
  const rounded = Math.round(vnd / CAPITAL_STEP_VND) * CAPITAL_STEP_VND;
  return Math.min(CAPITAL_MAX_VND, Math.max(CAPITAL_MIN_VND, rounded));
}

const LAB_COPY = {
  vi: {
    eyebrow: 'BẢN ĐỒ LỢI SUẤT ĐÔ THỊ SÀI GÒN & SO SÁNH ĐA TÀI SẢN 10 NĂM',
    title: 'Trục Hạ Tầng Metro Line-1 · Cầu Thủ Thiêm 4 & Đối Chiếu Danh Mục Tài Sản',
    subtitle:
      'Phân tích bản đồ nhiệt 6 hành lang bất động sản hạng sang dọc Sông Sài Gòn, tuyến Metro số 1 và Cầu Thủ Thiêm 4, kết nối trực tiếp vào bộ mô phỏng tăng trưởng vốn 10 năm giữa BĐS đòn bẩy Kinetix, Tiền gửi ngân hàng, Vàng SJC và S&P 500 USD.',
    marketBadge: '6 HÀNH LANG HẠNG SANG · METRO L1 & CẦU THỦ THIÊM 4',
    mapTitle: 'Bản Đồ Nhiệt 6 Hành Lang Ven Sông & Hạ Tầng Trọng Điểm TP.HCM',
    mapHint: 'Chạm trực tiếp vào từng khu vực trên bản đồ hoặc thẻ bên dưới để đối chiếu đơn giá, lợi suất và tăng trưởng',
    metricYield: 'Lợi Suất Ròng',
    metricPrice: 'Đơn Giá / m²',
    metricAppreciation: 'Tăng Giá 5 Năm',
    legendRiver: 'Sông Sài Gòn',
    legendMetro: 'Tuyến Metro Line-1',
    legendBridge: 'Cầu Ba Son / Thủ Thiêm 4',
    kinetixHomeBadge: 'TRỤ SỞ THE KINETIX',
    priceSqmLabel: 'Đơn Giá Trung Bình / m² (VNĐ & USD)',
    grossVsNetLabel: 'Lợi Suất Cho Thuê Gộp vs Ròng',
    grossTag: 'Gộp (Gross)',
    netTag: 'Ròng (Net)',
    occupancyLabel: 'Tỷ Lệ Lấp Đầy',
    catalystLabel: 'Tăng Giá Hạ Tầng 5N',
    commuteLabel: 'Di Chuyển Vào Q.1',
    scarcityLabel: 'Độ Khan Hiếm Quỹ Đất',
    minUnit: 'phút',
    transitLabel: 'Kết Nối Metro / Cầu Huyết Mạch',
    catalystBriefLabel: 'Động Lực Tăng Giá Hạ Tầng 2026–2031',
    benchmarkEyebrow: 'SO SÁNH HIỆU QUẢ ĐẦU TƯ 4 LỚP TÀI SẢN TRONG 10 NĂM',
    benchmarkTitle: 'Đặt Cùng Một Khoản Vốn Tự Có (5 – 30 Tỷ VNĐ) Vào 4 Kênh Đầu Tư',
    benchmarkSubtitle:
      'So sánh sức mạnh lãi kép 10 năm khi triển khai vốn trả trước của nhà đầu tư vào Dinh thự Kinetix (70% LTV + dòng tiền thuê ròng) so với Tiền gửi Ngân hàng VN (5.8%/năm), Vàng SJC (8.5%/năm) và Chỉ số S&P 500 USD (9.5%/năm + phòng hộ tỷ giá VND).',
    syncedDistrictPrefix: 'Đồng bộ tăng giá & lợi suất thuê theo hành lang:',
    capitalSliderLabel: 'Vốn Tự Có Triển Khai (Down Payment)',
    syncSimBtn: 'Lấy Từ Mô Phỏng Vay',
    impliedAssetLabel: 'Giá Trị Tài Sản Kiểm Soát (70% LTV)',
    fxHedgeLabel: 'Phòng hộ tỷ giá USD/VND (+2.2%/năm)',
    chartTitle: 'Quỹ Đạo Tăng Trưởng Tài Sản Ròng 10 Năm (Năm 0 – Năm 10)',
    chartHint: 'Di chuột hoặc chọn từng năm 1–10 để kiểm tra giá trị tài sản ròng thực nhận sau thuế & nợ vay',
    yearPrefix: 'Năm',
    alphaVsBank: 'Vượt Tiền Gửi NH',
    alphaVsGold: 'Vượt Vàng SJC',
    alphaVsSp500: 'Chênh Lệch vs S&P 500',
    colAsset: 'Lớp Tài Sản',
    colYear10: 'Tài Sản Năm 10',
    colProfit: 'Lợi Nhuận Ròng 10N',
    colMultiple: 'Bội Số (MOIC)',
    colIrr: 'Net IRR / Năm',
    colVol: 'Biến Động (σ)',
    colSharpe: 'Sharpe Ratio',
    winnerBadge: 'DẪN ĐẦU ALPHA',
    methodologyNote:
      'Sharpe Ratio tính theo công thức tổ chức (Net IRR − Rf) / σ với lãi suất phi rủi ro Rf = 5.8% (tiền gửi kỳ hạn VN). Kinetix Sky-Residence đã trừ phí quản lý, 0.8 tháng trống/năm, 10% thuế thuê chuẩn VN và 2% thuế TNCN chuyển nhượng tại năm thoái vốn.',
  },
  en: {
    eyebrow: 'SAIGON URBAN YIELD CARTOGRAPHY & 10-YEAR MULTI-ASSET BENCHMARK',
    title: 'Metro Line-1 & Bridge-4 Appreciation Map + Wealth Benchmark',
    subtitle:
      'Inspect calibrated yield, pricing, and transit catalysts across Ho Chi Minh City’s six premier residential corridors, coupled live to a 10-year capital comparator pitting 70% LTV Kinetix Sky-Residences against VN Bank Deposits, SJC Gold, and S&P 500 USD.',
    marketBadge: '6 LUXURY CORRIDORS · METRO L1 & BRIDGE-4',
    mapTitle: 'Ho Chi Minh City Luxury Corridor Heatmap & Transit Spine',
    mapHint: 'Click any corridor polygon on the cartographic plate or quick-selector below to inspect pricing, yields, and catalysts',
    metricYield: 'Net Rental Yield',
    metricPrice: 'Price / m²',
    metricAppreciation: '5Y Catalyst CAGR',
    legendRiver: 'Saigon River',
    legendMetro: 'Metro Line-1',
    legendBridge: 'Ba Son / Bridge-4',
    kinetixHomeBadge: 'THE KINETIX HOME',
    priceSqmLabel: 'Calibrated Price / m² (VND & USD)',
    grossVsNetLabel: 'Gross vs Net Rental Yield Spread',
    grossTag: 'Gross Yield',
    netTag: 'Net Yield',
    occupancyLabel: 'Occupancy Rate',
    catalystLabel: '5Y Infra Catalyst',
    commuteLabel: 'CBD Commute',
    scarcityLabel: 'Supply Scarcity',
    minUnit: 'min',
    transitLabel: 'Nearest Metro Line-1 / Bridge Link',
    catalystBriefLabel: '2026–2031 Infrastructure Appreciation Drivers',
    benchmarkEyebrow: '10-YEAR MULTI-ASSET WEALTH BENCHMARK COMPARATOR',
    benchmarkTitle: 'Deploy Your Exact Down Payment Capital (5B – 30B VND) Across 4 Asset Classes',
    benchmarkSubtitle:
      'Compares 10-year net realizable wealth deploying identical equity into a 70% LTV Kinetix Sky-Residence (incl. net rental cashflow & 2% exit tax) versus Vietnam Bank Term Deposits (5.8%/yr), SJC Physical Gold (8.5%/yr), and S&P 500 USD Index (9.5%/yr + VND FX hedge).',
    syncedDistrictPrefix: 'Live-calibrated to selected corridor:',
    capitalSliderLabel: 'Down Payment Equity Deployed',
    syncSimBtn: 'Sync Mortgage Equity',
    impliedAssetLabel: 'Implied 70% LTV Asset Controlled',
    fxHedgeLabel: 'VND/USD FX Hedge (+2.2%/yr)',
    chartTitle: '10-Year Multi-Curve Net Wealth Trajectory (Years 0 – 10)',
    chartHint: 'Hover or click any year 1–10 to inspect exact post-debt, post-tax wealth across all four asset classes',
    yearPrefix: 'Year',
    alphaVsBank: 'Alpha vs Bank Deposit',
    alphaVsGold: 'Alpha vs SJC Gold',
    alphaVsSp500: 'Spread vs S&P 500',
    colAsset: 'Asset Class',
    colYear10: 'Year-10 Wealth',
    colProfit: '10Y Net Profit',
    colMultiple: 'MOIC',
    colIrr: 'Net IRR',
    colVol: 'Volatility (σ)',
    colSharpe: 'Sharpe Ratio',
    winnerBadge: '#1 ALPHA LEADER',
    methodologyNote:
      'Sharpe Ratio uses institutional excess return (Net IRR − Rf) / σ with Vietnam Term Deposit (Rf = 5.8%) as risk-free baseline. Kinetix Sky-Residence deducts tower service fees, 0.8-month annual vacancy, 10% Vietnam statutory rental tax, and 2% resale transfer tax.',
  },
} as const;

export const SaigonYieldMapLab: React.FC<SaigonYieldMapLabProps> = ({
  currency,
  lang,
  simulatorDownPaymentVnd,
  simulatorInterestRatePct,
  simulatorLoanTermYears,
}) => {
  const copy = LAB_COPY[lang];
  const [selectedDistrictId, setSelectedDistrictId] = useState<SaigonDistrictId>('thu-thiem');
  const [heatMetric, setHeatMetric] = useState<CorridorHeatMetric>('APPRECIATION');
  const [capitalVnd, setCapitalVnd] = useState<number>(() =>
    clampCapital(simulatorDownPaymentVnd || 15_000_000_000)
  );
  const [includeFxHedge, setIncludeFxHedge] = useState<boolean>(true);
  const [inspectedYear, setInspectedYear] = useState<number>(10);

  const selectedDistrict = useMemo(
    () => getDistrictById(selectedDistrictId),
    [selectedDistrictId]
  );

  const marketSummary = useMemo(() => summarizeSaigonMarket(), []);

  const benchmark = useMemo(
    () =>
      computeAssetBenchmark({
        initialCapitalVnd: capitalVnd,
        horizonYears: BENCHMARK_DEFAULTS.horizonYears,
        ltvPct: BENCHMARK_DEFAULTS.ltvPct,
        mortgageInterestRatePct: simulatorInterestRatePct,
        loanTermYears: simulatorLoanTermYears,
        propertyAppreciationPct: selectedDistrict.fiveYearAppreciationCagrPct,
        propertyGrossYieldPct: selectedDistrict.grossRentalYieldPct,
        bankDepositRatePct: BENCHMARK_DEFAULTS.bankDepositRatePct,
        goldAnnualReturnPct: BENCHMARK_DEFAULTS.goldAnnualReturnPct,
        sp500UsdReturnPct: BENCHMARK_DEFAULTS.sp500UsdReturnPct,
        vndDepreciationPct: BENCHMARK_DEFAULTS.vndDepreciationPct,
        includeFxHedge,
      }),
    [
      capitalVnd,
      simulatorInterestRatePct,
      simulatorLoanTermYears,
      selectedDistrict,
      includeFxHedge,
    ]
  );

  const activeYearPoint =
    benchmark.trajectory.find((pt) => pt.year === inspectedYear) ??
    benchmark.trajectory[benchmark.trajectory.length - 1];

  // Helper to format corridor metric badge on the SVG map
  const formatDistrictMetricBadge = (d: (typeof SAIGON_DISTRICTS)[number]) => {
    if (heatMetric === 'YIELD') return `${d.netRentalYieldPct.toFixed(1)}% net`;
    if (heatMetric === 'PRICE') {
      return currency === 'USD'
        ? `$${d.pricePerSqmUsd.toLocaleString('en-US')}/m²`
        : `${Math.round(d.pricePerSqmVnd / 1_000_000)}M/m²`;
    }
    return `+${d.fiveYearAppreciationCagrPct.toFixed(1)}%/yr`;
  };

  // Architectural muted choropleth fill tone matching Daylight Ivory & Midnight Navy
  const getChoroplethFill = (d: (typeof SAIGON_DISTRICTS)[number], isSelected: boolean) => {
    const intensity = computeDistrictHeatIntensity(d, heatMetric);
    if (heatMetric === 'YIELD') {
      const alpha = isSelected ? 0.34 : Number((0.08 + intensity * 0.2).toFixed(2));
      return `rgba(21, 115, 86, ${alpha})`;
    }
    if (heatMetric === 'PRICE') {
      const alpha = isSelected ? 0.30 : Number((0.07 + intensity * 0.19).toFixed(2));
      return `rgba(15, 29, 54, ${alpha})`;
    }
    const alpha = isSelected ? 0.36 : Number((0.09 + intensity * 0.22).toFixed(2));
    return `rgba(180, 138, 62, ${alpha})`;
  };

  // SVG 10-Year Multi-Curve Chart Geometry
  const cW = 680;
  const cH = 276;
  const padL = 62;
  const padR = 20;
  const padT = 18;
  const padB = 30;
  const innerW = cW - padL - padR;
  const innerH = cH - padT - padB;

  const maxWealth = Math.max(
    capitalVnd * 1.5,
    ...benchmark.trajectory.flatMap((p) => [
      p.kinetixPropertyVnd,
      p.vnBankDepositVnd,
      p.sjcGoldVnd,
      p.sp500UsdVnd,
    ])
  );
  // Round ceiling up slightly for visual breathing room
  const yCeiling = maxWealth * 1.08;

  const xForYear = (yr: number) => padL + (yr / benchmark.horizonYears) * innerW;
  const yForWealth = (val: number) => padT + innerH - (Math.max(0, val) / yCeiling) * innerH;

  const buildPath = (selector: (pt: (typeof benchmark.trajectory)[number]) => number) =>
    benchmark.trajectory
      .map(
        (pt, idx) =>
          `${idx === 0 ? 'M' : 'L'} ${xForYear(pt.year).toFixed(1)} ${yForWealth(selector(pt)).toFixed(1)}`
      )
      .join(' ');

  const propPath = buildPath((p) => p.kinetixPropertyVnd);
  const propAreaPath = `${propPath} L ${xForYear(benchmark.horizonYears).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xForYear(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
  const sp500Path = buildPath((p) => p.sp500UsdVnd);
  const goldPath = buildPath((p) => p.sjcGoldVnd);
  const bankPath = buildPath((p) => p.vnBankDepositVnd);

  const clampedSimDownPayment = clampCapital(simulatorDownPaymentVnd);

  return (
    <section
      id="saigon-market"
      data-testid="saigon-yield-map-lab"
      className="no-print border-t py-16 lg:py-22"
      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial Chapter 03 Header */}
        <div
          className="mb-10 flex flex-col justify-between gap-5 border-b pb-7 lg:flex-row lg:items-end"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                03
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
            <MapPinIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
            <span className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.14em]" style={{ color: 'var(--text-heading)' }}>
              {copy.marketBadge}
            </span>
          </div>
        </div>

        {/* PART A: Saigon Luxury Corridor Cartographic SVG Map + District Telemetry Dossier */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start">
          {/* Left 7 Columns: Cartographic SVG Plate */}
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
            {/* Map Title + Heatmap Metric Selector */}
            <div
              className="mb-4 flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {copy.mapTitle}
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {copy.mapHint}
                </p>
              </div>

              <div
                className="inline-flex shrink-0 rounded-sm border p-0.5"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
                role="group"
                aria-label="Heatmap metric"
              >
                {(
                  [
                    { id: 'APPRECIATION', label: copy.metricAppreciation },
                    { id: 'YIELD', label: copy.metricYield },
                    { id: 'PRICE', label: copy.metricPrice },
                  ] as const
                ).map((item) => {
                  const active = heatMetric === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`heatmap-layer-${item.id.toLowerCase()}`}
                      onClick={() => setHeatMetric(item.id)}
                      className="cursor-pointer rounded-sm px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.06em] transition-colors"
                      style={{
                        backgroundColor: active ? 'var(--cta-bg)' : 'transparent',
                        color: active ? 'var(--cta-ink)' : 'var(--text-secondary)',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive SVG Cartographic Plate */}
            <div
              className="architectural-grid relative overflow-hidden border"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--blueprint-bg)',
              }}
            >
              <svg
                viewBox="0 0 700 440"
                className="h-auto w-full select-none"
                role="img"
                aria-label={copy.mapTitle}
              >
                <defs>
                  <linearGradient id="saigonRiverGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2C5E8A" stopOpacity="0.48" />
                    <stop offset="50%" stopColor="#2C5E8A" stopOpacity="0.62" />
                    <stop offset="100%" stopColor="#2C5E8A" stopOpacity="0.45" />
                  </linearGradient>
                </defs>

                {/* Architectural Lat/Lng Subtle Frame Ticks */}
                <text
                  x="16"
                  y="24"
                  fill="var(--text-muted)"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="1.2"
                >
                  HCMC · 10.77°N 106.72°E
                </text>

                {/* Mini Architectural North Rose (top-left) */}
                <g transform="translate(40, 56)" opacity="0.72">
                  <circle cx="0" cy="0" r="14" fill="none" stroke="var(--blueprint-wall)" strokeWidth="0.9" strokeOpacity="0.4" />
                  <polygon points="0,-12 3.5,2 0,-1 -3.5,2" fill="var(--accent)" />
                  <polygon points="0,12 3.5,-2 0,1 -3.5,-2" fill="var(--blueprint-wall)" fillOpacity="0.35" />
                  <text x="0" y="-16" textAnchor="middle" fill="var(--text-heading)" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    N
                  </text>
                </g>

                {/* Saigon River Outer Riparian Shelf & Main Channel */}
                <path
                  d="M 355 8 C 388 48, 418 72, 448 84 C 468 92, 434 142, 390 162 C 346 182, 326 218, 322 258 C 318 298, 356 334, 438 352 C 514 368, 592 385, 686 420"
                  fill="none"
                  stroke="#2C5E8A"
                  strokeWidth="30"
                  strokeOpacity="0.16"
                  strokeLinecap="round"
                />
                <path
                  d="M 355 8 C 388 48, 418 72, 448 84 C 468 92, 434 142, 390 162 C 346 182, 326 218, 322 258 C 318 298, 356 334, 438 352 C 514 368, 592 385, 686 420"
                  fill="none"
                  stroke="url(#saigonRiverGrad)"
                  strokeWidth="17"
                  strokeLinecap="round"
                />
                <path
                  d="M 355 8 C 388 48, 418 72, 448 84 C 468 92, 434 142, 390 162 C 346 182, 326 218, 322 258 C 318 298, 356 334, 438 352 C 514 368, 592 385, 686 420"
                  fill="none"
                  stroke="#FAF8F4"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                  strokeDasharray="6 6"
                />

                {/* Secondary Kenh Te Canal separating D1/D4 from Phu My Hung (D7) */}
                <path
                  d="M 80 338 C 165 336, 265 338, 356 346"
                  fill="none"
                  stroke="#2C5E8A"
                  strokeWidth="7"
                  strokeOpacity="0.34"
                  strokeLinecap="round"
                />

                {/* Saigon River Cartographic Watermark */}
                <text
                  x="568"
                  y="366"
                  fill="#2C5E8A"
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="2"
                  transform="rotate(14, 568, 366)"
                >
                  SAIGON RIVER
                </text>

                {/* 6 Interactive Luxury Corridor Polygons (Base Choropleth Layer) */}
                {SAIGON_DISTRICTS.map((district) => {
                  const isSelected = district.id === selectedDistrictId;
                  return (
                    <g
                      key={district.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${lang === 'vi' ? district.nameVi : district.nameEn} - ${formatDistrictMetricBadge(district)}`}
                      data-testid={`district-map-${district.id}`}
                      onClick={() => setSelectedDistrictId(district.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDistrictId(district.id);
                        }
                      }}
                      className="cursor-pointer transition-opacity focus:outline-none"
                    >
                      <polygon
                        points={district.map.polygon}
                        fill={getChoroplethFill(district, isSelected)}
                        stroke={
                          isSelected
                            ? 'var(--cta-bg)'
                            : district.isKinetixHome
                              ? 'var(--accent)'
                              : 'var(--blueprint-wall)'
                        }
                        strokeWidth={isSelected ? '2.6' : district.isKinetixHome ? '1.8' : '1.15'}
                        strokeOpacity={isSelected ? 1 : 0.55}
                      />
                    </g>
                  );
                })}

                {/* Infrastructure Corridor 1: Metro Line-1 (Ben Thanh -> Opera -> Ba Son -> Tan Cang -> Thao Dien -> An Phu) */}
                <path
                  d="M 174 298 L 256 290 L 312 204 L 344 144 L 418 136 L 492 126 L 608 112 L 672 102"
                  fill="none"
                  stroke="#157356"
                  strokeWidth="2.8"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pointerEvents="none"
                />

                {/* Infrastructure Corridor 2: Ba Son Cable-Stayed Bridge (D1 <-> Thu Thiem) */}
                <line
                  x1="312"
                  y1="204"
                  x2="386"
                  y2="212"
                  stroke="#B48A3E"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  pointerEvents="none"
                />

                {/* Infrastructure Corridor 3: Thu Thiem Bridge-4 (Thu Thiem <-> District 7 / Phu My Hung) */}
                <line
                  x1="428"
                  y1="326"
                  x2="376"
                  y2="364"
                  stroke="#B48A3E"
                  strokeWidth="4.6"
                  strokeDasharray="5 3"
                  strokeLinecap="round"
                  pointerEvents="none"
                />

                {/* Transit Station Markers & Non-Overlapping Callouts */}
                {SAIGON_TRANSIT_STATIONS.map((st) => {
                  const isMetro = st.line === 'METRO_L1';
                  const calloutPos: Record<string, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = {
                    'st-benthanh': { dx: 0, dy: 13, anchor: 'middle' },
                    'st-thaodien': { dx: 10, dy: 14, anchor: 'start' },
                    'br-thuthiem4': { dx: 10, dy: 4, anchor: 'start' },
                    'br-bason': { dx: 0, dy: -9, anchor: 'middle' },
                  };
                  const pos = calloutPos[st.id];
                  return (
                    <g key={st.id} pointerEvents="none">
                      <circle
                        cx={st.x}
                        cy={st.y}
                        r={isMetro ? '3.8' : '4.5'}
                        fill={isMetro ? '#157356' : '#B48A3E'}
                        stroke="#FAF8F4"
                        strokeWidth="1.6"
                      />
                      {pos && (
                        <text
                          x={st.x + pos.dx}
                          y={st.y + pos.dy}
                          textAnchor={pos.anchor}
                          fill={isMetro ? '#157356' : '#96702D'}
                          stroke="var(--blueprint-bg)"
                          strokeWidth="3"
                          paintOrder="stroke"
                          fontSize="7.8"
                          fontWeight="700"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {lang === 'vi' ? st.nameVi : st.nameEn}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Crisp Cartographic District Labels (Top Layer with Vellum Halo) */}
                {SAIGON_DISTRICTS.map((district) => {
                  const isSelected = district.id === selectedDistrictId;
                  return (
                    <g key={`label-${district.id}`} pointerEvents="none">
                      <text
                        x={district.map.labelX}
                        y={district.map.labelY - 12}
                        textAnchor={district.map.anchor}
                        fill="var(--accent)"
                        stroke="var(--blueprint-bg)"
                        strokeWidth="3.2"
                        paintOrder="stroke"
                        fontSize="8.5"
                        fontWeight="700"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {district.code}
                        {district.isKinetixHome ? ' · KINETIX' : ''}
                      </text>
                      <text
                        x={district.map.labelX}
                        y={district.map.labelY + 2}
                        textAnchor={district.map.anchor}
                        fill="var(--text-heading)"
                        stroke="var(--blueprint-bg)"
                        strokeWidth="3.5"
                        paintOrder="stroke"
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {lang === 'vi' ? district.nameVi : district.nameEn}
                      </text>
                      <text
                        x={district.map.labelX}
                        y={district.map.labelY + 17}
                        textAnchor={district.map.anchor}
                        fill={isSelected ? 'var(--text-heading)' : 'var(--text-secondary)'}
                        stroke="var(--blueprint-bg)"
                        strokeWidth="3.2"
                        paintOrder="stroke"
                        fontSize="9.5"
                        fontWeight="600"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {formatDistrictMetricBadge(district)}
                      </text>
                    </g>
                  );
                })}

                {/* Architectural Scale Bar (bottom-left) */}
                <g transform="translate(18, 412)">
                  <line x1="0" y1="0" x2="72" y2="0" stroke="var(--text-heading)" strokeWidth="1.4" />
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--text-heading)" strokeWidth="1.4" />
                  <line x1="36" y1="-3" x2="36" y2="3" stroke="var(--text-heading)" strokeWidth="1.1" />
                  <line x1="72" y1="-4" x2="72" y2="4" stroke="var(--text-heading)" strokeWidth="1.4" />
                  <text x="0" y="14" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono, monospace">
                    0
                  </text>
                  <text x="36" y="14" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono, monospace">
                    2 km
                  </text>
                  <text x="72" y="14" textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="JetBrains Mono, monospace">
                    4 km
                  </text>
                </g>
              </svg>
            </div>

            {/* Cartographic Legend Strip */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-4 rounded-xs" style={{ backgroundColor: 'rgba(44, 94, 138, 0.58)' }} />
                  {copy.legendRiver}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: '#157356' }} />
                  {copy.legendMetro}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-4 rounded-xs" style={{ backgroundColor: '#B48A3E' }} />
                  {copy.legendBridge}
                </span>
              </div>
              <span className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
                AVG NET YIELD {marketSummary.averageNetYieldPct.toFixed(2)}% · AVG 5Y +{marketSummary.averageAppreciationPct.toFixed(1)}%/YR
              </span>
            </div>

            {/* 6 Accessible Corridor Quick-Selector Pills */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SAIGON_DISTRICTS.map((district) => {
                const active = district.id === selectedDistrictId;
                return (
                  <button
                    key={district.id}
                    type="button"
                    data-testid={`district-btn-${district.id}`}
                    onClick={() => setSelectedDistrictId(district.id)}
                    className="cursor-pointer rounded-sm border px-3 py-2.5 text-left transition-all"
                    style={{
                      borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                      backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-primary)',
                      color: active ? 'var(--cta-ink)' : 'var(--text-primary)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="font-mono-tabular text-[9.5px] font-semibold tracking-[0.12em]"
                        style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
                      >
                        {district.code}
                      </span>
                      <span
                        className="font-mono-tabular text-[10px] font-semibold"
                        style={{ color: active ? 'var(--cta-ink)' : 'var(--accent)' }}
                      >
                        {formatDistrictMetricBadge(district)}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs font-semibold">
                      {lang === 'vi' ? district.nameVi : district.nameEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 5 Columns: Selected Corridor Telemetry Dossier */}
          <div
            className="min-w-0 border-t-2 border-r border-b border-l p-5 sm:p-6 lg:col-span-5"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderTopColor: 'var(--accent)',
              borderRightColor: 'var(--border-subtle)',
              borderBottomColor: 'var(--border-subtle)',
              borderLeftColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Dossier Header */}
            <div className="border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: 'var(--accent)' }}
                >
                  {selectedDistrict.code} · CORRIDOR INTELLIGENCE
                </span>
                {selectedDistrict.isKinetixHome && (
                  <span
                    className="font-mono-tabular rounded-sm border px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.14em]"
                    style={{
                      borderColor: 'var(--border-strong)',
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    {copy.kinetixHomeBadge}
                  </span>
                )}
              </div>
              <h3
                data-testid="district-inspector-name"
                className="font-display mt-2 text-2xl font-semibold sm:text-3xl"
                style={{ color: 'var(--text-heading)' }}
              >
                {lang === 'vi' ? selectedDistrict.nameVi : selectedDistrict.nameEn}
              </h3>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'vi' ? selectedDistrict.zoneTagVi : selectedDistrict.zoneTagEn}
              </p>
            </div>

            {/* Dual-Currency Price/m² Block (VND & USD simultaneously) */}
            <div
              className="mt-4 border p-4"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
            >
              <div className="text-[10.5px] font-medium tracking-[0.06em] uppercase" style={{ color: 'var(--text-muted)' }}>
                {copy.priceSqmLabel}
              </div>
              <div
                data-testid="district-inspector-price"
                className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2"
              >
                <span className="font-mono-tabular text-2xl font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {(selectedDistrict.pricePerSqmVnd / 1_000_000).toFixed(0)}{' '}
                  {lang === 'vi' ? 'tr VNĐ/m²' : 'M VND/m²'}
                </span>
                <span
                  className="font-mono-tabular rounded-sm border px-2.5 py-0.5 text-sm font-semibold"
                  style={{
                    borderColor: 'var(--border-strong)',
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  ${selectedDistrict.pricePerSqmUsd.toLocaleString('en-US')}/m²
                </span>
              </div>
            </div>

            {/* Gross vs Net Rental Yield Bar Comparison */}
            <div
              className="mt-4 border p-4"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {copy.grossVsNetLabel}
                </span>
                <span
                  data-testid="district-inspector-yield"
                  className="font-mono-tabular text-xs font-semibold"
                  style={{ color: 'var(--status-available)' }}
                >
                  {selectedDistrict.grossRentalYieldPct.toFixed(1)}% / {selectedDistrict.netRentalYieldPct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div>
                  <div className="mb-1 flex justify-between text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                    <span>{copy.grossTag}</span>
                    <span className="font-mono-tabular font-semibold" style={{ color: 'var(--text-heading)' }}>
                      {selectedDistrict.grossRentalYieldPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-xs" style={{ backgroundColor: 'var(--track-bg)' }}>
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (selectedDistrict.grossRentalYieldPct / 8.5) * 100)}%`,
                        backgroundColor: 'var(--cta-bg)',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                    <span>{copy.netTag}</span>
                    <span className="font-mono-tabular font-semibold" style={{ color: 'var(--status-available)' }}>
                      {selectedDistrict.netRentalYieldPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-xs" style={{ backgroundColor: 'var(--track-bg)' }}>
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (selectedDistrict.netRentalYieldPct / 8.5) * 100)}%`,
                        backgroundColor: 'var(--status-available)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Key Corridor KPI Tiles */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.occupancyLabel}
                </div>
                <div
                  data-testid="district-inspector-occupancy"
                  className="font-mono-tabular mt-1 text-xl font-semibold"
                  style={{ color: 'var(--text-heading)' }}
                >
                  {selectedDistrict.occupancyPct.toFixed(1)}%
                </div>
              </div>

              <div
                className="border p-3.5"
                style={{
                  borderColor: 'var(--border-strong)',
                  backgroundColor: 'var(--accent-soft)',
                }}
              >
                <div className="text-[10.5px]" style={{ color: 'var(--text-secondary)' }}>
                  {copy.catalystLabel}
                </div>
                <div
                  data-testid="district-inspector-catalyst"
                  className="font-mono-tabular mt-1 text-xl font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  +{selectedDistrict.fiveYearAppreciationCagrPct.toFixed(1)}%/yr
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.commuteLabel}
                </div>
                <div
                  data-testid="district-inspector-commute"
                  className="font-mono-tabular mt-1 text-xl font-semibold"
                  style={{ color: 'var(--text-heading)' }}
                >
                  {selectedDistrict.commuteToCbdMin} {copy.minUnit}
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.scarcityLabel}
                </div>
                <div className="font-mono-tabular mt-1 text-xl font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {selectedDistrict.supplyScarcityScore}/100
                </div>
              </div>
            </div>

            {/* Transit & Infrastructure Catalyst Brief */}
            <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-start gap-2.5">
                <TransitIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--status-available)' }} />
                <div>
                  <div className="text-[10.5px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    {copy.transitLabel}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                    {lang === 'vi'
                      ? selectedDistrict.nearestMetroStationVi
                      : selectedDistrict.nearestMetroStationEn}{' '}
                    <span className="font-mono-tabular" style={{ color: 'var(--accent)' }}>
                      ({selectedDistrict.metroTransitMin} {copy.minUnit})
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5">
                <div className="text-[10.5px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--text-muted)' }}>
                  {copy.catalystBriefLabel}
                </div>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {lang === 'vi'
                    ? selectedDistrict.catalystHeadlineVi
                    : selectedDistrict.catalystHeadlineEn}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {(lang === 'vi' ? selectedDistrict.catalystTagsVi : selectedDistrict.catalystTagsEn).map(
                    (tag) => (
                      <span
                        key={tag}
                        className="font-mono-tabular rounded-sm border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PART B: 10-Year Multi-Asset Wealth Benchmark Comparator */}
        <div
          id="wealth-benchmark"
          data-testid="asset-benchmark-comparator"
          className="mt-10 border-t-2 border-r border-b border-l p-5 sm:p-7"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderTopColor: 'var(--accent)',
            borderRightColor: 'var(--border-subtle)',
            borderBottomColor: 'var(--border-subtle)',
            borderLeftColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Comparator Header */}
          <div
            className="flex flex-col justify-between gap-4 border-b pb-5 lg:flex-row lg:items-end"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <ChartLineIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <span
                  className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.2em] uppercase"
                  style={{ color: 'var(--accent)' }}
                >
                  {copy.benchmarkEyebrow}
                </span>
              </div>
              <h3
                className="font-display mt-2 text-2xl font-semibold sm:text-3xl"
                style={{ color: 'var(--text-heading)' }}
              >
                {copy.benchmarkTitle}
              </h3>
              <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                {copy.benchmarkSubtitle}
              </p>
            </div>

            <div
              className="inline-flex self-start items-center gap-2 border px-3 py-2 text-xs lg:self-end"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--bg-primary)',
              }}
            >
              <CompassIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{copy.syncedDistrictPrefix}</span>
              <span className="font-mono-tabular font-semibold" style={{ color: 'var(--text-heading)' }}>
                {lang === 'vi' ? selectedDistrict.nameVi : selectedDistrict.nameEn} (+
                {selectedDistrict.fiveYearAppreciationCagrPct.toFixed(1)}%/yr)
              </span>
            </div>
          </div>

          {/* Capital Slider & Institutional Control Strip */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-center">
            <div
              className="border p-4 lg:col-span-7"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label
                  htmlFor="benchmark-capital-range"
                  className="text-xs font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {copy.capitalSliderLabel}
                </label>
                <span
                  data-testid="benchmark-capital-readout"
                  className="font-mono-tabular text-xl font-semibold"
                  style={{ color: 'var(--text-heading)' }}
                >
                  {formatCurrency(capitalVnd, currency, lang, { compact: true })}
                </span>
              </div>

              <input
                id="benchmark-capital-range"
                data-testid="benchmark-capital-slider"
                type="range"
                min={CAPITAL_MIN_VND}
                max={CAPITAL_MAX_VND}
                step={CAPITAL_STEP_VND}
                value={capitalVnd}
                onChange={(e) => setCapitalVnd(Number(e.target.value))}
                className="kinetix-slider mt-3"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {CAPITAL_PRESETS.map((preset) => {
                    const active = capitalVnd === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        data-testid={`capital-preset-${preset / 1_000_000_000}b`}
                        onClick={() => setCapitalVnd(preset)}
                        className="font-mono-tabular cursor-pointer rounded-sm border px-2.5 py-1 text-[10.5px] font-semibold transition-colors"
                        style={{
                          borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-secondary)',
                          color: active ? 'var(--cta-ink)' : 'var(--text-secondary)',
                        }}
                      >
                        {preset / 1_000_000_000}
                        {lang === 'vi' ? ' Tỷ' : 'B'}
                      </button>
                    );
                  })}
                </div>

                {clampedSimDownPayment !== capitalVnd && (
                  <button
                    type="button"
                    onClick={() => setCapitalVnd(clampedSimDownPayment)}
                    className="font-mono-tabular cursor-pointer rounded-sm border px-2.5 py-1 text-[10px] font-semibold transition-colors"
                    style={{
                      borderColor: 'var(--border-strong)',
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    {copy.syncSimBtn} ({formatCurrency(clampedSimDownPayment, currency, lang, { compact: true })})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-5">
              <div
                className="border p-4"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.impliedAssetLabel}
                </div>
                <div
                  data-testid="benchmark-implied-property"
                  className="font-mono-tabular mt-1 text-lg font-semibold"
                  style={{ color: 'var(--text-heading)' }}
                >
                  {formatCurrency(benchmark.impliedPropertyValueVnd, currency, lang, { compact: true })}
                </div>
                <div className="font-mono-tabular mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Vay NH' : 'Loan'}{' '}
                  {formatCurrency(benchmark.impliedLoanPrincipalVnd, currency, lang, { compact: true })} ·{' '}
                  {simulatorInterestRatePct.toFixed(1)}% / {simulatorLoanTermYears}
                  {lang === 'vi' ? 'N' : 'Y'}
                </div>
              </div>

              <div
                className="flex flex-col justify-between border p-4"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'vi' ? 'Lợi Suất Quy Đổi S&P 500 (VNĐ)' : 'S&P 500 VND Effective Return'}
                </div>
                <div className="font-mono-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--chart-rent)' }}>
                  {benchmark.effectiveSp500VndReturnPct.toFixed(2)}%/yr
                </div>
                <label className="mt-1.5 inline-flex cursor-pointer items-center gap-2 text-[10.5px]" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    data-testid="benchmark-fx-toggle"
                    checked={includeFxHedge}
                    onChange={(e) => setIncludeFxHedge(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#0F1D36]"
                  />
                  <span>{copy.fxHedgeLabel}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Interactive 10-Year Multi-Curve SVG Trajectory Chart */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            <div className="min-w-0 lg:col-span-8">
              <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h4 className="font-display text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                    {copy.chartTitle}
                  </h4>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.chartHint}
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {benchmark.assets.map((asset) => {
                  const styleCfg = ASSET_COLORS[asset.id];
                  return (
                    <span key={asset.id} className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-0.5 w-4"
                        style={{
                          backgroundColor: styleCfg.dash ? 'transparent' : styleCfg.stroke,
                          borderTop: styleCfg.dash ? `2px dashed ${styleCfg.stroke}` : undefined,
                        }}
                      />
                      <span>{lang === 'vi' ? asset.labelVi : asset.labelEn}</span>
                    </span>
                  );
                })}
              </div>

              <div
                className="border p-2.5 sm:p-3.5"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
              >
                <svg
                  viewBox={`0 0 ${cW} ${cH}`}
                  className="h-auto w-full select-none"
                  role="img"
                  aria-label={copy.chartTitle}
                >
                  <defs>
                    <linearGradient id="kinetixWealthArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F1D36" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#0F1D36" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis horizontal gridlines & labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                    const val = yCeiling * frac;
                    const y = yForWealth(val);
                    return (
                      <g key={frac}>
                        <line
                          x1={padL}
                          y1={y}
                          x2={cW - padR}
                          y2={y}
                          stroke="var(--border-subtle)"
                          strokeDasharray={frac === 0 ? undefined : '3 4'}
                        />
                        <text
                          x={padL - 8}
                          y={y + 3}
                          textAnchor="end"
                          fill="var(--text-muted)"
                          fontSize="8.5"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {formatCurrency(val, currency, lang, { compact: true })}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area under Leveraged Property Curve */}
                  <path d={propAreaPath} fill="url(#kinetixWealthArea)" />

                  {/* 4 Multi-Asset Wealth Curves */}
                  <path
                    data-testid="benchmark-curve-bank"
                    d={bankPath}
                    fill="none"
                    stroke={ASSET_COLORS.VN_BANK_DEPOSIT.stroke}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                  <path
                    data-testid="benchmark-curve-gold"
                    d={goldPath}
                    fill="none"
                    stroke={ASSET_COLORS.SJC_GOLD.stroke}
                    strokeWidth="2.2"
                    strokeDasharray="6 3"
                  />
                  <path
                    data-testid="benchmark-curve-sp500"
                    d={sp500Path}
                    fill="none"
                    stroke={ASSET_COLORS.SP500_USD.stroke}
                    strokeWidth="2.3"
                  />
                  <path
                    data-testid="benchmark-curve-property"
                    d={propPath}
                    fill="none"
                    stroke={ASSET_COLORS.KINETIX_PROPERTY.stroke}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Active Inspected Year Vertical Crosshair & 4 Nodes */}
                  <line
                    x1={xForYear(inspectedYear)}
                    y1={padT}
                    x2={xForYear(inspectedYear)}
                    y2={padT + innerH}
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                  {[
                    { val: activeYearPoint.kinetixPropertyVnd, color: ASSET_COLORS.KINETIX_PROPERTY.stroke, r: 5 },
                    { val: activeYearPoint.sp500UsdVnd, color: ASSET_COLORS.SP500_USD.stroke, r: 4.2 },
                    { val: activeYearPoint.sjcGoldVnd, color: ASSET_COLORS.SJC_GOLD.stroke, r: 4.2 },
                    { val: activeYearPoint.vnBankDepositVnd, color: ASSET_COLORS.VN_BANK_DEPOSIT.stroke, r: 4 },
                  ].map((dot, idx) => (
                    <circle
                      key={idx}
                      cx={xForYear(inspectedYear)}
                      cy={yForWealth(dot.val)}
                      r={dot.r}
                      fill={dot.color}
                      stroke="var(--bg-secondary)"
                      strokeWidth="2"
                    />
                  ))}

                  {/* Invisible Interactive Hover/Click Columns for Years 1..10 */}
                  {benchmark.trajectory.slice(1).map((pt) => {
                    const colW = innerW / benchmark.horizonYears;
                    return (
                      <rect
                        key={pt.year}
                        x={xForYear(pt.year) - colW / 2}
                        y={padT}
                        width={colW}
                        height={innerH}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setInspectedYear(pt.year)}
                        onClick={() => setInspectedYear(pt.year)}
                      />
                    );
                  })}

                  {/* X-axis Year Labels (Y0 .. Y10) */}
                  {benchmark.trajectory.map((pt) => (
                    <text
                      key={pt.year}
                      x={xForYear(pt.year)}
                      y={cH - 8}
                      textAnchor="middle"
                      fill={pt.year === inspectedYear ? 'var(--text-heading)' : 'var(--text-muted)'}
                      fontSize="9"
                      fontWeight={pt.year === inspectedYear ? '700' : '500'}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      Y{pt.year}
                    </text>
                  ))}
                </svg>

                {/* Accessible Year 1..10 Inspection Selector Strip */}
                <div className="mt-3 flex flex-wrap items-center gap-1 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-mono-tabular mr-1.5 text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                    {copy.yearPrefix}:
                  </span>
                  {Array.from({ length: benchmark.horizonYears }, (_, i) => i + 1).map((yr) => {
                    const active = inspectedYear === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        data-testid={`benchmark-year-btn-${yr}`}
                        onClick={() => setInspectedYear(yr)}
                        className="font-mono-tabular cursor-pointer rounded-sm border px-2 py-0.5 text-[10.5px] font-semibold transition-colors"
                        style={{
                          borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-secondary)',
                          color: active ? 'var(--cta-ink)' : 'var(--text-secondary)',
                        }}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Live Year-N Inspector & Alpha Summary */}
            <div className="min-w-0 space-y-3 lg:col-span-4">
              <div
                data-testid="benchmark-year-inspector"
                className="border p-4"
                style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-mono-tabular text-xs font-semibold uppercase" style={{ color: 'var(--accent)' }}>
                    {copy.yearPrefix} {inspectedYear} {lang === 'vi' ? '· ĐỐI CHIẾU' : 'SNAPSHOT'}
                  </span>
                  <span className="font-mono-tabular text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'vi' ? 'VỐN ' : ''}
                    {formatCurrency(capitalVnd, currency, lang, { compact: true })}
                    {lang === 'en' ? ' IN' : ''}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {[
                    {
                      id: 'KINETIX_PROPERTY' as AssetClassId,
                      label: lang === 'vi' ? 'Kinetix 70% LTV' : 'Kinetix 70% LTV',
                      val: activeYearPoint.kinetixPropertyVnd,
                    },
                    {
                      id: 'SP500_USD' as AssetClassId,
                      label: 'S&P 500 USD (+FX)',
                      val: activeYearPoint.sp500UsdVnd,
                    },
                    {
                      id: 'SJC_GOLD' as AssetClassId,
                      label: lang === 'vi' ? 'Vàng SJC' : 'SJC Gold',
                      val: activeYearPoint.sjcGoldVnd,
                    },
                    {
                      id: 'VN_BANK_DEPOSIT' as AssetClassId,
                      label: lang === 'vi' ? 'Tiền Gửi NH 5.8%' : 'VN Bank 5.8%',
                      val: activeYearPoint.vnBankDepositVnd,
                    },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: ASSET_COLORS[item.id].stroke }}
                        />
                        {item.label}
                      </span>
                      <span className="font-mono-tabular font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(item.val, currency, lang, { compact: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 10-Year Alpha Spread Tiles */}
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { label: copy.alphaVsBank, delta: benchmark.propertyAlphaVsBankVnd },
                  { label: copy.alphaVsGold, delta: benchmark.propertyAlphaVsGoldVnd },
                  { label: copy.alphaVsSp500, delta: benchmark.propertyAlphaVsSp500Vnd },
                ].map((alpha) => (
                  <div
                    key={alpha.label}
                    className="flex items-center justify-between border px-3.5 py-2.5"
                    style={{
                      borderColor: alpha.delta >= 0 ? 'var(--status-available-border)' : 'var(--status-reserved-border)',
                      backgroundColor: alpha.delta >= 0 ? 'var(--status-available-bg)' : 'var(--status-reserved-bg)',
                    }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {alpha.label}
                    </span>
                    <span
                      className="font-mono-tabular text-xs font-semibold"
                      style={{
                        color: alpha.delta >= 0 ? 'var(--status-available)' : 'var(--status-reserved)',
                      }}
                    >
                      {formatCurrency(alpha.delta, currency, lang, { compact: true, signed: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exact Net IRR, Equity Multiple & Sharpe Ratio Institutional Table */}
          <div className="mt-6 overflow-x-auto border" style={{ borderColor: 'var(--border-subtle)' }}>
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="px-4 py-3 font-semibold tracking-[0.08em] uppercase">{copy.colAsset}</th>
                  <th className="px-3 py-3 text-right font-semibold tracking-[0.08em] uppercase">{copy.colYear10}</th>
                  <th className="px-3 py-3 text-right font-semibold tracking-[0.08em] uppercase">{copy.colProfit}</th>
                  <th className="px-3 py-3 text-right font-semibold tracking-[0.08em] uppercase">{copy.colMultiple}</th>
                  <th className="px-3 py-3 text-right font-semibold tracking-[0.08em] uppercase">{copy.colIrr}</th>
                  <th className="px-3 py-3 text-right font-semibold tracking-[0.08em] uppercase">{copy.colVol}</th>
                  <th className="px-4 py-3 text-right font-semibold tracking-[0.08em] uppercase">{copy.colSharpe}</th>
                </tr>
              </thead>
              <tbody>
                {benchmark.assets.map((asset) => {
                  const isWinner = asset.id === benchmark.winnerAssetId;
                  return (
                    <tr
                      key={asset.id}
                      data-testid={`benchmark-row-${asset.id.toLowerCase()}`}
                      className="editorial-table-row border-b last:border-b-0"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        backgroundColor: isWinner ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: ASSET_COLORS[asset.id].stroke }}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2 font-semibold" style={{ color: 'var(--text-heading)' }}>
                              <span>{lang === 'vi' ? asset.labelVi : asset.labelEn}</span>
                              {isWinner && (
                                <span
                                  className="font-mono-tabular rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em]"
                                  style={{
                                    borderColor: 'var(--border-strong)',
                                    backgroundColor: 'var(--cta-bg)',
                                    color: 'var(--cta-ink)',
                                  }}
                                >
                                  {copy.winnerBadge}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                              {lang === 'vi' ? asset.subtitleVi : asset.subtitleEn}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono-tabular px-3 py-3 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(asset.endingWealthVnd, currency, lang, { compact: true })}
                      </td>
                      <td
                        className="font-mono-tabular px-3 py-3 text-right font-semibold"
                        style={{ color: asset.totalNetProfitVnd >= 0 ? 'var(--status-available)' : 'var(--status-sold)' }}
                      >
                        {formatCurrency(asset.totalNetProfitVnd, currency, lang, { compact: true, signed: true })}
                      </td>
                      <td className="font-mono-tabular px-3 py-3 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {asset.equityMultiple.toFixed(2)}x
                      </td>
                      <td className="font-mono-tabular px-3 py-3 text-right font-semibold" style={{ color: 'var(--accent)' }}>
                        {asset.netIrrPct.toFixed(2)}%
                      </td>
                      <td className="font-mono-tabular px-3 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {asset.annualVolatilityPct.toFixed(1)}%
                      </td>
                      <td className="font-mono-tabular px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {asset.sharpeRatio.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {copy.methodologyNote}
          </p>
        </div>
      </div>
    </section>
  );
};
