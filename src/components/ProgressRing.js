"use client";

const R = 185;
const ARC_START = 230;
const ARC_SPAN  = 280;

function clockToXY(deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: R * Math.sin(rad), y: -R * Math.cos(rad) };
}

const bgStart = clockToXY(ARC_START);
const bgEnd   = clockToXY(ARC_START + ARC_SPAN);
const BG_PATH = `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${R} ${R} 0 1 1 ${bgEnd.x.toFixed(2)} ${bgEnd.y.toFixed(2)}`;

export default function ProgressRing({ steps, openedDays }) {
  if (!steps || steps.length === 0) return null;

  const n = steps.length;
  const openedCount = steps.filter(s => openedDays.has(s.day)).length;
  const fillRatio = openedCount / n;

  let progressPath = null;
  if (fillRatio > 0) {
    const endDeg = ARC_START + fillRatio * ARC_SPAN;
    const pEnd = clockToXY(endDeg);
    const spanSoFar = fillRatio * ARC_SPAN;
    const largeArc = spanSoFar > 180 ? 1 : 0;
    progressPath = `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${pEnd.x.toFixed(2)} ${pEnd.y.toFixed(2)}`;
  }

  return (
    <svg
      style={{
        position: "absolute",
        pointerEvents: "none",
        width: "calc(var(--football-ball-size) + 54px)",
        height: "calc(var(--football-ball-size) + 54px)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        overflow: "visible",
        zIndex: 25,
      }}
      viewBox="-200 -200 400 400"
    >
      <path
        d={BG_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {progressPath && (
        <path
          d={progressPath}
          fill="none"
          stroke="#FACC01"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}

      <text
        x="0"
        y="168"
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize="13"
        fontWeight="500"
        fontFamily="system-ui, sans-serif"
      >
        {openedCount} / {n}
      </text>
    </svg>
  );
}
