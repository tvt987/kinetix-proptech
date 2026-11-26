import React, { useMemo } from 'react';
import type { Currency, Language, Residence } from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import { buildComparisonMetrics } from '../engines/residenceEngine';
import { formatCurrency, formatPricePerSqm } from '../engines/currencyEngine';
import { CalendarIcon, CloseIcon, CompareIcon } from './Icons';

interface ComparisonDrawerProps {
  residences: Residence[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRemove: (unitId: string) => void;
  onClearAll: () => void;
  onInspect: (unit: Residence) => void;
  onBook: (unit: Residence) => void;
  mortgageAssumptions: {
    downPaymentPct: number;
    loanTermYears: number;
    annualInterestRatePct: number;
  };
  currency: Currency;
  lang: Language;
  copy: CopyBundle['compare'];
  explorerCopy: CopyBundle['explorer'];
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  residences,
  isOpen,
  onOpen,
  onClose,
  onRemove,
  onClearAll,
  onInspect,
  onBook,
  mortgageAssumptions,
  currency,
  lang,
  copy,
  explorerCopy,
}) => {
  const rows = useMemo(
    () => buildComparisonMetrics(residences, mortgageAssumptions),
    [residences, mortgageAssumptions]
  );

  return (
    <>
      {/* Sleek Floating Comparison Tray (Bottom-Right when items exist & modal is closed) */}
      {residences.length > 0 && !isOpen && (
        <div
          className="fixed right-4 bottom-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-2xl border p-2.5 shadow-2xl backdrop-blur-xl sm:right-6 sm:bottom-6"
          style={{
            backgroundColor: 'var(--bg-glass)',
            borderColor: 'var(--border-strong)',
          }}
          role="region"
          aria-label={copy.dockLabel}
        >
          <div className="hidden items-center gap-1.5 pl-1 sm:flex">
            {residences.map((unit) => (
              <span
                key={unit.id}
                className="font-mono-tabular inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              >
                {unit.code}
                <button
                  type="button"
                  onClick={() => onRemove(unit.id)}
                  aria-label={`${copy.removeBtn} ${unit.code}`}
                  className="ml-0.5 cursor-pointer opacity-70 hover:opacity-100"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
          >
            <CompareIcon className="h-4 w-4" />
            <span>
              {copy.openMatrix} ({residences.length}/3)
            </span>
          </button>
        </div>
      )}

      {/* Side-by-Side Comparison Matrix Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={copy.modalTitle}
          onClick={onClose}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-strong)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <div className="font-mono-tabular text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
                  {copy.modalEyebrow}
                </div>
                <h3 className="font-display mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
                  {copy.modalTitle}
                </h3>
                <p className="font-mono-tabular mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.mortgageAssumptionsPrefix} {mortgageAssumptions.downPaymentPct}% down ·{' '}
                  {mortgageAssumptions.loanTermYears}y · {mortgageAssumptions.annualInterestRatePct.toFixed(1)}%
                </p>
              </div>

              <div className="flex items-center gap-2">
                {residences.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {copy.clearAll}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Matrix Body */}
            <div className="flex-1 overflow-auto p-5 sm:p-6">
              {rows.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mx-auto max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {copy.emptyState}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                    <thead>
                      <tr>
                        <th className="w-44 pb-4 align-bottom text-[11px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                          {lang === 'vi' ? 'Thông Số Đối Chiếu' : 'Specification'}
                        </th>
                        {rows.map((row) => (
                          <th key={row.residence.id} className="w-56 px-3 pb-4 align-top">
                            <div
                              className="overflow-hidden rounded-xl border"
                              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
                            >
                              <div className="relative h-28 w-full overflow-hidden">
                                <img
                                  src={row.residence.heroImage}
                                  alt={lang === 'vi' ? row.residence.nameVi : row.residence.nameEn}
                                  className="h-full w-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => onRemove(row.residence.id)}
                                  aria-label={`${copy.removeBtn} ${row.residence.code}`}
                                  className="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                                >
                                  <CloseIcon className="h-3.5 w-3.5" />
                                </button>
                                <span className="font-mono-tabular absolute bottom-2 left-2 rounded bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-[#E8C8A0]">
                                  {row.residence.code}
                                </span>
                              </div>
                              <div className="p-3">
                                <div className="font-display text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {lang === 'vi' ? row.residence.nameVi : row.residence.nameEn}
                                </div>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {row.isBestPricePerSqm && (
                                    <span className="rounded bg-[#D4A373]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#D4A373]">
                                      {copy.bestValueTag}
                                    </span>
                                  )}
                                  {row.isHighestNetYield && (
                                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                                      {copy.highestYieldTag}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowFloor}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="font-mono-tabular px-3 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {explorerCopy.floorPrefix} {r.residence.floor} ({r.residence.wing})
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowType}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>
                            {explorerCopy.tierLabels[r.residence.tier]} ({r.residence.bedrooms}BR / {r.residence.bathrooms}BA)
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowOrientation}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>
                            {explorerCopy.orientationLabels[r.residence.orientation]}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowRiverScore}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="font-mono-tabular px-3 py-3 font-semibold text-emerald-500">
                            {r.residence.riverViewScore} / 100
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowArea}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="font-mono-tabular px-3 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {r.residence.areaSqm} m²
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowTotalPrice}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="font-mono-tabular px-3 py-3 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                            {formatCurrency(r.residence.priceVnd, currency, lang)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowPriceSqm}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="font-mono-tabular px-3 py-3" style={{ color: 'var(--text-primary)' }}>
                            {formatPricePerSqm(r.residence.priceVnd, r.residence.areaSqm, currency, lang)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowEstMortgage}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="font-mono-tabular px-3 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {formatCurrency(r.monthlyMortgageVnd, currency, lang, { compact: true })}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowEstRent}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="font-mono-tabular px-3 py-3" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(r.residence.estMonthlyRentVnd, currency, lang, { compact: true })}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowNetYield}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="font-mono-tabular px-3 py-3 text-sm font-semibold text-emerald-500">
                            {r.netYieldPct.toFixed(2)}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{copy.rowPrivateLift}</td>
                        {rows.map((r) => (
                          <td key={r.residence.id} className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>
                            {r.residence.privateLift ? explorerCopy.privateLiftYes : explorerCopy.privateLiftNo}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="pt-4" />
                        {rows.map((r) => (
                          <td key={r.residence.id} className="px-3 pt-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onInspect(r.residence);
                                  onClose();
                                }}
                                className="flex-1 cursor-pointer rounded-lg border px-2.5 py-2 text-[11px] font-semibold"
                                style={{
                                  borderColor: 'var(--border-subtle)',
                                  backgroundColor: 'var(--bg-elevated)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {copy.inspectBtn}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onBook(r.residence);
                                }}
                                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold"
                                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                              >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <span>{copy.bookBtn}</span>
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
