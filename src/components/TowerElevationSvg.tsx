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
  AVAILABLE: 'var(--status-available)',
  RESERVED: 'var(--status-reserved)',
  SOLD: 'var(--status-sold)',
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
      className="flex flex-col border-t-2 border-r border-b border-l p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTopColor: 'var(--cta-bg)',
        borderRightColor: 'var(--border-subtle)',
        borderBottomColor: 'var(--border-subtle)',
        borderLeftColor: 'var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start justify-between gap-2 border-b pb-3.5" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="font-mono-tabular text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
            PLATE A · ELEVATION STACK
          </div>
          <h3 className="font-display mt-1 text-xl font-semibold" style={{ color: 'var(--text-heading)' }}>
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
            className="font-mono-tabular shrink-0 cursor-pointer rounded-sm border px-2.5 py-1 text-[10.5px] font-semibold uppercase transition-colors"
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

      {/* Interactive Architectural Tower Elevation Drafting Plate */}
      <div
        className="architectural-grid relative mt-4 overflow-hidden border px-3 py-4"
        style={{
          backgroundColor: 'var(--blueprint-bg)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Architectural Crown Roofline SVG */}
        <svg viewBox="0 0 280 42" className="mx-auto mb-1.5 w-full max-w-[280px]" aria-hidden="true">
          <path
            d="M44 40 L62 14 L218 14 L236 40"
            fill="none"
            stroke="var(--blueprint-wall)"
            strokeWidth="1.35"
            strokeOpacity="0.65"
          />
          <line x1="140" y1="2" x2="140" y2="14" stroke="var(--accent)" strokeWidth="1.5" />
          <circle cx="140" cy="2.5" r="2.2" fill="var(--accent)" />
          <text
            x="140"
            y="32"
            textAnchor="middle"
            fill="var(--text-heading)"
            fontSize="8.5"
            fontWeight="600"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="2.2"
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
                  className="group relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm border px-2.5 py-2 text-left transition-all"
                  style={{
                    borderColor:
                      isSelected || isFloorLocked
                        ? 'var(--accent)'
                        : isCrown
                          ? 'var(--border-strong)'
                          : 'var(--border-subtle)',
                    borderLeftWidth: isSelected || isFloorLocked ? '3px' : '1px',
                    borderLeftColor:
                      isSelected || isFloorLocked
                        ? 'var(--accent)'
                        : isCrown
                          ? 'var(--accent)'
                          : 'var(--border-subtle)',
                    backgroundColor:
                      isSelected || isFloorLocked
                        ? 'var(--accent-soft)'
                        : 'var(--bg-secondary)',
                    opacity: isMatched || isSelected ? 1 : 0.42,
                    transform: isSelected ? 'translateX(2px)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="font-mono-tabular flex h-7 w-9 items-center justify-center rounded-sm text-[11px] font-semibold"
                      style={{
                        backgroundColor: isSelected ? 'var(--cta-bg)' : 'var(--bg-elevated)',
                        color: isSelected ? 'var(--cta-ink)' : 'var(--text-heading)',
                      }}
                    >
                      F{floor}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono-tabular text-xs font-semibold"
                          style={{ color: 'var(--text-heading)' }}
                        >
                          {unit.code}
                        </span>
                        <span
                          className="rounded-sm border px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wider uppercase"
                          style={{
                            borderColor: isCrown ? 'var(--border-strong)' : 'var(--border-subtle)',
                            backgroundColor: isCrown ? 'var(--accent-soft)' : 'var(--bg-elevated)',
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

                  {/* Status Dot */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: STATUS_DOT_COLOR[unit.status],
                        boxShadow: '0 0 0 2px var(--bg-secondary)',
                      }}
                      title={statusLabels[unit.status]}
                    />
                  </div>
                </button>

                {isSkyGardenBelow && (
                  <div className="flex items-center gap-2 py-1">
                    <span className="h-px flex-1" style={{ backgroundColor: 'var(--status-available-border)' }} />
                    <span
                      className="font-mono-tabular text-[9px] font-semibold tracking-[0.18em] uppercase"
                      style={{ color: 'var(--status-available)' }}
                    >
                      F29 SKY BOTANICAL DECK
                    </span>
                    <span className="h-px flex-1" style={{ backgroundColor: 'var(--status-available-border)' }} />
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
            stroke="var(--chart-rent)"
            strokeWidth="1.25"
            strokeOpacity="0.7"
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
      <div
        className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px]"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
      >
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
