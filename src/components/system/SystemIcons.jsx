import React from 'react';

const iconsData = {
  UserLevelExplorerIcon: { color: '#64748B', svg: <><circle cx="50" cy="50" r="35" className="fill stroke"/><circle cx="50" cy="50" r="25" className="thin"/><path d="M50 17v7M50 76v7M17 50h7M76 50h7" className="thin"/><path d="M42 58l11-27 5 20-27 17z" fill="url(#metal)" stroke="var(--c2)" strokeWidth="2"/><circle cx="50" cy="50" r="4" className="core"/></> },
  UserLevelCollectorIcon: { color: '#3B82F6', svg: <><path d="M15 28c11-7 23-7 35 0v50c-12-7-24-7-35 0z" className="fill stroke"/><path d="M50 28c12-7 24-7 35 0v50c-11-7-23-7-35 0z" className="fill stroke"/><path d="M25 38c7-2 13-1 18 2M25 50c7-2 13-1 18 2M57 40c7-3 13-3 20-1M57 52c7-3 13-3 20-1" className="thin"/></> },
  UserLevelTraderIcon: { color: '#8B5CF6', svg: <><path d="M50 10l34 13v22c0 22-13 35-34 45-21-10-34-23-34-45V23z" className="fill stroke"/><path d="M32 55l11-12 10 10 8-8 10 10" className="thin"/><path d="M29 51l9 9c3 3 7 3 10 0l2-2 2 2c3 3 7 3 10 0l9-9" className="stroke"/></> },
  UserLevelReferentIcon: { color: '#F59E0B', svg: <><circle cx="50" cy="50" r="35" className="fill stroke"/><path d="M50 22l8 18 20 2-15 13 5 20-18-10-18 10 5-20-15-13 20-2z" className="core" stroke="var(--c2)" strokeWidth="2"/></> },
  BadgeActiveIcon: { color: '#22C55E', svg: <><path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" className="fill stroke"/><path d="M54 21L34 54h15l-4 25 22-38H52z" className="core" stroke="var(--c2)" strokeWidth="2"/></> },
  BadgeTrustedIcon: { color: '#3B82F6', svg: <><path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" className="fill stroke"/><path d="M31 51l12 12 27-29" className="stroke" style={{strokeWidth: 7}}/></> },
  BadgeTopTradeIcon: { color: '#8B5CF6', svg: <><path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" className="fill stroke"/><path d="M29 50l11-10 11 10M71 50L60 40 49 50" className="thin"/><path d="M31 58c8 9 16 9 24 0 6 7 13 7 20 0" className="stroke"/><path d="M33 39c8-7 15-7 22 0M67 39c-8-7-15-7-22 0" className="thin"/></> },
  BadgePartnerVerifiedIcon: { color: '#14B8A6', svg: <><path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" className="fill stroke"/><path d="M30 52l13 13 29-32" className="stroke" style={{strokeWidth: 7}}/><circle cx="50" cy="50" r="31" className="thin"/></> },
  BadgeImpactHighIcon: { color: '#EF4444', svg: <><path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" className="fill stroke"/><path d="M51 77c-14-6-19-17-14-29 3-8 11-12 11-25 12 9 18 18 14 29 5-3 8-8 9-14 8 18-1 34-20 39z" className="core" stroke="var(--c2)" strokeWidth="2"/></> },
  BadgeCollectorHubFriendlyIcon: { color: '#10B981', svg: <><path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" className="fill stroke"/><path d="M28 43h44l-4-14H32zM32 43v27h36V43" className="thin"/><path d="M36 70V54h13v16M56 55h8v8h-8z" className="stroke"/><path d="M28 43c4 8 10 8 14 0 4 8 10 8 14 0 4 8 10 8 16 0" className="core"/></> },
  FoundingMemberIcon: { color: '#FFD700', svg: <><path d="M50 7l35 14v24c0 21-13 34-35 45-22-11-35-24-35-45V21z" className="fill stroke"/><path d="M25 61h50l-5-30-12 13-8-20-8 20-12-13z" className="core" stroke="var(--c2)" strokeWidth="2"/><path d="M18 67h64l-6 13H24z" className="ribbon"/><text x="50" y="76" textAnchor="middle" className="label">FOUNDING</text><text x="50" y="87" textAnchor="middle" className="label">MEMBER</text></> },
  PlanFreeBoostIcon: { color: '#64748B', svg: <><path d="M50 90s28-29 28-52A28 28 0 1022 38c0 23 28 52 28 52z" className="fill stroke"/><circle cx="50" cy="38" r="12" fill="url(#metal)" stroke="var(--c2)" strokeWidth="2"/></> },
  PlanRadarTurboIcon: { color: '#3B82F6', svg: <><circle cx="50" cy="50" r="38" className="fill stroke"/><circle cx="50" cy="50" r="25" className="thin"/><circle cx="50" cy="50" r="10" className="thin"/><path d="M50 50l26-26" className="stroke"/><path d="M50 12v10M50 78v10M12 50h10M78 50h10" className="thin"/><path d="M68 18h15v15" className="stroke"/></> },
  PlanConversionDominioIcon: { color: '#8B5CF6', svg: <><path d="M30 70l-12 12 4-20M43 78l-8 14 1-22" className="stroke"/><path d="M35 63C41 34 58 17 83 14c-2 25-19 42-48 48z" className="fill stroke"/><circle cx="64" cy="34" r="9" fill="url(#metal)" stroke="var(--c2)" strokeWidth="2"/><path d="M35 63l-18 4 15-18M55 43l-22 22" className="thin"/></> },
  CollectorHubIcon: { color: '#FFD700', svg: <><path d="M50 7l35 14v24c0 21-13 34-35 45-22-11-35-24-35-45V21z" className="fill stroke"/><path d="M24 63h52l-5-31-13 13-8-22-8 22-13-13z" className="core" stroke="var(--c2)" strokeWidth="2"/><circle cx="50" cy="76" r="3" className="core"/></> },
  FoundingHubIcon: { color: '#FFD700', svg: <><path d="M50 7l35 14v24c0 21-13 34-35 45-22-11-35-24-35-45V21z" className="fill stroke"/><path d="M24 43h52L50 23zM29 47h42M33 47v22M45 47v22M57 47v22M69 47v22M27 70h46" className="stroke"/><path d="M18 72h64l-6 14H24z" className="ribbon"/><text x="50" y="82" textAnchor="middle" className="label">FOUNDING HUB</text></> },
  LegendaryCollectorHubIcon: { color: '#FFD700', svg: <><path d="M50 5l36 14v24c0 22-12 36-36 48-24-12-36-26-36-48V19z" className="fill stroke"/><path d="M50 13l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" className="core"/><path d="M24 61h52l-5-31-13 13-8-22-8 22-13-13z" className="core" stroke="var(--c2)" strokeWidth="2"/><path d="M14 67h72l-7 15H21z" className="ribbon"/><text x="50" y="78" textAnchor="middle" className="label">LEGENDARY</text><path d="M50 91l-5-7h10z" className="core"/></> }
};

function tint(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgb(${Math.min(255, r + 85)},${Math.min(255, g + 85)},${Math.min(255, b + 85)})`;
}

export const SystemIcon = ({ name, style }) => {
  const item = iconsData[name] || iconsData.BadgeActiveIcon;
  return (
    <span className="badge-icon" style={{ '--c': item.color, '--c2': tint(item.color), ...style }}>
      <svg viewBox="0 0 100 100" role="img" aria-label={name}>
        <defs>
          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.6" result="blur"/><feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .9 0" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="innerGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="badgeFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--c2)" stopOpacity=".28"/><stop offset=".52" stopColor="var(--c)" stopOpacity=".13"/><stop offset="1" stopColor="#000" stopOpacity=".38"/></linearGradient>
          <radialGradient id="metal" cx="35%" cy="25%" r="70%"><stop offset="0" stopColor="#fff" stopOpacity=".62"/><stop offset=".28" stopColor="var(--c2)" stopOpacity=".28"/><stop offset="1" stopColor="#020617" stopOpacity=".92"/></radialGradient>
        </defs>
        {item.svg}
      </svg>
    </span>
  );
};
