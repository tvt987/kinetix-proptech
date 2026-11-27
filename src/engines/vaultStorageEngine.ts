import type { DepositHoldRecord, VipPassRecord } from '../types/proptech';
import { generateDeterministicQrMatrix } from './vipPassEngine';

export const SHORTLIST_STORAGE_KEY = 'kinetix_shortlist_v2';
export const VIP_PASSES_STORAGE_KEY = 'kinetix_vip_passes_v2';
export const DEPOSIT_HOLDS_STORAGE_KEY = 'kinetix_deposit_holds_v2';

function resolveStorage(explicit?: Storage): Storage | null {
  if (explicit) return explicit;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function loadShortlistIds(validResidenceIds: string[], explicitStorage?: Storage): string[] {
  const storage = resolveStorage(explicitStorage);
  if (!storage) return [];
  try {
    const raw = storage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validSet = new Set(validResidenceIds);
    const deduped: string[] = [];
    for (const item of parsed) {
      if (typeof item === 'string' && validSet.has(item) && !deduped.includes(item)) {
        deduped.push(item);
      }
    }
    return deduped;
  } catch {
    return [];
  }
}

export function saveShortlistIds(ids: string[], explicitStorage?: Storage): void {
  const storage = resolveStorage(explicitStorage);
  if (!storage) return;
  try {
    storage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota / privacy mode errors gracefully
  }
}

function isValidPassShape(item: unknown): item is Omit<VipPassRecord, 'qrMatrix'> & { qrMatrix?: boolean[][] } {
  if (!item || typeof item !== 'object') return false;
  const rec = item as Record<string, unknown>;
  return (
    typeof rec.passCode === 'string' &&
    typeof rec.residenceId === 'string' &&
    typeof rec.residenceCode === 'string' &&
    typeof rec.dateIso === 'string' &&
    typeof rec.timeSlot === 'string' &&
    (rec.format === 'GALLERY_ONSITE' || rec.format === 'PRIVATE_3D_TOUR') &&
    typeof rec.clientName === 'string' &&
    typeof rec.clientPhone === 'string' &&
    typeof rec.clientEmail === 'string' &&
    typeof rec.advisorName === 'string' &&
    typeof rec.advisorTitleVi === 'string' &&
    typeof rec.advisorTitleEn === 'string' &&
    typeof rec.issuedAtIso === 'string'
  );
}

export function loadVipPasses(explicitStorage?: Storage): VipPassRecord[] {
  const storage = resolveStorage(explicitStorage);
  if (!storage) return [];
  try {
    const raw = storage.getItem(VIP_PASSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const passes: VipPassRecord[] = [];
    const seen = new Set<string>();

    for (const item of parsed) {
      if (!isValidPassShape(item) || seen.has(item.passCode)) continue;
      seen.add(item.passCode);
      const validMatrix =
        Array.isArray(item.qrMatrix) &&
        item.qrMatrix.length === 21 &&
        item.qrMatrix.every((row) => Array.isArray(row) && row.length === 21);

      const qrPayload = `${item.passCode}|${item.residenceCode}|${item.dateIso}|${item.timeSlot}|${item.format}`;
      passes.push({
        ...item,
        qrMatrix: validMatrix ? (item.qrMatrix as boolean[][]) : generateDeterministicQrMatrix(qrPayload),
      });
    }
    return passes;
  } catch {
    return [];
  }
}

export function saveVipPasses(passes: VipPassRecord[], explicitStorage?: Storage): void {
  const storage = resolveStorage(explicitStorage);
  if (!storage) return;
  try {
    // Store without heavy qrMatrix since qrMatrix is 100% deterministic from pass payload
    const compact = passes.map(({ qrMatrix: _omit, ...rest }) => rest);
    storage.setItem(VIP_PASSES_STORAGE_KEY, JSON.stringify(compact));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function upsertVipPass(existing: VipPassRecord[], nextPass: VipPassRecord): VipPassRecord[] {
  const filtered = existing.filter((p) => p.passCode !== nextPass.passCode);
  return [nextPass, ...filtered].slice(0, 20);
}

function isValidDepositHoldShape(item: unknown): item is DepositHoldRecord {
  if (!item || typeof item !== 'object') return false;
  const rec = item as Record<string, unknown>;
  return (
    typeof rec.holdId === 'string' &&
    typeof rec.residenceId === 'string' &&
    typeof rec.residenceCode === 'string' &&
    typeof rec.amountVnd === 'number' &&
    Number.isFinite(rec.amountVnd) &&
    typeof rec.transferMemo === 'string' &&
    typeof rec.createdAtIso === 'string' &&
    typeof rec.bankBin === 'string' &&
    typeof rec.accountNumber === 'string' &&
    typeof rec.accountName === 'string'
  );
}

export function loadDepositHolds(explicitStorage?: Storage): DepositHoldRecord[] {
  const storage = resolveStorage(explicitStorage);
  if (!storage) return [];
  try {
    const raw = storage.getItem(DEPOSIT_HOLDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const result: DepositHoldRecord[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      if (isValidDepositHoldShape(item) && !seen.has(item.holdId)) {
        seen.add(item.holdId);
        result.push(item);
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function saveDepositHolds(holds: DepositHoldRecord[], explicitStorage?: Storage): void {
  const storage = resolveStorage(explicitStorage);
  if (!storage) return;
  try {
    storage.setItem(DEPOSIT_HOLDS_STORAGE_KEY, JSON.stringify(holds.slice(0, 20)));
  } catch {
    // Ignore storage quota errors gracefully
  }
}
