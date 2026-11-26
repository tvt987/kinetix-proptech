import React, { useEffect, useMemo, useState } from 'react';
import type {
  BedroomTier,
  Currency,
  Language,
  Orientation,
  Residence,
  ResidenceFilterState,
  SortOption,
  UnitStatus,
} from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import { formatCurrency, formatPricePerSqm } from '../engines/currencyEngine';
import {
  computeResidenceGrossYieldPct,
  computeResidenceMonthlyMaintenance,
  computeResidenceNetYieldPct,
  filterAndSortResidences,
} from '../engines/residenceEngine';
import { TowerElevationSvg } from './TowerElevationSvg';
import { FloorplanSchematicSvg } from './FloorplanSchematicSvg';
import {
  BlueprintIcon,
  CalculatorIcon,
  CalendarIcon,
  CheckIcon,
  CompareIcon,
  CompassIcon,
  KeyIcon,
  PhotoIcon,
} from './Icons';

interface ResidenceExplorerProps {
  residences: Residence[];
  selectedResidence: Residence;
  onSelectResidence: (unit: Residence) => void;
  compareIds: string[];
  onToggleCompare: (unitId: string) => void;
  onBookViewing: (unit: Residence) => void;
  onSimulateResidence: (unit: Residence) => void;
  currency: Currency;
  lang: Language;
  copy: CopyBundle['explorer'];
}

const DEFAULT_MAX_PRICE = 85_000_000_000;

const STATUS_STYLE: Record<UnitStatus, { dot: string; bg: string; text: string }> = {
  AVAILABLE: { dot: '#10B981', bg: 'rgba(16, 185, 129, 0.14)', text: '#10B981' },
  RESERVED: { dot: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)', text: '#F59E0B' },
  SOLD: { dot: '#EF4444', bg: 'rgba(239, 68, 68, 0.14)', text: '#EF4444' },
};

export const ResidenceExplorer: React.FC<ResidenceExplorerProps> = ({
  residences,
  selectedResidence,
  onSelectResidence,
  compareIds,
  onToggleCompare,
  onBookViewing,
  onSimulateResidence,
  currency,
  lang,
  copy,
}) => {
  const [filters, setFilters] = useState<ResidenceFilterState>({
    tier: 'ALL',
    orientation: 'ALL',
    status: 'ALL',
    floor: null,
    maxPriceVnd: DEFAULT_MAX_PRICE,
    sortBy: 'FLOOR_DESC',
  });

  const [detailTab, setDetailTab] = useState<'gallery' | 'floorplan'>('gallery');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Reset active gallery photo when selected residence changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [selectedResidence.id]);

  const filteredResidences = useMemo(
    () => filterAndSortResidences(residences, filters),
    [residences, filters]
  );

  const matchingIds = useMemo(
    () => new Set(filteredResidences.map((r) => r.id)),
    [filteredResidences]
  );

  const resetAllFilters = () => {
    setFilters({
      tier: 'ALL',
      orientation: 'ALL',
      status: 'ALL',
      floor: null,
      maxPriceVnd: DEFAULT_MAX_PRICE,
      sortBy: 'FLOOR_DESC',
    });
  };

  const handleFloorSelect = (floor: number, unit: Residence) => {
    onSelectResidence(unit);
    setFilters((prev) => ({
      ...prev,
      floor: prev.floor === floor ? null : floor,
    }));
  };

  const isSelectedCompared = compareIds.includes(selectedResidence.id);
  const compareIsFull = compareIds.length >= 3 && !isSelectedCompared;
  const activePhoto = selectedResidence.gallery[activePhotoIndex] ?? selectedResidence.gallery[0];
  const monthlyMaintenanceVnd = computeResidenceMonthlyMaintenance(selectedResidence);
  const grossYieldPct = computeResidenceGrossYieldPct(selectedResidence);
  const netYieldPct = computeResidenceNetYieldPct(selectedResidence);
  const statusPalette = STATUS_STYLE[selectedResidence.status];

  return (
    <section id="tower-explorer" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      {/* Section Heading */}
      <div className="mb-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="h-px w-8" style={{ backgroundColor: 'var(--accent)' }} />
            <span className="font-mono-tabular text-[11px] font-semibold tracking-[0.22em] uppercase" style={{ color: 'var(--accent)' }}>
              {copy.eyebrow}
            </span>
          </div>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl" style={{ color: 'var(--text-primary)' }}>
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            {copy.subtitle}
          </p>
        </div>

        <div
          className="font-mono-tabular inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 text-xs font-medium lg:self-end"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="text-base font-semibold" style={{ color: 'var(--accent)' }}>
            {filteredResidences.length}
          </span>
          <span>/ {residences.length} {copy.matchingCount}</span>
        </div>
      </div>

      {/* Filter Control Console */}
      <div
        className="mb-8 rounded-2xl border p-4 sm:p-5"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          {/* Bedroom Tier Pills */}
          <div className="lg:col-span-5">
            <div className="mb-2 text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              {copy.tierLabels.ALL}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', '1BR', '2BR', '3BR', 'PENTHOUSE'] as Array<'ALL' | BedroomTier>).map((tier) => {
                const active = filters.tier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, tier, floor: null }))}
                    className="cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: active ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: active ? 'var(--accent-ink)' : 'var(--text-secondary)',
                    }}
                  >
                    {tier === 'ALL' ? copy.filterAll : copy.tierLabels[tier]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orientation Select */}
          <div className="sm:grid sm:grid-cols-2 sm:gap-3 lg:col-span-4">
            <div>
              <label
                htmlFor="orientation-filter"
                className="mb-2 block text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                {copy.orientationLabels.ALL}
              </label>
              <select
                id="orientation-filter"
                value={filters.orientation}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    orientation: e.target.value as 'ALL' | Orientation,
                    floor: null,
                  }))
                }
                className="w-full cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium outline-none"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              >
                {(['ALL', 'RIVER_PANORAMIC', 'SUNSET_CBD', 'BOTANICAL'] as Array<'ALL' | Orientation>).map((o) => (
                  <option key={o} value={o}>
                    {copy.orientationLabels[o]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 sm:mt-0">
              <label
                htmlFor="sort-filter"
                className="mb-2 block text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                {lang === 'vi' ? 'Sắp Xếp Quỹ Căn' : 'Sort Inventory'}
              </label>
              <select
                id="sort-filter"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortOption }))
                }
                className="w-full cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium outline-none"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              >
                {(['FLOOR_DESC', 'PRICE_ASC', 'PRICE_DESC', 'YIELD_DESC', 'AREA_DESC'] as SortOption[]).map((s) => (
                  <option key={s} value={s}>
                    {copy.sortLabels[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Budget Slider */}
          <div className="lg:col-span-3">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                {copy.maxBudgetLabel}
              </span>
              <span className="font-mono-tabular font-semibold" style={{ color: 'var(--accent)' }}>
                {formatCurrency(filters.maxPriceVnd, currency, lang, { compact: true })}
              </span>
            </div>
            <input
              type="range"
              aria-label={copy.maxBudgetLabel}
              min={14_000_000_000}
              max={DEFAULT_MAX_PRICE}
              step={2_000_000_000}
              value={filters.maxPriceVnd}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  maxPriceVnd: Number(e.target.value),
                  floor: null,
                }))
              }
              className="kinetix-slider"
            />
          </div>
        </div>
      </div>

      {/* Main 12-Col Explorer: Left Tower Elevation Stack | Right Residence Dossier + Inventory Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Interactive Tower Elevation */}
        <div className="lg:col-span-4">
          <TowerElevationSvg
            residences={residences}
            matchingIds={matchingIds}
            selectedResidenceId={selectedResidence.id}
            activeFloorFilter={filters.floor}
            currency={currency}
            lang={lang}
            onSelectFloor={handleFloorSelect}
            onClearFloor={() => setFilters((prev) => ({ ...prev, floor: null }))}
            title={copy.towerElevationTitle}
            hint={copy.towerElevationHint}
            resetLabel={copy.resetFloor}
            statusLabels={copy.statusLabels}
          />
        </div>

        {/* Right Column: Selected Residence Architectural Inspector + Unit Cards */}
        <div className="space-y-6 lg:col-span-8">
          {/* Selected Residence Dossier Card */}
          <div
            className="overflow-hidden rounded-2xl border p-4 sm:p-6"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-strong)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Dossier Top Header */}
            <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-start" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-tabular text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
                    {copy.selectedUnitEyebrow}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: statusPalette.bg, color: statusPalette.text }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusPalette.dot }} />
                    {copy.statusLabels[selectedResidence.status]}
                  </span>
                </div>

                <h3 className="font-display mt-2 text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
                  <span className="font-mono-tabular mr-2 text-xl" style={{ color: 'var(--accent)' }}>
                    {selectedResidence.code}
                  </span>
                  {lang === 'vi' ? selectedResidence.nameVi : selectedResidence.nameEn}
                </h3>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-mono-tabular">
                    {copy.floorPrefix} {selectedResidence.floor} · {selectedResidence.wing}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <CompassIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' } as React.CSSProperties} />
                    {copy.orientationLabels[selectedResidence.orientation]}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <KeyIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' } as React.CSSProperties} />
                    {selectedResidence.privateLift ? copy.privateLiftYes : copy.privateLiftNo}
                  </span>
                </div>
              </div>

              <div className="shrink-0 sm:text-right">
                <div className="font-mono-tabular text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--accent)' }}>
                  {formatCurrency(selectedResidence.priceVnd, currency, lang)}
                </div>
                <div className="font-mono-tabular mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatPricePerSqm(selectedResidence.priceVnd, selectedResidence.areaSqm, currency, lang)} ·{' '}
                  <span className="text-emerald-500">
                    {netYieldPct.toFixed(1)}% {lang === 'vi' ? 'ròng' : 'net'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Toggle: Photography Gallery vs Architectural SVG Floorplan */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex rounded-xl border p-1"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailTab === 'gallery'}
                  onClick={() => setDetailTab('gallery')}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: detailTab === 'gallery' ? 'var(--accent)' : 'transparent',
                    color: detailTab === 'gallery' ? 'var(--accent-ink)' : 'var(--text-secondary)',
                  }}
                >
                  <PhotoIcon className="h-3.5 w-3.5" />
                  <span>{copy.tabGallery}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailTab === 'floorplan'}
                  onClick={() => setDetailTab('floorplan')}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: detailTab === 'floorplan' ? 'var(--accent)' : 'transparent',
                    color: detailTab === 'floorplan' ? 'var(--accent-ink)' : 'var(--text-secondary)',
                  }}
                >
                  <BlueprintIcon className="h-3.5 w-3.5" />
                  <span>{copy.tabFloorplan}</span>
                </button>
              </div>

              <span className="font-mono-tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                {copy.estGrossYield}:{' '}
                <strong className="text-emerald-500">{grossYieldPct.toFixed(2)}%</strong>
              </span>
            </div>

            {/* Visual Stage: Gallery OR Interactive Blueprint */}
            <div className="mt-4">
              {detailTab === 'gallery' ? (
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <img
                      src={activePhoto.src}
                      alt={lang === 'vi' ? activePhoto.captionVi : activePhoto.captionEn}
                      className="h-full w-full object-cover transition-all duration-300"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 p-4"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(10,11,14,0) 0%, rgba(10,11,14,0.88) 100%)',
                      }}
                    >
                      <span className="font-mono-tabular inline-block rounded bg-[#D4A373]/25 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#F2D5B3] uppercase backdrop-blur-sm">
                        {lang === 'vi' ? activePhoto.tagVi : activePhoto.tagEn}
                      </span>
                      <p className="mt-1 text-xs text-white/90 sm:text-sm">
                        {lang === 'vi' ? activePhoto.captionVi : activePhoto.captionEn}
                      </p>
                    </div>
                  </div>

                  {/* Gallery Thumbnails */}
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {selectedResidence.gallery.map((img, idx) => {
                      const active = idx === activePhotoIndex;
                      return (
                        <button
                          key={`${img.src}-${idx}`}
                          type="button"
                          onClick={() => setActivePhotoIndex(idx)}
                          className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg border transition-all"
                          style={{
                            borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                            opacity: active ? 1 : 0.72,
                          }}
                        >
                          <img
                            src={img.src}
                            alt={lang === 'vi' ? img.tagVi : img.tagEn}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-left text-[10px] font-medium text-white">
                            {lang === 'vi' ? img.tagVi : img.tagEn}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <FloorplanSchematicSvg
                  residence={selectedResidence}
                  lang={lang}
                  hint={copy.floorplanHint}
                />
              )}
            </div>

            {/* Precision Specification Grid */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.areaLabel}</div>
                <div className="font-mono-tabular mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedResidence.areaSqm} m²
                </div>
                <div className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  +{selectedResidence.terraceSqm}m² {copy.terraceIncluded}
                </div>
              </div>

              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.pricePerSqmLabel}</div>
                <div className="font-mono-tabular mt-1 text-base font-semibold" style={{ color: 'var(--accent)' }}>
                  {formatPricePerSqm(selectedResidence.priceVnd, selectedResidence.areaSqm, currency, lang)}
                </div>
                <div className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {selectedResidence.bedrooms}BR · {selectedResidence.bathrooms}BA
                </div>
              </div>

              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.maintenanceLabel}</div>
                <div className="font-mono-tabular mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(monthlyMaintenanceVnd, currency, lang, { compact: true })}
                </div>
                <div className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {selectedResidence.maintenanceFeePerSqmVnd.toLocaleString('en-US')} VNĐ/m²
                </div>
              </div>

              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.riverScoreLabel}</div>
                <div className="font-mono-tabular mt-1 text-base font-semibold text-emerald-500">
                  {selectedResidence.riverViewScore}/100
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/20">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${selectedResidence.riverViewScore}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.ceilingLabel}</div>
                <div className="font-mono-tabular mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedResidence.ceilingHeightM.toFixed(1)} m
                </div>
                <div className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {selectedResidence.parkingSlots} Valet Bay{selectedResidence.parkingSlots > 1 ? 's' : ''}
                </div>
              </div>

              <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.handoverLabel}</div>
                <div className="font-mono-tabular mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedResidence.handoverQuarter}
                </div>
                <div className="font-mono-tabular text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(selectedResidence.estMonthlyRentVnd, currency, lang, { compact: true })} {copy.perMonth}
                </div>
              </div>
            </div>

            {/* Architectural Finish Highlights */}
            <div className="mt-5 rounded-xl border p-4" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
              <div className="mb-2.5 text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--accent)' }}>
                {copy.highlightsTitle}
              </div>
              <ul className="space-y-2">
                {(lang === 'vi' ? selectedResidence.highlightsVi : selectedResidence.highlightsEn).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' } as React.CSSProperties} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary Action Bar */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onBookViewing(selectedResidence)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:brightness-110 sm:text-sm"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
              >
                <CalendarIcon className="h-4 w-4" />
                <span>{copy.bookViewingBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => onSimulateResidence(selectedResidence)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm"
                style={{
                  borderColor: 'var(--border-strong)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                <CalculatorIcon className="h-4 w-4" />
                <span>{copy.simulateBtn}</span>
              </button>

              <button
                type="button"
                disabled={compareIsFull}
                onClick={() => onToggleCompare(selectedResidence.id)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm"
                style={{
                  borderColor: isSelectedCompared ? 'var(--accent)' : 'var(--border-subtle)',
                  backgroundColor: isSelectedCompared ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  color: isSelectedCompared ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                <CompareIcon className="h-4 w-4" />
                <span>
                  {isSelectedCompared
                    ? copy.comparingBtn
                    : compareIsFull
                      ? copy.compareFull
                      : copy.compareBtn}
                </span>
              </button>
            </div>
          </div>

          {/* Curated 12-Residence Inventory Cards */}
          <div>
            {filteredResidences.length === 0 ? (
              <div
                className="rounded-2xl border p-8 text-center"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {copy.noResults}
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-4 cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                >
                  {copy.resetFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {filteredResidences.map((unit) => {
                  const isSelected = unit.id === selectedResidence.id;
                  const inCompare = compareIds.includes(unit.id);
                  const canAddCompare = compareIds.length < 3 || inCompare;
                  const unitNetYield = computeResidenceNetYieldPct(unit);
                  const unitStatus = STATUS_STYLE[unit.status];

                  return (
                    <div
                      key={unit.id}
                      onClick={() => onSelectResidence(unit)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectResidence(unit);
                        }
                      }}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                        boxShadow: isSelected ? '0 0 0 1px var(--accent)' : undefined,
                      }}
                    >
                      <div className="relative h-36 w-full overflow-hidden">
                        <img
                          src={unit.heroImage}
                          alt={lang === 'vi' ? unit.nameVi : unit.nameEn}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="font-mono-tabular rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-[#F2D5B3] backdrop-blur-sm">
                            {unit.code} · F{unit.floor}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
                            style={{ backgroundColor: 'rgba(10,11,14,0.78)', color: unitStatus.text }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: unitStatus.dot }} />
                            {copy.statusLabels[unit.status]}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={!canAddCompare}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCompare(unit.id);
                          }}
                          aria-label={`Compare ${unit.code}`}
                          className="absolute top-2.5 right-2.5 flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold backdrop-blur-md transition-colors disabled:opacity-40"
                          style={{
                            borderColor: inCompare ? '#D4A373' : 'rgba(255,255,255,0.25)',
                            backgroundColor: inCompare ? '#D4A373' : 'rgba(10,11,14,0.68)',
                            color: inCompare ? '#0A0B0E' : '#FFFFFF',
                          }}
                        >
                          <CompareIcon className="h-3 w-3" />
                          {inCompare ? <CheckIcon className="h-3 w-3" /> : <span>+</span>}
                        </button>

                        <div className="absolute right-3 bottom-2.5 left-3 flex items-end justify-between">
                          <div className="font-display text-lg leading-tight font-semibold text-white">
                            {lang === 'vi' ? unit.nameVi : unit.nameEn}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-3.5">
                        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-mono-tabular">
                            {unit.areaSqm}m² · {unit.bedrooms}BR
                          </span>
                          <span>{copy.orientationLabels[unit.orientation]}</span>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between border-t pt-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="font-mono-tabular text-base font-semibold" style={{ color: 'var(--accent)' }}>
                            {formatCurrency(unit.priceVnd, currency, lang, { compact: true })}
                          </div>
                          <div className="font-mono-tabular text-xs font-semibold text-emerald-500">
                            {unitNetYield.toFixed(1)}% {lang === 'vi' ? 'ròng' : 'net'}
                          </div>
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
    </section>
  );
};
