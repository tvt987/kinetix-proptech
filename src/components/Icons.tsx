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

export const BookmarkIcon: React.FC<IconProps & { filled?: boolean }> = ({
  className = 'w-4 h-4',
  style,
  filled = false,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.75"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" strokeLinejoin="round" />
  </svg>
);

export const VaultIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 8.8V7M12 17v-1.8M15.2 12H17M7 12h1.8" strokeLinecap="round" />
  </svg>
);

export const PrinterIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <path d="M7 8V4h10v4" strokeLinejoin="round" />
    <rect x="4" y="8" width="16" height="8" rx="2" />
    <path d="M7 14h10v6H7v-6Z" strokeLinejoin="round" />
    <circle cx="17" cy="11" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const QrCodeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
    <path d="M14 14h2.5v2.5H14V14Zm4 0h2.5v2.5M14 20.5h6.5V18" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} style={style} aria-hidden="true">
    <path d="M12 3 5 6v5.8c0 4.5 3 8.3 7 9.7 4-1.4 7-5.2 7-9.7V6l-7-3Z" strokeLinejoin="round" />
    <path d="m9.2 12.2 2 2 3.8-4.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AlertTriangleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} style={style} aria-hidden="true">
    <path d="M10.4 4.2 3.2 17a1.8 1.8 0 0 0 1.6 2.7h14.4a1.8 1.8 0 0 0 1.6-2.7L13.6 4.2a1.8 1.8 0 0 0-3.2 0Z" strokeLinejoin="round" />
    <path d="M12 9.5v4.2" strokeLinecap="round" />
    <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 3h9a1.5 1.5 0 0 1 1.5 1.5V5" strokeLinecap="round" />
  </svg>
);

export const CalendarPlusIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
    <path d="M12 13v5M9.5 15.5h5" strokeLinecap="round" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <path d="M4 7h16M9.5 4h5M6.5 7l1 13h9l1-13" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v5M14 11v5" strokeLinecap="round" />
  </svg>
);

export const FileSpreadsheetIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} style={style} aria-hidden="true">
    <path d="M6 3h8l5 5v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4.5A1.5 1.5 0 0 1 6.5 3Z" strokeLinejoin="round" />
    <path d="M14 3v5h5M8 13h8M8 17h8M12 11v8" strokeLinecap="round" />
  </svg>
);

export const PulseIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} style={style} aria-hidden="true">
    <path d="M3 12h4l2.5-6 4 12 2.5-6H21" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
