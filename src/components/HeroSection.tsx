import React, { Suspense, lazy } from 'react';
import type { CopyBundle } from '../data/translations';
import type { Currency, Language, Residence, ThemeMode } from '../types/proptech';
import { ArrowUpRightIcon, BuildingIcon, CalculatorIcon, CalendarIcon } from './Icons';

const SaigonSkyTower3DStage = lazy(() =>
  import('./SaigonSkyTower3DStage').then((m) => ({ default: m.SaigonSkyTower3DStage }))
);

interface HeroSectionProps {
  copy: CopyBundle['hero'];
  availableCount: number;
  totalCount: number;
  residences: Residence[];
  selectedResidence: Residence;
  onSelectResidence: (unit: Residence) => void;
  onOpenDeposit: (unit: Residence) => void;
  onOpenScheduler: (unit?: Residence) => void;
  currency: Currency;
  lang: Language;
  theme: ThemeMode;
}

const StageLoadingFallback: React.FC<{ lang: Language }> = ({ lang }) => (
  <div
    className="architectural-grid flex h-[360px] w-full flex-col items-center justify-center border-t-2 border-r border-b border-l sm:h-[460px] lg:h-[580px]"
    style={{
      borderTopColor: 'var(--accent)',
      borderRightColor: 'var(--border-subtle)',
      borderBottomColor: 'var(--border-subtle)',
      borderLeftColor: 'var(--border-subtle)',
      backgroundColor: 'var(--bg-secondary)',
    }}
  >
    <div
      className="font-mono-tabular text-[11px] font-semibold tracking-[0.22em] uppercase"
      style={{ color: 'var(--accent)' }}
    >
      {lang === 'vi'
        ? 'ĐANG KHỞI TẠO MÔ HÌNH THÁP 3D SÀI GÒN v5.0 (PBR SHADOWS)...'
        : 'INITIALIZING 3D SAIGON SKY-TOWER TWIN v5.0 (PBR SHADOWS)...'}
    </div>
  </div>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  copy,
  availableCount,
  totalCount,
  residences,
  selectedResidence,
  onSelectResidence,
  onOpenDeposit,
  onOpenScheduler,
  currency,
  lang,
  theme,
}) => {
  return (
    <section
      id="top"
      className="no-print relative overflow-hidden border-b transition-colors"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-8 sm:px-6 lg:px-8 lg:pt-3.5 lg:pb-10">
        {/* Editorial Magazine Edition Rule */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-0.5 w-6" style={{ backgroundColor: 'var(--accent)' }} />
            <span
              className="font-mono-tabular text-[9.5px] font-semibold tracking-[0.18em] uppercase sm:text-[10px]"
              style={{ color: 'var(--accent)' }}
            >
              {copy.eyebrow}
            </span>
            <span
              className="font-mono-tabular rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] uppercase"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--text-heading)',
              }}
            >
              v5.0 · 3D PBR
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className="font-mono-tabular hidden text-[10px] tracking-[0.14em] xl:inline"
              style={{ color: 'var(--text-muted)' }}
            >
              {copy.coords}
            </span>

            {/* Crisp Daylight Live Release Status Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-sm border px-2.5 py-0.5"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: 'var(--status-available)' }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: 'var(--status-available)' }}
                />
              </span>
              <span className="text-[10.5px]" style={{ color: 'var(--text-secondary)' }}>
                {copy.liveInventoryPrefix}{' '}
                <strong className="font-mono-tabular font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {availableCount}/{totalCount}
                </strong>{' '}
                {copy.liveInventorySuffix}
              </span>
            </div>
          </div>
        </div>

        {/* Above-the-Fold Compact Editorial Headline & Action Strip */}
        <div className="mt-3 grid grid-cols-1 items-end gap-3 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-6">
            <h1
              className="font-display text-2xl leading-[1.04] font-semibold tracking-[-0.01em] sm:text-4xl lg:text-[2.45rem]"
              style={{ color: 'var(--text-heading)' }}
            >
              {copy.titleLine1}{' '}
              <span className="font-medium italic" style={{ color: 'var(--accent)' }}>
                {copy.titleLine2}
              </span>
            </h1>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 lg:col-span-6 lg:items-end">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <a
                href="#tower-explorer"
                className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase transition-all hover:opacity-92 sm:px-3.5 sm:py-2"
                style={{
                  backgroundColor: 'var(--cta-bg)',
                  borderColor: 'var(--cta-bg)',
                  color: 'var(--cta-ink)',
                }}
              >
                <BuildingIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                <span>{copy.ctaExplorer}</span>
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </a>

              <a
                href="#mortgage-simulator"
                className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase transition-all hover:border-[#B48A3E] sm:px-3.5 sm:py-2"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-navy)',
                  color: 'var(--text-heading)',
                }}
              >
                <CalculatorIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                <span>{copy.ctaSimulator}</span>
              </a>

              <button
                type="button"
                onClick={() => onOpenScheduler()}
                className="hidden cursor-pointer items-center gap-1.5 rounded-sm border px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase transition-all hover:opacity-85 sm:inline-flex"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-heading)',
                }}
              >
                <CalendarIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                <span>{copy.ctaViewing}</span>
              </button>
            </div>

            {/* Compact Institutional KPI Ledger */}
            <div
              className="font-mono-tabular flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>
                <strong style={{ color: 'var(--text-heading)' }}>{copy.stat1Value}</strong> {copy.stat1Label}
              </span>
              <span className="opacity-35" aria-hidden="true">|</span>
              <span>
                <strong style={{ color: 'var(--status-available)' }}>{copy.stat2Value}</strong> {copy.stat2Label}
              </span>
              <span className="hidden opacity-35 sm:inline" aria-hidden="true">|</span>
              <span className="hidden sm:inline">
                <strong style={{ color: 'var(--accent)' }}>28-Story 3D Twin</strong> · Metro Line-1
              </span>
            </div>
          </div>
        </div>

        {/* PRIMARY HERO STAGE: 60fps 3D Saigon Sky-Tower & Sun-Path Architectural Twin */}
        <div className="mt-3">
          <Suspense fallback={<StageLoadingFallback lang={lang} />}>
            <SaigonSkyTower3DStage
              residences={residences}
              selectedResidence={selectedResidence}
              onSelectResidence={onSelectResidence}
              onOpenDeposit={onOpenDeposit}
              onBookViewing={(unit) => onOpenScheduler(unit)}
              currency={currency}
              lang={lang}
              theme={theme}
            />
          </Suspense>
        </div>

        {/* Curated Editorial Architecture Monograph Triptych (Below the Fold Companion Strip) */}
        <div
          className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <figure
            className="m-0 border p-2.5"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src="./media/penthouse-living.webp"
                alt="The Kinetix Residences Double-Height Italian Travertine Living Salon"
                width={600}
                height={338}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-2 flex items-center justify-between gap-2">
              <span className="font-mono-tabular text-[9.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: 'var(--accent)' }}>
                PLATE 01 · CROWN SALON
              </span>
              <span className="font-mono-tabular text-[9.5px]" style={{ color: 'var(--text-muted)' }}>
                6.8M TRAVERTINE
              </span>
            </figcaption>
          </figure>

          <figure
            className="m-0 border p-2.5"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src="./media/kitchen-marble.webp"
                alt="Calacatta Viola Marble Culinary Pavilion"
                width={600}
                height={338}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-2 flex items-center justify-between gap-2">
              <span className="font-mono-tabular text-[9.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: 'var(--accent)' }}>
                PLATE 02 · CALACATTA STUDIO
              </span>
              <span className="font-mono-tabular text-[9.5px]" style={{ color: 'var(--text-muted)' }}>
                GAGGENAU SUITE
              </span>
            </figcaption>
          </figure>

          <figure
            className="m-0 border p-2.5"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src="./media/tower-twilight.webp"
                alt="The Kinetix Residences Sculpted Riverfront Elevation"
                width={600}
                height={338}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="mt-2 flex items-center justify-between gap-2">
              <span className="font-mono-tabular text-[9.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: 'var(--accent)' }}>
                PLATE 03 · RIVER ELEVATION
              </span>
              <span className="font-mono-tabular text-[9.5px]" style={{ color: 'var(--text-muted)' }}>
                THU THIEM PENINSULA
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};
