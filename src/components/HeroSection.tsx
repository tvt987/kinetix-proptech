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
      className="no-print relative overflow-hidden border-b"
      style={{ borderColor: 'var(--border-subtle)', backgroundColor: '#07090D' }}
    >
      {/* Full-bleed Architectural Twilight Photography */}
      <div className="relative min-h-[600px] lg:min-h-[680px]">
        <img
          src="./media/tower-twilight.webp"
          alt="The Kinetix Residences Thu Thiem Riverfront Twilight Architecture"
          width={1400}
          height={788}
          className="absolute inset-0 h-full w-full object-cover object-right lg:object-center"
        />

        {/* Multi-stop cinematic obsidian scrim: protects left editorial copy while keeping bronze tower glowing on the right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(96deg, rgba(8,10,14,0.94) 0%, rgba(8,10,14,0.82) 44%, rgba(8,10,14,0.36) 72%, rgba(8,10,14,0.18) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(8,10,14,0.35) 0%, rgba(8,10,14,0.08) 45%, rgba(8,10,14,0.92) 100%)',
          }}
        />

        {/* Architectural Hairline Framing Overlay */}
        <div className="relative z-10 mx-auto flex min-h-[600px] max-w-7xl flex-col justify-between px-4 pt-12 pb-8 sm:px-6 lg:min-h-[680px] lg:px-8 lg:pt-16 lg:pb-10">
          {/* Top Coordinate & Eyebrow Telemetry */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-6 rounded-full bg-[#D4A373]" />
              <span className="font-mono-tabular text-[11px] font-medium tracking-[0.22em] text-[#E6C59E] uppercase">
                {copy.eyebrow}
              </span>
            </div>
            <span className="font-mono-tabular hidden text-[11px] tracking-[0.14em] text-white/60 md:inline">
              {copy.coords}
            </span>
          </div>

          {/* Editorial Headline & CTA Block */}
          <div className="my-10 max-w-3xl lg:my-12">
            {/* Live Inventory Status Pill */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs text-white/80">
                {copy.liveInventoryPrefix}{' '}
                <strong className="font-mono-tabular font-semibold text-[#E8C8A0]">
                  {availableCount}/{totalCount}
                </strong>{' '}
                {copy.liveInventorySuffix}
              </span>
            </div>

            <h1 className="font-display text-4xl leading-[1.06] font-semibold tracking-tight text-[#FAF8F3] sm:text-5xl lg:text-6xl">
              {copy.titleLine1}
              <span className="mt-1 block font-medium italic text-[#D4A373]">{copy.titleLine2}</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#CFD4DF] sm:text-base">
              {copy.subtitle}
            </p>

            {/* Quick Navigation & Action Row */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#tower-explorer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#D4A373] px-5 py-3 text-sm font-semibold text-[#0A0B0E] shadow-lg transition-all hover:bg-[#E2B588]"
              >
                <BuildingIcon className="h-4 w-4" />
                <span>{copy.ctaExplorer}</span>
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>

              <a
                href="#mortgage-simulator"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-[#FAF8F3] backdrop-blur-md transition-all hover:border-[#D4A373] hover:bg-white/15"
              >
                <CalculatorIcon className="h-4 w-4 text-[#D4A373]" />
                <span>{copy.ctaSimulator}</span>
              </a>

              <button
                type="button"
                onClick={onOpenScheduler}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#D4A373]/45 bg-black/45 px-4 py-3 text-sm font-medium text-[#E8C8A0] backdrop-blur-md transition-all hover:border-[#D4A373] hover:bg-black/65"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>{copy.ctaViewing}</span>
              </button>
            </div>
          </div>

          {/* Bottom Precision Investment Telemetry Strip */}
          <div className="grid grid-cols-1 gap-3 border-t border-white/15 pt-6 sm:grid-cols-3 sm:gap-6">
            <div className="rounded-xl border border-white/12 bg-black/55 px-4 py-3.5 backdrop-blur-md">
              <div className="font-mono-tabular text-2xl font-semibold text-[#E8C8A0] sm:text-3xl">
                {copy.stat1Value}
              </div>
              <div className="mt-1 text-xs font-medium tracking-wide text-white/75 uppercase">
                {copy.stat1Label}
              </div>
            </div>

            <div className="rounded-xl border border-white/12 bg-black/55 px-4 py-3.5 backdrop-blur-md">
              <div className="font-mono-tabular text-2xl font-semibold text-emerald-400 sm:text-3xl">
                {copy.stat2Value}
              </div>
              <div className="mt-1 text-xs font-medium tracking-wide text-white/75 uppercase">
                {copy.stat2Label}
              </div>
            </div>

            <div className="rounded-xl border border-white/12 bg-black/55 px-4 py-3.5 backdrop-blur-md">
              <div className="font-mono-tabular text-xl font-semibold text-[#FAF8F3] sm:text-2xl lg:text-3xl">
                {copy.stat3Value}
              </div>
              <div className="mt-1 text-xs font-medium tracking-wide text-white/75 uppercase">
                {copy.stat3Label}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
