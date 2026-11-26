import type { Language } from '../types/proptech';

export interface CopyBundle {
  nav: {
    tower: string;
    simulator: string;
    compare: string;
    schedule: string;
    themeDark: string;
    themeLight: string;
  };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    ctaExplorer: string;
    ctaSimulator: string;
    ctaViewing: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
    liveInventoryPrefix: string;
    liveInventorySuffix: string;
    coords: string;
  };
  explorer: {
    eyebrow: string;
    title: string;
    subtitle: string;
    towerElevationTitle: string;
    towerElevationHint: string;
    resetFloor: string;
    filterAll: string;
    tierLabels: Record<'ALL' | '1BR' | '2BR' | '3BR' | 'PENTHOUSE', string>;
    orientationLabels: Record<'ALL' | 'RIVER_PANORAMIC' | 'SUNSET_CBD' | 'BOTANICAL', string>;
    statusLabels: Record<'ALL' | 'AVAILABLE' | 'RESERVED' | 'SOLD', string>;
    sortLabels: Record<'PRICE_ASC' | 'PRICE_DESC' | 'FLOOR_DESC' | 'YIELD_DESC' | 'AREA_DESC', string>;
    maxBudgetLabel: string;
    matchingCount: string;
    noResults: string;
    resetFilters: string;
    selectedUnitEyebrow: string;
    tabGallery: string;
    tabFloorplan: string;
    floorplanHint: string;
    areaLabel: string;
    pricePerSqmLabel: string;
    maintenanceLabel: string;
    riverScoreLabel: string;
    ceilingLabel: string;
    handoverLabel: string;
    privateLiftYes: string;
    privateLiftNo: string;
    compareBtn: string;
    comparingBtn: string;
    compareFull: string;
    bookViewingBtn: string;
    simulateBtn: string;
    estGrossYield: string;
    perMonth: string;
    floorPrefix: string;
    highlightsTitle: string;
    terraceIncluded: string;
  };
  simulator: {
    eyebrow: string;
    title: string;
    subtitle: string;
    modeResidence: string;
    modeCustom: string;
    syncedWith: string;
    propertyValueLabel: string;
    downPaymentLabel: string;
    loanTermLabel: string;
    yearsUnit: string;
    interestRateLabel: string;
    ratePresetsLabel: string;
    monthlyRentLabel: string;
    appreciationLabel: string;
    monthlyPmtTitle: string;
    loanPrincipalLabel: string;
    totalInterestLabel: string;
    grossYieldLabel: string;
    netYieldLabel: string;
    monthlyCashFlowLabel: string;
    cashOnCashLabel: string;
    tenYearEquityLabel: string;
    tenYearRoiLabel: string;
    principalVsInterestTitle: string;
    principalLabel: string;
    interestLabel: string;
    chartTitle: string;
    chartSubtitle: string;
    chartPropertyValue: string;
    chartNetEquity: string;
    chartRemainingDebt: string;
    chartCumRent: string;
    amortizationTitle: string;
    amortizationSubtitle: string;
    toggleAmortizationShow: string;
    toggleAmortizationHide: string;
    colYear: string;
    colOpening: string;
    colAnnualPayment: string;
    colPrincipal: string;
    colInterest: string;
    colEnding: string;
    exportMdBtn: string;
    exportJsonBtn: string;
    copiedLabel: string;
    exportNote: string;
  };
  compare: {
    dockLabel: string;
    openMatrix: string;
    clearAll: string;
    modalEyebrow: string;
    modalTitle: string;
    emptyState: string;
    rowFloor: string;
    rowType: string;
    rowOrientation: string;
    rowRiverScore: string;
    rowArea: string;
    rowTotalPrice: string;
    rowPriceSqm: string;
    rowEstMortgage: string;
    rowEstRent: string;
    rowNetYield: string;
    rowPrivateLift: string;
    bestValueTag: string;
    highestYieldTag: string;
    inspectBtn: string;
    bookBtn: string;
    removeBtn: string;
    mortgageAssumptionsPrefix: string;
  };
  scheduler: {
    eyebrow: string;
    title: string;
    subtitle: string;
    selectResidence: string;
    selectFormat: string;
    formatOnsite: string;
    formatOnsiteDesc: string;
    format3d: string;
    format3dDesc: string;
    selectDate: string;
    selectTime: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    submitBtn: string;
    passEyebrow: string;
    passTitle: string;
    passCodeLabel: string;
    passHolderLabel: string;
    passResidenceLabel: string;
    passScheduleLabel: string;
    passFormatLabel: string;
    passAdvisorLabel: string;
    passQrNote: string;
    downloadPassBtn: string;
    bookAnotherBtn: string;
    poweredBy: string;
    validationError: string;
  };
  footer: {
    brandDesc: string;
    colArchitecture: string;
    colFintech: string;
    colAdvisory: string;
    disclaimer: string;
    craftedBy: string;
  };
}

export const TRANSLATIONS: Record<Language, CopyBundle> = {
  vi: {
    nav: {
      tower: 'Tháp & Mặt Bằng',
      simulator: 'Tính Vay & ROI',
      compare: 'So Sánh',
      schedule: 'Đặt Lịch VIP',
      themeDark: 'Obsidian',
      themeLight: 'Limestone',
    },
    hero: {
      eyebrow: 'THE KINETIX RESIDENCES · THỦ THIÊM RIVERFRONT',
      titleLine1: 'Kiến Trúc Biểu Tượng',
      titleLine2: 'Bên Dòng Sông Sài Gòn.',
      subtitle:
        'Khám phá bộ sưu tập 128 dinh thự trên không từ tầng 18 đến tầng 42. Trải nghiệm sơ đồ tháp trực quan, bản vẽ mặt bằng tương tác và mô phỏng dòng tiền đầu tư theo thời gian thực.',
      ctaExplorer: 'Khám Phá Tháp & Mặt Bằng',
      ctaSimulator: 'Mô Phỏng Vay & ROI',
      ctaViewing: 'Đặt Lịch Xem Nhà Riêng',
      stat1Value: '18.4%',
      stat1Label: 'Tăng Giá Kỳ Vọng 3 Năm',
      stat2Value: '6.8%',
      stat2Label: 'Lợi Suất Cho Thuê Ròng',
      stat3Value: '42 Tầng · 128 Căn',
      stat3Label: 'Dinh Thự Trên Không Độc Bản',
      liveInventoryPrefix: 'Quỹ căn mở bán hiện tại:',
      liveInventorySuffix: 'căn sẵn sàng giao dịch',
      coords: '10.7725° N, 106.7219° E · BÁN ĐẢO THỦ THIÊM, TP.HCM',
    },
    explorer: {
      eyebrow: 'KHÁM PHÁ KIẾN TRÚC & QUỸ CĂN ĐỘC BẢN',
      title: 'Mặt Đứng Tháp & Mặt Bằng Chi Tiết',
      subtitle:
        'Chọn trực tiếp từng tầng trên trục đứng kiến trúc từ tầng 18 đến đỉnh tháp 42 hoặc lọc theo loại phòng, hướng sông và ngân sách để phân tích thông số kỹ thuật từng căn.',
      towerElevationTitle: 'Trục Đứng Tháp Kinetix (Tầng 18–42)',
      towerElevationHint: 'Chạm vào tầng hoặc mã căn để xem mặt bằng & nội thất',
      resetFloor: 'Hiện tất cả tầng',
      filterAll: 'Tất cả',
      tierLabels: {
        ALL: 'Tất cả loại căn',
        '1BR': '1 Phòng Ngủ',
        '2BR': '2 Phòng Ngủ',
        '3BR': '3 Phòng Ngủ',
        PENTHOUSE: 'Sky Penthouse',
      },
      orientationLabels: {
        ALL: 'Mọi hướng nhìn',
        RIVER_PANORAMIC: 'Toàn Cảnh Sông',
        SUNSET_CBD: 'Hoàng Hôn Quận 1',
        BOTANICAL: 'Công Viên Sinh Thái',
      },
      statusLabels: {
        ALL: 'Tất cả trạng thái',
        AVAILABLE: 'Đang Mở Bán',
        RESERVED: 'Đang Giữ Chỗ',
        SOLD: 'Đã Giao Dịch',
      },
      sortLabels: {
        FLOOR_DESC: 'Tầng cao nhất',
        PRICE_ASC: 'Giá tăng dần',
        PRICE_DESC: 'Giá giảm dần',
        YIELD_DESC: 'Lợi suất cao nhất',
        AREA_DESC: 'Diện tích lớn nhất',
      },
      maxBudgetLabel: 'Ngân sách tối đa',
      matchingCount: 'căn phù hợp bộ lọc',
      noResults: 'Không tìm thấy căn hộ khớp bộ lọc hiện tại.',
      resetFilters: 'Đặt lại bộ lọc',
      selectedUnitEyebrow: 'HỒ SƠ CĂN HỘ ĐANG CHỌN',
      tabGallery: 'Không Gian Nội Thất',
      tabFloorplan: 'Bản Vẽ Mặt Bằng SVG',
      floorplanHint: 'Di chuột hoặc chạm vào từng phân khu trên bản vẽ để xem diện tích & kích thước chi tiết',
      areaLabel: 'Tổng Diện Tích',
      pricePerSqmLabel: 'Đơn Giá / m²',
      maintenanceLabel: 'Phí Quản Lý / Tháng',
      riverScoreLabel: 'Chỉ Số Tầm Nhìn Sông',
      ceilingLabel: 'Chiều Cao Trần',
      handoverLabel: 'Dự Kiến Bàn Giao',
      privateLiftYes: 'Thang Máy Riêng',
      privateLiftNo: 'Thang Tốc Độ Cao',
      compareBtn: 'So Sánh (tối đa 3 căn)',
      comparingBtn: 'Đã Thêm So Sánh',
      compareFull: 'Đã Đủ 3 Căn So Sánh',
      bookViewingBtn: 'Đặt Lịch Xem Nhà Riêng',
      simulateBtn: 'Phân Tích Vay & ROI Căn Này',
      estGrossYield: 'Lợi suất thuê gộp',
      perMonth: '/ tháng',
      floorPrefix: 'Tầng',
      highlightsTitle: 'Điểm Nhấn Kiến Trúc & Bàn Giao',
      terraceIncluded: 'gồm logia/sân thượng',
    },
    simulator: {
      eyebrow: 'FINTECH MORTGAGE & INVESTMENT ENGINE',
      title: 'Mô Phỏng Vay Ngân Hàng & Lợi Suất Đầu Tư',
      subtitle:
        'Tính toán chính xác khoản trả góp PMT hàng tháng theo công thức niên kim chuẩn ngân hàng, lợi suất cho thuê ròng sau phí vận hành và biểu đồ tăng trưởng vốn chủ sở hữu trong 10 năm.',
      modeResidence: 'Đồng Bộ Căn Đang Chọn',
      modeCustom: 'Giá Trị BĐS Tùy Chỉnh',
      syncedWith: 'Đang đồng bộ thông số của',
      propertyValueLabel: 'Giá Trị Bất Động Sản',
      downPaymentLabel: 'Vốn Tự Có (Trả Trước)',
      loanTermLabel: 'Thời Hạn Vay',
      yearsUnit: 'năm',
      interestRateLabel: 'Lãi Suất Ngân Hàng / Năm',
      ratePresetsLabel: 'Gói lãi suất tham chiếu:',
      monthlyRentLabel: 'Giá Cho Thuê Dự Kiến / Tháng',
      appreciationLabel: 'Tăng Giá Tài Sản Kỳ Vọng / Năm',
      monthlyPmtTitle: 'Trả Góp Hàng Tháng (PMT)',
      loanPrincipalLabel: 'Dư Nợ Vay Ban Đầu',
      totalInterestLabel: 'Tổng Lãi Suất Toàn Kỳ',
      grossYieldLabel: 'Lợi Suất Thuê Gộp',
      netYieldLabel: 'Lợi Suất Thuê Ròng',
      monthlyCashFlowLabel: 'Dòng Tiền Ròng / Tháng',
      cashOnCashLabel: 'Tỷ Suất Tiền Mặt (CoC)',
      tenYearEquityLabel: 'Vốn Chủ Sở Hữu Năm 10',
      tenYearRoiLabel: 'Tổng ROI Tích Lũy 10 Năm',
      principalVsInterestTitle: 'Cơ Cấu Tổng Thanh Toán: Gốc vs Lãi',
      principalLabel: 'Tiền Gốc',
      interestLabel: 'Tiền Lãi',
      chartTitle: 'Dự Phóng Vốn Chủ Sở Hữu & Tài Sản 10 Năm',
      chartSubtitle: 'Di chuột lên từng năm để kiểm tra giá trị tài sản, dư nợ còn lại và tiền thuê ròng tích lũy',
      chartPropertyValue: 'Giá Trị BĐS',
      chartNetEquity: 'Vốn Chủ Sở Hữu',
      chartRemainingDebt: 'Dư Nợ Còn Lại',
      chartCumRent: 'Tiền Thuê Tích Lũy',
      amortizationTitle: 'Bảng Khấu Hao Dư Nợ Theo Năm',
      amortizationSubtitle: 'Theo dõi dòng tiền gốc & lãi từng năm đến khi tất toán dư nợ về 0',
      toggleAmortizationShow: 'Mở Toàn Bộ Bảng Khấu Hao',
      toggleAmortizationHide: 'Thu Gọn Bảng Khấu Hao',
      colYear: 'Năm',
      colOpening: 'Dư Nợ Đầu Kỳ',
      colAnnualPayment: 'Tổng Trả Năm',
      colPrincipal: 'Trả Gốc',
      colInterest: 'Trả Lãi',
      colEnding: 'Dư Nợ Cuối Kỳ',
      exportMdBtn: 'Xuất Hồ Sơ (.md)',
      exportJsonBtn: 'Xuất Dữ Liệu (.json)',
      copiedLabel: 'Đã tải xuống',
      exportNote: 'Lợi suất ròng đã trừ phí quản lý tòa nhà, 0.8 tháng trống dự phòng và 10% thuế cho thuê chuẩn VN.',
    },
    compare: {
      dockLabel: 'Danh sách so sánh căn hộ',
      openMatrix: 'Mở Bảng So Sánh',
      clearAll: 'Xóa Tất Cả',
      modalEyebrow: 'SO SÁNH ĐA CHIỀU · TỐI ĐA 3 CĂN HỘ',
      modalTitle: 'Ma Trận Đối Chiếu Kiến Trúc & Hiệu Quả Đầu Tư',
      emptyState: 'Chọn tối đa 3 căn hộ ở mục Khám Phá Tháp để đối chiếu trực tiếp thông số kỹ thuật và dòng tiền.',
      rowFloor: 'Cao Độ Tầng',
      rowType: 'Phân Hạng',
      rowOrientation: 'Hướng Tầm Nhìn',
      rowRiverScore: 'Điểm Tầm Nhìn Sông',
      rowArea: 'Tổng Diện Tích',
      rowTotalPrice: 'Giá Bán Niêm Yết',
      rowPriceSqm: 'Đơn Giá / m²',
      rowEstMortgage: 'Trả Góp Ước Tính / Tháng',
      rowEstRent: 'Tiền Thuê Dự Kiến / Tháng',
      rowNetYield: 'Lợi Suất Thuê Ròng',
      rowPrivateLift: 'Thang Máy Riêng',
      bestValueTag: 'Đơn Giá Tốt Nhất',
      highestYieldTag: 'Lợi Suất Cao Nhất',
      inspectBtn: 'Xem Chi Tiết',
      bookBtn: 'Đặt Lịch Xem',
      removeBtn: 'Gỡ bỏ',
      mortgageAssumptionsPrefix: 'Ước tính trả góp theo cấu hình hiện tại:',
    },
    scheduler: {
      eyebrow: 'PRIVATE CLIENT DESK · THỦ THIÊM GALLERY',
      title: 'Đặt Lịch Xem Nhà Riêng VIP',
      subtitle:
        'Đăng ký trải nghiệm căn hộ mẫu thực tế tại bán đảo Thủ Thiêm hoặc buổi trình chiếu 3D Private Tour cùng cố vấn đầu tư chuyên biệt.',
      selectResidence: 'Căn hộ quan tâm',
      selectFormat: 'Hình thức trải nghiệm',
      formatOnsite: 'Trực tiếp tại Nhà Mẫu',
      formatOnsiteDesc: 'Đón tiếp riêng tại Kinetix Riverfront Gallery, Thủ Thiêm · Valet Parking',
      format3d: 'Video 3D Private Tour',
      format3dDesc: 'Phiên họp trực tuyến 1:1 cùng kiến trúc sư & chuyên viên thẩm định ROI',
      selectDate: 'Chọn ngày tham quan',
      selectTime: 'Chọn khung giờ riêng',
      nameLabel: 'Họ và tên khách hàng',
      namePlaceholder: 'Ví dụ: Nguyễn Minh Quân',
      phoneLabel: 'Số điện thoại liên hệ',
      phonePlaceholder: '0901 234 567',
      emailLabel: 'Email nhận thẻ mời điện tử',
      emailPlaceholder: 'quan.nguyen@capital.vn',
      notesLabel: 'Yêu cầu đặc biệt (tùy chọn)',
      notesPlaceholder: 'Ví dụ: Quan tâm gói vay ưu đãi 24 tháng, yêu cầu bản vẽ CAD...',
      submitBtn: 'Xác Nhận & Cấp Thẻ VIP Pass',
      passEyebrow: 'THẺ MỜI THAM QUAN ĐỘC QUYỀN',
      passTitle: 'Xác Nhận Lịch Hẹn Thành Công',
      passCodeLabel: 'MÃ ĐỊNH DANH VIP PASS',
      passHolderLabel: 'Khách Mời',
      passResidenceLabel: 'Căn Hộ Quan Tâm',
      passScheduleLabel: 'Thời Gian Hẹn',
      passFormatLabel: 'Hình Thức',
      passAdvisorLabel: 'Cố Vấn Chuyên Biệt',
      passQrNote: 'Xuất trình mã QR tại sảnh Private Lounge Kinetix Thủ Thiêm để nhận đặc quyền đón tiếp không chờ đợi.',
      downloadPassBtn: 'Tải Thẻ VIP (.txt)',
      bookAnotherBtn: 'Đặt Thêm Lịch Khác',
      poweredBy: 'Private Client Desk · Powered by TVT Studio',
      validationError: 'Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Email hợp lệ.',
    },
    footer: {
      brandDesc:
        'Nền tảng PropTech & thẩm định đầu tư bất động sản hạng sang cho dự án The Kinetix Residences tại bán đảo Thủ Thiêm, TP. Hồ Chí Minh.',
      colArchitecture: 'Thông Số Dự Án',
      colFintech: 'Chuẩn Toán Tài Chính',
      colAdvisory: 'Private Client Desk',
      disclaimer:
        'Các chỉ số lợi suất, tốc độ tăng giá và lịch trả nợ ngân hàng mang tính mô phỏng tài chính chuyên sâu phục vụ phân tích đầu tư. Dữ liệu thị trường tham chiếu quý IV/2026.',
      craftedBy: 'Thiết kế & Phát triển bởi TVT Studio · Trương Văn Tình',
    },
  },
  en: {
    nav: {
      tower: 'Tower & Floorplans',
      simulator: 'Mortgage & ROI',
      compare: 'Compare',
      schedule: 'VIP Viewing',
      themeDark: 'Obsidian',
      themeLight: 'Limestone',
    },
    hero: {
      eyebrow: 'THE KINETIX RESIDENCES · THU THIEM RIVERFRONT',
      titleLine1: 'Sculptural Living',
      titleLine2: 'Above the Saigon River.',
      subtitle:
        'Explore 128 limited-edition sky residences spanning floors 18 to 42. Inspect the interactive architectural elevation stack, precision SVG floorplans, and real-time mortgage & yield analytics.',
      ctaExplorer: 'Explore Tower & Floorplans',
      ctaSimulator: 'Simulate Mortgage & ROI',
      ctaViewing: 'Book Private Viewing',
      stat1Value: '18.4%',
      stat1Label: '3-Year Appreciation Forecast',
      stat2Value: '6.8%',
      stat2Label: 'Projected Net Rental Yield',
      stat3Value: '42 Floors · 128 Units',
      stat3Label: 'Limited Sky Residences',
      liveInventoryPrefix: 'Live release inventory:',
      liveInventorySuffix: 'residences available now',
      coords: '10.7725° N, 106.7219° E · THU THIEM PENINSULA, HO CHI MINH CITY',
    },
    explorer: {
      eyebrow: 'ARCHITECTURAL INVENTORY & BLUEPRINTS',
      title: 'Interactive Tower Elevation & Floorplans',
      subtitle:
        'Select any floor along the vertical elevation stack from Level 18 to the Floor 42 Crown Duplex, or filter by layout tier, river orientation, and budget to inspect complete specifications.',
      towerElevationTitle: 'Kinetix Tower Elevation (Floors 18–42)',
      towerElevationHint: 'Click any floor level or unit badge to inspect',
      resetFloor: 'Show All Floors',
      filterAll: 'All',
      tierLabels: {
        ALL: 'All Layouts',
        '1BR': '1 Bedroom',
        '2BR': '2 Bedrooms',
        '3BR': '3 Bedrooms',
        PENTHOUSE: 'Sky Penthouse',
      },
      orientationLabels: {
        ALL: 'All Views',
        RIVER_PANORAMIC: 'River Panoramic',
        SUNSET_CBD: 'Sunset CBD',
        BOTANICAL: 'Botanical Park',
      },
      statusLabels: {
        ALL: 'All Statuses',
        AVAILABLE: 'Available',
        RESERVED: 'Reserved',
        SOLD: 'Sold',
      },
      sortLabels: {
        FLOOR_DESC: 'Highest Floor',
        PRICE_ASC: 'Price: Low to High',
        PRICE_DESC: 'Price: High to Low',
        YIELD_DESC: 'Highest Yield',
        AREA_DESC: 'Largest Area',
      },
      maxBudgetLabel: 'Maximum Budget',
      matchingCount: 'residences match criteria',
      noResults: 'No residences match your current filter selection.',
      resetFilters: 'Reset Filters',
      selectedUnitEyebrow: 'SELECTED RESIDENCE DOSSIER',
      tabGallery: 'Interior Photography',
      tabFloorplan: 'Architectural SVG Floorplan',
      floorplanHint: 'Hover or click any architectural zone on the schematic to inspect room dimensions and area',
      areaLabel: 'Total Area',
      pricePerSqmLabel: 'Price / m²',
      maintenanceLabel: 'Monthly Service Fee',
      riverScoreLabel: 'River View Index',
      ceilingLabel: 'Clear Ceiling',
      handoverLabel: 'Est. Handover',
      privateLiftYes: 'Private Lift Lobby',
      privateLiftNo: 'High-Speed Lift Core',
      compareBtn: 'Compare (up to 3)',
      comparingBtn: 'In Comparison',
      compareFull: 'Compare Full (3/3)',
      bookViewingBtn: 'Book Private Viewing',
      simulateBtn: 'Simulate Mortgage & ROI',
      estGrossYield: 'Est. gross yield',
      perMonth: '/ month',
      floorPrefix: 'Floor',
      highlightsTitle: 'Architectural Specifications & Finish',
      terraceIncluded: 'incl. sky terrace',
    },
    simulator: {
      eyebrow: 'FINTECH MORTGAGE & INVESTMENT ENGINE',
      title: 'Live Mortgage & Rental Yield ROI Simulator',
      subtitle:
        'Model institutional-grade annuity PMT payments, net rental yield after management & Vietnam statutory rental tax, 10-year equity trajectory, and full amortization schedule.',
      modeResidence: 'Synced to Selected Unit',
      modeCustom: 'Custom Property Value',
      syncedWith: 'Live-synced with residence',
      propertyValueLabel: 'Property Valuation',
      downPaymentLabel: 'Down Payment Equity',
      loanTermLabel: 'Loan Tenure',
      yearsUnit: 'years',
      interestRateLabel: 'Annual Bank Interest Rate',
      ratePresetsLabel: 'Benchmark bank packages:',
      monthlyRentLabel: 'Estimated Monthly Rent',
      appreciationLabel: 'Annual Capital Appreciation',
      monthlyPmtTitle: 'Monthly Mortgage Payment (PMT)',
      loanPrincipalLabel: 'Initial Loan Principal',
      totalInterestLabel: 'Total Lifetime Interest',
      grossYieldLabel: 'Gross Rental Yield',
      netYieldLabel: 'Net Rental Yield',
      monthlyCashFlowLabel: 'Monthly Net Cash Flow',
      cashOnCashLabel: 'Cash-on-Cash Return',
      tenYearEquityLabel: 'Year 10 Net Equity',
      tenYearRoiLabel: '10-Year Total ROI',
      principalVsInterestTitle: 'Total Outlay Breakdown: Principal vs Interest',
      principalLabel: 'Principal',
      interestLabel: 'Interest',
      chartTitle: '10-Year Equity & Wealth Projection',
      chartSubtitle: 'Hover across years 1–10 to inspect projected property value, remaining debt, and cumulative net rental income',
      chartPropertyValue: 'Property Value',
      chartNetEquity: 'Net Equity',
      chartRemainingDebt: 'Remaining Debt',
      chartCumRent: 'Cumulative Net Rent',
      amortizationTitle: 'Year-by-Year Amortization Schedule',
      amortizationSubtitle: 'Complete principal reduction and interest expense down to exact zero balance',
      toggleAmortizationShow: 'Expand Full Schedule',
      toggleAmortizationHide: 'Collapse Schedule',
      colYear: 'Year',
      colOpening: 'Opening Balance',
      colAnnualPayment: 'Annual Payment',
      colPrincipal: 'Principal Paid',
      colInterest: 'Interest Paid',
      colEnding: 'Ending Balance',
      exportMdBtn: 'Export Dossier (.md)',
      exportJsonBtn: 'Export JSON (.json)',
      copiedLabel: 'Downloaded',
      exportNote: 'Net yield deducts monthly tower service fees, 0.8-month vacancy reserve, and 10% Vietnam statutory rental tax.',
    },
    compare: {
      dockLabel: 'Residence comparison tray',
      openMatrix: 'Open Comparison Matrix',
      clearAll: 'Clear All',
      modalEyebrow: 'SIDE-BY-SIDE ANALYTICS · UP TO 3 UNITS',
      modalTitle: 'Residence & Investment Comparison Matrix',
      emptyState: 'Add up to 3 residences from the Tower Explorer to benchmark elevation, river views, unit pricing, and projected yields.',
      rowFloor: 'Floor Elevation',
      rowType: 'Residence Tier',
      rowOrientation: 'View Orientation',
      rowRiverScore: 'River View Score',
      rowArea: 'Total Area',
      rowTotalPrice: 'List Price',
      rowPriceSqm: 'Price / m²',
      rowEstMortgage: 'Est. Monthly Mortgage',
      rowEstRent: 'Est. Monthly Rent',
      rowNetYield: 'Projected Net Yield',
      rowPrivateLift: 'Private Lift Access',
      bestValueTag: 'Best Price / m²',
      highestYieldTag: 'Highest Net Yield',
      inspectBtn: 'Inspect Unit',
      bookBtn: 'Book Viewing',
      removeBtn: 'Remove',
      mortgageAssumptionsPrefix: 'Mortgage estimates use active simulator terms:',
    },
    scheduler: {
      eyebrow: 'PRIVATE CLIENT DESK · THU THIEM GALLERY',
      title: 'Schedule Private VIP Viewing',
      subtitle:
        'Reserve an invitation-only appointment at the Thu Thiem Riverfront Gallery or a live 3D Architectural Walkthrough with our private wealth desk.',
      selectResidence: 'Selected Residence',
      selectFormat: 'Viewing Format',
      formatOnsite: 'In-Person Gallery Viewing',
      formatOnsiteDesc: 'Private arrival at Kinetix Thu Thiem Gallery · Dedicated Valet',
      format3d: 'Private 3D Video Tour',
      format3dDesc: '1-on-1 interactive walkthrough with architect & investment advisor',
      selectDate: 'Preferred Date',
      selectTime: 'Preferred Time Slot',
      nameLabel: 'Full Name',
      namePlaceholder: 'e.g. Alexander Tran',
      phoneLabel: 'Direct Phone / WhatsApp',
      phonePlaceholder: '+84 901 234 567',
      emailLabel: 'Email for VIP Pass Delivery',
      emailPlaceholder: 'alexander@privatewealth.sg',
      notesLabel: 'Bespoke Requests (Optional)',
      notesPlaceholder: 'e.g. Requesting CAD drawings, foreign ownership quota brief...',
      submitBtn: 'Confirm & Issue VIP Pass',
      passEyebrow: 'EXCLUSIVE INVITATION CREDENTIAL',
      passTitle: 'Private Viewing Confirmed',
      passCodeLabel: 'DETERMINISTIC VIP PASS ID',
      passHolderLabel: 'Invited Guest',
      passResidenceLabel: 'Residence of Interest',
      passScheduleLabel: 'Appointment Window',
      passFormatLabel: 'Experience Format',
      passAdvisorLabel: 'Assigned Private Advisor',
      passQrNote: 'Present this QR code at the Kinetix Private Arrival Lounge for seamless priority reception.',
      downloadPassBtn: 'Download Pass (.txt)',
      bookAnotherBtn: 'Schedule Another Viewing',
      poweredBy: 'Private Client Desk · Powered by TVT Studio',
      validationError: 'Please provide your full name, phone number, and a valid email address.',
    },
    footer: {
      brandDesc:
        'Ultra-luxury PropTech showcase and real-time residential investment analytics engineered for The Kinetix Residences, Thu Thiem Riverfront.',
      colArchitecture: 'Tower Telemetry',
      colFintech: 'Financial Methodology',
      colAdvisory: 'Private Client Desk',
      disclaimer:
        'Projected rental yields, appreciation trajectories, and mortgage schedules are institutional-grade financial simulations for investment underwriting.',
      craftedBy: 'Architected & Engineered by TVT Studio · Truong Van Tinh',
    },
  },
};
