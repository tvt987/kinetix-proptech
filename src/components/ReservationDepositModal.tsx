import React, { useEffect, useMemo, useState } from 'react';
import type { Currency, DepositHoldRecord, Language, Residence } from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import {
  DEPOSIT_HOLD_TIERS,
  TECHCOMBANK_VIETQR_CONFIG,
  buildDepositTransferMemo,
  buildEmvCoVietQrPayload,
  buildTechcombankVietQrUrl,
  createDepositHoldRecord,
} from '../engines/vietQrEngine';
import { generateDeterministicQrMatrix } from '../engines/vipPassEngine';
import { formatCurrency } from '../engines/currencyEngine';
import { CheckIcon, CloseIcon, CopyIcon, QrCodeIcon, ShieldCheckIcon } from './Icons';

interface ReservationDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  residence: Residence;
  linkedPassCode?: string;
  currency: Currency;
  lang: Language;
  copy: CopyBundle['deposit'];
  onSaveHoldRecord: (record: DepositHoldRecord) => void;
}

export const ReservationDepositModal: React.FC<ReservationDepositModalProps> = ({
  isOpen,
  onClose,
  residence,
  linkedPassCode,
  currency,
  lang,
  copy,
  onSaveHoldRecord,
}) => {
  const defaultTierId = residence.tier === 'PENTHOUSE' ? 'crown-exclusive' : 'priority-72h';
  const [selectedTierId, setSelectedTierId] = useState<string>(defaultTierId);
  const [qrImgFailed, setQrImgFailed] = useState(false);
  const [copiedField, setCopiedField] = useState<'none' | 'account' | 'memo'>('none');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTierId(residence.tier === 'PENTHOUSE' ? 'crown-exclusive' : 'priority-72h');
      setQrImgFailed(false);
      setCopiedField('none');
      setSavedNotice(false);
    }
  }, [isOpen, residence.id, residence.tier, linkedPassCode]);

  const activeTier =
    DEPOSIT_HOLD_TIERS.find((t) => t.id === selectedTierId) ?? DEPOSIT_HOLD_TIERS[0];

  const transferMemo = useMemo(
    () => buildDepositTransferMemo(residence.code, linkedPassCode),
    [residence.code, linkedPassCode]
  );

  const vietQrUrl = useMemo(
    () => buildTechcombankVietQrUrl(activeTier.amountVnd, transferMemo, 'compact2'),
    [activeTier.amountVnd, transferMemo]
  );

  const fallbackQrMatrix = useMemo(() => {
    const emvPayload = buildEmvCoVietQrPayload(activeTier.amountVnd, transferMemo);
    return generateDeterministicQrMatrix(emvPayload);
  }, [activeTier.amountVnd, transferMemo]);

  if (!isOpen) return null;

  const handleCopy = async (text: string, field: 'account' | 'memo') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Clipboard may be unavailable in restricted contexts; still provide visual feedback
    }
    setCopiedField(field);
    window.setTimeout(() => setCopiedField('none'), 2200);
  };

  const handleSaveHold = () => {
    const record = createDepositHoldRecord(
      residence.id,
      residence.code,
      activeTier.amountVnd,
      linkedPassCode
    );
    onSaveHoldRecord(record);
    setSavedNotice(true);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-sm sm:p-6"
      style={{ backgroundColor: 'var(--backdrop-veil)' }}
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden border-t-2 border-r border-b border-l shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderTopColor: 'var(--cta-bg)',
          borderRightColor: 'var(--border-subtle)',
          borderBottomColor: 'var(--border-subtle)',
          borderLeftColor: 'var(--border-subtle)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
              {copy.eyebrow}
            </div>
            <h3 className="font-display mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--text-heading)' }}>
              {copy.title}
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-mono-tabular font-semibold" style={{ color: 'var(--accent)' }}>
                {residence.code} · F{residence.floor}
              </span>{' '}
              — {lang === 'vi' ? residence.nameVi : residence.nameEn}
              {linkedPassCode ? ` · VIP ${linkedPassCode}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.closeBtn}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <p className="text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            {copy.subtitle}
          </p>

          {/* Tier Selection */}
          <div className="mt-4">
            <div className="mb-2 text-[10.5px] font-semibold tracking-[0.16em] uppercase" style={{ color: 'var(--text-muted)' }}>
              {copy.selectTierLabel}
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {DEPOSIT_HOLD_TIERS.map((tier) => {
                const active = tier.id === activeTier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      setSelectedTierId(tier.id);
                      setQrImgFailed(false);
                      setSavedNotice(false);
                    }}
                    className="cursor-pointer rounded-sm border p-3.5 text-left transition-all"
                    style={{
                      borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-primary)',
                    }}
                  >
                    <div className="font-mono-tabular text-sm font-semibold" style={{ color: active ? 'var(--accent)' : 'var(--text-heading)' }}>
                      {formatCurrency(tier.amountVnd, currency, lang, { compact: true })}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                      {lang === 'vi' ? tier.labelVi : tier.labelEn}
                    </div>
                    <div className="mt-1 text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                      {lang === 'vi' ? tier.holdWindowVi : tier.holdWindowEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Col VietQR + Wire Instructions */}
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-12 md:items-start">
            {/* Live Techcombank VietQR Card */}
            <div
              className="architectural-grid flex flex-col items-center border p-4 md:col-span-5"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--blueprint-bg)',
              }}
            >
              <div className="mb-3 flex w-full items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--text-heading)' }}>
                  <QrCodeIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="truncate">{copy.qrTitle}</span>
                </span>
                <span
                  className="font-mono-tabular shrink-0 whitespace-nowrap rounded-sm border px-2 py-0.5 text-[9px] font-semibold"
                  style={{
                    borderColor: 'var(--status-available-border)',
                    backgroundColor: 'var(--status-available-bg)',
                    color: 'var(--status-available)',
                  }}
                >
                  {qrImgFailed ? copy.qrFallbackBadge : copy.qrLiveBadge}
                </span>
              </div>

              <div className="flex w-full max-w-[240px] items-center justify-center overflow-hidden border bg-white p-2.5 shadow-sm" style={{ borderColor: 'var(--border-subtle)' }}>
                {!qrImgFailed ? (
                  <img
                    src={vietQrUrl}
                    alt={`Techcombank VietQR ${TECHCOMBANK_VIETQR_CONFIG.accountNumber} ${transferMemo}`}
                    className="h-auto w-full object-contain"
                    onError={() => setQrImgFailed(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center p-2">
                    <svg
                      viewBox="0 0 21 21"
                      className="h-44 w-44"
                      shapeRendering="crispEdges"
                      role="img"
                      aria-label={`Fallback EMVCo VietQR ${transferMemo}`}
                    >
                      <rect width="21" height="21" fill="#FFFFFF" />
                      {fallbackQrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#0F1D36" />
                          ) : null
                        )
                      )}
                    </svg>
                    <span className="font-mono-tabular mt-1.5 text-[10px] font-semibold text-[#0F1D36]">
                      TCB · {TECHCOMBANK_VIETQR_CONFIG.accountNumber}
                    </span>
                  </div>
                )}
              </div>

              <p className="mt-3 text-center text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {copy.qrScanHint}
              </p>
            </div>

            {/* Structured Bank Transfer & Guarantee Details */}
            <div className="flex flex-col gap-3 md:col-span-7">
              <div
                className="space-y-3 border p-4"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{copy.bankLabel}</span>
                  <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                    {TECHCOMBANK_VIETQR_CONFIG.bankName} (BIN {TECHCOMBANK_VIETQR_CONFIG.bankBin})
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.accountNoLabel}</div>
                    <div className="font-mono-tabular text-base font-bold tracking-wider" style={{ color: 'var(--text-heading)' }}>
                      {TECHCOMBANK_VIETQR_CONFIG.accountNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(TECHCOMBANK_VIETQR_CONFIG.accountNumber, 'account')}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-sm border px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                    style={{
                      borderColor: 'var(--border-strong)',
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    {copiedField === 'account' ? <CheckIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} /> : <CopyIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
                    <span>{copiedField === 'account' ? copy.copiedBtn : copy.copyBtn}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{copy.accountHolderLabel}</span>
                  <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                    {TECHCOMBANK_VIETQR_CONFIG.accountName}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{copy.amountLabel}</span>
                  <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--status-available)' }}>
                    {formatCurrency(activeTier.amountVnd, currency, lang)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.memoLabel}</div>
                    <div className="font-mono-tabular truncate text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                      {transferMemo}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferMemo, 'memo')}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-sm border px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    {copiedField === 'memo' ? <CheckIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} /> : <CopyIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
                    <span>{copiedField === 'memo' ? copy.copiedBtn : copy.copyBtn}</span>
                  </button>
                </div>
              </div>

              {/* Refundable Escrow Notice */}
              <div
                className="border p-3.5"
                style={{
                  borderColor: 'var(--status-available-border)',
                  backgroundColor: 'var(--status-available-bg)',
                }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--status-available)' }}>
                  <ShieldCheckIcon className="h-4 w-4 shrink-0" />
                  <span>{copy.guaranteeTitle}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {copy.guaranteeBody}
                </p>
              </div>

              {/* Save Hold Receipt CTA */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSaveHold}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm px-4 py-3 text-xs font-semibold tracking-wider uppercase transition-all hover:opacity-92"
                  style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
                >
                  {savedNotice ? <CheckIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} /> : <QrCodeIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
                  <span>{savedNotice ? copy.holdSavedLabel : copy.saveHoldBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
