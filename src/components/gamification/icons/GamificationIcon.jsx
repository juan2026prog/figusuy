import React from 'react';
import { getIconData } from '../../../lib/gamification/iconsMap';

export default function GamificationIcon({ icon, size = 'md', className = '' }) {
  let data = getIconData(icon);
  
  if (!data) {
    console.warn(`Icon "${icon}" not found, using fallback.`);
    data = getIconData(icon?.startsWith('UserLevel') ? 'DefaultLevelIcon' : 'DefaultBadgeIcon');
  }

  if (!data) return null;

  return (
    <span
      className={`badge-icon ${size} ${className}`}
      style={{
        '--c': data.color,
        '--c2': data.color2,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={icon}
        dangerouslySetInnerHTML={{ __html: data.innerHtml }}
      />
    </span>
  );
}
