import { describe, expect, it } from 'vitest';
import { RESIDENCES } from '../../data/residences';
import {
  analyzeMortgageAndRoi,
  buildInvestmentCashflowCsv,
  classifyDtiSafety,
  computeInterestRateStressTest,
  escapeCsvCell,
} from '../mortgageEngine';
import { filterAndSortResidences } from '../residenceEngine';
import { buildViewingIcsContent, escapeIcsText, issueVipPass } from '../vipPassEngine';
import {
  TECHCOMBANK_VIETQR_CONFIG,
  buildDepositTransferMemo,
  buildEmvCoVietQrPayload,
  buildTechcombankVietQrUrl,
  crc16CcittFalse,
  createDepositHoldRecord,
  sanitizeTransferMemo,
} from '../vietQrEngine';
import {
  DEPOSIT_HOLDS_STORAGE_KEY,
  SHORTLIST_STORAGE_KEY,
  VIP_PASSES_STORAGE_KEY,
  loadDepositHolds,
  loadShortlistIds,
  loadVipPasses,
  saveDepositHolds,
  saveShortlistIds,
  saveVipPasses,
  upsertVipPass,
} from '../vaultStorageEngine';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('v2.0 VIP PRO — Interest-Rate Stress Test, DTI & UTF-8 BOM CSV', () => {
  const sampleInputs = {
    propertyPriceVnd: 24_200_000_000,
    downPaymentPct: 30,
    loanTermYears: 20,
    annualInterestRatePct: 7.2,
    estimatedMonthlyRentVnd: 152_000_000,
    monthlyMaintenanceFeeVnd: 132 * 40_000,
    annualAppreciationPct: 6.0,
  };

  it('classifies bank Debt-to-Income (DTI) safety tiers accurately across boundaries', () => {
    expect(classifyDtiSafety(25)).toBe('SAFE');
    expect(classifyDtiSafety(35)).toBe('SAFE');
    expect(classifyDtiSafety(35.1)).toBe('CAUTION');
    expect(classifyDtiSafety(50)).toBe('CAUTION');
    expect(classifyDtiSafety(50.1)).toBe('HIGH_RISK');
  });

  it('computes +0%, +2%, and +4% floating-rate stress shocks with monotonic payment & DTI impact', () => {
    const summary = computeInterestRateStressTest(sampleInputs, 2, 420_000_000);

    expect(summary.benchmarkScenarios).toHaveLength(3);
    const [base, shock2, shock4] = summary.benchmarkScenarios;

    expect(base.shockPct).toBe(0);
    expect(base.deltaMonthlyPaymentVnd).toBe(0);
    expect(shock2.effectiveRatePct).toBeCloseTo(9.2, 2);
    expect(shock4.effectiveRatePct).toBeCloseTo(11.2, 2);

    expect(shock2.monthlyPaymentVnd).toBeGreaterThan(base.monthlyPaymentVnd);
    expect(shock4.monthlyPaymentVnd).toBeGreaterThan(shock2.monthlyPaymentVnd);
    expect(shock4.deltaMonthlyPaymentVnd).toBeGreaterThan(shock2.deltaMonthlyPaymentVnd);
    expect(shock4.dtiRatioPct).toBeGreaterThan(shock2.dtiRatioPct);
    expect(summary.activeScenario.monthlyPaymentVnd).toBe(shock2.monthlyPaymentVnd);
  });

  it('mitigates CSV formula injection and escapes commas and quotes cleanly', () => {
    expect(escapeCsvCell('=CMD|calc')).toBe("'=CMD|calc");
    expect(escapeCsvCell('+SUM(A1:A2)')).toBe("'+SUM(A1:A2)");
    expect(escapeCsvCell('K-40P, "Obsidian" Penthouse')).toBe('"K-40P, ""Obsidian"" Penthouse"');
    expect(escapeCsvCell(125000000)).toBe('125000000');
  });

  it('exports Excel-ready UTF-8 BOM CSV containing stress test, 10-year projection, and amortization schedule', () => {
    const unit = RESIDENCES[10];
    const analysis = analyzeMortgageAndRoi(sampleInputs);
    const stress = computeInterestRateStressTest(sampleInputs, 2, 500_000_000);

    const csvVi = buildInvestmentCashflowCsv(analysis, sampleInputs, stress, 'VND', 'vi', unit);
    expect(csvVi.startsWith('\uFEFF')).toBe(true);
    expect(csvVi).toContain('KINETIX PROPTECH v2.0 VIP PRO');
    expect(csvVi).toContain(unit.code);
    expect(csvVi).toContain('Shock +2.0%');
    expect(csvVi).toContain('Shock +4.0%');
    expect(csvVi).toContain('BẢNG KHẤU HAO DƯ NỢ CHI TIẾT THEO NĂM');

    const csvUsd = buildInvestmentCashflowCsv(analysis, sampleInputs, stress, 'USD', 'en', unit);
    expect(csvUsd.startsWith('\uFEFF')).toBe(true);
    expect(csvUsd).toContain('Display Currency,USD');
    expect(csvUsd).toContain('YEAR-BY-YEAR AMORTIZATION SCHEDULE');
  });
});

describe('v2.0 VIP PRO — RFC 5545 Calendar (.ics) & Techcombank VietQR Engine', () => {
  const unit = RESIDENCES[10]; // K-40P

  it('generates valid RFC 5545 .ics calendar invites with escaped text and 90-minute viewing duration', () => {
    const pass = issueVipPass(
      {
        residenceId: unit.id,
        residenceCode: unit.code,
        dateIso: '2026-12-08',
        timeSlot: '18:30 Sunset',
        format: 'GALLERY_ONSITE',
        clientName: 'Nguyễn Minh Quân',
        clientPhone: '0901234567',
        clientEmail: 'quan@capital.vn',
        notes: 'Request CAD; check river view, floor 40',
      },
      '2026-11-27T01:30:00Z'
    );

    const ics = buildViewingIcsContent(pass, unit, 'en');
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain(`UID:${pass.passCode}@kinetix.tvtstudio.vn`);
    expect(ics).toContain('DTSTART;TZID=Asia/Ho_Chi_Minh:20261208T183000');
    expect(ics).toContain('DTEND;TZID=Asia/Ho_Chi_Minh:20261208T200000');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('END:VCALENDAR\r\n');
    expect(escapeIcsText('A;B,C\nD')).toBe('A\\;B\\,C\\nD');
  });

  it('builds official Techcombank VietQR QuickLink URL (970407 / 19077742964012 / TRUONG VAN TINH)', () => {
    const memo = buildDepositTransferMemo('K-40P', 'KNX-2026-AB12');
    expect(memo).toBe('KINETIX HOLD K40P KNX2026AB12');

    const url = buildTechcombankVietQrUrl(200_000_000, memo, 'compact2');
    expect(url).toContain(
      `https://img.vietqr.io/image/${TECHCOMBANK_VIETQR_CONFIG.bankBin}-${TECHCOMBANK_VIETQR_CONFIG.accountNumber}-compact2.svg`
    );
    expect(url).toContain('amount=200000000');
    expect(url).toContain('accountName=TRUONG+VAN+TINH');
    expect(url).toContain('addInfo=KINETIX+HOLD+K40P+KNX2026AB12');
  });

  it('sanitizes Vietnamese diacritics and symbols in NAPAS transfer memos safely', () => {
    expect(sanitizeTransferMemo('Đặt cọc căn hộ K-40P @ Thủ Thiêm!')).toBe('DAT COC CAN HO K-40P THU THIEM');
  });

  it('computes exact ISO/IEC 13239 CRC-16/CCITT-FALSE and spec-compliant EMVCo VietQR payload', () => {
    // Standard CRC-16/CCITT-FALSE check value for "123456789" is 0x29B1
    expect(crc16CcittFalse('123456789')).toBe('29B1');

    const emv = buildEmvCoVietQrPayload(100_000_000, 'KINETIX HOLD K40P');
    expect(emv.startsWith('000201010212')).toBe(true);
    expect(emv).toContain('A000000727');
    expect(emv).toContain('970407');
    expect(emv).toContain('19077742964012');
    expect(emv).toContain('5303704');
    expect(emv).toContain('5409100000000');
    expect(emv).toContain('5802VN');

    // Verify self-consistent CRC suffix
    const body = emv.slice(0, -4);
    const checksum = emv.slice(-4);
    expect(crc16CcittFalse(body)).toBe(checksum);
  });

  it('creates deterministic refundable deposit hold records with Techcombank beneficiary details', () => {
    const recA = createDepositHoldRecord('knx-40p', 'K-40P', 100_000_000, 'KNX-2026-99AA', '2026-11-27T02:00:00Z');
    const recB = createDepositHoldRecord('knx-40p', 'K-40P', 100_000_000, 'KNX-2026-99AA', '2026-11-27T02:00:00Z');
    expect(recA.holdId).toMatch(/^HOLD-2026-[23456789A-HJ-NP-Z]{4}$/);
    expect(recA.holdId).toBe(recB.holdId);
    expect(recA.bankBin).toBe('970407');
    expect(recA.accountNumber).toBe('19077742964012');
    expect(recA.accountName).toBe('TRUONG VAN TINH');
  });
});

describe('v2.0 VIP PRO — Persistent VIP Vault Storage & Shortlist Filter', () => {
  it('persists and hydrates shortlisted residences, pruning invalid or duplicate IDs', () => {
    const storage = createMemoryStorage();
    const validIds = RESIDENCES.map((r) => r.id);

    saveShortlistIds(['knx-40p', 'knx-28a', 'knx-40p', 'non-existent-unit'], storage);
    const hydrated = loadShortlistIds(validIds, storage);
    expect(hydrated).toEqual(['knx-40p', 'knx-28a']);

    const shortlistedOnly = filterAndSortResidences(
      RESIDENCES,
      {
        tier: 'ALL',
        orientation: 'ALL',
        status: 'ALL',
        floor: null,
        maxPriceVnd: 90_000_000_000,
        sortBy: 'FLOOR_DESC',
        shortlistOnly: true,
      },
      hydrated
    );
    expect(shortlistedOnly).toHaveLength(2);
    expect(shortlistedOnly.map((u) => u.id)).toEqual(['knx-40p', 'knx-28a']);
  });

  it('persists VIP passes compactly and deterministically rehydrates 21x21 QR matrices on reload', () => {
    const storage = createMemoryStorage();
    const pass = issueVipPass(
      {
        residenceId: 'knx-40p',
        residenceCode: 'K-40P',
        dateIso: '2026-12-10',
        timeSlot: '16:30',
        format: 'PRIVATE_3D_TOUR',
        clientName: 'Trương Văn Tình',
        clientPhone: '0931467024',
        clientEmail: 'tinhkun102@gmail.com',
      },
      '2026-11-27T02:00:00Z'
    );

    const list = upsertVipPass([], pass);
    saveVipPasses(list, storage);
    const hydrated = loadVipPasses(storage);

    expect(hydrated).toHaveLength(1);
    expect(hydrated[0].passCode).toBe(pass.passCode);
    expect(hydrated[0].qrMatrix).toEqual(pass.qrMatrix);
  });

  it('handles malformed or tampered localStorage JSON gracefully without throwing', () => {
    const storage = createMemoryStorage();
    storage.setItem(SHORTLIST_STORAGE_KEY, '{corrupt json');
    storage.setItem(VIP_PASSES_STORAGE_KEY, '[{"bad":"shape"}]');
    storage.setItem(DEPOSIT_HOLDS_STORAGE_KEY, 'null');

    expect(loadShortlistIds(['knx-40p'], storage)).toEqual([]);
    expect(loadVipPasses(storage)).toEqual([]);
    expect(loadDepositHolds(storage)).toEqual([]);

    const hold = createDepositHoldRecord('knx-40p', 'K-40P', 500_000_000);
    saveDepositHolds([hold], storage);
    expect(loadDepositHolds(storage)).toEqual([hold]);
  });
});
