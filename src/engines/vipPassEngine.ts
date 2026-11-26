import type { ViewingBookingInput, VipPassRecord } from '../types/proptech';

/**
 * Deterministic 32-bit FNV-1a hash for generating repeatable VIP pass codes
 * and geometric QR matrices with zero randomness flakiness.
 */
export function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Generates deterministic VIP Pass code in format: KNX-2026-XXXX
 */
export function generateDeterministicPassCode(input: ViewingBookingInput): string {
  const canonical = [
    input.residenceCode.trim().toUpperCase(),
    input.dateIso.trim(),
    input.timeSlot.trim(),
    input.format,
    input.clientEmail.trim().toLowerCase(),
    input.clientPhone.replace(/\s+/g, ''),
  ].join('|');

  const h = fnv1aHash(canonical);
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  let n = h;
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length) ^ ((h >>> (i * 5)) & 0x1f);
  }
  return `KNX-2026-${suffix}`;
}

/**
 * Generates a crisp 21x21 QR-style matrix with standard 3-corner finder patterns
 * and deterministic payload bits encoded from the VIP pass payload.
 */
export function generateDeterministicQrMatrix(payload: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const placeFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[top + r][left + c] = isBorder || isCenter;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing strips
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  const isReserved = (r: number, c: number) => {
    const inTopLeft = r < 8 && c < 8;
    const inTopRight = r < 8 && c >= size - 8;
    const inBottomLeft = r >= size - 8 && c < 8;
    const inTiming = r === 6 || c === 6;
    return inTopLeft || inTopRight || inBottomLeft || inTiming;
  };

  let state = fnv1aHash(payload) || 0x12345678;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isReserved(r, c)) continue;
      // Xorshift32 deterministic stream
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      grid[r][c] = ((state >>> 0) & 1) === 1;
    }
  }

  return grid;
}

const PRIVATE_ADVISORS = [
  {
    name: 'Lê Hoàng Gia Bảo',
    titleVi: 'Giám Đốc Khách Hàng Cá Nhân Cao Cấp',
    titleEn: 'Director of Private Client Advisory',
  },
  {
    name: 'Trần Ngọc Khánh Linh',
    titleVi: 'Chuyên Gia Thẩm Định Đầu Tư BĐS Hạng Sang',
    titleEn: 'Senior Luxury Asset & Yield Strategist',
  },
  {
    name: 'Nguyễn Minh Triết',
    titleVi: 'Cố Vấn Kiến Trúc & Quỹ Căn Crown Collection',
    titleEn: 'Crown Collection Architectural Advisor',
  },
];

export function issueVipPass(input: ViewingBookingInput, issuedAtIso?: string): VipPassRecord {
  const passCode = generateDeterministicPassCode(input);
  const advisorIndex = fnv1aHash(input.residenceCode) % PRIVATE_ADVISORS.length;
  const advisor = PRIVATE_ADVISORS[advisorIndex];
  const qrPayload = `${passCode}|${input.residenceCode}|${input.dateIso}|${input.timeSlot}|${input.format}`;

  return {
    ...input,
    passCode,
    advisorName: advisor.name,
    advisorTitleVi: advisor.titleVi,
    advisorTitleEn: advisor.titleEn,
    issuedAtIso: issuedAtIso ?? new Date().toISOString(),
    qrMatrix: generateDeterministicQrMatrix(qrPayload),
  };
}
