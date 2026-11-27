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
  BookmarkIcon,
  CalculatorIcon,
  CalendarIcon,
  CheckIcon,
  CompareIcon,
  CompassIcon,
  KeyIcon,
  PhotoIcon,
  PrinterIcon,
  QrCodeIcon,
} from './Icons';

interface ResidenceExplorerProps {
  residences: Residence[];
  selectedResidence: Residence;
  onSelectResidence: (unit: Residence) => void;
  compareIds: string[];
  onToggleCompare: (unitId: string) => void;
  shortlistIds: string[];
  onToggleShortlist: (unitId: string) => void;
  onBookViewing: (unit: Residence) => void;
  onOpenDeposit: (unit: Residence) => void;
  onSimulateResidence: (unit: Residence) => void;
  onPrintDossier: () => void;
  currency: Currency;
  lang: Language;
  copy: CopyBundle['explorer'];
}

const DEFAULT_MAX_PRICE = 85_000_000_000;

const STATUS_STYLE: Record<UnitStatus, { dot: string; bg: string; border: string; text: string }> = {
  AVAILABLE: {
    dot: 'var(--status-available)',
    bg: 'var(--status-available-bg)',
    border: 'var(--status-available-border)',
    text: 'var(--status-available)',
  },
  RESERVED: {
    dot: 'var(--status-reserved)',
    bg: 'var(--status-reserved-bg)',
    border: 'var(--status-reserved-border)',
    text: 'var(--status-reserved)',
  },
  SOLD: {
    dot: 'var(--status-sold)',
    bg: 'var(--status-sold-bg)',
    border: 'var(--status-sold-border)',
    text: 'var(--status-sold)',
  },
};

export const ResidenceExplorer: React.FC<ResidenceExplorerProps> = ({
  residences,
  selectedResidence,
  onSelectResidence,
  compareIds,
  onToggleCompare,
  shortlistIds,
  onToggleShortlist,
  onBookViewing,
  onOpenDeposit,
  onSimulateResidence,
  onPrintDossier,
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
    shortlistOnly: false,
  });

  const [detailTab, setDetailTab] = useState<'gallery' | 'floorplan'>('gallery');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Reset active gallery photo when selected residence changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [selectedResidence.id]);

  const filteredResidences = useMemo(
    () => filterAndSortResidences(residences, filters, shortlistIds),
    [residences, filters, shortlistIds]
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
      shortlistOnly: false,
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
  const isSelectedShortlisted = shortlistIds.includes(selectedResidence.id);
  const compareIsFull = compareIds.length >= 3 && !isSelectedCompared;
  const activePhoto = selectedResidence.gallery[activePhotoIndex] ?? selectedResidence.gallery[0];
  const monthlyMaintenanceVnd = computeResidenceMonthlyMaintenance(selectedResidence);
  const grossYieldPct = computeResidenceGrossYieldPct(selectedResidence);
  const netYieldPct = computeResidenceNetYieldPct(selectedResidence);
  const statusPalette = STATUS_STYLE[selectedResidence.status];

  return (
    <section id="tower-explorer" className="no-print mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-22">
      {/* Editorial Chapter Header */}
      <div className="mb-10 flex flex-col justify-between gap-5 border-b pb-7 lg:flex-row lg:items-end" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              01
            </span>
            <span className="h-px w-8" style={{ backgroundColor: 'var(--accent)' }} />
            <span
              className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: 'var(--accent)' }}
            >
              {copy.eyebrow}
            </span>
          </div>
          <h2
            className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: 'var(--text-heading)' }}
          >
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            {copy.subtitle}
          </p>
        </div>

        <div
          className="font-mono-tabular inline-flex items-baseline gap-2 self-start border px-4 py-2.5 text-xs font-medium lg:self-end"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
        >
          <span className="font-display text-2xl leading-none font-semibold" style={{ color: 'var(--text-heading)' }}>
            {filteredResidences.length}
          </span>
          <span>/ {residences.length} {copy.matchingCount}</span>
        </div>
      </div>

      {/* Architectural Catalogue Filter Index Bar */}
      <div
        className="mb-8 border-t-2 border-r border-b border-l p-4 sm:p-5"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderTopColor: 'var(--accent)',
          borderRightColor: 'var(--border-subtle)',
          borderBottomColor: 'var(--border-subtle)',
          borderLeftColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          {/* Bedroom Tier Pills */}
          <div className="lg:col-span-5">
            <div className="mb-2 text-[10.5px] font-semibold tracking-[0.16em] uppercase" style={{ color: 'var(--text-muted)' }}>
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
                    className="cursor-pointer rounded-sm border px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                      backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-primary)',
                      color: active ? 'var(--cta-ink)' : 'var(--text-secondary)',
                    }}
                  >
                    {tier === 'ALL' ? copy.filterAll : copy.tierLabels[tier]}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    shortlistOnly: !prev.shortlistOnly,
                    floor: null,
                  }))
                }
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  borderColor: filters.shortlistOnly ? 'var(--accent)' : 'var(--border-subtle)',
                  backgroundColor: filters.shortlistOnly ? 'var(--accent-soft)' : 'var(--bg-primary)',
                  color: filters.shortlistOnly ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <BookmarkIcon className="h-3.5 w-3.5" filled={Boolean(filters.shortlistOnly)} />
                <span>{copy.shortlistFilterBtn}</span>
                <span className="font-mono-tabular opacity-80">({shortlistIds.length})</span>
              </button>
            </div>
          </div>

          {/* Orientation & Sort Selects */}
          <div className="sm:grid sm:grid-cols-2 sm:gap-3 lg:col-span-4">
            <div>
              <label
                htmlFor="orientation-filter"
                className="mb-2 block text-[10.5px] font-semibold tracking-[0.16em] uppercase"
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
                className="w-full cursor-pointer rounded-sm border px-3 py-2 text-xs font-medium outline-none"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-primary)',
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
                className="mb-2 block text-[10.5px] font-semibold tracking-[0.16em] uppercase"
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
                className="w-full cursor-pointer rounded-sm border px-3 py-2 text-xs font-medium outline-none"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-primary)',
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
            <div className="mb-2 flex items-center justify-between text-[10.5px]">
              <span className="font-semibold tracking-[0.16em] uppercase" style={{ color: 'var(--text-muted)' }}>
                {copy.maxBudgetLabel}
              </span>
              <span className="font-mono-tabular font-semibold" style={{ color: 'var(--text-heading)' }}>
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

      {/* Main 12-Col Explorer: Left Tower Elevation Stack | Right Residence Dossier + Catalogue Grid */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Interactive Tower Elevation */}
        <div className="min-w-0 lg:sticky lg:top-28 lg:col-span-4">
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

        {/* Right Column: Selected Residence Gallery Monograph + Curated Listing Cards */}
        <div className="min-w-0 space-y-8 lg:col-span-8">
          {/* Selected Residence Architectural Monograph Dossier */}
          <div
            className="overflow-hidden border-t-2 border-r border-b border-l p-5 sm:p-7"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderTopColor: 'var(--cta-bg)',
              borderRightColor: 'var(--border-subtle)',
              borderBottomColor: 'var(--border-subtle)',
              borderLeftColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-editorial)',
            }}
          >
            {/* Dossier Top Header */}
            <div
              className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-start"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: 'var(--accent)' }}
                  >
                    {copy.selectedUnitEyebrow}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10.5px] font-semibold"
                    style={{
                      backgroundColor: statusPalette.bg,
                      borderColor: statusPalette.border,
                      color: statusPalette.text,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusPalette.dot }} />
                    {copy.statusLabels[selectedResidence.status]}
                  </span>
                </div>

                <h3
                  className="font-display mt-2.5 text-2xl font-semibold sm:text-3xl lg:text-[2rem]"
                  style={{ color: 'var(--text-heading)' }}
                >
                  <span className="font-mono-tabular mr-2.5 text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                    {selectedResidence.code}
                  </span>
                  {lang === 'vi' ? selectedResidence.nameVi : selectedResidence.nameEn}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-mono-tabular">
                    {copy.floorPrefix} {selectedResidence.floor} · {selectedResidence.wing}
                  </span>
                  <span style={{ color: 'var(--accent)' }}>·</span>
                  <span className="inline-flex items-center gap-1">
                    <CompassIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                    {copy.orientationLabels[selectedResidence.orientation]}
                  </span>
                  <span style={{ color: 'var(--accent)' }}>·</span>
                  <span className="inline-flex items-center gap-1">
                    <KeyIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                    {selectedResidence.privateLift ? copy.privateLiftYes : copy.privateLiftNo}
                  </span>
                </div>
              </div>

              <div className="shrink-0 sm:text-right">
                <div
                  className="font-mono-tabular text-2xl font-semibold sm:text-3xl"
                  style={{ color: 'var(--text-heading)' }}
                >
                  {formatCurrency(selectedResidence.priceVnd, currency, lang)}
                </div>
                <div className="font-mono-tabular mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatPricePerSqm(selectedResidence.priceVnd, selectedResidence.areaSqm, currency, lang)} ·{' '}
                  <span className="font-semibold" style={{ color: 'var(--status-available)' }}>
                    {netYieldPct.toFixed(1)}% {lang === 'vi' ? 'ròng' : 'net'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Toggle: Interior Photography vs Architectural CAD Floorplan */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex rounded-sm border p-0.5"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={detailTab === 'gallery'}
                  onClick={() => setDetailTab('gallery')}
                  className="flex cursor-pointer items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: detailTab === 'gallery' ? 'var(--cta-bg)' : 'transparent',
                    color: detailTab === 'gallery' ? 'var(--cta-ink)' : 'var(--text-secondary)',
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
                  className="flex cursor-pointer items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: detailTab === 'floorplan' ? 'var(--cta-bg)' : 'transparent',
                    color: detailTab === 'floorplan' ? 'var(--cta-ink)' : 'var(--text-secondary)',
                  }}
                >
                  <BlueprintIcon className="h-3.5 w-3.5" />
                  <span>{copy.tabFloorplan}</span>
                </button>
              </div>

              <span className="font-mono-tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                {copy.estGrossYield}:{' '}
                <strong style={{ color: 'var(--status-available)' }}>{grossYieldPct.toFixed(2)}%</strong>
              </span>
            </div>

            {/* Visual Stage: Daylight Framed Gallery OR Interactive CAD Blueprint */}
            <div className="mt-4">
              {detailTab === 'gallery' ? (
                <div className="space-y-3">
                  <figure
                    className="m-0 overflow-hidden border"
                    style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <img
                        src={activePhoto.src}
                        alt={lang === 'vi' ? activePhoto.captionVi : activePhoto.captionEn}
                        className="h-full w-full object-cover transition-all duration-300"
                      />
                    </div>
                    <figcaption
                      className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        backgroundColor: 'var(--bg-primary)',
                      }}
                    >
                      <span
                        className="font-mono-tabular inline-block border-l-2 pl-2 text-[10px] font-semibold tracking-[0.16em] uppercase"
                        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                      >
                        {lang === 'vi' ? activePhoto.tagVi : activePhoto.tagEn}
                      </span>
                      <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {lang === 'vi' ? activePhoto.captionVi : activePhoto.captionEn}
                      </p>
                    </figcaption>
                  </figure>

                  {/* Gallery Thumbnails */}
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {selectedResidence.gallery.map((img, idx) => {
                      const active = idx === activePhotoIndex;
                      return (
                        <button
                          key={`${img.src}-${idx}`}
                          type="button"
                          onClick={() => setActivePhotoIndex(idx)}
                          className="group flex cursor-pointer flex-col overflow-hidden border text-left transition-all"
                          style={{
                            borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                            backgroundColor: 'var(--bg-primary)',
                            opacity: active ? 1 : 0.78,
                          }}
                        >
                          <div className="aspect-[16/10] w-full overflow-hidden">
                            <img
                              src={img.src}
                              alt={lang === 'vi' ? img.tagVi : img.tagEn}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div
                            className="truncate px-2 py-1.5 text-[10px] font-semibold"
                            style={{
                              color: active ? 'var(--accent)' : 'var(--text-secondary)',
                              borderTop: '1px solid var(--border-subtle)',
                            }}
                          >
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

            {/* Precision Architectural Specification Ledger */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  {copy.areaLabel}
                </div>
                <div className="font-mono-tabular mt-1.5 text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {selectedResidence.areaSqm} m²
                </div>
                <div className="font-mono-tabular text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  +{selectedResidence.terraceSqm}m² {copy.terraceIncluded}
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  {copy.pricePerSqmLabel}
                </div>
                <div className="font-mono-tabular mt-1.5 text-base font-semibold" style={{ color: 'var(--accent)' }}>
                  {formatPricePerSqm(selectedResidence.priceVnd, selectedResidence.areaSqm, currency, lang)}
                </div>
                <div className="font-mono-tabular text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {selectedResidence.bedrooms}BR · {selectedResidence.bathrooms}BA
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  {copy.maintenanceLabel}
                </div>
                <div className="font-mono-tabular mt-1.5 text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {formatCurrency(monthlyMaintenanceVnd, currency, lang, { compact: true })}
                </div>
                <div className="font-mono-tabular text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {selectedResidence.maintenanceFeePerSqmVnd.toLocaleString('en-US')} VNĐ/m²
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  {copy.riverScoreLabel}
                </div>
                <div className="font-mono-tabular mt-1.5 text-base font-semibold" style={{ color: 'var(--status-available)' }}>
                  {selectedResidence.riverViewScore}/100
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--track-bg)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedResidence.riverViewScore}%`,
                      backgroundColor: 'var(--status-available)',
                    }}
                  />
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  {copy.ceilingLabel}
                </div>
                <div className="font-mono-tabular mt-1.5 text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {selectedResidence.ceilingHeightM.toFixed(1)} m
                </div>
                <div className="font-mono-tabular text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {selectedResidence.parkingSlots} Valet Bay{selectedResidence.parkingSlots > 1 ? 's' : ''}
                </div>
              </div>

              <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-[10.5px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  {copy.handoverLabel}
                </div>
                <div className="font-mono-tabular mt-1.5 text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
                  {selectedResidence.handoverQuarter}
                </div>
                <div className="font-mono-tabular text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(selectedResidence.estMonthlyRentVnd, currency, lang, { compact: true })} {copy.perMonth}
                </div>
              </div>
            </div>

            {/* Architectural Finish Highlights */}
            <div
              className="mt-5 border-l-2 border-t border-r border-b p-4"
              style={{
                borderLeftColor: 'var(--accent)',
                borderTopColor: 'var(--border-subtle)',
                borderRightColor: 'var(--border-subtle)',
                borderBottomColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <div
                className="mb-2.5 text-[10.5px] font-semibold tracking-[0.18em] uppercase"
                style={{ color: 'var(--accent)' }}
              >
                {copy.highlightsTitle}
              </div>
              <ul className="space-y-2">
                {(lang === 'vi' ? selectedResidence.highlightsVi : selectedResidence.highlightsEn).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary Action Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onBookViewing(selectedResidence)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-sm px-4 py-2.5 text-xs font-semibold tracking-[0.08em] uppercase transition-all hover:opacity-92"
                style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
              >
                <CalendarIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <span>{copy.bookViewingBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenDeposit(selectedResidence)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-sm border px-4 py-2.5 text-xs font-semibold tracking-[0.06em] uppercase transition-all"
                style={{
                  borderColor: 'var(--border-strong)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--text-heading)',
                }}
              >
                <QrCodeIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <span>{copy.holdDepositBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => onSimulateResidence(selectedResidence)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-sm border px-4 py-2.5 text-xs font-semibold transition-all hover:border-[#B48A3E]"
                style={{
                  borderColor: 'var(--border-navy)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-heading)',
                }}
              >
                <CalculatorIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <span>{copy.simulateBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleShortlist(selectedResidence.id)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-sm border px-3.5 py-2.5 text-xs font-semibold transition-all"
                style={{
                  borderColor: isSelectedShortlisted ? 'var(--accent)' : 'var(--border-subtle)',
                  backgroundColor: isSelectedShortlisted ? 'var(--accent-soft)' : 'var(--bg-primary)',
                  color: isSelectedShortlisted ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                <BookmarkIcon className="h-4 w-4" filled={isSelectedShortlisted} />
                <span>{isSelectedShortlisted ? copy.savedShortlistBtn : copy.saveShortlistBtn}</span>
              </button>

              <button
                type="button"
                disabled={compareIsFull}
                onClick={() => onToggleCompare(selectedResidence.id)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-sm border px-3.5 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  borderColor: isSelectedCompared ? 'var(--accent)' : 'var(--border-subtle)',
                  backgroundColor: isSelectedCompared ? 'var(--accent-soft)' : 'var(--bg-primary)',
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

              <button
                type="button"
                onClick={onPrintDossier}
                title={copy.printDossierBtn}
                aria-label={copy.printDossierBtn}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-3 py-2.5 text-xs font-semibold transition-all"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                }}
              >
                <PrinterIcon className="h-4 w-4" />
                <span className="hidden sm:inline">A4 PDF</span>
              </button>
            </div>
          </div>

          {/* Curated 12-Residence Editorial Listing Catalogue */}
          <div>
            {filteredResidences.length === 0 ? (
              <div
                className="border p-10 text-center"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {copy.noResults}
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-4 cursor-pointer rounded-sm px-4 py-2 text-xs font-semibold tracking-wider uppercase"
                  style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
                >
                  {copy.resetFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredResidences.map((unit) => {
                  const isSelected = unit.id === selectedResidence.id;
                  const inCompare = compareIds.includes(unit.id);
                  const isShortlisted = shortlistIds.includes(unit.id);
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
                      className="group flex cursor-pointer flex-col overflow-hidden border transition-all hover:-translate-y-0.5"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                        boxShadow: isSelected ? '0 0 0 1px var(--accent), var(--shadow-card)' : 'var(--shadow-card)',
                      }}
                    >
                      {/* Clean Daylight Listing Plate */}
                      <div className="relative h-44 w-full overflow-hidden">
                        <img
                          src={unit.heroImage}
                          alt={lang === 'vi' ? unit.nameVi : unit.nameEn}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Minimal Architectural Code & Status Badges */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span
                            className="font-mono-tabular rounded-sm px-2 py-0.5 text-[10.5px] font-semibold tracking-wider"
                            style={{ backgroundColor: 'rgba(15, 29, 54, 0.88)', color: '#FAF8F4' }}
                          >
                            {unit.code} · F{unit.floor}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.94)', color: unitStatus.text }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: unitStatus.dot }} />
                            {copy.statusLabels[unit.status]}
                          </span>
                        </div>

                        {/* Action Icons */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleShortlist(unit.id);
                            }}
                            aria-label={`Bookmark ${unit.code}`}
                            className="flex cursor-pointer items-center justify-center rounded-sm border p-1.5 transition-colors"
                            style={{
                              borderColor: isShortlisted ? '#B48A3E' : 'rgba(15, 29, 54, 0.2)',
                              backgroundColor: isShortlisted ? '#B48A3E' : 'rgba(255, 255, 255, 0.92)',
                              color: isShortlisted ? '#FFFFFF' : '#0F1D36',
                            }}
                          >
                            <BookmarkIcon className="h-3.5 w-3.5" filled={isShortlisted} />
                          </button>

                          <button
                            type="button"
                            disabled={!canAddCompare}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCompare(unit.id);
                            }}
                            aria-label={`Compare ${unit.code}`}
                            className="flex cursor-pointer items-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-40"
                            style={{
                              borderColor: inCompare ? '#0F1D36' : 'rgba(15, 29, 54, 0.2)',
                              backgroundColor: inCompare ? '#0F1D36' : 'rgba(255, 255, 255, 0.92)',
                              color: inCompare ? '#FAF8F4' : '#0F1D36',
                            }}
                          >
                            <CompareIcon className="h-3 w-3" />
                            {inCompare ? <CheckIcon className="h-3 w-3" /> : <span>+</span>}
                          </button>
                        </div>
                      </div>

                      {/* Editorial Listing Details Below Photo */}
                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <div className="font-display text-xl leading-snug font-semibold" style={{ color: 'var(--text-heading)' }}>
                            {lang === 'vi' ? unit.nameVi : unit.nameEn}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="font-mono-tabular">
                              {unit.areaSqm}m² · {unit.bedrooms}BR
                            </span>
                            <span>{copy.orientationLabels[unit.orientation]}</span>
                          </div>
                        </div>

                        <div
                          className="mt-3.5 flex items-baseline justify-between border-t pt-3"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <div className="font-mono-tabular text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
                            {formatCurrency(unit.priceVnd, currency, lang, { compact: true })}
                          </div>
                          <div className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--status-available)' }}>
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
