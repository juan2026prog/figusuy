import React from 'react';

export function GamificationIconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .9 0" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="innerGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="badgeFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--c2)" stopOpacity=".28" />
          <stop offset=".52" stopColor="var(--c)" stopOpacity=".13" />
          <stop offset="1" stopColor="#000" stopOpacity=".38" />
        </linearGradient>
        <radialGradient id="metal" cx="35%" cy="25%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity=".62" />
          <stop offset=".28" stopColor="var(--c2)" stopOpacity=".28" />
          <stop offset="1" stopColor="#020617" stopOpacity=".92" />
        </radialGradient>
      </defs>
    </svg>
  );
}
