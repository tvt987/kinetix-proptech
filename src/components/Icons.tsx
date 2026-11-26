import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const KinetixMark: React.FC<IconProps> = ({ className = 'w-6 h-6', style }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} style={style} aria-hidden="true">
    <rect x="2" y="2" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.45" />
    <path d="M9.5 23.5V8.5H12.7V15.4L19.1 8.5H23L16.6 15.3L23.4 23.5H19.4L14.2 17.2L12.7 18.8V23.5H9.5Z" fill="currentColor" />
  </svg>
);

export const BuildingIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <path d="M4 21h16" strokeLinecap="round" />
    <path d="M6 21V5.5A1.5 1.5 0 0 1 7.5 4h9A1.5 1.5 0 0 1 18 5.5V21" />
    <path d="M10 8h1m2 0h1m-4 4h1m2 0h1m-4 4h1m2 0h1" strokeLinecap="round" />
    <path d="M10 21v-3h4v3" />
  </svg>
);

export const CalculatorIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <path d="M8 7h8" strokeLinecap="round" />
    <path d="M8 12h2m4 0h2M8 16h2m4 0h2" strokeLinecap="round" />
  </svg>
);

export const CompareIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="3" y="4" width="7" height="16" rx="1.5" />
    <rect x="14" y="4" width="7" height="16" rx="1.5" />
    <path d="M6.5 9h0M17.5 9h0M6.5 13h0M17.5 13h0" strokeLinecap="round" strokeWidth="2.2" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
    <path d="M8 14h3v3H8z" fill="currentColor" stroke="none" />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" strokeLinecap="round" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <path d="M20.2 14.8A8.5 8.5 0 1 1 9.2 3.8a6.8 6.8 0 0 0 11 11Z" strokeLinejoin="round" />
  </svg>
);

export const CompassIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <polygon points="15.8,8.2 13.7,13.7 8.2,15.8 10.3,10.3" strokeLinejoin="round" />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <path d="M12 4v11m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" strokeLinecap="round" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className={className} style={style} aria-hidden="true">
    <path d="M5 12.5 9.5 17 19 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} style={style} aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
);

export const ArrowUpRightIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} style={style} aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BlueprintIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <path d="M3 10h8v10M11 14h10M15 4v6" strokeLinecap="round" />
  </svg>
);

export const PhotoIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m21 16-5-5-4 4-2-2-7 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const KeyIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h9m-3 0v3m-3-3v2" strokeLinecap="round" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} style={style} aria-hidden="true">
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
