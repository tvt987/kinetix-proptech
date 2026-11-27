import type { Language } from '../types/proptech';

export interface CopyBundle {
  nav: {
    tower: string;
    solar: string;
    market: string;
    simulator: string;
    compare: string;
    vault: string;
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
    shortlistFilterBtn: string;
    saveShortlistBtn: string;
    savedShortlistBtn: string;
    holdDepositBtn: string;
    printDossierBtn: string;
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
    exportCsvBtn: string;
    printPdfBtn: string;
    copiedLabel: string;
    exportNote: string;
    stressEyebrow: string;
    stressTitle: string;
    stressSubtitle: string;
    rateShockLabel: string;
    monthlyIncomeLabel: string;
    shockBase: string;
    shockModerate: string;
    shockSevere: string;
    stressedPmtLabel: string;
    shockDeltaLabel: string;
    dtiRatioLabel: string;
    dtiSafeLabel: string;
    dtiCautionLabel: string;
    dtiRiskLabel: string;
    colScenario: string;
    colEffRate: string;
    colMonthlyPmt: string;
    colDeltaPmt: string;
    colNetCashFlow: string;
    colDti: string;
    colSafety: string;
    scheduleTab10Y: string;
    scheduleTabFull: string;
    totalRowLabel: string;
    leverageEyebrow: string;
    leverageTitle: string;
    leverageSubtitle: string;
    leverageCashTitle: string;
    leverageBankTitle: string;
    leverageAlphaLabel: string;
    leverageCapitalFreed: string;
    leverageMultipleAdv: string;
    leverageRowInitialEquity: string;
    leverageRowGrossRent: string;
    leverageRowOpFees: string;
    leverageRowInterest: string;
    leverageRowExitVal: string;
    leverageRowNetExit: string;
    leverageRowNetProfit: string;
    leverageRowMultiple: string;
    leverageRowNetIrr: string;
    leverageNote: string;
  };
  solar: {
    eyebrow: string;
    title: string;
    subtitle: string;
    coordsBadge: string;
    timeSliderLabel: string;
    seasonLabel: string;
    orientationLabel: string;
    syncedUnitPrefix: string;
    presetMorning: string;
    presetNoon: string;
    presetAfternoon: string;
    presetSunset: string;
    altitudeLabel: string;
    azimuthLabel: string;
    thermalLoadLabel: string;
    interiorGainLabel: string;
    penetrationLabel: string;
    daylightLuxLabel: string;
    noonPeakPrefix: string;
    beamActiveBadge: string;
    beamShadedBadge: string;
    compassCaption: string;
    profileTitle: string;
    profileSubtitle: string;
    lowESpecNote: string;
    comfortTiers: Record<'OPTIMAL_DAYLIGHT' | 'BRIGHT_DIRECT_GLARE' | 'AMBIENT_DIFFUSE' | 'TWILIGHT_LOW', string>;
    thermalTiers: Record<'COOL_MORNING' | 'BALANCED' | 'ELEVATED_SOLAR_GAIN' | 'PEAK_WEST_LOAD', string>;
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
    downloadIcsBtn: string;
    holdDepositCta: string;
    savedToVaultBadge: string;
    openVaultBtn: string;
    bookAnotherBtn: string;
    poweredBy: string;
    validationError: string;
  };
  vault: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tabShortlist: string;
    tabPasses: string;
    emptyShortlist: string;
    emptyPasses: string;
    activeHoldsTitle: string;
    inspectBtn: string;
    simulateBtn: string;
    depositBtn: string;
    bookBtn: string;
    downloadIcsBtn: string;
    downloadTxtBtn: string;
    removeBtn: string;
    persistedNote: string;
    bookNewViewingBtn: string;
  };
  deposit: {
    eyebrow: string;
    title: string;
    subtitle: string;
    selectTierLabel: string;
    qrTitle: string;
    qrLiveBadge: string;
    qrFallbackBadge: string;
    qrScanHint: string;
    bankLabel: string;
    accountNoLabel: string;
    accountHolderLabel: string;
    amountLabel: string;
    memoLabel: string;
    copyBtn: string;
    copiedBtn: string;
    guaranteeTitle: string;
    guaranteeBody: string;
    saveHoldBtn: string;
    holdSavedLabel: string;
    closeBtn: string;
  };
  print: {
    eyebrow: string;
    title: string;
    generatedOn: string;
    assetSection: string;
    underwritingSection: string;
    stressSection: string;
    amortizationSection: string;
    depositSection: string;
    refundNotice: string;
    signatureAdvisor: string;
    signatureClient: string;
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
      solar: 'Hướng Nắng',
      market: 'Bản Đồ & Tài Sản',
      simulator: 'Tính Vay & ROI',
      compare: 'So Sánh',
      vault: 'VIP Vault',
      schedule: 'Đặt Lịch VIP',
      themeDark: 'Midnight Navy',
      themeLight: 'Daylight Ivory',
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
      shortlistFilterBtn: 'Danh Sách Đã Lưu',
      saveShortlistBtn: 'Lưu Vào Shortlist',
      savedShortlistBtn: 'Đã Lưu Shortlist',
      holdDepositBtn: 'Giữ Căn VietQR',
      printDossierBtn: 'In Hồ Sơ A4 PDF',
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
      exportCsvBtn: 'Xuất Excel CSV (BOM)',
      printPdfBtn: 'In Hồ Sơ A4 PDF',
      copiedLabel: 'Đã tải xuống',
      exportNote: 'Lợi suất ròng đã trừ phí quản lý tòa nhà, 0.8 tháng trống dự phòng và 10% thuế cho thuê chuẩn VN. File CSV chuẩn UTF-8 BOM mở trực tiếp trên Excel.',
      stressEyebrow: 'STRESS TEST LÃI SUẤT THẢ NỔI & NGƯỠNG AN TOÀN DTI',
      stressTitle: 'Kiểm Thử Sốc Lãi Suất Sau Ưu Đãi (+0% / +2% / +4%)',
      stressSubtitle: 'Mô phỏng áp lực trả nợ hàng tháng khi lãi suất chuyển sang thả nổi và xếp hạng an toàn tỷ lệ Nợ/Thu nhập (DTI) chuẩn ngân hàng.',
      rateShockLabel: 'Biên Độ Sốc Lãi Thả Nổi',
      monthlyIncomeLabel: 'Thu Nhập Ròng Nhà Đầu Tư / Tháng',
      shockBase: '+0% Cơ Sở',
      shockModerate: '+2% Thả Nổi',
      shockSevere: '+4% Sốc Cao',
      stressedPmtLabel: 'Trả Góp Khi Sốc Lãi',
      shockDeltaLabel: 'Tăng Thêm / Tháng',
      dtiRatioLabel: 'Tỷ Lệ Nợ / Thu Nhập (DTI)',
      dtiSafeLabel: 'An Toàn Ngân Hàng (<=35%)',
      dtiCautionLabel: 'Cần Đệm Thanh Khoản (<=50%)',
      dtiRiskLabel: 'Cảnh Báo Vượt Ngưỡng (>50%)',
      colScenario: 'Kịch Bản',
      colEffRate: 'Lãi Suất',
      colMonthlyPmt: 'Trả Góp/Tháng',
      colDeltaPmt: 'Tăng Thêm',
      colNetCashFlow: 'Dòng Tiền Ròng',
      colDti: 'DTI',
      colSafety: 'Xếp Hạng',
      scheduleTab10Y: 'Lịch 10 Năm Đầu',
      scheduleTabFull: 'Toàn Kỳ Vay',
      totalRowLabel: 'Tổng Cộng Kỳ Đang Xem',
      leverageEyebrow: 'SO SÁNH ĐÒN BẨY ĐẦU TƯ 10 NĂM & NET IRR',
      leverageTitle: 'Mua Tiền Mặt 100% vs Đòn Bẩy Ngân Hàng 70% LTV',
      leverageSubtitle: 'Đối chiếu trực tiếp hiệu suất vốn tự có, tổng phí quản lý, chi phí lãi vay, giá trị tăng trưởng và tỷ suất hoàn vốn nội bộ ròng (Net IRR) sau thuế chuyển nhượng 2% tại năm thứ 10.',
      leverageCashTitle: 'Mua Tiền Mặt 100% (0% LTV)',
      leverageBankTitle: 'Đòn Bẩy Ngân Hàng',
      leverageAlphaLabel: 'Biên Độ Leverage Alpha (Net IRR)',
      leverageCapitalFreed: 'Vốn Giải Phóng Tái Đầu Tư',
      leverageMultipleAdv: 'Chênh Lệch Bội Số Vốn',
      leverageRowInitialEquity: 'Vốn Tự Có Ban Đầu',
      leverageRowGrossRent: 'Tổng Tiền Thuê Gộp (10 Năm)',
      leverageRowOpFees: 'Phí Quản Lý, Trống & Thuế (10N)',
      leverageRowInterest: 'Tổng Lãi Vay Ngân Hàng (10N)',
      leverageRowExitVal: 'Định Giá Thoái Vốn Năm 10',
      leverageRowNetExit: 'Thu Ròng Thoái Vốn (Sau Thuế 2%)',
      leverageRowNetProfit: 'Tổng Lợi Nhuận Ròng 10 Năm',
      leverageRowMultiple: 'Bội Số Vốn Chủ Sở Hữu (MOIC)',
      leverageRowNetIrr: 'Tỷ Suất Hoàn Vốn Ròng (Net IRR)',
      leverageNote: 'Giả định tăng giá thuê bảo thủ 3%/năm, 0.8 tháng trống/năm, 10% thuế cho thuê chuẩn VN và 2% thuế TNCN khi chuyển nhượng cuối năm 10.',
    },
    solar: {
      eyebrow: 'PHÒNG THÍ NGHIỆM HÌNH HỌC MẶT TRỜI SÀI GÒN',
      title: 'Quỹ Đạo Mặt Trời & Ánh Sáng Tự Nhiên Theo Hướng Ban Công',
      subtitle: 'Mô phỏng thiên văn chính xác tại tọa độ Thủ Thiêm (10.7725° N, 106.7219° E) theo từng khung giờ 06:00–18:00 và bốn mùa Xuân/Hạ/Thu/Đông để đo bức xạ nhiệt W/m², độ xuyên nắng mặt bằng và cường độ chiếu sáng tự nhiên.',
      coordsBadge: '10.7725° N · 106.7219° E · UTC+7',
      timeSliderLabel: 'Khung Giờ Địa Phương (Sài Gòn)',
      seasonLabel: 'Chu Kỳ Mùa Thiên Văn',
      orientationLabel: 'Hướng Ban Công Mặt Đứng',
      syncedUnitPrefix: 'Đồng bộ mặt bằng căn',
      presetMorning: '07:30 Nắng Sớm',
      presetNoon: '12:00 Chính Ngọ',
      presetAfternoon: '15:30 Đỉnh Tây',
      presetSunset: '17:15 Hoàng Hôn',
      altitudeLabel: 'Góc Cao Mặt Trời',
      azimuthLabel: 'Góc Phương Vị',
      thermalLoadLabel: 'Tải Nhiệt Mặt Đứng',
      interiorGainLabel: 'Nhiệt Vào Kính Low-E',
      penetrationLabel: 'Độ Xuyên Nắng Sàn',
      daylightLuxLabel: 'Ánh Sáng Tự Nhiên',
      noonPeakPrefix: 'Đỉnh ngọ',
      beamActiveBadge: 'CHIẾU NẮNG TRỰC TIẾP',
      beamShadedBadge: 'ÁNH SÁNG TÁN XẠ DỊU',
      compassCaption: 'La bàn kiến trúc kết hợp quỹ đạo mặt trời thực tế và tia chiếu xuyên qua mặt bằng căn hộ theo hướng ban công.',
      profileTitle: 'Biểu Đồ Bức Xạ Nhiệt Theo Giờ (06:00 – 18:00)',
      profileSubtitle: 'Cường độ bức xạ ngoài kính (W/m²) so với nhiệt lượng truyền qua hệ kính Low-E 3 lớp + logia sâu 2.2m',
      lowESpecNote: 'Hệ kính hộp Low-E 3 lớp chuẩn SHGC 0.36 · VLT 62% kết hợp logia che nắng sâu 2.2m cắt giảm >64% tải nhiệt bức xạ trực tiếp.',
      comfortTiers: {
        OPTIMAL_DAYLIGHT: 'Ánh Sáng Lý Tưởng',
        BRIGHT_DIRECT_GLARE: 'Nắng Gắt · Cần Rèm',
        AMBIENT_DIFFUSE: 'Ánh Sáng Dịu Tự Nhiên',
        TWILIGHT_LOW: 'Bình Minh / Hoàng Hôn',
      },
      thermalTiers: {
        COOL_MORNING: 'Mát Mẻ Dịu Nhẹ',
        BALANCED: 'Cân Bằng Nhiệt',
        ELEVATED_SOLAR_GAIN: 'Bức Xạ Trung Bình Cao',
        PEAK_WEST_LOAD: 'Tải Nhiệt Tây Đỉnh Điểm',
      },
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
      downloadIcsBtn: 'Thêm Lịch (.ics)',
      holdDepositCta: 'Đặt Cọc Giữ Căn (VietQR)',
      savedToVaultBadge: 'Đã lưu tự động vào VIP Vault',
      openVaultBtn: 'Mở VIP Vault',
      bookAnotherBtn: 'Đặt Thêm Lịch Khác',
      poweredBy: 'Private Client Desk · Powered by TVT Studio',
      validationError: 'Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Email hợp lệ.',
    },
    vault: {
      eyebrow: 'PRIVATE CLIENT VAULT · LƯU TRỮ CỤC BỘ BẢO MẬT',
      title: 'Két Lưu Trữ Shortlist & Thẻ VIP Pass',
      subtitle: 'Toàn bộ căn hộ quan tâm, lịch hẹn xem nhà riêng và biên nhận giữ chỗ hoàn lại được lưu bền vững trên trình duyệt của quý khách.',
      tabShortlist: 'Căn Đã Lưu',
      tabPasses: 'Thẻ VIP & Lịch Hẹn',
      emptyShortlist: 'Quý khách chưa lưu căn hộ nào. Nhấn biểu tượng đánh dấu trên từng căn hộ để xây dựng danh mục theo dõi riêng.',
      emptyPasses: 'Chưa có lịch hẹn xem nhà riêng nào trong Vault. Hãy đặt lịch VIP để nhận mã QR và tệp lịch .ics.',
      activeHoldsTitle: 'Biên Nhận Giữ Chỗ Hoàn Lại Đã Ghi Nhận',
      inspectBtn: 'Xem Hồ Sơ',
      simulateBtn: 'Tính Vay',
      depositBtn: 'Giữ Căn VietQR',
      bookBtn: 'Đặt Lịch VIP',
      downloadIcsBtn: 'Tải Lịch (.ics)',
      downloadTxtBtn: 'Thẻ (.txt)',
      removeBtn: 'Xóa',
      persistedNote: 'Dữ liệu lưu cục bộ trên trình duyệt (localStorage) — tự động khôi phục khi tải lại trang.',
      bookNewViewingBtn: 'Đặt Lịch Xem Nhà Mới',
    },
    deposit: {
      eyebrow: 'TECHCOMBANK VIETQR · ĐẶT CỌC GIỮ CHỖ HOÀN LẠI 100%',
      title: 'Giữ Quyền Ưu Tiên Căn Hộ Qua VietQR',
      subtitle: 'Quét mã Techcombank VietQR trực tiếp để thanh toán hoặc xem trước lệnh đặt cọc giữ chỗ có hoàn lại cho quỹ căn Kinetix.',
      selectTierLabel: 'Chọn Mức Đặt Cọc Giữ Chỗ Hoàn Lại',
      qrTitle: 'Mã Thanh Toán Techcombank VietQR',
      qrLiveBadge: 'VIETQR TRỰC TIẾP',
      qrFallbackBadge: 'EMVCO OFFLINE QR',
      qrScanHint: 'Mở ứng dụng Ngân hàng bất kỳ tại Việt Nam để quét mã NAPAS 247 tự động điền số tiền và nội dung.',
      bankLabel: 'Ngân Hàng Thụ Hưởng',
      accountNoLabel: 'Số Tài Khoản',
      accountHolderLabel: 'Chủ Tài Khoản',
      amountLabel: 'Số Tiền Giữ Chỗ',
      memoLabel: 'Nội Dung Chuyển Khoản',
      copyBtn: 'Sao Chép',
      copiedBtn: 'Đã Chép',
      guaranteeTitle: 'Cam Kết Hoàn Tiền 100% Không Rủi Ro',
      guaranteeBody: 'Khoản đặt cọc giữ chỗ được bảo lãnh hoàn lại 100% trong vòng 7 ngày làm việc nếu quý khách quyết định không ký hợp đồng sau buổi tham quan thực tế.',
      saveHoldBtn: 'Lưu Lệnh Giữ Chỗ Vào VIP Vault',
      holdSavedLabel: 'Đã Lưu Vào VIP Vault',
      closeBtn: 'Đóng',
    },
    print: {
      eyebrow: 'THE KINETIX RESIDENCES · THỦ THIÊM RIVERFRONT · HỒ SƠ THẨM ĐỊNH ĐẦU TƯ A4',
      title: 'Hồ Sơ Phân Tích Tài Chính & Dòng Tiền Bất Động Sản',
      generatedOn: 'Ngày lập hồ sơ',
      assetSection: '1. Thông Số Kiến Trúc & Định Giá Tài Sản',
      underwritingSection: '2. Chỉ Số Vay Ngân Hàng & Lợi Suất Cho Thuê',
      stressSection: '3. Kiểm Thử Sốc Lãi Suất Thả Nổi (+0% / +2% / +4%) & DTI',
      amortizationSection: '4. Lịch Khấu Hao Dư Nợ & Dự Phóng Vốn Chủ Sở Hữu 10 Năm',
      depositSection: '5. Thông Tin Đặt Cọc Giữ Chỗ Hoàn Lại (Techcombank VietQR)',
      refundNotice: 'Khoản đặt cọc giữ chỗ hoàn lại 100% trong 7 ngày làm việc nếu khách hàng không tiến hành giao dịch sau khi tham quan.',
      signatureAdvisor: 'Cố Vấn Khách Hàng Cao Cấp · Private Client Desk',
      signatureClient: 'Xác Nhận Của Nhà Đầu Tư',
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
      solar: 'Sun-Path Lab',
      market: 'Corridors & Alpha',
      simulator: 'Mortgage & ROI',
      compare: 'Compare',
      vault: 'VIP Vault',
      schedule: 'VIP Viewing',
      themeDark: 'Midnight Navy',
      themeLight: 'Daylight Ivory',
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
      shortlistFilterBtn: 'Saved Shortlist',
      saveShortlistBtn: 'Save to Shortlist',
      savedShortlistBtn: 'Saved in Shortlist',
      holdDepositBtn: 'Hold Deposit (VietQR)',
      printDossierBtn: 'Print A4 Dossier PDF',
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
      exportCsvBtn: 'Export Excel CSV (BOM)',
      printPdfBtn: 'Print A4 Dossier PDF',
      copiedLabel: 'Downloaded',
      exportNote: 'Net yield deducts monthly tower service fees, 0.8-month vacancy reserve, and 10% Vietnam statutory rental tax. UTF-8 BOM CSV opens natively in Microsoft Excel.',
      stressEyebrow: 'FLOATING-RATE STRESS TEST & BANK DTI UNDERWRITING',
      stressTitle: 'Post-Promo Interest-Rate Shock (+0% / +2% / +4%)',
      stressSubtitle: 'Stress-test monthly debt service against floating-rate jumps after promotional lock expires and evaluate bank-grade Debt-to-Income (DTI) safety.',
      rateShockLabel: 'Post-Promo Rate Shock',
      monthlyIncomeLabel: 'Monthly Investor / Household Income',
      shockBase: '+0% Base',
      shockModerate: '+2% Floating',
      shockSevere: '+4% Severe Shock',
      stressedPmtLabel: 'Stressed Monthly PMT',
      shockDeltaLabel: 'Monthly Payment Impact',
      dtiRatioLabel: 'Debt-to-Income (DTI)',
      dtiSafeLabel: 'Bank-Grade Safe (<=35%)',
      dtiCautionLabel: 'Moderate Stretch (<=50%)',
      dtiRiskLabel: 'Elevated DTI Risk (>50%)',
      colScenario: 'Scenario',
      colEffRate: 'Eff. Rate',
      colMonthlyPmt: 'Monthly PMT',
      colDeltaPmt: 'Shock Delta',
      colNetCashFlow: 'Net Cash Flow',
      colDti: 'DTI',
      colSafety: 'Safety Tier',
      scheduleTab10Y: '10-Year Schedule',
      scheduleTabFull: 'Full Loan Term',
      totalRowLabel: 'Displayed Period Total',
      leverageEyebrow: '10-YEAR INVESTOR YIELD & LEVERAGE CASHFLOW MATRIX',
      leverageTitle: '100% Cash Acquisition vs 70% Bank Leverage & Net IRR',
      leverageSubtitle: 'Side-by-side institutional comparison across rental yield, tower management & statutory taxes, interest expense, capital appreciation, equity multiple, and exact Net IRR upon Year-10 exit.',
      leverageCashTitle: '100% Cash Purchase (0% LTV)',
      leverageBankTitle: 'Bank Leverage Strategy',
      leverageAlphaLabel: 'Leverage Alpha (Net IRR Spread)',
      leverageCapitalFreed: 'Capital Freed for Co-Investment',
      leverageMultipleAdv: 'Equity Multiple Advantage',
      leverageRowInitialEquity: 'Initial Equity Deployed',
      leverageRowGrossRent: '10-Year Gross Rental Income',
      leverageRowOpFees: '10Y Management, Vacancy & Tax',
      leverageRowInterest: '10-Year Bank Interest Paid',
      leverageRowExitVal: 'Year-10 Exit Valuation',
      leverageRowNetExit: 'Net Exit Proceeds (Post 2% Tax)',
      leverageRowNetProfit: '10-Year Total Net Profit',
      leverageRowMultiple: 'Equity Multiple (MOIC)',
      leverageRowNetIrr: 'Net Annualized IRR',
      leverageNote: 'Models 3%/yr conservative rental escalation, 0.8-month annual vacancy, 10% Vietnam statutory rental tax, and 2% resale transfer tax at Year-10 exit.',
    },
    solar: {
      eyebrow: 'SAIGON SOLAR GEOMETRY & DAYLIGHT ORIENTATION LAB',
      title: 'Interactive Sun-Path & Floorplan Daylight Exposure',
      subtitle: 'Astronomical solar geometry calibrated for Thu Thiem, Ho Chi Minh City (10.7725° N, 106.7219° E) across 06:00–18:00 and all four solstices/equinoxes — computing altitude, azimuth, facade thermal load (W/m²), sun penetration, and natural daylight lux.',
      coordsBadge: '10.7725° N · 106.7219° E · UTC+7',
      timeSliderLabel: 'Local Time of Day (Saigon)',
      seasonLabel: 'Solar Season / Declination',
      orientationLabel: 'Balcony & Facade Orientation',
      syncedUnitPrefix: 'Floorplan synced to',
      presetMorning: '07:30 Dawn Light',
      presetNoon: '12:00 Solar Noon',
      presetAfternoon: '15:30 West Peak',
      presetSunset: '17:15 Golden Hour',
      altitudeLabel: 'Solar Altitude',
      azimuthLabel: 'Solar Azimuth',
      thermalLoadLabel: 'Facade Thermal Load',
      interiorGainLabel: 'Interior Low-E Gain',
      penetrationLabel: 'Direct Sun Penetration',
      daylightLuxLabel: 'Natural Daylight Lux',
      noonPeakPrefix: 'Noon zenith',
      beamActiveBadge: 'DIRECT SUN PENETRATION',
      beamShadedBadge: 'DIFFUSE RIVER DAYLIGHT',
      compassCaption: 'Polar sun-path compass coupled with the selected residence floorplan and dynamic directional sunlight beam.',
      profileTitle: 'Hourly Facade Thermal Load Profile (06:00 – 18:00)',
      profileSubtitle: 'Exterior vertical irradiance (W/m²) versus interior solar heat gain through triple Low-E glazing + 2.2m loggia overhang',
      lowESpecNote: 'Triple-glazed acoustic Low-E curtain wall (SHGC 0.36 · VLT 62%) paired with a 2.2m recessed architectural loggia mitigates >64% of peak radiant heat load.',
      comfortTiers: {
        OPTIMAL_DAYLIGHT: 'Optimal Daylight',
        BRIGHT_DIRECT_GLARE: 'High Glare · Shade Advised',
        AMBIENT_DIFFUSE: 'Soft Ambient Daylight',
        TWILIGHT_LOW: 'Dawn / Dusk Horizon',
      },
      thermalTiers: {
        COOL_MORNING: 'Cool & Shaded',
        BALANCED: 'Balanced Thermal Envelope',
        ELEVATED_SOLAR_GAIN: 'Elevated Solar Load',
        PEAK_WEST_LOAD: 'Peak West Thermal Load',
      },
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
      downloadIcsBtn: 'Add to Calendar (.ics)',
      holdDepositCta: 'Hold Unit Deposit (VietQR)',
      savedToVaultBadge: 'Persisted in VIP Vault',
      openVaultBtn: 'Open VIP Vault',
      bookAnotherBtn: 'Schedule Another Viewing',
      poweredBy: 'Private Client Desk · Powered by TVT Studio',
      validationError: 'Please provide your full name, phone number, and a valid email address.',
    },
    vault: {
      eyebrow: 'PRIVATE CLIENT VAULT · PERSISTENT LOCAL STORAGE',
      title: 'Saved Shortlist & VIP Viewing Pass Vault',
      subtitle: 'Your bookmarked sky-residences, scheduled private viewing appointments, and refundable reservation hold receipts persist securely across reloads.',
      tabShortlist: 'Saved Shortlist',
      tabPasses: 'VIP Viewing Passes',
      emptyShortlist: 'No bookmarked residences yet. Click the bookmark icon on any sky-residence to curate your private shortlist.',
      emptyPasses: 'No private viewing appointments saved yet. Schedule a VIP viewing to issue a deterministic QR pass and .ics calendar invite.',
      activeHoldsTitle: 'Recorded Refundable Hold Previews',
      inspectBtn: 'Inspect Unit',
      simulateBtn: 'Simulate',
      depositBtn: 'VietQR Deposit',
      bookBtn: 'Book VIP',
      downloadIcsBtn: 'Calendar (.ics)',
      downloadTxtBtn: 'Pass (.txt)',
      removeBtn: 'Remove',
      persistedNote: 'Stored locally in browser storage (localStorage) — restored automatically across page reloads.',
      bookNewViewingBtn: 'Schedule New Viewing',
    },
    deposit: {
      eyebrow: 'TECHCOMBANK VIETQR · 100% REFUNDABLE PRIORITY HOLD',
      title: 'Refundable Unit Hold Deposit via VietQR',
      subtitle: 'Scan the live Techcombank NAPAS 247 VietQR code to execute or preview a 100% refundable priority reservation lock on this residence.',
      selectTierLabel: 'Select Refundable Priority Hold Tier',
      qrTitle: 'Live Techcombank VietQR Code',
      qrLiveBadge: 'LIVE VIETQR',
      qrFallbackBadge: 'EMVCO OFFLINE QR',
      qrScanHint: 'Scan with any Vietnamese mobile banking app to auto-fill Techcombank beneficiary, hold amount, and transfer reference.',
      bankLabel: 'Beneficiary Bank',
      accountNoLabel: 'Account Number',
      accountHolderLabel: 'Beneficiary Name',
      amountLabel: 'Hold Deposit Amount',
      memoLabel: 'Transfer Reference Memo',
      copyBtn: 'Copy',
      copiedBtn: 'Copied',
      guaranteeTitle: '100% Risk-Free Refund Guarantee',
      guaranteeBody: 'Priority unit hold deposits are 100% refundable within 7 business days if you choose not to proceed after inspecting the residence.',
      saveHoldBtn: 'Save Hold Preview to VIP Vault',
      holdSavedLabel: 'Saved to VIP Vault',
      closeBtn: 'Close',
    },
    print: {
      eyebrow: 'THE KINETIX RESIDENCES · THU THIEM RIVERFRONT · EXECUTIVE A4 INVESTMENT DOSSIER',
      title: 'Institutional Property Underwriting & Cashflow Dossier',
      generatedOn: 'Issued Date',
      assetSection: '1. Architectural Specifications & Valuation',
      underwritingSection: '2. Mortgage Structure & Rental Yield Telemetry',
      stressSection: '3. Post-Promo Floating-Rate Stress Test (+0% / +2% / +4%) & DTI',
      amortizationSection: '4. 10-Year Amortization & Net Equity Trajectory',
      depositSection: '5. Refundable Priority Hold Instructions (Techcombank VietQR)',
      refundNotice: 'Priority hold deposit is 100% refundable within 7 business days if buyer declines after private gallery inspection.',
      signatureAdvisor: 'Director of Private Client Advisory',
      signatureClient: 'Investor / Principal Counterparty',
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
