import React, { useState } from 'react';
import type { FloorplanRoom, Language, Residence } from '../types/proptech';

interface FloorplanSchematicSvgProps {
  residence: Residence;
  lang: Language;
  hint: string;
}

const ZONE_COLORS: Record<FloorplanRoom['zone'], { fill: string; stroke: string }> = {
  living: { fill: 'rgba(212, 163, 115, 0.14)', stroke: 'rgba(212, 163, 115, 0.72)' },
  bedroom: { fill: 'rgba(148, 163, 184, 0.14)', stroke: 'rgba(148, 163, 184, 0.6)' },
  kitchen: { fill: 'rgba(16, 185, 129, 0.12)', stroke: 'rgba(16, 185, 129, 0.58)' },
  bath: { fill: 'rgba(56, 189, 248, 0.12)', stroke: 'rgba(56, 189, 248, 0.55)' },
  terrace: { fill: 'rgba(212, 163, 115, 0.22)', stroke: 'rgba(212, 163, 115, 0.88)' },
  foyer: { fill: 'rgba(168, 85, 247, 0.10)', stroke: 'rgba(168, 85, 247, 0.45)' },
};

export const FloorplanSchematicSvg: React.FC<FloorplanSchematicSvgProps> = ({
  residence,
  lang,
  hint,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<string>(residence.floorplanRooms[0]?.id ?? 'living');

  const activeRoom =
    residence.floorplanRooms.find((r) => r.id === activeRoomId) ?? residence.floorplanRooms[0];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="architectural-grid relative overflow-hidden rounded-xl border p-3 sm:p-4"
        style={{
          backgroundColor: 'var(--blueprint-bg)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Blueprint Header Metadata */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-[0.18em] uppercase">
          <span className="font-mono-tabular font-semibold" style={{ color: 'var(--accent)' }}>
            CAD SCHEMATIC · {residence.code} · LEVEL {residence.floor}
          </span>
          <span className="font-mono-tabular" style={{ color: 'var(--text-muted)' }}>
            SCALE 1:100 · {residence.areaSqm}m² NSA · {residence.ceilingHeightM.toFixed(1)}M CEILING
          </span>
        </div>

        {/* Precision SVG Blueprint */}
        <svg
          viewBox="0 0 380 300"
          className="h-auto w-full select-none"
          role="img"
          aria-label={`Architectural floorplan for ${residence.code}`}
        >
          {/* Outer Structural Curtain Wall */}
          <rect
            x="12"
            y="12"
            width="356"
            height="270"
            rx="4"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.6"
            strokeOpacity="0.65"
          />

          {/* Interactive Room Zones */}
          {residence.floorplanRooms.map((room) => {
            const isSelected = activeRoom?.id === room.id;
            const palette = ZONE_COLORS[room.zone];
            const roomLabel = lang === 'vi' ? room.labelVi : room.labelEn;

            return (
              <g
                key={room.id}
                onMouseEnter={() => setActiveRoomId(room.id)}
                onClick={() => setActiveRoomId(room.id)}
                className="cursor-pointer transition-opacity"
              >
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx="2.5"
                  fill={isSelected ? 'rgba(212, 163, 115, 0.30)' : palette.fill}
                  stroke={isSelected ? 'var(--accent)' : palette.stroke}
                  strokeWidth={isSelected ? 2 : 1.1}
                  strokeDasharray={room.zone === 'terrace' ? '5 3' : undefined}
                />

                {/* Room Label */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 - 4}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize={room.w < 96 ? '7.5' : '9'}
                  fontWeight={isSelected ? '600' : '500'}
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {roomLabel.length > Math.floor(room.w / 4.6)
                    ? `${roomLabel.slice(0, Math.max(10, Math.floor(room.w / 4.6) - 1))}…`
                    : roomLabel}
                </text>

                {/* Exact Area Callout */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 + 10}
                  textAnchor="middle"
                  fill="var(--accent)"
                  fontSize="8.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {room.areaSqm.toFixed(1)} m²
                </text>
              </g>
            );
          })}

          {/* Saigon River Facing Indicator */}
          <line x1="20" y1="292" x2="292" y2="292" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.55" />
          <text
            x="156"
            y="296"
            textAnchor="middle"
            fill="var(--accent)"
            fontSize="8"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="2"
          >
            PANORAMIC GLAZED FACADE · VIEW CORRIDOR
          </text>

          {/* Architectural Compass Rose */}
          <g transform={`translate(342, 290)`}>
            <circle cx="0" cy="0" r="8" fill="none" stroke="var(--text-muted)" strokeWidth="0.9" />
            <g transform={`rotate(${residence.compassDeg})`}>
              <polygon points="0,-6 2.5,2 0,0.5 -2.5,2" fill="var(--accent)" />
            </g>
            <text
              x="16"
              y="3"
              fill="var(--text-muted)"
              fontSize="7.5"
              fontFamily="JetBrains Mono, monospace"
            >
              {residence.compassDeg}°
            </text>
          </g>
        </svg>
      </div>

      {/* Active Room Precision Readout */}
      {activeRoom && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5"
          style={{
            borderColor: 'var(--border-strong)',
            backgroundColor: 'var(--accent-soft)',
          }}
        >
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {lang === 'vi' ? activeRoom.labelVi : activeRoom.labelEn}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {hint}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono-tabular text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                {activeRoom.areaSqm.toFixed(1)} m²
              </div>
              <div className="font-mono-tabular text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {activeRoom.dimensions}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
