import React, { useState } from 'react';
import type { Currency, Language, ThemeMode } from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import {
  BuildingIcon,
  CalculatorIcon,
  CalendarIcon,
  CloseIcon,
  CompareIcon,
  KinetixMark,
  MoonIcon,
  SunIcon,
  VaultIcon,
} from './Icons';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  compareCount: number;
  vaultCount: number;
  onOpenCompare: () => void;
  onOpenVault: () => void;
  onOpenScheduler: () => void;
  copy: CopyBundle['nav'];
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  currency,
  setCurrency,
  theme,
  toggleTheme,
  compareCount,
  vaultCount,
  onOpenCompare,
  onOpenVault,
  onOpenScheduler,
  copy,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 transition-colors">
      {/* Tier 1: Institutional Midnight Navy Editorial Dateline & Controls Strip */}
      <div
        className="border-b"
        style={{
          backgroundColor: 'var(--masthead-bg)',
          borderColor: 'var(--masthead-border)',
          color: 'var(--masthead-ink)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
            <span
              className="font-mono-tabular truncate text-[10px] font-medium tracking-[0.2em] uppercase"
              style={{ color: 'var(--masthead-muted)' }}
            >
              {lang === 'vi'
                ? 'ẤN PHẨM DANH MỤC RIÊNG · BÁN ĐẢO THỦ THIÊM, TP.HCM'
                : 'PRIVATE PORTFOLIO EDITION · THU THIEM PENINSULA, HCMC'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Language Switch */}
            <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Language">
              {(['vi', 'en'] as Language[]).map((code, idx) => (
                <React.Fragment key={code}>
                  {idx > 0 && (
                    <span className="text-[10px] opacity-30" aria-hidden="true">
                      /
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setLang(code)}
                    className="font-mono-tabular cursor-pointer px-1 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors"
                    style={{
                      color: lang === code ? 'var(--accent)' : 'var(--masthead-muted)',
                      borderBottom: lang === code ? '1px solid var(--accent)' : '1px solid transparent',
                    }}
                  >
                    {code}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <span className="hidden h-3 w-px opacity-25 sm:inline-block" style={{ backgroundColor: 'var(--masthead-ink)' }} />

            {/* Currency Switch */}
            <div className="hidden items-center gap-1 sm:flex" role="group" aria-label="Currency">
              {(['VND', 'USD'] as Currency[]).map((cur, idx) => (
                <React.Fragment key={cur}>
                  {idx > 0 && (
                    <span className="text-[10px] opacity-30" aria-hidden="true">
                      /
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className="font-mono-tabular cursor-pointer px-1 py-0.5 text-[10px] font-semibold tracking-[0.12em] transition-colors"
                    style={{
                      color: currency === cur ? 'var(--accent)' : 'var(--masthead-muted)',
                      borderBottom: currency === cur ? '1px solid var(--accent)' : '1px solid transparent',
                    }}
                  >
                    {cur === 'VND' ? 'VNĐ' : 'USD'}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <span className="hidden h-3 w-px opacity-25 sm:inline-block" style={{ backgroundColor: 'var(--masthead-ink)' }} />

            {/* Daylight / Midnight Salon Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? copy.themeLight : copy.themeDark}
              title={theme === 'dark' ? copy.themeLight : copy.themeDark}
              className="font-mono-tabular inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] uppercase transition-colors hover:opacity-100"
              style={{ color: 'var(--accent)' }}
            >
              {theme === 'dark' ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">
                {theme === 'dark' ? copy.themeLight : copy.themeDark}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Crisp Gallery White Magazine Masthead */}
      <div
        className="border-b backdrop-blur-xl transition-colors"
        style={{
          backgroundColor: 'var(--bg-glass)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Editorial Serif Brand Masthead */}
          <a href="#top" className="group flex shrink-0 items-center gap-3 focus:outline-none">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-sm border transition-transform group-hover:scale-105"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--masthead-bg)',
                color: 'var(--masthead-ink)',
              }}
            >
              <KinetixMark className="h-6 w-6" />
            </span>
            <div className="flex flex-col leading-none">
              <span
                className="font-display text-xl font-semibold tracking-[0.18em] sm:text-2xl"
                style={{ color: 'var(--text-heading)' }}
              >
                THE KINETIX
              </span>
              <span
                className="font-mono-tabular mt-0.5 text-[9.5px] font-medium tracking-[0.24em] uppercase"
                style={{ color: 'var(--accent)' }}
              >
                INTERNATIONAL RESIDENCES · PROPTECH
              </span>
            </div>
          </a>

          {/* Primary Desktop Magazine Navigation */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
            <a
              href="#tower-explorer"
              className="flex items-center gap-1.5 border-b border-transparent py-1 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-[#B48A3E]"
              style={{ color: 'var(--text-primary)' }}
            >
              <BuildingIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              <span>{copy.tower}</span>
            </a>
            <a
              href="#mortgage-simulator"
              className="flex items-center gap-1.5 border-b border-transparent py-1 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-[#B48A3E]"
              style={{ color: 'var(--text-primary)' }}
            >
              <CalculatorIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              <span>{copy.simulator}</span>
            </a>
            <button
              type="button"
              onClick={onOpenCompare}
              className="flex cursor-pointer items-center gap-1.5 border-b border-transparent py-1 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-[#B48A3E]"
              style={{ color: compareCount > 0 ? 'var(--text-heading)' : 'var(--text-secondary)' }}
            >
              <CompareIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              <span>{copy.compare}</span>
              <span
                className="font-mono-tabular rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  borderColor: compareCount > 0 ? 'var(--border-strong)' : 'var(--border-subtle)',
                  backgroundColor: compareCount > 0 ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  color: compareCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {compareCount}/3
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenVault}
              className="flex cursor-pointer items-center gap-1.5 border-b border-transparent py-1 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-[#B48A3E]"
              style={{ color: vaultCount > 0 ? 'var(--text-heading)' : 'var(--text-secondary)' }}
            >
              <VaultIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              <span>{copy.vault}</span>
              <span
                className="font-mono-tabular rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  borderColor: vaultCount > 0 ? 'var(--border-strong)' : 'var(--border-subtle)',
                  backgroundColor: vaultCount > 0 ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  color: vaultCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {vaultCount}
              </span>
            </button>
          </nav>

          {/* Right CTA & Mobile Menu Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenScheduler}
              className="hidden cursor-pointer items-center gap-2 rounded-sm border px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase transition-all hover:opacity-92 md:inline-flex"
              style={{
                backgroundColor: 'var(--cta-bg)',
                borderColor: 'var(--cta-bg)',
                color: 'var(--cta-ink)',
              }}
            >
              <CalendarIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              <span>{copy.schedule}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Menu"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border lg:hidden"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              {mobileOpen ? (
                <CloseIcon className="h-4 w-4" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h12" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Editorial Navigation Drawer */}
      {mobileOpen && (
        <div
          className="border-b px-4 py-4 shadow-lg lg:hidden"
          style={{
            borderColor: 'var(--border-strong)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center rounded-sm border p-0.5"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
              >
                {(['vi', 'en'] as Language[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className="font-mono-tabular cursor-pointer rounded-sm px-2.5 py-1 text-xs font-semibold uppercase"
                    style={{
                      backgroundColor: lang === code ? 'var(--cta-bg)' : 'transparent',
                      color: lang === code ? 'var(--cta-ink)' : 'var(--text-muted)',
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
              <div
                className="flex items-center rounded-sm border p-0.5"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
              >
                {(['VND', 'USD'] as Currency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className="font-mono-tabular cursor-pointer rounded-sm px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: currency === cur ? 'var(--cta-bg)' : 'transparent',
                      color: currency === cur ? 'var(--cta-ink)' : 'var(--text-muted)',
                    }}
                  >
                    {cur === 'VND' ? 'VNĐ' : 'USD'}
                  </button>
                ))}
              </div>
            </div>

            <a
              href="#tower-explorer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-sm border px-3.5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <BuildingIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <span>{copy.tower}</span>
            </a>
            <a
              href="#mortgage-simulator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-sm border px-3.5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <CalculatorIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <span>{copy.simulator}</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenCompare();
              }}
              className="flex cursor-pointer items-center justify-between rounded-sm border px-3.5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <span className="flex items-center gap-2.5">
                <CompareIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                {copy.compare}
              </span>
              <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                {compareCount}/3
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenVault();
              }}
              className="flex cursor-pointer items-center justify-between rounded-sm border px-3.5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <span className="flex items-center gap-2.5">
                <VaultIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                {copy.vault}
              </span>
              <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                {vaultCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenScheduler();
              }}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-sm px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase"
              style={{ backgroundColor: 'var(--cta-bg)', color: 'var(--cta-ink)' }}
            >
              <CalendarIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <span>{copy.schedule}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
