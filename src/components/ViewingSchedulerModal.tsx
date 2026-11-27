import React, { useEffect, useMemo, useState } from 'react';
import type { Language, Residence, ViewingFormat, VipPassRecord } from '../types/proptech';
import type { CopyBundle } from '../data/translations';
import { buildViewingIcsContent, issueVipPass } from '../engines/vipPassEngine';
import {
  CalendarIcon,
  CalendarPlusIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  QrCodeIcon,
  VaultIcon,
} from './Icons';

interface ViewingSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  residences: Residence[];
  initialResidence: Residence;
  onPassIssued: (pass: VipPassRecord) => void;
  onOpenVault: () => void;
  onOpenDeposit: (unit: Residence, passCode?: string) => void;
  lang: Language;
  copy: CopyBundle['scheduler'];
}

const TIME_SLOTS = ['09:30', '11:00', '14:00', '16:30', '18:30 Sunset'];

function buildUpcomingDates(days = 8): Array<{ iso: string; dayLabel: string; numLabel: string }> {
  const result: Array<{ iso: string; dayLabel: string; numLabel: string }> = [];
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 1; i <= days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    result.push({
      iso,
      dayLabel: weekdayNames[d.getDay()],
      numLabel: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return result;
}

export const ViewingSchedulerModal: React.FC<ViewingSchedulerModalProps> = ({
  isOpen,
  onClose,
  residences,
  initialResidence,
  onPassIssued,
  onOpenVault,
  onOpenDeposit,
  lang,
  copy,
}) => {
  const dateOptions = useMemo(() => buildUpcomingDates(8), []);

  const [residenceId, setResidenceId] = useState(initialResidence.id);
  const [format, setFormat] = useState<ViewingFormat>('GALLERY_ONSITE');
  const [dateIso, setDateIso] = useState(dateOptions[1]?.iso ?? dateOptions[0].iso);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[3]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [issuedPass, setIssuedPass] = useState<VipPassRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResidenceId(initialResidence.id);
      setErrorMsg('');
    }
  }, [isOpen, initialResidence.id]);

  if (!isOpen) return null;

  const selectedUnit = residences.find((r) => r.id === residenceId) ?? initialResidence;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = clientName.trim();
    const trimmedPhone = clientPhone.trim();
    const trimmedEmail = clientEmail.trim();

    if (trimmedName.length < 2 || trimmedPhone.length < 7 || !trimmedEmail.includes('@')) {
      setErrorMsg(copy.validationError);
      return;
    }

    setErrorMsg('');
    const pass = issueVipPass({
      residenceId: selectedUnit.id,
      residenceCode: selectedUnit.code,
      dateIso,
      timeSlot,
      format,
      clientName: trimmedName,
      clientPhone: trimmedPhone,
      clientEmail: trimmedEmail,
      notes: notes.trim() || undefined,
    });
    setIssuedPass(pass);
    onPassIssued(pass);
  };

  const handleDownloadIcs = () => {
    if (!issuedPass) return;
    const ics = buildViewingIcsContent(issuedPass, selectedUnit, lang);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${issuedPass.passCode}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPass = () => {
    if (!issuedPass) return;
    const text = [
      'THE KINETIX RESIDENCES · THU THIEM RIVERFRONT',
      '=============================================',
      `VIP PASS CODE : ${issuedPass.passCode}`,
      `GUEST         : ${issuedPass.clientName}`,
      `RESIDENCE     : ${issuedPass.residenceCode} — ${selectedUnit.nameEn} (Floor ${selectedUnit.floor})`,
      `SCHEDULE      : ${issuedPass.dateIso} · ${issuedPass.timeSlot}`,
      `FORMAT        : ${issuedPass.format === 'GALLERY_ONSITE' ? copy.formatOnsite : copy.format3d}`,
      `ADVISOR       : ${issuedPass.advisorName} (${lang === 'vi' ? issuedPass.advisorTitleVi : issuedPass.advisorTitleEn})`,
      `CONTACT       : ${issuedPass.clientPhone} | ${issuedPass.clientEmail}`,
      '---------------------------------------------',
      copy.poweredBy,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${issuedPass.passCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-strong)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="font-mono-tabular text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
              {issuedPass ? copy.passEyebrow : copy.eyebrow}
            </div>
            <h3 className="font-display mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
              {issuedPass ? copy.passTitle : copy.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!issuedPass ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                {copy.subtitle}
              </p>

              {/* Residence Selector */}
              <div>
                <label
                  htmlFor="booking-residence"
                  className="mb-1.5 block text-xs font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {copy.selectResidence}
                </label>
                <select
                  id="booking-residence"
                  value={residenceId}
                  onChange={(e) => setResidenceId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm font-medium outline-none"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {residences.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.code} · F{unit.floor} — {lang === 'vi' ? unit.nameVi : unit.nameEn} ({unit.areaSqm}m²)
                    </option>
                  ))}
                </select>
              </div>

              {/* Viewing Format */}
              <div>
                <div className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {copy.selectFormat}
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: 'GALLERY_ONSITE' as ViewingFormat,
                        title: copy.formatOnsite,
                        desc: copy.formatOnsiteDesc,
                      },
                      {
                        value: 'PRIVATE_3D_TOUR' as ViewingFormat,
                        title: copy.format3d,
                        desc: copy.format3dDesc,
                      },
                    ] as const
                  ).map((opt) => {
                    const active = format === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormat(opt.value)}
                        className="cursor-pointer rounded-xl border p-3.5 text-left transition-all"
                        style={{
                          borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        }}
                      >
                        <div className="text-xs font-semibold" style={{ color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {opt.title}
                        </div>
                        <div className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Strip */}
              <div>
                <div className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {copy.selectDate}
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {dateOptions.map((d) => {
                    const active = d.iso === dateIso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setDateIso(d.iso)}
                        className="cursor-pointer rounded-lg border py-2 text-center transition-all"
                        style={{
                          borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--accent)' : 'var(--bg-elevated)',
                          color: active ? 'var(--accent-ink)' : 'var(--text-primary)',
                        }}
                      >
                        <div className="text-[10px] opacity-80">{d.dayLabel}</div>
                        <div className="font-mono-tabular text-xs font-semibold">{d.numLabel}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Pills */}
              <div>
                <div className="mb-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {copy.selectTime}
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const active = slot === timeSlot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className="font-mono-tabular cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                          backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                          color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="client-name" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.nameLabel} *
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={copy.namePlaceholder}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#D4A373]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="client-phone" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.phoneLabel} *
                  </label>
                  <input
                    id="client-phone"
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder={copy.phonePlaceholder}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#D4A373]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="client-email" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.emailLabel} *
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder={copy.emailPlaceholder}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#D4A373]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="client-notes" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {copy.notesLabel}
                  </label>
                  <input
                    id="client-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={copy.notesPlaceholder}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#D4A373]"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-mono-tabular text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {copy.poweredBy}
                </span>
                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:brightness-110"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>{copy.submitBtn}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Deterministic VIP Pass Credential View */
            <div className="space-y-5">
              <div
                className="architectural-grid relative overflow-hidden rounded-2xl border p-5 sm:p-6"
                style={{
                  borderColor: 'var(--border-strong)',
                  backgroundColor: 'var(--blueprint-bg)',
                }}
              >
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500">
                        <CheckIcon className="h-3.5 w-3.5" />
                        <span>VIP CREDENTIAL ACTIVE</span>
                      </div>
                      <div
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                        style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        <VaultIcon className="h-3 w-3" />
                        <span>{copy.savedToVaultBadge}</span>
                      </div>
                    </div>

                    <div>
                      <div className="font-mono-tabular text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
                        {copy.passCodeLabel}
                      </div>
                      <div className="font-mono-tabular mt-0.5 text-2xl font-bold tracking-wider sm:text-3xl" style={{ color: 'var(--accent)' }}>
                        {issuedPass.passCode}
                      </div>
                    </div>

                    <dl className="space-y-1.5 text-xs">
                      <div className="flex gap-2">
                        <dt style={{ color: 'var(--text-muted)' }}>{copy.passHolderLabel}:</dt>
                        <dd className="font-semibold" style={{ color: 'var(--text-primary)' }}>{issuedPass.clientName}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt style={{ color: 'var(--text-muted)' }}>{copy.passResidenceLabel}:</dt>
                        <dd className="font-mono-tabular font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {issuedPass.residenceCode} · Floor {selectedUnit.floor}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt style={{ color: 'var(--text-muted)' }}>{copy.passScheduleLabel}:</dt>
                        <dd className="font-mono-tabular font-semibold" style={{ color: 'var(--accent)' }}>
                          {issuedPass.dateIso} · {issuedPass.timeSlot}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt style={{ color: 'var(--text-muted)' }}>{copy.passFormatLabel}:</dt>
                        <dd className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {issuedPass.format === 'GALLERY_ONSITE' ? copy.formatOnsite : copy.format3d}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Deterministic 21x21 SVG QR Code */}
                  <div className="flex flex-col items-center self-center rounded-xl bg-white p-3 shadow-lg">
                    <svg
                      viewBox="0 0 21 21"
                      className="h-32 w-32"
                      shapeRendering="crispEdges"
                      role="img"
                      aria-label={`QR Code for ${issuedPass.passCode}`}
                    >
                      <rect width="21" height="21" fill="#FFFFFF" />
                      {issuedPass.qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#0A0B0E" />
                          ) : null
                        )
                      )}
                    </svg>
                    <span className="font-mono-tabular mt-1.5 text-[10px] font-semibold tracking-wider text-[#0A0B0E]">
                      {issuedPass.passCode}
                    </span>
                  </div>
                </div>

                {/* Assigned Advisor Footer */}
                <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.passAdvisorLabel}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {issuedPass.advisorName}{' '}
                    <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>
                      — {lang === 'vi' ? issuedPass.advisorTitleVi : issuedPass.advisorTitleEn}
                    </span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {copy.passQrNote}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:brightness-110"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                  >
                    <CalendarPlusIcon className="h-4 w-4" />
                    <span>{copy.downloadIcsBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDeposit(selectedUnit, issuedPass.passCode);
                    }}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold"
                    style={{
                      borderColor: 'var(--border-strong)',
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    <QrCodeIcon className="h-4 w-4" />
                    <span>{copy.holdDepositCta}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <span className="font-mono-tabular text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {copy.poweredBy}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPass}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      <DownloadIcon className="h-3.5 w-3.5" />
                      <span>{copy.downloadPassBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenVault();
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--accent)' }}
                    >
                      <VaultIcon className="h-3.5 w-3.5" />
                      <span>{copy.openVaultBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIssuedPass(null)}
                      className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      {copy.bookAnotherBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
