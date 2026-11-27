import React from 'react';
import type {
  Currency,
  InterestStressTestSummary,
  Language,
  MortgageAnalysisResult,
  MortgageInputs,
  Residence,
} from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import { formatCurrency, formatPricePerSqm } from '../engines/currencyEngine';
import {
  TECHCOMBANK_VIETQR_CONFIG,
  buildDepositTransferMemo,
} from '../engines/vietQrEngine';

interface PrintableDossierProps {
  residence: Residence | null;
  inputs: MortgageInputs;
  analysis: MortgageAnalysisResult;
  stressSummary: InterestStressTestSummary;
  currency: Currency;
  lang: Language;
  copy: CopyBundle['print'];
  simCopy: CopyBundle['simulator'];
  explorerCopy: CopyBundle['explorer'];
}

export const PrintableDossier: React.FC<PrintableDossierProps> = ({
  residence,
  inputs,
  analysis,
  stressSummary,
  currency,
  lang,
  copy,
  simCopy,
  explorerCopy,
}) => {
  const fmt = (v: number, compact = false) => formatCurrency(v, currency, lang, { compact });
  const issueDate = new Date().toISOString().slice(0, 10);
  const transferMemo = buildDepositTransferMemo(residence ? residence.code : 'CUSTOM');
  const firstTenAmortization = analysis.amortizationSchedule.slice(0, 10);

  return (
    <article className="print-only-dossier mx-auto max-w-[820px] bg-white px-2 py-2 text-[#162032]">
      {/* Executive A4 Masthead */}
      <header className="border-b-2 border-[#0F1D36] pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono-tabular text-[9px] font-semibold tracking-[0.22em] text-[#B48A3E] uppercase">
              {copy.eyebrow}
            </div>
            <h1 className="font-display mt-1 text-2xl font-bold text-[#0F1D36]">
              {copy.title}
            </h1>
          </div>
          <div className="font-mono-tabular text-right text-[10px] text-[#47546A]">
            <div className="font-bold text-[#0F1D36]">THE KINETIX · PROPTECH v2.0</div>
            <div>
              {copy.generatedOn}: {issueDate}
            </div>
            <div>FX REF: 25,400 VND/USD</div>
          </div>
        </div>
      </header>

      {/* Section 1: Asset Overview */}
      <section className="print-break-avoid mt-4">
        <h2 className="font-mono-tabular border-b border-[#D8CFC0] pb-1 text-[11px] font-bold tracking-[0.14em] text-[#0F1D36] uppercase">
          {copy.assetSection}
        </h2>
        <div className="mt-2.5 grid grid-cols-4 gap-3 text-xs">
          <div className="border border-[#D8CFC0] p-2.5">
            <div className="text-[10px] text-[#6C788C]">{lang === 'vi' ? 'Mã & Tên Căn' : 'Residence'}</div>
            <div className="mt-0.5 font-semibold text-[#0F1D36]">
              {residence
                ? `${residence.code} — ${lang === 'vi' ? residence.nameVi : residence.nameEn}`
                : lang === 'vi'
                  ? 'Tài Sản Tùy Chỉnh'
                  : 'Custom Asset'}
            </div>
          </div>
          <div className="border border-[#D8CFC0] p-2.5">
            <div className="text-[10px] text-[#6C788C]">{explorerCopy.areaLabel}</div>
            <div className="font-mono-tabular mt-0.5 font-semibold">
              {residence ? `${residence.areaSqm} m² (F${residence.floor})` : '—'}
            </div>
          </div>
          <div className="border border-[#D8CFC0] p-2.5">
            <div className="text-[10px] text-[#6C788C]">{simCopy.propertyValueLabel}</div>
            <div className="font-mono-tabular mt-0.5 font-bold text-[#B48A3E]">
              {fmt(analysis.propertyPriceVnd)}
            </div>
          </div>
          <div className="border border-[#D8CFC0] p-2.5">
            <div className="text-[10px] text-[#6C788C]">{explorerCopy.pricePerSqmLabel}</div>
            <div className="font-mono-tabular mt-0.5 font-semibold">
              {residence ? formatPricePerSqm(residence.priceVnd, residence.areaSqm, currency, lang) : '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Underwriting KPIs */}
      <section className="print-break-avoid mt-4">
        <h2 className="font-mono-tabular border-b border-[#D8CFC0] pb-1 text-[11px] font-bold tracking-[0.14em] text-[#0F1D36] uppercase">
          {copy.underwritingSection}
        </h2>
        <div className="mt-2.5 grid grid-cols-4 gap-2.5 text-xs">
          <div className="border border-[#D8CFC0] bg-[#FAF8F4] p-2.5">
            <div className="text-[10px] text-[#6C788C]">{simCopy.downPaymentLabel}</div>
            <div className="font-mono-tabular mt-0.5 font-semibold">
              {inputs.downPaymentPct}% ({fmt(analysis.downPaymentVnd, true)})
            </div>
          </div>
          <div className="border border-[#D8CFC0] bg-[#FAF8F4] p-2.5">
            <div className="text-[10px] text-[#6C788C]">{simCopy.loanPrincipalLabel}</div>
            <div className="font-mono-tabular mt-0.5 font-semibold">
              {fmt(analysis.loanPrincipalVnd, true)} ({inputs.loanTermYears}y @ {inputs.annualInterestRatePct.toFixed(1)}%)
            </div>
          </div>
          <div className="border border-[#D8CFC0] bg-[#FAF8F4] p-2.5">
            <div className="text-[10px] text-[#6C788C]">{simCopy.monthlyPmtTitle}</div>
            <div className="font-mono-tabular mt-0.5 font-bold text-[#0F1D36]">
              {fmt(analysis.monthlyPaymentVnd)}
            </div>
          </div>
          <div className="border border-[#D8CFC0] bg-[#FAF8F4] p-2.5">
            <div className="text-[10px] text-[#6C788C]">{simCopy.netYieldLabel} / {simCopy.tenYearRoiLabel}</div>
            <div className="font-mono-tabular mt-0.5 font-bold text-[#157356]">
              {analysis.netRentalYieldPct.toFixed(2)}% / +{analysis.tenYearTotalRoiPct.toFixed(0)}%
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Floating-Rate Stress Test & DTI */}
      <section className="print-break-avoid mt-4">
        <h2 className="font-mono-tabular border-b border-[#D8CFC0] pb-1 text-[11px] font-bold tracking-[0.14em] text-[#0F1D36] uppercase">
          {copy.stressSection}
        </h2>
        <p className="font-mono-tabular mt-1 text-[10px] text-[#47546A]">
          {simCopy.monthlyIncomeLabel}: {fmt(stressSummary.monthlyIncomeVnd)}
        </p>
        <table className="mt-2 w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="border-b border-[#B48A3E] bg-[#FAF8F4] text-[#0F1D36]">
              <th className="px-2 py-1.5 font-semibold">{simCopy.colScenario}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{simCopy.colEffRate}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{simCopy.colMonthlyPmt}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{simCopy.colDeltaPmt}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{simCopy.colNetCashFlow}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{simCopy.colDti}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{simCopy.colSafety}</th>
            </tr>
          </thead>
          <tbody className="font-mono-tabular divide-y divide-[#ECE7DC]">
            {stressSummary.benchmarkScenarios.map((sc) => (
              <tr key={sc.shockPct}>
                <td className="px-2 py-1.5 font-semibold">
                  {sc.shockPct === 0 ? simCopy.shockBase : sc.shockPct === 2 ? simCopy.shockModerate : simCopy.shockSevere}
                </td>
                <td className="px-2 py-1.5 text-right">{sc.effectiveRatePct.toFixed(2)}%</td>
                <td className="px-2 py-1.5 text-right font-semibold">{fmt(sc.monthlyPaymentVnd, true)}</td>
                <td className="px-2 py-1.5 text-right">
                  {sc.deltaMonthlyPaymentVnd > 0 ? `+${fmt(sc.deltaMonthlyPaymentVnd, true)}` : '—'}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {formatCurrency(sc.monthlyNetCashFlowVnd, currency, lang, { compact: true, signed: true })}
                </td>
                <td className="px-2 py-1.5 text-right font-semibold">{sc.dtiRatioPct.toFixed(1)}%</td>
                <td className="px-2 py-1.5 text-right font-semibold">{sc.dtiSafetyTier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Section 4: 10-Year Amortization & Equity Trajectory */}
      <section className="print-break-avoid mt-4">
        <h2 className="font-mono-tabular border-b border-[#D8CFC0] pb-1 text-[11px] font-bold tracking-[0.14em] text-[#0F1D36] uppercase">
          {copy.amortizationSection}
        </h2>
        <table className="mt-2 w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="border-b border-[#B48A3E] bg-[#FAF8F4] text-[#0F1D36]">
              <th className="px-1.5 py-1.5 font-semibold">{simCopy.colYear}</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">{simCopy.colOpening}</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">{simCopy.colPrincipal}</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">{simCopy.colInterest}</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">{simCopy.colEnding}</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">{simCopy.chartPropertyValue}</th>
              <th className="px-1.5 py-1.5 text-right font-semibold">{simCopy.chartNetEquity}</th>
            </tr>
          </thead>
          <tbody className="font-mono-tabular divide-y divide-[#ECE7DC]">
            {firstTenAmortization.map((row) => {
              const proj = analysis.tenYearProjection.find((p) => p.year === row.year);
              return (
                <tr key={row.year}>
                  <td className="px-1.5 py-1 font-semibold">Y{row.year}</td>
                  <td className="px-1.5 py-1 text-right">{fmt(row.openingBalanceVnd, true)}</td>
                  <td className="px-1.5 py-1 text-right text-[#157356]">{fmt(row.principalPaidVnd, true)}</td>
                  <td className="px-1.5 py-1 text-right text-[#B46A1A]">{fmt(row.interestPaidVnd, true)}</td>
                  <td className="px-1.5 py-1 text-right font-semibold">{fmt(row.endingBalanceVnd, true)}</td>
                  <td className="px-1.5 py-1 text-right">{proj ? fmt(proj.propertyValueVnd, true) : '—'}</td>
                  <td className="px-1.5 py-1 text-right font-semibold text-[#157356]">
                    {proj ? fmt(proj.netEquityVnd, true) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Section 5: Techcombank VietQR Deposit Instructions & Signature */}
      <section className="print-break-avoid mt-4 border-l-2 border-[#B48A3E] border-t border-r border-b border-t-[#D8CFC0] border-r-[#D8CFC0] border-b-[#D8CFC0] bg-[#FAF8F4] p-3">
        <h2 className="font-mono-tabular text-[10px] font-bold tracking-[0.14em] text-[#0F1D36] uppercase">
          {copy.depositSection}
        </h2>
        <div className="font-mono-tabular mt-2 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            Bank: <strong>{TECHCOMBANK_VIETQR_CONFIG.bankName} (BIN {TECHCOMBANK_VIETQR_CONFIG.bankBin})</strong>
          </div>
          <div>
            Account: <strong>{TECHCOMBANK_VIETQR_CONFIG.accountNumber}</strong>
          </div>
          <div>
            Beneficiary: <strong>{TECHCOMBANK_VIETQR_CONFIG.accountName}</strong>
          </div>
          <div>
            Reference Memo: <strong>{transferMemo}</strong>
          </div>
        </div>
        <p className="mt-1.5 text-[9.5px] text-[#47546A]">{copy.refundNotice}</p>
      </section>

      <footer className="print-break-avoid mt-6 grid grid-cols-2 gap-8 border-t border-[#0F1D36] pt-4 text-[10px]">
        <div>
          <div className="font-semibold text-[#0F1D36]">{copy.signatureAdvisor}</div>
          <div className="mt-8 border-b border-dashed border-[#B48A3E]/60" />
          <div className="font-mono-tabular mt-1 text-[9px] text-[#6C788C]">
            Kinetix Riverfront Gallery · +84 931 467 024 · tinhkun102@gmail.com
          </div>
        </div>
        <div>
          <div className="font-semibold text-[#0F1D36]">{copy.signatureClient}</div>
          <div className="mt-8 border-b border-dashed border-[#B48A3E]/60" />
          <div className="font-mono-tabular mt-1 text-[9px] text-[#6C788C]">
            Powered by Kinetix PropTech v2.0 · TVT Studio
          </div>
        </div>
      </footer>
    </article>
  );
};
