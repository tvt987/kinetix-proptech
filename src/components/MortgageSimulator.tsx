import React, { useMemo, useState } from 'react';
import type { Currency, Language, MortgageInputs, Residence } from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import {
  analyzeMortgageAndRoi,
  buildInvestmentDossierJson,
  buildInvestmentDossierMarkdown,
} from '../engines/mortgageEngine';
import { formatCurrency } from '../engines/currencyEngine';
import { ChevronDownIcon, DownloadIcon } from './Icons';

interface MortgageSimulatorProps {
  selectedResidence: Residence;
  inputs: MortgageInputs;
  onChangeInputs: (updater: (prev: MortgageInputs) => MortgageInputs) => void;
  isCustomMode: boolean;
  onToggleMode: (custom: boolean) => void;
  currency: Currency;
  lang: Language;
  copy: CopyBundle['simulator'];
}

const BANK_PRESETS = [
  { label: 'VCB 6.5%', rate: 6.5 },
  { label: 'SCB 7.2%', rate: 7.2 },
  { label: 'HSBC 8.0%', rate: 8.0 },
  { label: 'Stress 10.5%', rate: 10.5 },
];

export const MortgageSimulator: React.FC<MortgageSimulatorProps> = ({
  selectedResidence,
  inputs,
  onChangeInputs,
  isCustomMode,
  onToggleMode,
  currency,
  lang,
  copy,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number>(10);
  const [showFullAmortization, setShowFullAmortization] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'md' | 'json'>('idle');

  const analysis = useMemo(() => analyzeMortgageAndRoi(inputs), [inputs]);

  const principalPct =
    analysis.totalPaymentsVnd > 0
      ? (analysis.loanPrincipalVnd / analysis.totalPaymentsVnd) * 100
      : 100;
  const interestPct = 100 - principalPct;

  const activePoint =
    analysis.tenYearProjection.find((p) => p.year === hoveredYear) ??
    analysis.tenYearProjection[analysis.tenYearProjection.length - 1];

  // SVG Chart Geometry
  const chartW = 640;
  const chartH = 240;
  const padL = 16;
  const padR = 16;
  const padT = 18;
  const padB = 28;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const maxChartValue = Math.max(
    1,
    ...analysis.tenYearProjection.map((p) => Math.max(p.propertyValueVnd, p.totalWealthVnd))
  );

  const xForYear = (year: number) => padL + ((year - 1) / 9) * innerW;
  const yForVal = (val: number) => padT + innerH - (val / maxChartValue) * innerH;

  const buildPath = (selector: (p: (typeof analysis.tenYearProjection)[number]) => number) =>
    analysis.tenYearProjection
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${xForYear(pt.year).toFixed(1)} ${yForVal(selector(pt)).toFixed(1)}`)
      .join(' ');

  const propertyPath = buildPath((p) => p.propertyValueVnd);
  const equityPath = buildPath((p) => p.netEquityVnd);
  const debtPath = buildPath((p) => p.remainingDebtVnd);
  const rentPath = buildPath((p) => p.cumulativeNetRentVnd);

  const equityAreaPath = `${equityPath} L ${xForYear(10).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xForYear(1).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  const triggerDownload = (content: string, filename: string, mimeType: string, kind: 'md' | 'json') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportStatus(kind);
    window.setTimeout(() => setExportStatus('idle'), 2600);
  };

  const handleExportMd = () => {
    const md = buildInvestmentDossierMarkdown(
      analysis,
      inputs,
      currency,
      lang,
      isCustomMode ? null : selectedResidence
    );
    const slug = isCustomMode ? 'custom-asset' : selectedResidence.code.toLowerCase();
    triggerDownload(md, `kinetix-dossier-${slug}.md`, 'text/markdown;charset=utf-8', 'md');
  };

  const handleExportJson = () => {
    const json = buildInvestmentDossierJson(
      analysis,
      inputs,
      currency,
      isCustomMode ? null : selectedResidence
    );
    const slug = isCustomMode ? 'custom-asset' : selectedResidence.code.toLowerCase();
    triggerDownload(json, `kinetix-dossier-${slug}.json`, 'application/json;charset=utf-8', 'json');
  };

  const displayedAmortization = showFullAmortization
    ? analysis.amortizationSchedule
    : analysis.amortizationSchedule.filter(
        (_r, idx, arr) => idx < 5 || idx === arr.length - 1
      );

  return (
    <section
      id="mortgage-simulator"
      className="border-t py-16 lg:py-20"
      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header & Mode Switch */}
        <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
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

          {/* Synced vs Custom Mode Pills */}
          <div
            className="inline-flex self-start rounded-xl border p-1 lg:self-end"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <button
              type="button"
              onClick={() => onToggleMode(false)}
              className="cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all"
              style={{
                backgroundColor: !isCustomMode ? 'var(--accent)' : 'transparent',
                color: !isCustomMode ? 'var(--accent-ink)' : 'var(--text-secondary)',
              }}
            >
              {copy.modeResidence}
            </button>
            <button
              type="button"
              onClick={() => onToggleMode(true)}
              className="cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold transition-all"
              style={{
                backgroundColor: isCustomMode ? 'var(--accent)' : 'transparent',
                color: isCustomMode ? 'var(--accent-ink)' : 'var(--text-secondary)',
              }}
            >
              {copy.modeCustom}
            </button>
          </div>
        </div>

        {/* Main 12-Col FinTech Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Panel: Interactive Financial Parameters */}
          <div
            className="flex flex-col justify-between rounded-2xl border p-5 sm:p-6 lg:col-span-5"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="space-y-6">
              {/* Synced Residence Banner */}
              {!isCustomMode && (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                  style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--accent-soft)' }}
                >
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {copy.syncedWith}
                    </div>
                    <div className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      {selectedResidence.code} · {lang === 'vi' ? selectedResidence.nameVi : selectedResidence.nameEn}
                    </div>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedResidence.areaSqm}m²
                  </span>
                </div>
              )}

              {/* Property Valuation */}
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <label htmlFor="sim-price" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.propertyValueLabel}
                  </label>
                  <span className="font-mono-tabular text-base font-semibold" style={{ color: 'var(--accent)' }}>
                    {formatCurrency(inputs.propertyPriceVnd, currency, lang)}
                  </span>
                </div>
                <input
                  id="sim-price"
                  type="range"
                  min={8_000_000_000}
                  max={100_000_000_000}
                  step={500_000_000}
                  value={inputs.propertyPriceVnd}
                  onChange={(e) => {
                    onToggleMode(true);
                    const nextPrice = Number(e.target.value);
                    onChangeInputs((prev) => ({ ...prev, propertyPriceVnd: nextPrice }));
                  }}
                  className="kinetix-slider"
                />
              </div>

              {/* Down Payment % */}
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <label htmlFor="sim-down" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.downPaymentLabel}
                  </label>
                  <div className="font-mono-tabular text-right">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {inputs.downPaymentPct}%
                    </span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--accent)' }}>
                      ({formatCurrency(analysis.downPaymentVnd, currency, lang, { compact: true })})
                    </span>
                  </div>
                </div>
                <input
                  id="sim-down"
                  type="range"
                  min={20}
                  max={70}
                  step={5}
                  value={inputs.downPaymentPct}
                  onChange={(e) =>
                    onChangeInputs((prev) => ({ ...prev, downPaymentPct: Number(e.target.value) }))
                  }
                  className="kinetix-slider"
                />
                <div className="font-mono-tabular mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>20%</span>
                  <span>45%</span>
                  <span>70%</span>
                </div>
              </div>

              {/* Loan Term Years */}
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <label htmlFor="sim-term" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.loanTermLabel}
                  </label>
                  <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {inputs.loanTermYears} {copy.yearsUnit}
                  </span>
                </div>
                <input
                  id="sim-term"
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={inputs.loanTermYears}
                  onChange={(e) =>
                    onChangeInputs((prev) => ({ ...prev, loanTermYears: Number(e.target.value) }))
                  }
                  className="kinetix-slider"
                />
                <div className="font-mono-tabular mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>5 {copy.yearsUnit}</span>
                  <span>15 {copy.yearsUnit}</span>
                  <span>30 {copy.yearsUnit}</span>
                </div>
              </div>

              {/* Annual Interest Rate */}
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <label htmlFor="sim-rate" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.interestRateLabel}
                  </label>
                  <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                    {inputs.annualInterestRatePct.toFixed(1)}%
                  </span>
                </div>
                <input
                  id="sim-rate"
                  type="range"
                  min={5.5}
                  max={12.5}
                  step={0.1}
                  value={inputs.annualInterestRatePct}
                  onChange={(e) =>
                    onChangeInputs((prev) => ({
                      ...prev,
                      annualInterestRatePct: Number(e.target.value),
                    }))
                  }
                  className="kinetix-slider"
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.ratePresetsLabel}
                  </span>
                  {BANK_PRESETS.map((preset) => {
                    const active = Math.abs(inputs.annualInterestRatePct - preset.rate) < 0.05;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          onChangeInputs((prev) => ({ ...prev, annualInterestRatePct: preset.rate }))
                        }
                        className="font-mono-tabular cursor-pointer rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors"
                        style={{
                          borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                          color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Monthly Rent */}
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <label htmlFor="sim-rent" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.monthlyRentLabel}
                  </label>
                  <span className="font-mono-tabular text-sm font-semibold text-emerald-500">
                    {formatCurrency(inputs.estimatedMonthlyRentVnd, currency, lang, { compact: true })}
                  </span>
                </div>
                <input
                  id="sim-rent"
                  type="range"
                  min={40_000_000}
                  max={600_000_000}
                  step={2_000_000}
                  value={inputs.estimatedMonthlyRentVnd}
                  onChange={(e) =>
                    onChangeInputs((prev) => ({
                      ...prev,
                      estimatedMonthlyRentVnd: Number(e.target.value),
                    }))
                  }
                  className="kinetix-slider"
                />
              </div>

              {/* Annual Appreciation Forecast */}
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <label htmlFor="sim-appreciation" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.appreciationLabel}
                  </label>
                  <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {inputs.annualAppreciationPct.toFixed(1)}% / yr
                  </span>
                </div>
                <input
                  id="sim-appreciation"
                  type="range"
                  min={3}
                  max={12}
                  step={0.5}
                  value={inputs.annualAppreciationPct}
                  onChange={(e) =>
                    onChangeInputs((prev) => ({
                      ...prev,
                      annualAppreciationPct: Number(e.target.value),
                    }))
                  }
                  className="kinetix-slider"
                />
              </div>
            </div>

            {/* Export Investment Dossier Actions */}
            <div className="mt-7 border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleExportMd}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:brightness-110"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                >
                  <DownloadIcon className="h-4 w-4" />
                  <span>{exportStatus === 'md' ? copy.copiedLabel : copy.exportMdBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all"
                  style={{
                    borderColor: 'var(--border-strong)',
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  <DownloadIcon className="h-4 w-4" />
                  <span>{exportStatus === 'json' ? copy.copiedLabel : copy.exportJsonBtn}</span>
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {copy.exportNote}
              </p>
            </div>
          </div>

          {/* Right Panel: Live KPI Telemetry + 10-Year Equity SVG Chart + Amortization */}
          <div className="space-y-6 lg:col-span-7">
            {/* Hero PMT & Principal/Interest Breakdown */}
            <div
              className="rounded-2xl border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-strong)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <div className="font-mono-tabular text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--accent)' }}>
                    {copy.monthlyPmtTitle}
                  </div>
                  <div className="font-mono-tabular mt-2 text-3xl font-semibold sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(analysis.monthlyPaymentVnd, currency, lang)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>
                      {copy.loanPrincipalLabel}:{' '}
                      <strong className="font-mono-tabular" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(analysis.loanPrincipalVnd, currency, lang, { compact: true })}
                      </strong>
                    </span>
                    <span>
                      {copy.totalInterestLabel}:{' '}
                      <strong className="font-mono-tabular text-amber-500">
                        {formatCurrency(analysis.totalInterestVnd, currency, lang, { compact: true })}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Cash-on-Cash / Cashflow Pill */}
                <div
                  className="flex flex-col justify-center rounded-xl border p-3.5"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
                >
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.monthlyCashFlowLabel}
                  </div>
                  <div
                    className={`font-mono-tabular mt-1 text-lg font-semibold ${
                      analysis.monthlyNetCashFlowVnd >= 0 ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {formatCurrency(analysis.monthlyNetCashFlowVnd, currency, lang, {
                      compact: true,
                      signed: true,
                    })}
                  </div>
                  <div className="font-mono-tabular mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.cashOnCashLabel}: {analysis.cashOnCashReturnPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Principal vs Total Interest Stacked Visual Bar */}
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span style={{ color: 'var(--text-secondary)' }}>{copy.principalVsInterestTitle}</span>
                  <span className="font-mono-tabular" style={{ color: 'var(--text-muted)' }}>
                    {copy.principalLabel} {principalPct.toFixed(0)}% · {copy.interestLabel} {interestPct.toFixed(0)}%
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-black/25">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${principalPct}%`, backgroundColor: 'var(--accent)' }}
                  />
                  <div
                    className="h-full bg-amber-500/75 transition-all duration-300"
                    style={{ width: `${interestPct}%` }}
                  />
                </div>
              </div>

              {/* 4 Financial Yield & ROI KPI Tiles */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.grossYieldLabel}</div>
                  <div className="font-mono-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {analysis.grossRentalYieldPct.toFixed(2)}%
                  </div>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.netYieldLabel}</div>
                  <div className="font-mono-tabular mt-1 text-lg font-semibold text-emerald-500">
                    {analysis.netRentalYieldPct.toFixed(2)}%
                  </div>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.tenYearEquityLabel}</div>
                  <div className="font-mono-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                    {formatCurrency(
                      analysis.tenYearProjection[9]?.netEquityVnd ?? 0,
                      currency,
                      lang,
                      { compact: true }
                    )}
                  </div>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{copy.tenYearRoiLabel}</div>
                  <div className="font-mono-tabular mt-1 text-lg font-semibold text-emerald-500">
                    +{analysis.tenYearTotalRoiPct.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* 10-Year Equity Projection Interactive SVG Chart */}
            <div
              className="rounded-2xl border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {copy.chartTitle}
                  </h3>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {copy.chartSubtitle}
                  </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#D4A373]" />
                    {copy.chartPropertyValue}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {copy.chartNetEquity}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {copy.chartRemainingDebt}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    {copy.chartCumRent}
                  </span>
                </div>
              </div>

              {/* Active Year Telemetry Bar */}
              {activePoint && (
                <div
                  className="mt-4 grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-5"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
                >
                  <div>
                    <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                      {copy.colYear}
                    </div>
                    <div className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                      Y{activePoint.year}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{copy.chartPropertyValue}</div>
                    <div className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(activePoint.propertyValueVnd, currency, lang, { compact: true })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{copy.chartNetEquity}</div>
                    <div className="font-mono-tabular text-xs font-semibold text-emerald-500">
                      {formatCurrency(activePoint.netEquityVnd, currency, lang, { compact: true })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{copy.chartRemainingDebt}</div>
                    <div className="font-mono-tabular text-xs font-semibold text-amber-500">
                      {formatCurrency(activePoint.remainingDebtVnd, currency, lang, { compact: true })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{copy.chartCumRent}</div>
                    <div className="font-mono-tabular text-xs font-semibold text-sky-400">
                      {formatCurrency(activePoint.cumulativeNetRentVnd, currency, lang, { compact: true })}
                    </div>
                  </div>
                </div>
              )}

              {/* SVG Chart Canvas */}
              <div className="mt-4 overflow-hidden">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-auto w-full select-none" role="img" aria-label={copy.chartTitle}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Reference Lines */}
                  {[0.25, 0.5, 0.75, 1].map((frac) => {
                    const y = padT + innerH * (1 - frac);
                    return (
                      <line
                        key={frac}
                        x1={padL}
                        y1={y}
                        x2={chartW - padR}
                        y2={y}
                        stroke="var(--border-subtle)"
                        strokeDasharray="3 4"
                      />
                    );
                  })}

                  {/* Net Equity Area */}
                  <path d={equityAreaPath} fill="url(#equityGrad)" />

                  {/* Series Curves */}
                  <path d={propertyPath} fill="none" stroke="#D4A373" strokeWidth="2.4" strokeLinecap="round" />
                  <path d={equityPath} fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                  <path d={debtPath} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="5 3" />
                  <path d={rentPath} fill="none" stroke="#38BDF8" strokeWidth="1.8" />

                  {/* Active Vertical Guide Line & Dots */}
                  {activePoint && (
                    <g>
                      <line
                        x1={xForYear(activePoint.year)}
                        y1={padT}
                        x2={xForYear(activePoint.year)}
                        y2={padT + innerH}
                        stroke="var(--accent)"
                        strokeOpacity="0.5"
                        strokeDasharray="2 2"
                      />
                      <circle cx={xForYear(activePoint.year)} cy={yForVal(activePoint.propertyValueVnd)} r="4.5" fill="#D4A373" stroke="var(--bg-secondary)" strokeWidth="2" />
                      <circle cx={xForYear(activePoint.year)} cy={yForVal(activePoint.netEquityVnd)} r="4.5" fill="#10B981" stroke="var(--bg-secondary)" strokeWidth="2" />
                      <circle cx={xForYear(activePoint.year)} cy={yForVal(activePoint.remainingDebtVnd)} r="3.5" fill="#F59E0B" />
                      <circle cx={xForYear(activePoint.year)} cy={yForVal(activePoint.cumulativeNetRentVnd)} r="3.5" fill="#38BDF8" />
                    </g>
                  )}

                  {/* Interactive Hover Columns + X-Axis Labels */}
                  {analysis.tenYearProjection.map((pt) => {
                    const x = xForYear(pt.year);
                    const colW = innerW / 9;
                    const isFocused = pt.year === hoveredYear;
                    return (
                      <g
                        key={pt.year}
                        onMouseEnter={() => setHoveredYear(pt.year)}
                        onClick={() => setHoveredYear(pt.year)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={x - colW / 2}
                          y={padT}
                          width={colW}
                          height={innerH + padB}
                          fill="transparent"
                        />
                        <text
                          x={x}
                          y={chartH - 8}
                          textAnchor="middle"
                          fill={isFocused ? 'var(--accent)' : 'var(--text-muted)'}
                          fontSize="10"
                          fontWeight={isFocused ? '700' : '500'}
                          fontFamily="JetBrains Mono, monospace"
                        >
                          Y{pt.year}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Year-by-Year Amortization Table */}
            <div
              className="rounded-2xl border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {copy.amortizationTitle}
                  </h3>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {copy.amortizationSubtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullAmortization((prev) => !prev)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    borderColor: 'var(--border-strong)',
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  <span>
                    {showFullAmortization
                      ? copy.toggleAmortizationHide
                      : `${copy.toggleAmortizationShow} (${analysis.amortizationSchedule.length})`}
                  </span>
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 transition-transform ${showFullAmortization ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[540px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th className="py-2.5 pr-3 font-semibold">{copy.colYear}</th>
                      <th className="px-3 py-2.5 text-right font-semibold">{copy.colOpening}</th>
                      <th className="px-3 py-2.5 text-right font-semibold">{copy.colAnnualPayment}</th>
                      <th className="px-3 py-2.5 text-right font-semibold">{copy.colPrincipal}</th>
                      <th className="px-3 py-2.5 text-right font-semibold">{copy.colInterest}</th>
                      <th className="py-2.5 pl-3 text-right font-semibold">{copy.colEnding}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-tabular divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {displayedAmortization.map((row, idx) => {
                      const prevRow = displayedAmortization[idx - 1];
                      const hasGap = prevRow && row.year - prevRow.year > 1;
                      return (
                        <React.Fragment key={row.year}>
                          {hasGap && (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-2 text-center text-[11px]"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                ··· {row.year - prevRow.year - 1} {copy.yearsUnit} ···
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-white/[0.02]">
                            <td className="py-2.5 pr-3 font-semibold" style={{ color: 'var(--accent)' }}>
                              Y{row.year}
                            </td>
                            <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>
                              {formatCurrency(row.openingBalanceVnd, currency, lang, { compact: true })}
                            </td>
                            <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-primary)' }}>
                              {formatCurrency(row.annualPaymentVnd, currency, lang, { compact: true })}
                            </td>
                            <td className="px-3 py-2.5 text-right text-emerald-500">
                              {formatCurrency(row.principalPaidVnd, currency, lang, { compact: true })}
                            </td>
                            <td className="px-3 py-2.5 text-right text-amber-500">
                              {formatCurrency(row.interestPaidVnd, currency, lang, { compact: true })}
                            </td>
                            <td className="py-2.5 pl-3 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {formatCurrency(row.endingBalanceVnd, currency, lang, { compact: true })}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
