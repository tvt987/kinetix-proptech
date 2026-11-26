import React from 'react';
import type { Currency, Language, Residence, UnitStatus } from '../types/proptech';
import { TOWER_FLOOR_LEVELS } from '../data/residences';
import { formatCurrency } from '../engines/currencyEngine';

interface TowerElevationSvgProps {
  residences: Residence[];
  matchingIds: Set<string>;
  selectedResidenceId: string;
  activeFloorFilter: number | null;
  currency: Currency;
  lang: Language;
  onSelectFloor: (floor: number, unit: Residence) => void;
  onClearFloor: () => void;
  title: string;
  hint: string;
  resetLabel: string;
  statusLabels: Record<'ALL' | UnitStatus, string>;
}

const STATUS_DOT_COLOR: Record<UnitStatus, string> = {
  AVAILABLE: '#10B981',
  RESERVED: '#F59E0B',
  SOLD: '#EF4444',
};

export const TowerElevationSvg: React.FC<TowerElevationSvgProps> = ({
  residences,
  matchingIds,
  selectedResidenceId,
  activeFloorFilter,
  currency,
  lang,
  onSelectFloor,
  onClearFloor,
  title,
  hint,
  resetLabel,
  statusLabels,
}) => {
  const unitByFloor = new Map<number, Residence>();
  for (const r of residences) {
    unitByFloor.set(r.floor, r);
  }

  return (
    <div
      className="flex flex-col rounded-2xl border p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start justify-between gap-2 pb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </p>
        </div>
        {activeFloorFilter !== null && (
          <button
            type="button"
            onClick={onClearFloor}
            className="font-mono-tabular shrink-0 cursor-pointer rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors"
            style={{
              borderColor: 'var(--border-strong)',
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
          >
            {resetLabel}
          </button>
        )}
      </div>

      {/* Interactive Architectural Tower Elevation SVG */}
      <div
        className="architectural-grid relative overflow-hidden rounded-xl border px-3 py-4"
        style={{
          backgroundColor: 'var(--blueprint-bg)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Architectural Crown Roofline SVG */}
        <svg viewBox="0 0 280 42" className="mx-auto mb-1 w-full max-w-[280px]" aria-hidden="true">
          <path
            d="M44 40 L62 14 L218 14 L236 40"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.4"
            strokeOpacity="0.65"
          />
          <line x1="140" y1="2" x2="140" y2="14" stroke="var(--accent)" strokeWidth="1.4" strokeOpacity="0.8" />
          <circle cx="140" cy="2.5" r="2" fill="var(--accent)" />
          <text
            x="140"
            y="32"
            textAnchor="middle"
            fill="var(--accent)"
            fontSize="8.5"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="2.4"
          >
            CROWN · 178M ELEVATION
          </text>
        </svg>

        {/* Interactive Floor Stack (Floors 42 -> 18) */}
        <div className="space-y-1.5" role="list" aria-label={title}>
          {TOWER_FLOOR_LEVELS.map((floor) => {
            const unit = unitByFloor.get(floor);
            if (!unit) return null;

            const isSelected = unit.id === selectedResidenceId;
            const isFloorLocked = activeFloorFilter === floor;
            const isMatched = matchingIds.has(unit.id);
            const isCrown = floor >= 40;
            const isSkyGardenBelow = floor === 30;

            return (
              <React.Fragment key={floor}>
                <button
                  type="button"
                  onClick={() => onSelectFloor(floor, unit)}
                  className="group relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-all"
                  style={{
                    borderColor:
                      isSelected || isFloorLocked
                        ? 'var(--accent)'
                        : isCrown
                          ? 'rgba(212, 163, 115, 0.34)'
                          : 'var(--border-subtle)',
                    backgroundColor:
                      isSelected || isFloorLocked
                        ? 'var(--accent-soft)'
                        : 'var(--bg-secondary)',
                    opacity: isMatched || isSelected ? 1 : 0.42,
                    transform: isSelected ? 'translateX(3px)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="font-mono-tabular flex h-7 w-9 items-center justify-center rounded text-[11px] font-semibold"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: isSelected ? 'var(--accent-ink)' : 'var(--text-primary)',
                      }}
                    >
                      F{floor}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono-tabular text-xs font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {unit.code}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: isCrown ? 'var(--accent)' : 'var(--text-secondary)',
                          }}
                        >
                          {unit.tier === 'PENTHOUSE' ? 'PH' : unit.tier}
                        </span>
                      </div>
                      <div className="font-mono-tabular text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {unit.areaSqm}m² · {formatCurrency(unit.priceVnd, currency, lang, { compact: true })}
                      </div>
                    </div>
                  </div>

                  {/* Status Dot + Elevation Bar */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-black/20"
                      style={{ backgroundColor: STATUS_DOT_COLOR[unit.status] }}
                      title={statusLabels[unit.status]}
                    />
                  </div>
                </button>

                {isSkyGardenBelow && (
                  <div className="flex items-center gap-2 py-0.5">
                    <span className="h-px flex-1 bg-emerald-500/35" />
                    <span className="font-mono-tabular text-[9px] tracking-[0.2em] text-emerald-500 uppercase">
                      F29 SKY BOTANICAL DECK
                    </span>
                    <span className="h-px flex-1 bg-emerald-500/35" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Riverfront Podium Base SVG */}
        <svg viewBox="0 0 280 28" className="mx-auto mt-3 w-full max-w-[280px]" aria-hidden="true">
          <line x1="12" y1="6" x2="268" y2="6" stroke="var(--border-strong)" strokeWidth="1" />
          <path
            d="M16 17 Q 76 11, 140 17 T 264 17"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeOpacity="0.55"
          />
          <text
            x="140"
            y="26"
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="8"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="2"
          >
            SAIGON RIVERFRONT PROMENADE · 0M
          </text>
        </svg>
      </div>

      {/* Status Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {(['AVAILABLE', 'RESERVED', 'SOLD'] as UnitStatus[]).map((st) => (
          <span key={st} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLOR[st] }} />
            <span>{statusLabels[st]}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
