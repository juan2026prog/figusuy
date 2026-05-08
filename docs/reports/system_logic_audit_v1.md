# FigusUY System Logic Audit: v1.0

## Overview
As the **Gamification, Reputation & Ranking Systems Agent**, I have performed an initial audit of the current logic implemented in the Supabase migrations. The goal is to ensure the ecosystem rewards **real utility** and **trust**, not vanity or noise.

---

## 1. StoreScore & Ranking Audit

### [Current Logic] Business Engagement
`engagement_score := LEAST(views_count * 2 + favorites_count * 10, 100)`
- **Observation**: `views_count` is a low-fidelity signal. It can be easily inflated.
- **Risk**: Low-value stores appearing first due to "vanity traffic".
- **Optimization**:
    - Reduce `views_count` weight (e.g., multiplier of 0.5 or 1).
    - Incorporate **Conversion Rate**: Successful exchange completions at that location vs. total views.
    - Incorporate **Reliability**: Average user rating specifically for that store's role as an exchange point.

### [Current Logic] Business Relevance
`s_relevance := 50 + (type_bonus) + (location_data_bonus)`
- **Observation**: Mostly static.
- **Optimization**: Dynamic relevance based on **Stock Intensity**. If a store has many active users looking for stickers they stock, its relevance should spike temporarily.

---

## 2. PointScore & Trust Audit

### [Current Logic] Reputation Scoring
`s_trust := 100 - (report_count * 15) - (block_count * 25)`
- **Observation**: Primarily reactive/negative.
- **Risk**: A "ghost" user with no activity has 100 trust.
- **Optimization**:
    - **Proactive Trust**: Start at a lower baseline (e.g., 50) and gain trust through verified completions and positive feedback.
    - **Verification Loop**: Reward points for "Photo Verifications" of exchange points to ensure they are still active and safe.

---

## 3. Gamification & Progression Audit

### [Current Logic] Leveling Up
- `Explorador -> Coleccionista`: Requires 1 album and 10 stickers.
- `Coleccionista -> Intercambiador`: Requires 3 favorites, 3 chats, 1 trade.
- **Observation**: "Favorites" is a passive metric.
- **Optimization**:
    - Replace/Supplement "Favorites" with **Unique Interactors**.
    - Add **Curation Metric**: Reward users who help organize the database (reporting incorrect sticker names, adding photos).

---

## Immediate Action Plan

1. **Hardening**: Update `calculate_business_ranking` to prioritize `successful_completions` over `views`.
2. **Incentive Alignment**: Introduce a "Safety Badge" for exchange points with >10 verified completions and no reports.
3. **Visibility Audit**: Review top 10 stores to see if they are actually "Useful" or just "Old".

---
**Status**: AUDIT COMPLETE. Logic improvements ready for implementation pending next development phase.
