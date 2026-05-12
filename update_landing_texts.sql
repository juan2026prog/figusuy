

-- INSERTAR NUEVA SECCION DE REFERIDOS (ESTILO PREMIUM CARDS)
DELETE FROM public.landing_blocks WHERE block_type = 'referral_section' AND page_key = 'official';

INSERT INTO public.landing_blocks (page_key, block_type, internal_title, slug, draft_content, published_content, draft_order, published_order, is_enabled)
VALUES (
  'official',
  'referral_section',
  'Sección Referidos (Cards Gaming)',
  'invita-y-gana-section',
  '{
    "kicker": "// CRECÉ CON TU RED",
    "title": "INVITÁ AMIGOS. MOVÉ LA COMUNIDAD.",
    "subtitle": "Compartí tu enlace personal. Cuando tu amigo completa su primer intercambio, ambos ganan 3 días de Plus gratis."
  }',
  '{
    "kicker": "// CRECÉ CON TU RED",
    "title": "INVITÁ AMIGOS. MOVÉ LA COMUNIDAD.",
    "subtitle": "Compartí tu enlace personal. Cuando tu amigo completa su primer intercambio, ambos ganan 3 días de Plus gratis."
  }',
  75,
  75,
  true
);
