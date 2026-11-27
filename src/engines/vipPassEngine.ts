import type { Language, Residence, ViewingBookingInput, VipPassRecord } from '../types/proptech';

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

/**
 * Escapes RFC 5545 text values for safe iCalendar (.ics) generation.
 */
export function escapeIcsText(value: string): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatIcsLocalDateTime(dateIso: string, hours: number, minutes: number): string {
  const cleanDate = dateIso.replace(/[^0-9]/g, '').slice(0, 8);
  const safeDate = cleanDate.length === 8 ? cleanDate : '20261201';
  const hh = String(Math.max(0, Math.min(23, hours))).padStart(2, '0');
  const mm = String(Math.max(0, Math.min(59, minutes))).padStart(2, '0');
  return `${safeDate}T${hh}${mm}00`;
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) invite for a VIP private viewing appointment.
 * Supports Apple Calendar, Google Calendar, and Microsoft Outlook with Asia/Ho_Chi_Minh timezone.
 */
export function buildViewingIcsContent(
  pass: VipPassRecord,
  residence: Residence | undefined,
  lang: Language = 'vi'
): string {
  const match = pass.timeSlot.match(/(\d{1,2}):(\d{2})/);
  const startHour = match ? Number(match[1]) : 10;
  const startMin = match ? Number(match[2]) : 0;

  // Standard 90-minute VIP viewing window
  const totalEndMinutes = startHour * 60 + startMin + 90;
  const endHour = Math.min(23, Math.floor(totalEndMinutes / 60));
  const endMin = totalEndMinutes % 60;

  const dtStart = formatIcsLocalDateTime(pass.dateIso, startHour, startMin);
  const dtEnd = formatIcsLocalDateTime(pass.dateIso, endHour, endMin);
  const dtStamp = pass.issuedAtIso
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z')
    .slice(0, 16);
  const safeStamp = /^\d{8}T\d{6}Z$/.test(dtStamp) ? dtStamp : '20261127T010000Z';

  const unitName = residence
    ? `${residence.code} — ${lang === 'vi' ? residence.nameVi : residence.nameEn} (F${residence.floor})`
    : pass.residenceCode;

  const summary =
    lang === 'vi'
      ? `Kinetix VIP Viewing: ${pass.residenceCode} (${pass.passCode})`
      : `Kinetix Private VIP Viewing: ${pass.residenceCode} (${pass.passCode})`;

  const location =
    pass.format === 'GALLERY_ONSITE'
      ? 'Kinetix Riverfront Gallery, Thu Thiem Peninsula, Ho Chi Minh City'
      : 'Private 3D Architectural Video Walkthrough (Link via Kinetix Advisor)';

  const descriptionLines = [
    `VIP Pass Code: ${pass.passCode}`,
    `Guest: ${pass.clientName}`,
    `Residence: ${unitName}`,
    `Private Advisor: ${pass.advisorName} (${lang === 'vi' ? pass.advisorTitleVi : pass.advisorTitleEn})`,
    `Contact: ${pass.clientPhone} | ${pass.clientEmail}`,
    pass.notes ? `Notes: ${pass.notes}` : '',
    'Private Client Desk: +84 931 467 024 | tinhkun102@gmail.com',
  ].filter(Boolean);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kinetix PropTech//TVT Studio VIP Desk//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(pass.passCode)}@kinetix.tvtstudio.vn`,
    `DTSTAMP:${safeStamp}`,
    `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`,
    `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines.join('\n'))}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.join('\r\n')}\r\n`;
}
