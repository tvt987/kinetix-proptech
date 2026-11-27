import type { DepositHoldRecord } from '../types/proptech';
import { fnv1aHash } from './vipPassEngine';

export const TECHCOMBANK_VIETQR_CONFIG = {
  bankBin: '970407',
  bankCode: 'TCB',
  bankName: 'Techcombank',
  accountNumber: '19077742964012',
  accountName: 'TRUONG VAN TINH',
} as const;

export interface DepositTierOption {
  id: string;
  amountVnd: number;
  labelVi: string;
  labelEn: string;
  holdWindowVi: string;
  holdWindowEn: string;
}

export const DEPOSIT_HOLD_TIERS: DepositTierOption[] = [
  {
    id: 'priority-72h',
    amountVnd: 100_000_000,
    labelVi: 'Giữ Chỗ Ưu Tiên 72 Giờ',
    labelEn: '72-Hour Priority Hold',
    holdWindowVi: 'Hoàn lại 100% trong 7 ngày làm việc nếu không tiếp tục giao dịch',
    holdWindowEn: '100% refundable within 7 business days if declined after viewing',
  },
  {
    id: 'vip-corner',
    amountVnd: 200_000_000,
    labelVi: 'Khóa Căn VIP Riverfront',
    labelEn: 'VIP Riverfront Unit Lock',
    holdWindowVi: 'Giữ quyền ưu tiên số 1 cho căn hộ góc & tầng cao trong 5 ngày',
    holdWindowEn: 'Priority #1 reservation lock on high-floor river units for 5 days',
  },
  {
    id: 'crown-exclusive',
    amountVnd: 500_000_000,
    labelVi: 'Đặc Quyền Crown Penthouse',
    labelEn: 'Crown Penthouse Exclusive Lock',
    holdWindowVi: 'Khóa bảng hàng Penthouse / Duplex độc bản trong 7 ngày cùng cố vấn riêng',
    holdWindowEn: 'Exclusive 7-day Crown Penthouse inventory lock with private legal brief',
  },
];

/**
 * Normalizes a transfer memo to clean uppercase ASCII alphanumeric + spaces (max 50 chars)
 * compliant with NAPAS 247 / VietQR clearing rules.
 */
export function sanitizeTransferMemo(raw: string): string {
  return String(raw ?? '')
    .replace(/[đĐ]/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 50);
}

/**
 * Generates standardized Techcombank reservation transfer memo.
 */
export function buildDepositTransferMemo(residenceCode: string, passCode?: string): string {
  const cleanUnit = sanitizeTransferMemo(residenceCode).replace(/-/g, '');
  const cleanPass = passCode ? sanitizeTransferMemo(passCode).replace(/-/g, '') : '';
  const base = cleanPass ? `KINETIX HOLD ${cleanUnit} ${cleanPass}` : `KINETIX HOLD ${cleanUnit}`;
  return sanitizeTransferMemo(base);
}

/**
 * Builds direct SVG QuickLink URL for official Techcombank VietQR (HTTP 200 vector SVG).
 */
export function buildTechcombankVietQrUrl(
  amountVnd: number,
  transferMemo: string,
  template: 'compact2' | 'compact' | 'qr_only' = 'compact2'
): string {
  const safeAmount = Math.max(0, Math.round(Number.isFinite(amountVnd) ? amountVnd : 0));
  const cleanMemo = sanitizeTransferMemo(transferMemo);
  const params = new URLSearchParams({
    amount: String(safeAmount),
    addInfo: cleanMemo,
    accountName: TECHCOMBANK_VIETQR_CONFIG.accountName,
  });
  return `https://img.vietqr.io/image/${TECHCOMBANK_VIETQR_CONFIG.bankBin}-${TECHCOMBANK_VIETQR_CONFIG.accountNumber}-${template}.svg?${params.toString()}`;
}

function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Computes ISO/IEC 13239 CRC-16/CCITT-FALSE checksum (4 uppercase hex chars)
 * mandated by EMVCo Merchant-Presented QR & NAPAS VietQR specification.
 */
export function crc16CcittFalse(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Constructs a spec-compliant EMVCo NAPAS 247 VietQR string for Techcombank (970407)
 * including valid CRC-16 checksum (also powers offline fallback QR verification).
 */
export function buildEmvCoVietQrPayload(amountVnd: number, transferMemo: string): string {
  const safeAmount = Math.max(0, Math.round(Number.isFinite(amountVnd) ? amountVnd : 0));
  const cleanMemo = sanitizeTransferMemo(transferMemo);

  const bankAndAccount =
    tlv('00', TECHCOMBANK_VIETQR_CONFIG.bankBin) +
    tlv('01', TECHCOMBANK_VIETQR_CONFIG.accountNumber);

  const consumerAccountInfo =
    tlv('00', 'A000000727') +
    tlv('01', bankAndAccount) +
    tlv('02', 'QRIBFTTA');

  const additionalData = cleanMemo ? tlv('08', cleanMemo) : '';

  const payloadWithoutCrc =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('38', consumerAccountInfo) +
    tlv('53', '704') +
    (safeAmount > 0 ? tlv('54', String(safeAmount)) : '') +
    tlv('58', 'VN') +
    (additionalData ? tlv('62', additionalData) : '') +
    '6304';

  return `${payloadWithoutCrc}${crc16CcittFalse(payloadWithoutCrc)}`;
}

/**
 * Creates a deterministic, persistent hold preview record for the buyer's VIP Vault.
 */
export function createDepositHoldRecord(
  residenceId: string,
  residenceCode: string,
  amountVnd: number,
  passCode?: string,
  createdAtIso?: string
): DepositHoldRecord {
  const transferMemo = buildDepositTransferMemo(residenceCode, passCode);
  const hash = fnv1aHash(`${residenceCode}|${amountVnd}|${transferMemo}`);
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  let n = hash;
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length) ^ ((hash >>> (i * 5)) & 0x1f);
  }

  return {
    holdId: `HOLD-2026-${suffix}`,
    residenceId,
    residenceCode,
    amountVnd: Math.max(0, Math.round(amountVnd)),
    transferMemo,
    passCode,
    createdAtIso: createdAtIso ?? new Date().toISOString(),
    bankBin: TECHCOMBANK_VIETQR_CONFIG.bankBin,
    accountNumber: TECHCOMBANK_VIETQR_CONFIG.accountNumber,
    accountName: TECHCOMBANK_VIETQR_CONFIG.accountName,
  };
}
