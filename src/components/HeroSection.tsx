import React from 'react';
import type { CopyBundle } from '../data/translations';
import { ArrowUpRightIcon, BuildingIcon, CalculatorIcon, CalendarIcon } from './Icons';

interface HeroSectionProps {
  copy: CopyBundle['hero'];
  availableCount: number;
  totalCount: number;
  onOpenScheduler: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  copy,
  availableCount,
  totalCount,
  onOpenScheduler,
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
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 lg:px-8 lg:pt-10 lg:pb-16">
        {/* Editorial Magazine Edition Rule */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <span className="h-0.5 w-8" style={{ backgroundColor: 'var(--accent)' }} />
            <span
              className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: 'var(--accent)' }}
            >
              {copy.eyebrow}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span
              className="font-mono-tabular hidden text-[10.5px] tracking-[0.14em] xl:inline"
              style={{ color: 'var(--text-muted)' }}
            >
              {copy.coords}
            </span>

            {/* Crisp Daylight Live Release Status Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-sm border px-3 py-1"
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
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {copy.liveInventoryPrefix}{' '}
                <strong className="font-mono-tabular font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {availableCount}/{totalCount}
                </strong>{' '}
                {copy.liveInventorySuffix}
              </span>
            </div>
          </div>
        </div>

        {/* Architectural Daylight Editorial Split Spread */}
        <div className="mt-8 grid grid-cols-1 items-center gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Editorial Monograph Copy & Institutional CTAs */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <h1
                className="font-display text-4xl leading-[1.03] font-semibold tracking-[-0.01em] sm:text-5xl lg:text-[3.75rem]"
                style={{ color: 'var(--text-heading)' }}
              >
                {copy.titleLine1}
                <span className="mt-1.5 block font-medium italic" style={{ color: 'var(--accent)' }}>
                  {copy.titleLine2}
                </span>
              </h1>

              {/* Brushed Brass Architectural Divider */}
              <div className="mt-6 flex items-center gap-3">
                <span className="h-[2px] w-14" style={{ backgroundColor: 'var(--accent)' }} />
                <span className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
              </div>

              <p
                className="mt-6 max-w-xl text-sm leading-[1.75] sm:text-base"
                style={{ color: 'var(--text-secondary)' }}
              >
                {copy.subtitle}
              </p>

              {/* Refined Architectural Action Bar */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#tower-explorer"
                  className="inline-flex items-center gap-2 rounded-sm border px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase transition-all hover:opacity-92"
                  style={{
                    backgroundColor: 'var(--cta-bg)',
                    borderColor: 'var(--cta-bg)',
                    color: 'var(--cta-ink)',
                  }}
                >
                  <BuildingIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span>{copy.ctaExplorer}</span>
                  <ArrowUpRightIcon className="h-4 w-4" />
                </a>

                <a
                  href="#mortgage-simulator"
                  className="inline-flex items-center gap-2 rounded-sm border px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase transition-all hover:border-[#B48A3E]"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-navy)',
                    color: 'var(--text-heading)',
                  }}
                >
                  <CalculatorIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span>{copy.ctaSimulator}</span>
                </a>

                <button
                  type="button"
                  onClick={onOpenScheduler}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-sm border px-4 py-3 text-xs font-semibold tracking-[0.12em] uppercase transition-all hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-heading)',
                  }}
                >
                  <CalendarIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span>{copy.ctaViewing}</span>
                </button>
              </div>
            </div>

            {/* Knight Frank-Style Editorial Telemetry Ledger */}
            <div
              className="mt-10 grid grid-cols-1 gap-5 border-t pt-7 sm:grid-cols-[0.85fr_0.85fr_1.3fr] sm:gap-0"
              style={{
                borderColor: 'var(--border-strong)',
              }}
            >
              <div className="sm:pr-5">
                <div
                  className="font-display text-3xl leading-none font-semibold sm:text-4xl"
                  style={{ color: 'var(--text-heading)' }}
                >
                  {copy.stat1Value}
                </div>
                <div
                  className="mt-2 text-[10.5px] font-semibold tracking-[0.14em] uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {copy.stat1Label}
                </div>
              </div>

              <div className="sm:border-l sm:px-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div
                  className="font-display text-3xl leading-none font-semibold sm:text-4xl"
                  style={{ color: 'var(--status-available)' }}
                >
                  {copy.stat2Value}
                </div>
                <div
                  className="mt-2 text-[10.5px] font-semibold tracking-[0.14em] uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {copy.stat2Label}
                </div>
              </div>

              <div className="sm:border-l sm:pl-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div
                  className="font-display text-2xl leading-none font-semibold whitespace-nowrap sm:text-[1.75rem]"
                  style={{ color: 'var(--accent)' }}
                >
                  {copy.stat3Value}
                </div>
                <div
                  className="mt-2 text-[10.5px] font-semibold tracking-[0.14em] uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {copy.stat3Label}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Daylight Framed Gallery Photography Spread */}
          <div className="lg:col-span-6">
            <div
              className="border-t-2 border-r border-b border-l p-3 sm:p-4"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderTopColor: 'var(--accent)',
                borderRightColor: 'var(--border-subtle)',
                borderBottomColor: 'var(--border-subtle)',
                borderLeftColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-editorial)',
              }}
            >
              {/* Plate 01: Sunlit Italian Travertine Double-Height Salon */}
              <figure className="m-0">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src="./media/penthouse-living.webp"
                    alt="The Kinetix Residences Double-Height Italian Travertine Living Salon"
                    width={1200}
                    height={750}
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption
                  className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-b pb-2.5"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span
                    className="font-mono-tabular text-[10px] font-semibold tracking-[0.18em] uppercase"
                    style={{ color: 'var(--accent)' }}
                  >
                    PLATE 01 · CROWN SALON · LEVEL 40
                  </span>
                  <span className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    6.8M TRAVERTINE · SAIGON RIVER VISTA
                  </span>
                </figcaption>
              </figure>

              {/* Secondary Editorial Diptych: Calacatta Kitchen + Sculpted Tower Elevation */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <figure className="m-0">
                  <div className="relative aspect-[16/10] w-full overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <img
                      src="./media/kitchen-marble.webp"
                      alt="Calacatta Viola Marble Culinary Pavilion"
                      width={600}
                      height={375}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-1.5 flex items-center justify-between gap-1">
                    <span
                      className="font-mono-tabular truncate text-[9.5px] font-semibold tracking-[0.14em] uppercase"
                      style={{ color: 'var(--text-heading)' }}
                    >
                      PLATE 02 · CALACATTA STUDIO
                    </span>
                  </figcaption>
                </figure>

                <figure className="m-0">
                  <div className="relative aspect-[16/10] w-full overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <img
                      src="./media/tower-twilight.webp"
                      alt="The Kinetix Residences 42-Storey Riverfront Elevation"
                      width={600}
                      height={375}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <figcaption className="mt-1.5 flex items-center justify-between gap-1">
                    <span
                      className="font-mono-tabular truncate text-[9.5px] font-semibold tracking-[0.14em] uppercase"
                      style={{ color: 'var(--text-heading)' }}
                    >
                      PLATE 03 · 178M ELEVATION
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
