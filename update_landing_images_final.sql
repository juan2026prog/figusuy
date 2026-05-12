-- Actualizar el bloque 'How it works' con las nuevas imágenes premium
UPDATE landing_blocks
SET 
  published_content = jsonb_set(
    jsonb_set(
      jsonb_set(published_content, '{steps,0,image}', '"/assets/landing/how_it_works/step1.png"'),
      '{steps,1,image}', '"/assets/landing/how_it_works/step2.png"'
    ),
    '{steps,2,image}', '"/assets/landing/how_it_works/step3.png"'
  ),
  draft_content = jsonb_set(
    jsonb_set(
      jsonb_set(draft_content, '{steps,0,image}', '"/assets/landing/how_it_works/step1.png"'),
      '{steps,1,image}', '"/assets/landing/how_it_works/step2.png"'
    ),
    '{steps,2,image}', '"/assets/landing/how_it_works/step3.png"'
  )
WHERE block_type = 'how_it_works';

-- También actualizamos el bloque de 'Exchange Points' (Lugares de intercambio)
-- Usamos la misma foto premium que generamos para el paso 3 o una similar
UPDATE landing_blocks
SET 
  published_content = jsonb_set(published_content, '{image}', '"/assets/landing/how_it_works/step3.png"'),
  draft_content = jsonb_set(draft_content, '{image}', '"/assets/landing/how_it_works/step3.png"')
WHERE block_type = 'exchange_points';
