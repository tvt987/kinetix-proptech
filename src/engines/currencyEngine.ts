import type { Currency, Language } from '../types/proptech';

/** Institutional reference FX rate (VND per 1 USD) */
export const VND_PER_USD = 25_400;

export function convertVndToUsd(amountVnd: number): number {
  if (!Number.isFinite(amountVnd)) return 0;
  return amountVnd / VND_PER_USD;
}

export function convertUsdToVnd(amountUsd: number): number {
  if (!Number.isFinite(amountUsd)) return 0;
  return Math.round(amountUsd * VND_PER_USD);
}

/**
 * Formats large property or monthly amounts cleanly in VND or USD.
 * compact=true renders concise luxury notation (e.g. "24.2 Tỷ VNĐ", "$953K", "$1.49M", "152 Tr VNĐ")
 */
export function formatCurrency(
  amountVnd: number,
  currency: Currency,
  lang: Language = 'vi',
  options?: { compact?: boolean; signed?: boolean }
): string {
  const safeVnd = Number.isFinite(amountVnd) ? amountVnd : 0;
  const sign = safeVnd < 0 ? '-' : options?.signed && safeVnd > 0 ? '+' : '';
  const absVnd = Math.abs(safeVnd);

  if (currency === 'USD') {
    const absUsd = convertVndToUsd(absVnd);
    if (options?.compact) {
      if (absUsd >= 1_000_000) {
        return `${sign}$${(absUsd / 1_000_000).toFixed(2)}M`;
      }
      if (absUsd >= 10_000) {
        return `${sign}$${Math.round(absUsd / 1_000).toLocaleString('en-US')}K`;
      }
      if (absUsd >= 1_000) {
        return `${sign}$${(absUsd / 1_000).toFixed(1)}K`;
      }
    }
    return `${sign}$${Math.round(absUsd).toLocaleString('en-US')}`;
  }

  // VND formatting
  if (options?.compact) {
    if (absVnd >= 1_000_000_000) {
      const billions = absVnd / 1_000_000_000;
      const formatted = billions >= 100 ? billions.toFixed(1) : billions.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
      return lang === 'vi' ? `${sign}${formatted} tỷ` : `${sign}${formatted}B VND`;
    }
    if (absVnd >= 1_000_000) {
      const millions = absVnd / 1_000_000;
      const formatted = millions >= 100 ? Math.round(millions).toString() : millions.toFixed(1).replace(/\.0$/, '');
      return lang === 'vi' ? `${sign}${formatted} tr` : `${sign}${formatted}M VND`;
    }
  }

  if (absVnd >= 1_000_000_000) {
    const billions = absVnd / 1_000_000_000;
    return lang === 'vi'
      ? `${sign}${billions.toFixed(2)} tỷ VNĐ`
      : `${sign}${billions.toFixed(2)}B VND`;
  }

  return `${sign}${Math.round(absVnd).toLocaleString('en-US')} ${lang === 'vi' ? 'VNĐ' : 'VND'}`;
}

export function formatPricePerSqm(priceVnd: number, areaSqm: number, currency: Currency, lang: Language = 'vi'): string {
  if (areaSqm <= 0) return formatCurrency(0, currency, lang);
  const perSqmVnd = priceVnd / areaSqm;
  if (currency === 'USD') {
    return `$${Math.round(convertVndToUsd(perSqmVnd)).toLocaleString('en-US')}/m²`;
  }
  const millions = perSqmVnd / 1_000_000;
  return lang === 'vi'
    ? `${millions.toFixed(1)} tr/m²`
    : `${millions.toFixed(1)}M VND/m²`;
}
