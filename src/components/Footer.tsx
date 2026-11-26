import React from 'react';
import type { CopyBundle } from '../data/translations';
import { KinetixMark } from './Icons';

interface FooterProps {
  copy: CopyBundle['footer'];
}

export const Footer: React.FC<FooterProps> = ({ copy }) => {
  return (
    <footer
      className="border-t py-12"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand Summary */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg border"
                style={{
                  borderColor: 'var(--border-strong)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                <KinetixMark className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-semibold tracking-[0.14em]" style={{ color: 'var(--text-primary)' }}>
                KINETIX PROPTECH
              </span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
              {copy.brandDesc}
            </p>
          </div>

          {/* Architecture Specs */}
          <div className="md:col-span-2">
            <h4 className="font-mono-tabular text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--accent)' }}>
              {copy.colArchitecture}
            </h4>
            <ul className="font-mono-tabular mt-3 space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <li>42 Floors · 178m</li>
              <li>128 Sky Residences</li>
              <li>Low-E Triple Glazing</li>
              <li>Thu Thiem Peninsula</li>
            </ul>
          </div>

          {/* FinTech Specs */}
          <div className="md:col-span-2">
            <h4 className="font-mono-tabular text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--accent)' }}>
              {copy.colFintech}
            </h4>
            <ul className="font-mono-tabular mt-3 space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <li>Annuity PMT Engine</li>
              <li>FX 25,400 VNĐ/USD</li>
              <li>Net Yield (Post-Tax)</li>
              <li>10Y Equity Curve</li>
            </ul>
          </div>

          {/* Private Client Desk */}
          <div className="md:col-span-3">
            <h4 className="font-mono-tabular text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--accent)' }}>
              {copy.colAdvisory}
            </h4>
            <ul className="mt-3 space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <li>Kinetix Riverfront Gallery, Thủ Thiêm</li>
              <li className="font-mono-tabular">Hotline: +84 931 467 024</li>
              <li className="font-mono-tabular">tinhkun102@gmail.com</li>
            </ul>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col justify-between gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          <p className="max-w-2xl leading-relaxed">{copy.disclaimer}</p>
          <span className="font-mono-tabular shrink-0 font-medium" style={{ color: 'var(--accent)' }}>
            {copy.craftedBy}
          </span>
        </div>
      </div>
    </footer>
  );
};
