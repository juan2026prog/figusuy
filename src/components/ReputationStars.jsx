import React from 'react'
import { getStarLevel, renderStars } from '../lib/reputation'

/**
 * ReputationStars — Visual 5-star reputation badge.
 * 
 * Shows public reputation as filled/empty stars.
 * Used in: profile, matches, chat, user cards.
 * 
 * Props:
 * - stars: number (1-5)
 * - size: 'sm' | 'md' | 'lg' (default 'md')
 * - showLabel: boolean (show text label like "Confiable")
 * - showTooltip: boolean (show hover tooltip)
 * - inline: boolean (inline-flex for embedding in text)
 */
export default function ReputationStars({
  stars = 1,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  inline = false,
}) {
  const safeStars = Math.max(1, Math.min(5, stars || 1))
  const level = getStarLevel(safeStars)

  const sizes = {
    xs: { starSize: '0.625rem', gap: '1px', labelSize: '0.5625rem', labelGap: '3px' },
    sm: { starSize: '0.75rem', gap: '1px', labelSize: '0.625rem', labelGap: '4px' },
    md: { starSize: '0.9375rem', gap: '2px', labelSize: '0.6875rem', labelGap: '5px' },
    lg: { starSize: '1.25rem', gap: '2px', labelSize: '0.8125rem', labelGap: '6px' },
  }

  const s = sizes[size] || sizes.md

  return (
    <>
      <style>{`
        .rep-stars-wrap {
          display: ${inline ? 'inline-flex' : 'flex'};
          align-items: center;
          gap: ${s.labelGap};
          vertical-align: middle;
          cursor: default;
          position: relative;
        }
        .rep-stars {
          display: flex;
          gap: ${s.gap};
          line-height: 1;
        }
        .rep-star {
          font-size: ${s.starSize};
          line-height: 1;
          transition: transform 0.15s ease;
        }
        .rep-star-filled {
          color: ${level.color};
          text-shadow: 0 0 4px ${level.color}40;
        }
        .rep-star-empty {
          color: rgba(255,255,255,0.15);
        }
        .rep-stars-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: ${s.labelSize};
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${level.color};
          white-space: nowrap;
        }
        .rep-stars-wrap[data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          color: #e5e5e5;
          padding: 6px 10px;
          font-family: 'Barlow', sans-serif;
          font-size: 0.6875rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.12);
          z-index: 50;
          pointer-events: none;
        }
      `}</style>
      <span
        className="rep-stars-wrap"
        data-tooltip={showTooltip ? `${level.label} — ${level.description}` : undefined}
      >
        <span className="rep-stars">
          {[1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              className={`rep-star ${i <= safeStars ? 'rep-star-filled' : 'rep-star-empty'}`}
            >
              ★
            </span>
          ))}
        </span>
        {showLabel && (
          <span className="rep-stars-label">{level.label}</span>
        )}
      </span>
    </>
  )
}
