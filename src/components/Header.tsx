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
    <header
      className="no-print sticky top-0 z-40 border-b backdrop-blur-xl transition-colors"
      style={{
        backgroundColor: 'var(--bg-glass)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <a href="#top" className="group flex shrink-0 items-center gap-2.5 focus:outline-none">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-transform group-hover:scale-105"
            style={{
              borderColor: 'var(--border-strong)',
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
          >
            <KinetixMark className="h-6 w-6" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-[0.14em] sm:text-xl" style={{ color: 'var(--text-primary)' }}>
              KINETIX
            </span>
            <span className="font-mono-tabular text-[10px] tracking-[0.22em] uppercase" style={{ color: 'var(--accent)' }}>
              PROPTECH · THU THIEM
            </span>
          </div>
        </a>

        {/* Primary Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          <a
            href="#tower-explorer"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-100"
            style={{ color: 'var(--text-secondary)' }}
          >
            <BuildingIcon className="h-4 w-4 opacity-75" />
            <span>{copy.tower}</span>
          </a>
          <a
            href="#mortgage-simulator"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-100"
            style={{ color: 'var(--text-secondary)' }}
          >
            <CalculatorIcon className="h-4 w-4 opacity-75" />
            <span>{copy.simulator}</span>
          </a>
          <button
            type="button"
            onClick={onOpenCompare}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: compareCount > 0 ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <CompareIcon className="h-4 w-4" />
            <span>{copy.compare}</span>
            <span
              className="font-mono-tabular rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: compareCount > 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                color: compareCount > 0 ? 'var(--accent-ink)' : 'var(--text-muted)',
              }}
            >
              {compareCount}/3
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenVault}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: vaultCount > 0 ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <VaultIcon className="h-4 w-4" />
            <span>{copy.vault}</span>
            <span
              className="font-mono-tabular rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: vaultCount > 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                color: vaultCount > 0 ? 'var(--accent-ink)' : 'var(--text-muted)',
              }}
            >
              {vaultCount}
            </span>
          </button>
        </nav>

        {/* Controls & VIP CTA */}
        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <div
            className="hidden items-center rounded-lg border p-0.5 sm:flex"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
            role="group"
            aria-label="Language"
          >
            {(['vi', 'en'] as Language[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className="font-mono-tabular cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold uppercase transition-colors"
                style={{
                  backgroundColor: lang === code ? 'var(--accent)' : 'transparent',
                  color: lang === code ? 'var(--accent-ink)' : 'var(--text-muted)',
                }}
              >
                {code}
              </button>
            ))}
          </div>

          {/* Currency Switch */}
          <div
            className="hidden items-center rounded-lg border p-0.5 sm:flex"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
            role="group"
            aria-label="Currency"
          >
            {(['VND', 'USD'] as Currency[]).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className="font-mono-tabular cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  backgroundColor: currency === cur ? 'var(--accent)' : 'transparent',
                  color: currency === cur ? 'var(--accent-ink)' : 'var(--text-muted)',
                }}
              >
                {cur === 'VND' ? 'VNĐ' : 'USD'}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? copy.themeLight : copy.themeDark}
            title={theme === 'dark' ? copy.themeLight : copy.themeDark}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--accent)',
            }}
          >
            {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>

          {/* Desktop VIP CTA */}
          <button
            type="button"
            onClick={onOpenScheduler}
            className="hidden cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all hover:brightness-110 md:flex"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-ink)',
            }}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{copy.schedule}</span>
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menu"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border lg:hidden"
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

      {/* Mobile Dropdown Navigation */}
      {mobileOpen && (
        <div
          className="border-t px-4 py-4 lg:hidden"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center rounded-lg border p-0.5"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
              >
                {(['vi', 'en'] as Language[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className="font-mono-tabular cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold uppercase"
                    style={{
                      backgroundColor: lang === code ? 'var(--accent)' : 'transparent',
                      color: lang === code ? 'var(--accent-ink)' : 'var(--text-muted)',
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
              <div
                className="flex items-center rounded-lg border p-0.5"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-primary)' }}
              >
                {(['VND', 'USD'] as Currency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className="font-mono-tabular cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: currency === cur ? 'var(--accent)' : 'transparent',
                      color: currency === cur ? 'var(--accent-ink)' : 'var(--text-muted)',
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
              className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <BuildingIcon className="h-4 w-4" style={{ color: 'var(--accent)' } as React.CSSProperties} />
              <span>{copy.tower}</span>
            </a>
            <a
              href="#mortgage-simulator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <CalculatorIcon className="h-4 w-4" style={{ color: 'var(--accent)' } as React.CSSProperties} />
              <span>{copy.simulator}</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenCompare();
              }}
              className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <span className="flex items-center gap-2">
                <CompareIcon className="h-4 w-4" />
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
              className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <span className="flex items-center gap-2">
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
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>{copy.schedule}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
