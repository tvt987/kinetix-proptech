import React, { useMemo, useState } from 'react';
import type {
  Currency,
  DtiSafetyTier,
  InterestStressTestSummary,
  Language,
  MortgageAnalysisResult,
  MortgageInputs,
  Residence,
} from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import {
  buildInvestmentCashflowCsv,
  buildInvestmentDossierJson,
  buildInvestmentDossierMarkdown,
} from '../engines/mortgageEngine';
import { compareCashVsLeverage } from '../engines/leverageEngine';
import { formatCurrency } from '../engines/currencyEngine';
import {
  AlertTriangleIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  PrinterIcon,
  PulseIcon,
  ShieldCheckIcon,
} from './Icons';

interface MortgageSimulatorProps {
  selectedResidence: Residence;
  inputs: MortgageInputs;
  onChangeInputs: (updater: (prev: MortgageInputs) => MortgageInputs) => void;
  analysis: MortgageAnalysisResult;
  stressSummary: InterestStressTestSummary;
  rateShockPct: number;
  onChangeRateShock: (shock: number) => void;
  monthlyIncomeVnd: number;
  onChangeMonthlyIncome: (incomeVnd: number) => void;
  isCustomMode: boolean;
  onToggleMode: (custom: boolean) => void;
  onPrintDossier: () => void;
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

const SHOCK_PRESETS = [0, 2, 4] as const;

const DTI_STYLE: Record<DtiSafetyTier, { bg: string; border: string; text: string }> = {
  SAFE: {
    bg: 'var(--status-available-bg)',
    border: 'var(--status-available-border)',
    text: 'var(--status-available)',
  },
  CAUTION: {
    bg: 'var(--status-reserved-bg)',
    border: 'var(--status-reserved-border)',
    text: 'var(--status-reserved)',
  },
  HIGH_RISK: {
    bg: 'var(--status-sold-bg)',
    border: 'var(--status-sold-border)',
    text: 'var(--status-sold)',
  },
};

export const MortgageSimulator: React.FC<MortgageSimulatorProps> = ({
  selectedResidence,
  inputs,
  onChangeInputs,
  analysis,
  stressSummary,
  rateShockPct,
  onChangeRateShock,
  monthlyIncomeVnd,
  onChangeMonthlyIncome,
  isCustomMode,
  onToggleMode,
  onPrintDossier,
  currency,
  lang,
  copy,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number>(10);
  const [scheduleScope, setScheduleScope] = useState<'10y' | 'full'>('10y');
  const [exportStatus, setExportStatus] = useState<'idle' | 'md' | 'json' | 'csv'>('idle');
  const [leverageLtvPct, setLeverageLtvPct] = useState<number>(70);

  const leverageComparison = useMemo(
    () => compareCashVsLeverage(inputs, leverageLtvPct, 10),
    [inputs, leverageLtvPct]
  );

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

  const triggerDownload = (content: string, filename: string, mimeType: string, kind: 'md' | 'json' | 'csv') => {
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

  const handleExportCsv = () => {
    const csv = buildInvestmentCashflowCsv(
      analysis,
      inputs,
      stressSummary,
      currency,
      lang,
      isCustomMode ? null : selectedResidence
    );
    const slug = isCustomMode ? 'custom-asset' : selectedResidence.code.toLowerCase();
    triggerDownload(csv, `kinetix-cashflow-${slug}.csv`, 'text/csv;charset=utf-8;', 'csv');
  };

  const getDtiLabel = (tier: DtiSafetyTier) => {
    if (tier === 'SAFE') return copy.dtiSafeLabel;
    if (tier === 'CAUTION') return copy.dtiCautionLabel;
    return copy.dtiRiskLabel;
  };

  const displayedAmortization =
    scheduleScope === 'full'
      ? analysis.amortizationSchedule
      : analysis.amortizationSchedule.slice(0, 10);

  const displayedTotals = displayedAmortization.reduce(
    (acc, row) => ({
      annualPaymentVnd: acc.annualPaymentVnd + row.annualPaymentVnd,
      principalPaidVnd: acc.principalPaidVnd + row.principalPaidVnd,
      interestPaidVnd: acc.interestPaidVnd + row.interestPaidVnd,
    }),
    { annualPaymentVnd: 0, principalPaidVnd: 0, interestPaidVnd: 0 }
  );

  const activeDtiPalette = DTI_STYLE[stressSummary.activeScenario.dtiSafetyTier];

  return (
    <section
      id="mortgage-simulator"
      className="no-print border-t py-16 lg:py-22"
      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial Chapter Header & Mode Switch */}
        <div
          className="mb-10 flex flex-col justify-between gap-5 border-b pb-7 lg:flex-row lg:items-end"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                03
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

          {/* Synced vs Custom Mode Switch */}
          <div
            className="inline-flex self-start rounded-sm border p-1 lg:self-end"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <button
              type="button"
              onClick={() => onToggleMode(false)}
              className="cursor-pointer rounded-sm px-3.5 py-2 text-xs font-semibold transition-all"
              style={{
                backgroundColor: !isCustomMode ? 'var(--cta-bg)' : 'transparent',
                color: !isCustomMode ? 'var(--cta-ink)' : 'var(--text-secondary)',
              }}
            >
              {copy.modeResidence}
            </button>
            <button
              type="button"
              onClick={() => onToggleMode(true)}
              className="cursor-pointer rounded-sm px-3.5 py-2 text-xs font-semibold transition-all"
              style={{
                backgroundColor: isCustomMode ? 'var(--cta-bg)' : 'transparent',
                color: isCustomMode ? 'var(--cta-ink)' : 'var(--text-secondary)',
              }}
            >
              {copy.modeCustom}
            </button>
          </div>
        </div>

        {/* Main 12-Col Private Wealth Layout */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start">
          {/* Left Panel: Sticky Underwriting Parameters Folio */}
          <div
            className="min-w-0 flex flex-col justify-between border-t-2 border-r border-b border-l p-5 sm:p-6 lg:sticky lg:top-28 lg:col-span-5"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderTopColor: 'var(--cta-bg)',
              borderRightColor: 'var(--border-subtle)',
              borderBottomColor: 'var(--border-subtle)',
              borderLeftColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="space-y-6">
              {/* Synced Residence Banner */}
              {!isCustomMode && (
                <div
                  className="flex items-center justify-between gap-3 border-l-2 border-t border-r border-b px-3.5 py-2.5"
                  style={{
                    borderLeftColor: 'var(--accent)',
                    borderTopColor: 'var(--border-subtle)',
                    borderRightColor: 'var(--border-subtle)',
                    borderBottomColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-primary)',
                  }}
                >
                  <div>
                    <div className="text-[10.5px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                      {copy.syncedWith}
                    </div>
                    <div className="font-mono-tabular mt-0.5 text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                      {selectedResidence.code} · {lang === 'vi' ? selectedResidence.nameVi : selectedResidence.nameEn}
                    </div>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
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
                  <span className="font-mono-tabular text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
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
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                      {inputs.downPaymentPct}%
                    </span>
                    <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
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
                  <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
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
                        className="font-mono-tabular cursor-pointer rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors"
                        style={{
                          borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-primary)',
                          color: active ? 'var(--cta-ink)' : 'var(--text-secondary)',
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
                  <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--status-available)' }}>
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
                  <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all hover:opacity-92"
                  style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
                >
                  <FileSpreadsheetIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span>{exportStatus === 'csv' ? copy.copiedLabel : copy.exportCsvBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={onPrintDossier}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border px-3.5 py-2.5 text-xs font-semibold transition-all"
                  style={{
                    borderColor: 'var(--border-strong)',
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--text-heading)',
                  }}
                >
                  <PrinterIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span>{copy.printPdfBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMd}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border px-3.5 py-2 text-xs font-semibold transition-all"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <DownloadIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                  <span>{exportStatus === 'md' ? copy.copiedLabel : copy.exportMdBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border px-3.5 py-2 text-xs font-semibold transition-all"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <DownloadIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                  <span>{exportStatus === 'json' ? copy.copiedLabel : copy.exportJsonBtn}</span>
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {copy.exportNote}
              </p>
            </div>
          </div>

          {/* Right Panel: Institutional Telemetry Folios + Stress Test + 10Y Chart + Ledger */}
          <div className="min-w-0 space-y-6 lg:col-span-7">
            {/* Hero PMT & Principal/Interest Folio */}
            <div
              className="border-t-2 border-r border-b border-l p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderTopColor: 'var(--accent)',
                borderRightColor: 'var(--border-subtle)',
                borderBottomColor: 'var(--border-subtle)',
                borderLeftColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <div
                    className="font-mono-tabular text-[10.5px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: 'var(--accent)' }}
                  >
                    {copy.monthlyPmtTitle}
                  </div>
                  <div
                    className="font-mono-tabular mt-2 text-3xl font-semibold sm:text-4xl"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    {formatCurrency(analysis.monthlyPaymentVnd, currency, lang)}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>
                      {copy.loanPrincipalLabel}:{' '}
                      <strong className="font-mono-tabular" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(analysis.loanPrincipalVnd, currency, lang, { compact: true })}
                      </strong>
                    </span>
                    <span>
                      {copy.totalInterestLabel}:{' '}
                      <strong className="font-mono-tabular" style={{ color: 'var(--status-reserved)' }}>
                        {formatCurrency(analysis.totalInterestVnd, currency, lang, { compact: true })}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Cash-on-Cash / Cashflow Well */}
                <div
                  className="flex flex-col justify-center border p-3.5"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <div className="text-[10.5px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                    {copy.monthlyCashFlowLabel}
                  </div>
                  <div
                    className="font-mono-tabular mt-1 text-lg font-semibold"
                    style={{
                      color:
                        analysis.monthlyNetCashFlowVnd >= 0
                          ? 'var(--status-available)'
                          : 'var(--status-reserved)',
                    }}
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
                <div className="flex h-2.5 w-full overflow-hidden rounded-sm" style={{ backgroundColor: 'var(--track-bg)' }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${principalPct}%`, backgroundColor: 'var(--cta-bg)' }}
                  />
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${interestPct}%`, backgroundColor: 'var(--accent)' }}
                  />
                </div>
              </div>

              {/* 4 Financial Yield & ROI Ledger Tiles */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{copy.grossYieldLabel}</div>
                  <div className="font-mono-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--text-heading)' }}>
                    {analysis.grossRentalYieldPct.toFixed(2)}%
                  </div>
                </div>

                <div className="border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{copy.netYieldLabel}</div>
                  <div className="font-mono-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--status-available)' }}>
                    {analysis.netRentalYieldPct.toFixed(2)}%
                  </div>
                </div>

                <div className="border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{copy.tenYearEquityLabel}</div>
                  <div className="font-mono-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                    {formatCurrency(
                      analysis.tenYearProjection[9]?.netEquityVnd ?? 0,
                      currency,
                      lang,
                      { compact: true }
                    )}
                  </div>
                </div>

                <div className="border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{copy.tenYearRoiLabel}</div>
                  <div className="font-mono-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--status-available)' }}>
                    +{analysis.tenYearTotalRoiPct.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interest-Rate Stress Test (+0% / +2% / +4%) & Bank DTI Underwriting */}
            <div
              className="border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-start" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <div
                    className="font-mono-tabular flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: 'var(--accent)' }}
                  >
                    <PulseIcon className="h-3.5 w-3.5" />
                    <span>{copy.stressEyebrow}</span>
                  </div>
                  <h3 className="font-display mt-1 text-xl font-semibold sm:text-2xl" style={{ color: 'var(--text-heading)' }}>
                    {copy.stressTitle}
                  </h3>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {copy.stressSubtitle}
                  </p>
                </div>

                {/* Quick Shock Scenario Buttons (+0% / +2% / +4%) */}
                <div className="flex shrink-0 flex-wrap gap-1.5" role="group" aria-label={copy.rateShockLabel}>
                  {SHOCK_PRESETS.map((shock) => {
                    const active = Math.abs(rateShockPct - shock) < 0.05;
                    const label =
                      shock === 0 ? copy.shockBase : shock === 2 ? copy.shockModerate : copy.shockSevere;
                    return (
                      <button
                        key={shock}
                        type="button"
                        onClick={() => onChangeRateShock(shock)}
                        className="font-mono-tabular cursor-pointer rounded-sm border px-2.5 py-1.5 text-[11px] font-semibold transition-all"
                        style={{
                          borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-primary)',
                          color: active ? 'var(--cta-ink)' : 'var(--text-secondary)',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dual Interactive Controls: Rate Shock Slider + Monthly Investor Income Slider */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <label htmlFor="sim-shock" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {copy.rateShockLabel}
                    </label>
                    <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                      +{rateShockPct.toFixed(1)}% ({stressSummary.activeScenario.effectiveRatePct.toFixed(1)}%)
                    </span>
                  </div>
                  <input
                    id="sim-shock"
                    type="range"
                    min={0}
                    max={4.5}
                    step={0.5}
                    value={rateShockPct}
                    onChange={(e) => onChangeRateShock(Number(e.target.value))}
                    className="kinetix-slider"
                  />
                  <div className="font-mono-tabular mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>+0%</span>
                    <span>+2%</span>
                    <span>+4%</span>
                  </div>
                </div>

                <div className="border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <label htmlFor="sim-income" className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {copy.monthlyIncomeLabel}
                    </label>
                    <span className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                      {formatCurrency(monthlyIncomeVnd, currency, lang, { compact: true })}
                    </span>
                  </div>
                  <input
                    id="sim-income"
                    type="range"
                    min={100_000_000}
                    max={2_000_000_000}
                    step={25_000_000}
                    value={monthlyIncomeVnd}
                    onChange={(e) => onChangeMonthlyIncome(Number(e.target.value))}
                    className="kinetix-slider"
                  />
                  <div className="font-mono-tabular mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>{formatCurrency(100_000_000, currency, lang, { compact: true })}</span>
                    <span>{formatCurrency(1_000_000_000, currency, lang, { compact: true })}</span>
                    <span>{formatCurrency(2_000_000_000, currency, lang, { compact: true })}</span>
                  </div>
                </div>
              </div>

              {/* Active Shock Telemetry & DTI Safety Badge */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{copy.stressedPmtLabel}</div>
                  <div className="font-mono-tabular mt-1 text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
                    {formatCurrency(stressSummary.activeScenario.monthlyPaymentVnd, currency, lang, { compact: true })}
                  </div>
                </div>

                <div className="border p-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}>
                  <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{copy.shockDeltaLabel}</div>
                  <div className="font-mono-tabular mt-1 text-base font-semibold" style={{ color: 'var(--status-reserved)' }}>
                    {stressSummary.activeScenario.deltaMonthlyPaymentVnd > 0
                      ? `+${formatCurrency(stressSummary.activeScenario.deltaMonthlyPaymentVnd, currency, lang, { compact: true })}`
                      : formatCurrency(0, currency, lang, { compact: true })}
                  </div>
                </div>

                <div
                  className="border p-3"
                  style={{
                    borderColor: activeDtiPalette.border,
                    backgroundColor: activeDtiPalette.bg,
                  }}
                >
                  <div className="flex items-center justify-between text-[10.5px]" style={{ color: activeDtiPalette.text }}>
                    <span>{copy.dtiRatioLabel}</span>
                    {stressSummary.activeScenario.dtiSafetyTier === 'SAFE' ? (
                      <ShieldCheckIcon className="h-4 w-4" />
                    ) : (
                      <AlertTriangleIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="font-mono-tabular mt-1 text-base font-bold" style={{ color: activeDtiPalette.text }}>
                    {stressSummary.activeScenario.dtiRatioPct.toFixed(1)}%
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold" style={{ color: activeDtiPalette.text }}>
                    {getDtiLabel(stressSummary.activeScenario.dtiSafetyTier)}
                  </div>
                </div>
              </div>

              {/* 3-Scenario Benchmark Stress Table (+0% / +2% / +4%) */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th className="py-2 pr-2 font-semibold">{copy.colScenario}</th>
                      <th className="px-2 py-2 text-right font-semibold">{copy.colEffRate}</th>
                      <th className="px-2 py-2 text-right font-semibold">{copy.colMonthlyPmt}</th>
                      <th className="px-2 py-2 text-right font-semibold">{copy.colDeltaPmt}</th>
                      <th className="px-2 py-2 text-right font-semibold">{copy.colNetCashFlow}</th>
                      <th className="py-2 pl-2 text-right font-semibold">{copy.colDti}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-tabular divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {stressSummary.benchmarkScenarios.map((sc) => {
                      const isCurrent = Math.abs(sc.shockPct - rateShockPct) < 0.05;
                      const tierStyle = DTI_STYLE[sc.dtiSafetyTier];
                      const scenarioName =
                        sc.shockPct === 0 ? copy.shockBase : sc.shockPct === 2 ? copy.shockModerate : copy.shockSevere;
                      return (
                        <tr
                          key={sc.shockPct}
                          onClick={() => onChangeRateShock(sc.shockPct)}
                          className="editorial-table-row cursor-pointer transition-colors"
                          style={{
                            backgroundColor: isCurrent ? 'var(--accent-soft)' : 'transparent',
                          }}
                        >
                          <td className="py-2.5 pr-2 font-semibold" style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-heading)' }}>
                            {scenarioName}
                          </td>
                          <td className="px-2 py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>
                            {sc.effectiveRatePct.toFixed(1)}%
                          </td>
                          <td className="px-2 py-2.5 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                            {formatCurrency(sc.monthlyPaymentVnd, currency, lang, { compact: true })}
                          </td>
                          <td className="px-2 py-2.5 text-right" style={{ color: 'var(--status-reserved)' }}>
                            {sc.deltaMonthlyPaymentVnd > 0
                              ? `+${formatCurrency(sc.deltaMonthlyPaymentVnd, currency, lang, { compact: true })}`
                              : '—'}
                          </td>
                          <td
                            className="px-2 py-2.5 text-right"
                            style={{
                              color: sc.monthlyNetCashFlowVnd >= 0 ? 'var(--status-available)' : 'var(--status-reserved)',
                            }}
                          >
                            {formatCurrency(sc.monthlyNetCashFlowVnd, currency, lang, { compact: true, signed: true })}
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <span
                              className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                backgroundColor: tierStyle.bg,
                                borderColor: tierStyle.border,
                                color: tierStyle.text,
                              }}
                            >
                              {sc.dtiRatioPct.toFixed(1)}% · {sc.dtiSafetyTier}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 10-Year Equity Projection Interactive SVG Chart */}
            <div
              className="border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h3 className="font-display text-xl font-semibold sm:text-2xl" style={{ color: 'var(--text-heading)' }}>
                    {copy.chartTitle}
                  </h3>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {copy.chartSubtitle}
                  </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--chart-property)' }} />
                    {copy.chartPropertyValue}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--chart-equity)' }} />
                    {copy.chartNetEquity}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--chart-debt)' }} />
                    {copy.chartRemainingDebt}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--chart-rent)' }} />
                    {copy.chartCumRent}
                  </span>
                </div>
              </div>

              {/* Active Year Telemetry Bar */}
              {activePoint && (
                <div
                  className="mt-4 grid grid-cols-2 gap-2 border p-3 sm:grid-cols-5"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
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
                    <div className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--text-heading)' }}>
                      {formatCurrency(activePoint.propertyValueVnd, currency, lang, { compact: true })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{copy.chartNetEquity}</div>
                    <div className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--chart-equity)' }}>
                      {formatCurrency(activePoint.netEquityVnd, currency, lang, { compact: true })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{copy.chartRemainingDebt}</div>
                    <div className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--chart-debt)' }}>
                      {formatCurrency(activePoint.remainingDebtVnd, currency, lang, { compact: true })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{copy.chartCumRent}</div>
                    <div className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--chart-rent)' }}>
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
                      <stop offset="0%" stopColor="#157356" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#157356" stopOpacity="0.02" />
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
                  <path d={propertyPath} fill="none" stroke="var(--chart-property)" strokeWidth="2.4" strokeLinecap="round" />
                  <path d={equityPath} fill="none" stroke="var(--chart-equity)" strokeWidth="2.2" strokeLinecap="round" />
                  <path d={debtPath} fill="none" stroke="var(--chart-debt)" strokeWidth="1.9" strokeDasharray="5 3" />
                  <path d={rentPath} fill="none" stroke="var(--chart-rent)" strokeWidth="1.8" />

                  {/* Active Vertical Guide Line & Dots */}
                  {activePoint && (
                    <g>
                      <line
                        x1={xForYear(activePoint.year)}
                        y1={padT}
                        x2={xForYear(activePoint.year)}
                        y2={padT + innerH}
                        stroke="var(--accent)"
                        strokeOpacity="0.55"
                        strokeDasharray="2 2"
                      />
                      <circle cx={xForYear(activePoint.year)} cy={yForVal(activePoint.propertyValueVnd)} r="4.5" fill="var(--chart-property)" stroke="var(--bg-secondary)" strokeWidth="2" />
                      <circle cx={xForYear(activePoint.year)} cy={yForVal(activePoint.netEquityVnd)} r="4.5" fill="var(--chart-equity)" stroke="var(--bg-secondary)" strokeWidth="2" />
                      <circle cx={xForYear(activePoint.year)} cy={yForVal(activePoint.remainingDebtVnd)} r="3.5" fill="var(--chart-debt)" />
                      <circle cx={xForYear(activePoint.year)} cy={yForVal(activePoint.cumulativeNetRentVnd)} r="3.5" fill="var(--chart-rent)" />
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

            {/* Side-by-Side 10-Year Cash Purchase vs 70% Bank Leverage & Net IRR Matrix */}
            <div
              data-testid="leverage-irr-simulator"
              className="border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-start"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div>
                  <div
                    className="font-mono-tabular text-[10px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: 'var(--accent)' }}
                  >
                    {copy.leverageEyebrow}
                  </div>
                  <h3
                    className="font-display mt-1 text-xl font-semibold sm:text-2xl"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    {copy.leverageTitle}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {copy.leverageSubtitle}
                  </p>
                </div>

                {/* Quick LTV Benchmark Switch (50% / 60% / 70%) */}
                <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label="Leverage LTV">
                  {[50, 60, 70].map((ltv) => {
                    const active = leverageLtvPct === ltv;
                    return (
                      <button
                        key={ltv}
                        type="button"
                        onClick={() => setLeverageLtvPct(ltv)}
                        className="font-mono-tabular cursor-pointer rounded-sm border px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                        style={{
                          borderColor: active ? 'var(--cta-bg)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--cta-bg)' : 'var(--bg-primary)',
                          color: active ? 'var(--cta-ink)' : 'var(--text-secondary)',
                        }}
                      >
                        {ltv}% LTV
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Executive Leverage Alpha Telemetry Callouts */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div
                  className="border p-3"
                  style={{
                    borderColor:
                      leverageComparison.irrSpreadPct >= 0
                        ? 'var(--status-available-border)'
                        : 'var(--status-reserved-border)',
                    backgroundColor:
                      leverageComparison.irrSpreadPct >= 0
                        ? 'var(--status-available-bg)'
                        : 'var(--status-reserved-bg)',
                  }}
                >
                  <div
                    className="text-[10.5px]"
                    style={{
                      color:
                        leverageComparison.irrSpreadPct >= 0
                          ? 'var(--status-available)'
                          : 'var(--status-reserved)',
                    }}
                  >
                    {copy.leverageAlphaLabel}
                  </div>
                  <div
                    data-testid="leverage-irr-spread"
                    className="font-mono-tabular mt-1 text-lg font-bold"
                    style={{
                      color:
                        leverageComparison.irrSpreadPct >= 0
                          ? 'var(--status-available)'
                          : 'var(--status-reserved)',
                    }}
                  >
                    {leverageComparison.irrSpreadPct >= 0 ? '+' : ''}
                    {leverageComparison.irrSpreadPct.toFixed(2)}% p.a.
                  </div>
                </div>

                <div
                  className="border p-3"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.leverageCapitalFreed}
                  </div>
                  <div
                    className="font-mono-tabular mt-1 text-lg font-semibold"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    {formatCurrency(leverageComparison.capitalFreedVnd, currency, lang, { compact: true })}
                  </div>
                </div>

                <div
                  className="border p-3"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <div className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.leverageMultipleAdv}
                  </div>
                  <div
                    className="font-mono-tabular mt-1 text-lg font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {leverageComparison.equityMultipleAdvantage >= 0 ? '+' : ''}
                    {leverageComparison.equityMultipleAdvantage.toFixed(2)}x
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Ledger Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th className="py-2.5 pr-3 font-semibold">{copy.colScenario}</th>
                      <th className="px-3 py-2.5 text-right font-semibold">{copy.leverageCashTitle}</th>
                      <th className="py-2.5 pl-3 text-right font-semibold" style={{ color: 'var(--accent)' }}>
                        {copy.leverageBankTitle} ({leverageLtvPct}% LTV)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-tabular divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    <tr className="editorial-table-row">
                      <td className="py-2.5 pr-3 font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {copy.leverageRowInitialEquity}
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(leverageComparison.cashStrategy.initialEquityVnd, currency, lang, { compact: true })}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(leverageComparison.leveragedStrategy.initialEquityVnd, currency, lang, { compact: true })}
                      </td>
                    </tr>
                    <tr className="editorial-table-row">
                      <td className="py-2.5 pr-3 font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {copy.leverageRowGrossRent}
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--status-available)' }}>
                        {formatCurrency(leverageComparison.cashStrategy.tenYearGrossRentVnd, currency, lang, { compact: true })}
                      </td>
                      <td className="py-2.5 pl-3 text-right" style={{ color: 'var(--status-available)' }}>
                        {formatCurrency(leverageComparison.leveragedStrategy.tenYearGrossRentVnd, currency, lang, { compact: true })}
                      </td>
                    </tr>
                    <tr className="editorial-table-row">
                      <td className="py-2.5 pr-3 font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {copy.leverageRowOpFees}
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>
                        -{formatCurrency(leverageComparison.cashStrategy.tenYearOperatingFeesVnd, currency, lang, { compact: true })}
                      </td>
                      <td className="py-2.5 pl-3 text-right" style={{ color: 'var(--text-muted)' }}>
                        -{formatCurrency(leverageComparison.leveragedStrategy.tenYearOperatingFeesVnd, currency, lang, { compact: true })}
                      </td>
                    </tr>
                    <tr className="editorial-table-row">
                      <td className="py-2.5 pr-3 font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {copy.leverageRowInterest}
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>
                        {formatCurrency(0, currency, lang, { compact: true })}
                      </td>
                      <td className="py-2.5 pl-3 text-right" style={{ color: 'var(--status-reserved)' }}>
                        -{formatCurrency(leverageComparison.leveragedStrategy.tenYearInterestPaidVnd, currency, lang, { compact: true })}
                      </td>
                    </tr>
                    <tr className="editorial-table-row">
                      <td className="py-2.5 pr-3 font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {copy.leverageRowExitVal}
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(leverageComparison.cashStrategy.year10PropertyValueVnd, currency, lang, { compact: true })}
                      </td>
                      <td className="py-2.5 pl-3 text-right" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(leverageComparison.leveragedStrategy.year10PropertyValueVnd, currency, lang, { compact: true })}
                      </td>
                    </tr>
                    <tr className="editorial-table-row">
                      <td className="py-2.5 pr-3 font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {copy.leverageRowNetExit}
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(leverageComparison.cashStrategy.netExitProceedsVnd, currency, lang, { compact: true })}
                      </td>
                      <td className="py-2.5 pl-3 text-right" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(leverageComparison.leveragedStrategy.netExitProceedsVnd, currency, lang, { compact: true })}
                      </td>
                    </tr>
                    <tr className="editorial-table-row">
                      <td className="py-2.5 pr-3 font-sans font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {copy.leverageRowNetProfit}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(leverageComparison.cashStrategy.totalNetProfitVnd, currency, lang, { compact: true, signed: true })}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(leverageComparison.leveragedStrategy.totalNetProfitVnd, currency, lang, { compact: true, signed: true })}
                      </td>
                    </tr>
                    <tr className="editorial-table-row">
                      <td className="py-2.5 pr-3 font-sans font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {copy.leverageRowMultiple}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {leverageComparison.cashStrategy.equityMultiple.toFixed(2)}x
                      </td>
                      <td className="py-2.5 pl-3 text-right font-bold" style={{ color: 'var(--accent)' }}>
                        {leverageComparison.leveragedStrategy.equityMultiple.toFixed(2)}x
                      </td>
                    </tr>
                    <tr
                      className="border-t-2"
                      style={{
                        borderColor: 'var(--border-strong)',
                        backgroundColor: 'var(--accent-soft)',
                      }}
                    >
                      <td className="py-3 pr-3 font-sans text-xs font-bold" style={{ color: 'var(--text-heading)' }}>
                        {copy.leverageRowNetIrr}
                      </td>
                      <td
                        data-testid="leverage-cash-irr"
                        className="px-3 py-3 text-right text-sm font-bold"
                        style={{ color: 'var(--text-heading)' }}
                      >
                        {leverageComparison.cashStrategy.netIrrPct.toFixed(2)}%
                      </td>
                      <td
                        data-testid="leverage-bank-irr"
                        className="py-3 pl-3 text-right text-sm font-bold"
                        style={{ color: 'var(--status-available)' }}
                      >
                        {leverageComparison.leveragedStrategy.netIrrPct.toFixed(2)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {copy.leverageNote}
              </p>
            </div>

            {/* Year-by-Year 10-Year / Full-Term Amortization Schedule Ledger */}
            <div
              className="border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-semibold sm:text-2xl" style={{ color: 'var(--text-heading)' }}>
                    {copy.amortizationTitle}
                  </h3>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {copy.amortizationSubtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="inline-flex rounded-sm border p-0.5"
                    style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setScheduleScope('10y')}
                      className="cursor-pointer rounded-sm px-2.5 py-1 text-[11px] font-semibold transition-colors"
                      style={{
                        backgroundColor: scheduleScope === '10y' ? 'var(--cta-bg)' : 'transparent',
                        color: scheduleScope === '10y' ? 'var(--cta-ink)' : 'var(--text-secondary)',
                      }}
                    >
                      {copy.scheduleTab10Y}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleScope('full')}
                      className="cursor-pointer rounded-sm px-2.5 py-1 text-[11px] font-semibold transition-colors"
                      style={{
                        backgroundColor: scheduleScope === 'full' ? 'var(--cta-bg)' : 'transparent',
                        color: scheduleScope === 'full' ? 'var(--cta-ink)' : 'var(--text-secondary)',
                      }}
                    >
                      {copy.scheduleTabFull} ({analysis.amortizationSchedule.length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                    style={{
                      borderColor: 'var(--border-strong)',
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--text-heading)',
                    }}
                  >
                    <FileSpreadsheetIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                    <span>{exportStatus === 'csv' ? copy.copiedLabel : 'CSV'}</span>
                  </button>
                </div>
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
                    {displayedAmortization.map((row) => {
                      const principalSharePct =
                        row.annualPaymentVnd > 0
                          ? Math.min(100, Math.round((row.principalPaidVnd / row.annualPaymentVnd) * 100))
                          : 0;
                      return (
                        <tr key={row.year} className="editorial-table-row transition-colors">
                          <td className="py-2.5 pr-3 font-semibold" style={{ color: 'var(--accent)' }}>
                            Y{row.year}
                          </td>
                          <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(row.openingBalanceVnd, currency, lang, { compact: true })}
                          </td>
                          <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-heading)' }}>
                            {formatCurrency(row.annualPaymentVnd, currency, lang, { compact: true })}
                          </td>
                          <td className="px-3 py-2.5 text-right" style={{ color: 'var(--status-available)' }}>
                            <div>{formatCurrency(row.principalPaidVnd, currency, lang, { compact: true })}</div>
                            <div className="mt-1 ml-auto h-1 w-14 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--track-bg)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${principalSharePct}%`,
                                  backgroundColor: 'var(--status-available)',
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right" style={{ color: 'var(--status-reserved)' }}>
                            {formatCurrency(row.interestPaidVnd, currency, lang, { compact: true })}
                          </td>
                          <td className="py-2.5 pl-3 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>
                            {formatCurrency(row.endingBalanceVnd, currency, lang, { compact: true })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-mono-tabular border-t-2 font-semibold" style={{ borderColor: 'var(--border-strong)' }}>
                      <td className="py-2.5 pr-3 text-[11px]" colSpan={2} style={{ color: 'var(--accent)' }}>
                        {copy.totalRowLabel} ({displayedAmortization.length} {copy.yearsUnit})
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(displayedTotals.annualPaymentVnd, currency, lang, { compact: true })}
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--status-available)' }}>
                        {formatCurrency(displayedTotals.principalPaidVnd, currency, lang, { compact: true })}
                      </td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--status-reserved)' }}>
                        {formatCurrency(displayedTotals.interestPaidVnd, currency, lang, { compact: true })}
                      </td>
                      <td className="py-2.5 pl-3 text-right" style={{ color: 'var(--text-heading)' }}>
                        {formatCurrency(
                          displayedAmortization[displayedAmortization.length - 1]?.endingBalanceVnd ?? 0,
                          currency,
                          lang,
                          { compact: true }
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
