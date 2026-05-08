export const ICONS_MAP = {
  UserLevelExplorerIcon: { color: '#64748B', innerHtml: `<circle cx="50" cy="50" r="35" class="fill stroke"/><circle cx="50" cy="50" r="25" class="thin"/><path d="M50 17v7M50 76v7M17 50h7M76 50h7" class="thin"/><path d="M42 58l11-27 5 20-27 17z" fill="url(#metal)" stroke="var(--c2)" stroke-width="2"/><circle cx="50" cy="50" r="4" class="core"/>` },
  UserLevelCollectorIcon: { color: '#3B82F6', innerHtml: `<path d="M15 28c11-7 23-7 35 0v50c-12-7-24-7-35 0z" class="fill stroke"/><path d="M50 28c12-7 24-7 35 0v50c-11-7-23-7-35 0z" class="fill stroke"/><path d="M25 38c7-2 13-1 18 2M25 50c7-2 13-1 18 2M57 40c7-3 13-3 20-1M57 52c7-3 13-3 20-1" class="thin"/>` },
  UserLevelTraderIcon: { color: '#8B5CF6', innerHtml: `<path d="M50 10l34 13v22c0 22-13 35-34 45-21-10-34-23-34-45V23z" class="fill stroke"/><path d="M32 55l11-12 10 10 8-8 10 10" class="thin"/><path d="M29 51l9 9c3 3 7 3 10 0l2-2 2 2c3 3 7 3 10 0l9-9" class="stroke"/>` },
  UserLevelReferentIcon: { color: '#F59E0B', innerHtml: `<circle cx="50" cy="50" r="35" class="fill stroke"/><path d="M50 22l8 18 20 2-15 13 5 20-18-10-18 10 5-20-15-13 20-2z" class="core" stroke="var(--c2)" stroke-width="2"/>` },
  BadgeActiveIcon: { color: '#22C55E', innerHtml: `<path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" class="fill stroke"/><path d="M54 21L34 54h15l-4 25 22-38H52z" class="core" stroke="var(--c2)" stroke-width="2"/>` },
  BadgeTrustedIcon: { color: '#3B82F6', innerHtml: `<path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" class="fill stroke"/><path d="M31 51l12 12 27-29" class="stroke" style="stroke-width:7"/>` },
  BadgeTopTradeIcon: { color: '#8B5CF6', innerHtml: `<path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" class="fill stroke"/><path d="M29 50l11-10 11 10M71 50L60 40 49 50" class="thin"/><path d="M31 58c8 9 16 9 24 0 6 7 13 7 20 0" class="stroke"/><path d="M33 39c8-7 15-7 22 0M67 39c-8-7-15-7-22 0" class="thin"/>` },
  BadgePartnerVerifiedIcon: { color: '#14B8A6', innerHtml: `<path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" class="fill stroke"/><path d="M30 52l13 13 29-32" class="stroke" style="stroke-width:7"/><circle cx="50" cy="50" r="31" class="thin"/>` },
  BadgeImpactHighIcon: { color: '#EF4444', innerHtml: `<path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" class="fill stroke"/><path d="M51 77c-14-6-19-17-14-29 3-8 11-12 11-25 12 9 18 18 14 29 5-3 8-8 9-14 8 18-1 34-20 39z" class="core" stroke="var(--c2)" stroke-width="2"/>` },
  BadgeCollectorHubFriendlyIcon: { color: '#10B981', innerHtml: `<path d="M50 8l34 13v22c0 22-13 36-34 47-21-11-34-25-34-47V21z" class="fill stroke"/><path d="M28 43h44l-4-14H32zM32 43v27h36V43" class="thin"/><path d="M36 70V54h13v16M56 55h8v8h-8z" class="stroke"/><path d="M28 43c4 8 10 8 14 0 4 8 10 8 14 0 4 8 10 8 16 0" class="core"/>` },
  FoundingMemberIcon: { color: '#FFD700', innerHtml: `<path d="M50 7l35 14v24c0 21-13 34-35 45-22-11-35-24-35-45V21z" class="fill stroke"/><path d="M25 61h50l-5-30-12 13-8-20-8 20-12-13z" class="core" stroke="var(--c2)" stroke-width="2"/><path d="M18 67h64l-6 13H24z" class="ribbon"/><text x="50" y="76" text-anchor="middle" class="label">FOUNDING</text><text x="50" y="87" text-anchor="middle" class="label">MEMBER</text>` },
  PlanFreeBoostIcon: { color: '#64748B', innerHtml: `<path d="M50 90s28-29 28-52A28 28 0 1022 38c0 23 28 52 28 52z" class="fill stroke"/><circle cx="50" cy="38" r="12" fill="url(#metal)" stroke="var(--c2)" stroke-width="2"/>` },
  PlanRadarTurboIcon: { color: '#3B82F6', innerHtml: `<circle cx="50" cy="50" r="38" class="fill stroke"/><circle cx="50" cy="50" r="25" class="thin"/><circle cx="50" cy="50" r="10" class="thin"/><path d="M50 50l26-26" class="stroke"/><path d="M50 12v10M50 78v10M12 50h10M78 50h10" class="thin"/><path d="M68 18h15v15" class="stroke"/>` },
  PlanConversionDominioIcon: { color: '#8B5CF6', innerHtml: `<path d="M30 70l-12 12 4-20M43 78l-8 14 1-22" class="stroke"/><path d="M35 63C41 34 58 17 83 14c-2 25-19 42-48 48z" class="fill stroke"/><circle cx="64" cy="34" r="9" fill="url(#metal)" stroke="var(--c2)" stroke-width="2"/><path d="M35 63l-18 4 15-18M55 43l-22 22" class="thin"/>` },
  CollectorHubIcon: { color: '#FFD700', innerHtml: `<path d="M50 7l35 14v24c0 21-13 34-35 45-22-11-35-24-35-45V21z" class="fill stroke"/><path d="M24 63h52l-5-31-13 13-8-22-8 22-13-13z" class="core" stroke="var(--c2)" stroke-width="2"/><circle cx="50" cy="76" r="3" class="core"/>` },
  FoundingHubIcon: { color: '#FFD700', innerHtml: `<path d="M50 7l35 14v24c0 21-13 34-35 45-22-11-35-24-35-45V21z" class="fill stroke"/><path d="M24 43h52L50 23zM29 47h42M33 47v22M45 47v22M57 47v22M69 47v22M27 70h46" class="stroke"/><path d="M18 72h64l-6 14H24z" class="ribbon"/><text x="50" y="82" text-anchor="middle" class="label">FOUNDING HUB</text>` },
  LegendaryCollectorHubIcon: { color: '#FFD700', innerHtml: `<path d="M50 5l36 14v24c0 22-12 36-36 48-24-12-36-26-36-48V19z" class="fill stroke"/><path d="M50 13l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" class="core"/><path d="M24 61h52l-5-31-13 13-8-22-8 22-13-13z" class="core" stroke="var(--c2)" stroke-width="2"/><path d="M14 67h72l-7 15H21z" class="ribbon"/><text x="50" y="78" text-anchor="middle" class="label">LEGENDARY</text><path d="M50 91l-5-7h10z" class="core"/>` },
  
  // Fallbacks
  DefaultBadgeIcon: { color: '#64748B', innerHtml: `<path d="M50 10l34 13v22c0 22-13 35-34 45-21-10-34-23-34-45V23z" class="fill stroke"/><circle cx="50" cy="50" r="10" class="thin"/>` },
  DefaultLevelIcon: { color: '#64748B', innerHtml: `<circle cx="50" cy="50" r="35" class="fill stroke"/><circle cx="50" cy="50" r="10" class="core"/>` },
};

function tint(hex) {
  if (!hex) return 'rgba(255,255,255,0.5)';
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16),
        g = parseInt(clean.slice(2, 4), 16),
        b = parseInt(clean.slice(4, 6), 16);
  return `rgb(${Math.min(255, r + 85)},${Math.min(255, g + 85)},${Math.min(255, b + 85)})`;
}

export function getIconData(key) {
  const icon = ICONS_MAP[key];
  if (!icon) return null;
  return {
    ...icon,
    color2: tint(icon.color)
  };
}
