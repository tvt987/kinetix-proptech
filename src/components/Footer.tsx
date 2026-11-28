import React from 'react';
import type { CopyBundle } from '../data/translations';
import { KinetixMark } from './Icons';

interface FooterProps {
  copy: CopyBundle['footer'];
}

export const Footer: React.FC<FooterProps> = ({ copy }) => {
  return (
    <footer
      className="no-print border-t-2 py-14"
      style={{
        borderColor: 'var(--accent)',
        backgroundColor: 'var(--masthead-bg)',
        color: 'var(--masthead-ink)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Brand Summary */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-sm border"
                style={{
                  borderColor: 'var(--masthead-border)',
                  backgroundColor: 'rgba(250, 248, 244, 0.06)',
                  color: 'var(--accent)',
                }}
              >
                <KinetixMark className="h-5 w-5" />
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl font-semibold tracking-[0.18em]" style={{ color: 'var(--masthead-ink)' }}>
                  THE KINETIX
                </span>
                <span className="font-mono-tabular mt-0.5 text-[9.5px] tracking-[0.22em] uppercase" style={{ color: 'var(--accent)' }}>
                  INTERNATIONAL RESIDENCES · PROPTECH v5.0
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--masthead-muted)' }}>
              {copy.brandDesc}
            </p>
          </div>

          {/* Architecture Specs */}
          <div className="md:col-span-2">
            <h4
              className="font-mono-tabular border-b pb-2 text-[10.5px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: 'var(--accent)', borderColor: 'var(--masthead-border)' }}
            >
              {copy.colArchitecture}
            </h4>
            <ul className="font-mono-tabular mt-3.5 space-y-2 text-xs" style={{ color: 'var(--masthead-muted)' }}>
              <li>42 Floors · 178m</li>
              <li>128 Sky Residences</li>
              <li>Low-E Triple Glazing</li>
              <li>Thu Thiem Peninsula</li>
            </ul>
          </div>

          {/* FinTech Specs */}
          <div className="md:col-span-2">
            <h4
              className="font-mono-tabular border-b pb-2 text-[10.5px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: 'var(--accent)', borderColor: 'var(--masthead-border)' }}
            >
              {copy.colFintech}
            </h4>
            <ul className="font-mono-tabular mt-3.5 space-y-2 text-xs" style={{ color: 'var(--masthead-muted)' }}>
              <li>Annuity PMT Engine</li>
              <li>FX 25,400 VNĐ/USD</li>
              <li>Net Yield (Post-Tax)</li>
              <li>10Y Equity Curve</li>
            </ul>
          </div>

          {/* Private Client Desk */}
          <div className="md:col-span-3">
            <h4
              className="font-mono-tabular border-b pb-2 text-[10.5px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: 'var(--accent)', borderColor: 'var(--masthead-border)' }}
            >
              {copy.colAdvisory}
            </h4>
            <ul className="mt-3.5 space-y-2 text-xs" style={{ color: 'var(--masthead-muted)' }}>
              <li>Kinetix Riverfront Gallery, Thủ Thiêm</li>
              <li className="font-mono-tabular">Hotline: +84 931 467 024</li>
              <li className="font-mono-tabular">tinhkun102@gmail.com</li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col justify-between gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center"
          style={{ borderColor: 'var(--masthead-border)', color: 'var(--masthead-muted)' }}
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
