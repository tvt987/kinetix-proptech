import React, { useEffect, useState } from 'react';
import type {
  Currency,
  DepositHoldRecord,
  Language,
  Residence,
  VipPassRecord,
} from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import { formatCurrency } from '../engines/currencyEngine';
import { computeResidenceNetYieldPct } from '../engines/residenceEngine';
import { buildViewingIcsContent } from '../engines/vipPassEngine';
import {
  BookmarkIcon,
  CalculatorIcon,
  CalendarIcon,
  CalendarPlusIcon,
  CloseIcon,
  DownloadIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  TrashIcon,
  VaultIcon,
} from './Icons';

interface VipVaultDrawerProps {
  isOpen: boolean;
  initialTab?: 'shortlist' | 'passes';
  onClose: () => void;
  residences: Residence[];
  shortlistIds: string[];
  vipPasses: VipPassRecord[];
  depositHolds: DepositHoldRecord[];
  onRemoveShortlist: (unitId: string) => void;
  onRemovePass: (passCode: string) => void;
  onInspectUnit: (unit: Residence) => void;
  onSimulateUnit: (unit: Residence) => void;
  onBookUnit: (unit: Residence) => void;
  onOpenDeposit: (unit: Residence, passCode?: string) => void;
  currency: Currency;
  lang: Language;
  copy: CopyBundle['vault'];
  schedulerCopy: CopyBundle['scheduler'];
}

export const VipVaultDrawer: React.FC<VipVaultDrawerProps> = ({
  isOpen,
  initialTab = 'shortlist',
  onClose,
  residences,
  shortlistIds,
  vipPasses,
  depositHolds,
  onRemoveShortlist,
  onRemovePass,
  onInspectUnit,
  onSimulateUnit,
  onBookUnit,
  onOpenDeposit,
  currency,
  lang,
  copy,
  schedulerCopy,
}) => {
  const [activeTab, setActiveTab] = useState<'shortlist' | 'passes'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const shortlistResidences = shortlistIds
    .map((id) => residences.find((r) => r.id === id))
    .filter((r): r is Residence => Boolean(r));

  const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadIcs = (pass: VipPassRecord) => {
    const unit = residences.find((r) => r.id === pass.residenceId);
    const ics = buildViewingIcsContent(pass, unit, lang);
    triggerFileDownload(ics, `${pass.passCode}.ics`, 'text/calendar;charset=utf-8');
  };

  const handleDownloadTxt = (pass: VipPassRecord) => {
    const unit = residences.find((r) => r.id === pass.residenceId);
    const text = [
      'THE KINETIX RESIDENCES · THU THIEM RIVERFRONT',
      '=============================================',
      `VIP PASS CODE : ${pass.passCode}`,
      `GUEST         : ${pass.clientName}`,
      `RESIDENCE     : ${pass.residenceCode}${unit ? ` — ${unit.nameEn} (Floor ${unit.floor})` : ''}`,
      `SCHEDULE      : ${pass.dateIso} · ${pass.timeSlot}`,
      `FORMAT        : ${pass.format === 'GALLERY_ONSITE' ? schedulerCopy.formatOnsite : schedulerCopy.format3d}`,
      `ADVISOR       : ${pass.advisorName} (${lang === 'vi' ? pass.advisorTitleVi : pass.advisorTitleEn})`,
      `CONTACT       : ${pass.clientPhone} | ${pass.clientEmail}`,
      '---------------------------------------------',
      schedulerCopy.poweredBy,
    ].join('\n');
    triggerFileDownload(text, `${pass.passCode}.txt`, 'text/plain;charset=utf-8');
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
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden border-t-2 border-r border-b border-l shadow-2xl"
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
          className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="font-mono-tabular flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
              <VaultIcon className="h-3.5 w-3.5" />
              <span>{copy.eyebrow}</span>
            </div>
            <h3 className="font-display mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--text-heading)' }}>
              {copy.title}
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {copy.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close VIP Vault"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 sm:px-6"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="inline-flex rounded-sm border p-0.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'shortlist'}
              onClick={() => setActiveTab('shortlist')}
              className="flex cursor-pointer items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeTab === 'shortlist' ? 'var(--cta-bg)' : 'transparent',
                color: activeTab === 'shortlist' ? 'var(--cta-ink)' : 'var(--text-secondary)',
              }}
            >
              <BookmarkIcon className="h-3.5 w-3.5" filled={activeTab === 'shortlist'} />
              <span>{copy.tabShortlist}</span>
              <span className="font-mono-tabular rounded-sm px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'rgba(180, 138, 62, 0.22)' }}>
                {shortlistResidences.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'passes'}
              onClick={() => setActiveTab('passes')}
              className="flex cursor-pointer items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeTab === 'passes' ? 'var(--cta-bg)' : 'transparent',
                color: activeTab === 'passes' ? 'var(--cta-ink)' : 'var(--text-secondary)',
              }}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{copy.tabPasses}</span>
              <span className="font-mono-tabular rounded-sm px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'rgba(180, 138, 62, 0.22)' }}>
                {vipPasses.length}
              </span>
            </button>
          </div>

          <span className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {copy.persistedNote}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* Recorded Refundable Hold Receipts Banner */}
          {depositHolds.length > 0 && (
            <div
              className="mb-5 border p-3.5"
              style={{
                borderColor: 'var(--status-available-border)',
                backgroundColor: 'var(--status-available-bg)',
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--status-available)' }}>
                <ShieldCheckIcon className="h-4 w-4" />
                <span>{copy.activeHoldsTitle} ({depositHolds.length})</span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {depositHolds.slice(0, 4).map((hold) => (
                  <div
                    key={hold.holdId}
                    className="flex items-center justify-between gap-2 border px-3 py-2 text-xs"
                    style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="min-w-0">
                      <div className="font-mono-tabular font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {hold.holdId} · {hold.residenceCode}
                      </div>
                      <div className="font-mono-tabular truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        TCB {hold.accountNumber} · {hold.transferMemo}
                      </div>
                    </div>
                    <span className="font-mono-tabular shrink-0 font-semibold" style={{ color: 'var(--status-available)' }}>
                      {formatCurrency(hold.amountVnd, currency, lang, { compact: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shortlist' ? (
            shortlistResidences.length === 0 ? (
              <div className="border p-10 text-center" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <BookmarkIcon className="mx-auto h-8 w-8 opacity-45" style={{ color: 'var(--accent)' }} />
                <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {copy.emptyShortlist}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {shortlistResidences.map((unit) => {
                  const netYield = computeResidenceNetYieldPct(unit);
                  const hasHold = depositHolds.some((h) => h.residenceId === unit.id);
                  return (
                    <div
                      key={unit.id}
                      className="flex flex-col overflow-hidden border"
                      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
                    >
                      <div className="relative h-36 w-full overflow-hidden">
                        <img
                          src={unit.heroImage}
                          alt={lang === 'vi' ? unit.nameVi : unit.nameEn}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span
                            className="font-mono-tabular rounded-sm px-2 py-0.5 text-[10.5px] font-semibold"
                            style={{ backgroundColor: 'rgba(15, 29, 54, 0.88)', color: '#FAF8F4' }}
                          >
                            {unit.code} · F{unit.floor}
                          </span>
                          {hasHold && (
                            <span
                              className="font-mono-tabular rounded-sm px-2 py-0.5 text-[10px] font-semibold text-white"
                              style={{ backgroundColor: '#157356' }}
                            >
                              HOLD LOGGED
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveShortlist(unit.id)}
                          aria-label={`${copy.removeBtn} ${unit.code}`}
                          className="absolute top-2.5 right-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm bg-white/90 text-[#0F1D36] hover:bg-[#B5343A] hover:text-white"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="font-display text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                            {lang === 'vi' ? unit.nameVi : unit.nameEn}
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-2">
                            <span className="font-mono-tabular text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
                              {formatCurrency(unit.priceVnd, currency, lang, { compact: true })}
                            </span>
                            <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--status-available)' }}>
                              {unit.areaSqm}m² · {netYield.toFixed(1)}% {lang === 'vi' ? 'ròng' : 'net'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onInspectUnit(unit);
                              onClose();
                            }}
                            className="cursor-pointer rounded-sm border px-2.5 py-1.5 text-[11px] font-semibold"
                            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-heading)' }}
                          >
                            {copy.inspectBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSimulateUnit(unit);
                              onClose();
                            }}
                            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-sm border px-2.5 py-1.5 text-[11px] font-semibold"
                            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-heading)' }}
                          >
                            <CalculatorIcon className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                            <span>{copy.simulateBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenDeposit(unit);
                            }}
                            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-sm border px-2.5 py-1.5 text-[11px] font-semibold"
                            style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--accent-soft)', color: 'var(--text-heading)' }}
                          >
                            <QrCodeIcon className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                            <span>{copy.depositBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onBookUnit(unit);
                            }}
                            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-sm px-2.5 py-1.5 text-[11px] font-semibold"
                            style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
                          >
                            <CalendarIcon className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                            <span>{copy.bookBtn}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : vipPasses.length === 0 ? (
            <div className="border p-10 text-center" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
              <CalendarIcon className="mx-auto h-8 w-8 opacity-45" style={{ color: 'var(--accent)' }} />
              <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
                {copy.emptyPasses}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookUnit(residences[10] ?? residences[0]);
                }}
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-4 py-2.5 text-xs font-semibold tracking-wider uppercase"
                style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
              >
                <CalendarIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                <span>{copy.bookNewViewingBtn}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {vipPasses.map((pass) => {
                const unit = residences.find((r) => r.id === pass.residenceId);
                return (
                  <div
                    key={pass.passCode}
                    className="architectural-grid border p-4 sm:p-5"
                    style={{
                      borderColor: 'var(--border-strong)',
                      backgroundColor: 'var(--blueprint-bg)',
                    }}
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-tabular text-lg font-bold tracking-wider" style={{ color: 'var(--text-heading)' }}>
                            {pass.passCode}
                          </span>
                          <span
                            className="rounded-sm border px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              borderColor: 'var(--status-available-border)',
                              backgroundColor: 'var(--status-available-bg)',
                              color: 'var(--status-available)',
                            }}
                          >
                            {pass.format === 'GALLERY_ONSITE' ? schedulerCopy.formatOnsite : schedulerCopy.format3d}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>{schedulerCopy.passHolderLabel}: </span>
                            <strong style={{ color: 'var(--text-heading)' }}>{pass.clientName}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>{schedulerCopy.passResidenceLabel}: </span>
                            <strong className="font-mono-tabular" style={{ color: 'var(--text-heading)' }}>
                              {pass.residenceCode}{unit ? ` · F${unit.floor}` : ''}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>{schedulerCopy.passScheduleLabel}: </span>
                            <strong className="font-mono-tabular" style={{ color: 'var(--accent)' }}>
                              {pass.dateIso} · {pass.timeSlot}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>{schedulerCopy.passAdvisorLabel}: </span>
                            <strong style={{ color: 'var(--text-heading)' }}>{pass.advisorName}</strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(pass)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11px] font-semibold"
                            style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
                          >
                            <CalendarPlusIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                            <span>{copy.downloadIcsBtn}</span>
                          </button>
                          {unit && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenDeposit(unit, pass.passCode);
                              }}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[11px] font-semibold"
                              style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--accent-soft)', color: 'var(--text-heading)' }}
                            >
                              <QrCodeIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                              <span>{copy.depositBtn}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadTxt(pass)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[11px] font-semibold"
                            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          >
                            <DownloadIcon className="h-3.5 w-3.5" />
                            <span>{copy.downloadTxtBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemovePass(pass.passCode)}
                            aria-label={`${copy.removeBtn} ${pass.passCode}`}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-sm border px-2.5 py-1.5 text-[11px] font-medium"
                            style={{
                              borderColor: 'var(--status-sold-border)',
                              backgroundColor: 'var(--status-sold-bg)',
                              color: 'var(--status-sold)',
                            }}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            <span>{copy.removeBtn}</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline Deterministic 21x21 QR */}
                      <div className="flex shrink-0 flex-col items-center self-center border bg-white p-2 shadow-sm" style={{ borderColor: 'var(--border-subtle)' }}>
                        <svg
                          viewBox="0 0 21 21"
                          className="h-20 w-20"
                          shapeRendering="crispEdges"
                          role="img"
                          aria-label={`VIP QR ${pass.passCode}`}
                        >
                          <rect width="21" height="21" fill="#FFFFFF" />
                          {pass.qrMatrix.map((row, rIdx) =>
                            row.map((cell, cIdx) =>
                              cell ? (
                                <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#0F1D36" />
                              ) : null
                            )
                          )}
                        </svg>
                        <span className="font-mono-tabular mt-1 text-[9px] font-semibold text-[#0F1D36]">
                          {pass.passCode}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
