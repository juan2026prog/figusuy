-- Script para actualizar de inmediato los textos de la landing directamente en la base de datos
-- Esto reemplaza el copy viejo por el nuevo sin borrar ningún otro cambio que hayas hecho.

UPDATE public.landing_blocks
SET 
  -- Actualizamos el editor/borrador
  draft_content = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              draft_content,
              '{cards,2,title}', '"Zonas activas"'
            ),
            '{cards,2,description}', '"Pocitos, Centro y Cordon siguen llenos de intercambios."'
          ),
          '{activityItems,0,title}', '"Mucho movimiento en Pocitos"'
        ),
        '{activityItems,0,detail}', '"Se siguen cerrando intercambios cerca tuyo."'
      ),
      '{activityItems,1,title}', '"Nueva insignia disponible"'
    ),
    '{activityItems,1,detail}', '"Nuevo badge para quienes ayudan a mover la comunidad."'
  ),
  -- Actualizamos también la versión pública ya publicada
  published_content = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              published_content,
              '{cards,2,title}', '"Zonas activas"'
            ),
            '{cards,2,description}', '"Pocitos, Centro y Cordon siguen llenos de intercambios."'
          ),
          '{activityItems,0,title}', '"Mucho movimiento en Pocitos"'
        ),
        '{activityItems,0,detail}', '"Se siguen cerrando intercambios cerca tuyo."'
      ),
      '{activityItems,1,title}', '"Nueva insignia disponible"'
    ),
    '{activityItems,1,detail}', '"Nuevo badge para quienes ayudan a mover la comunidad."'
  )
WHERE block_type = 'now' AND page_key = 'official';
