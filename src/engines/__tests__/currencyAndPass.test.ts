import { describe, expect, it } from 'vitest';
import {
  VND_PER_USD,
  convertUsdToVnd,
  convertVndToUsd,
  formatCurrency,
  formatPricePerSqm,
} from '../currencyEngine';
import {
  generateDeterministicPassCode,
  generateDeterministicQrMatrix,
  issueVipPass,
} from '../vipPassEngine';

describe('currencyEngine — VND / USD Conversion & Formatting', () => {
  it('converts accurately between VND and USD round-trip', () => {
    const usd = convertVndToUsd(25_400_000_000);
    expect(usd).toBe(1_000_000);
    expect(convertUsdToVnd(usd)).toBe(25_400_000_000);
    expect(VND_PER_USD).toBe(25_400);
  });

  it('formats full and compact VND amounts cleanly in VI and EN', () => {
    expect(formatCurrency(24_200_000_000, 'VND', 'vi')).toBe('24.20 tỷ VNĐ');
    expect(formatCurrency(24_200_000_000, 'VND', 'vi', { compact: true })).toBe('24.2 tỷ');
    expect(formatCurrency(24_200_000_000, 'VND', 'en', { compact: true })).toBe('24.2B VND');
    expect(formatCurrency(152_000_000, 'VND', 'vi', { compact: true })).toBe('152 tr');
  });

  it('formats full and compact USD amounts cleanly with signs', () => {
    expect(formatCurrency(25_400_000_000, 'USD', 'en', { compact: true })).toBe('$1.00M');
    expect(formatCurrency(-25_400_000, 'USD', 'en')).toBe('-$1,000');
    expect(formatCurrency(25_400_000, 'USD', 'en', { signed: true })).toBe('+$1,000');
  });

  it('formats price per square meter in both VND and USD', () => {
    const vndPerSqm = formatPricePerSqm(20_000_000_000, 100, 'VND', 'vi');
    expect(vndPerSqm).toBe('200.0 tr/m²');

    const usdPerSqm = formatPricePerSqm(25_400_000_000, 100, 'USD', 'en');
    expect(usdPerSqm).toBe('$10,000/m²');
  });
});

describe('vipPassEngine — Deterministic VIP Pass & QR Matrix', () => {
  const sampleBooking = {
    residenceId: 'knx-42p',
    residenceCode: 'K-42P',
    dateIso: '2026-12-02',
    timeSlot: '16:30',
    format: 'GALLERY_ONSITE' as const,
    clientName: 'Trương Văn Tình',
    clientPhone: '0931467024',
    clientEmail: 'tinhkun102@gmail.com',
  };

  it('generates deterministic KNX-2026-XXXX codes for identical inputs', () => {
    const codeA = generateDeterministicPassCode(sampleBooking);
    const codeB = generateDeterministicPassCode({
      ...sampleBooking,
      clientEmail: ' TINHKUN102@GMAIL.COM ',
      clientPhone: '0931 467 024',
    });

    expect(codeA).toMatch(/^KNX-2026-[23456789A-HJ-NP-Z]{4}$/);
    expect(codeA).toBe(codeB);
  });

  it('produces distinct pass codes when residence or time changes', () => {
    const code1 = generateDeterministicPassCode(sampleBooking);
    const code2 = generateDeterministicPassCode({ ...sampleBooking, timeSlot: '18:30' });
    const code3 = generateDeterministicPassCode({ ...sampleBooking, residenceCode: 'K-28A' });

    expect(code1).not.toBe(code2);
    expect(code1).not.toBe(code3);
  });

  it('builds a valid 21x21 QR matrix with corner finder patterns and issues complete VIP pass', () => {
    const pass = issueVipPass(sampleBooking, '2026-11-26T13:00:00Z');
    expect(pass.passCode).toMatch(/^KNX-2026-/);
    expect(pass.qrMatrix).toHaveLength(21);
    expect(pass.qrMatrix.every((row) => row.length === 21)).toBe(true);
    // Top-left finder corner must be filled
    expect(pass.qrMatrix[0][0]).toBe(true);
    expect(pass.qrMatrix[3][3]).toBe(true);
    expect(pass.qrMatrix[1][1]).toBe(false);
    expect(pass.advisorName.length).toBeGreaterThan(3);

    // Identical payload yields identical QR matrix
    const qr2 = generateDeterministicQrMatrix(
      `${pass.passCode}|${sampleBooking.residenceCode}|${sampleBooking.dateIso}|${sampleBooking.timeSlot}|${sampleBooking.format}`
    );
    expect(qr2).toEqual(pass.qrMatrix);
  });
});
