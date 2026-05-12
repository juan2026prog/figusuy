-- Script para forzar el plan premium pro a todos los usuarios actuales y futuros

-- 1. Actualizar usuarios existentes a Pro Premium
UPDATE profiles 
SET plan_name = 'pro',
    is_premium = true;

-- 2. Modificar la estructura de la tabla para que el default de nuevos usuarios sea 'pro' y is_premium sea true
ALTER TABLE profiles 
ALTER COLUMN plan_name SET DEFAULT 'pro',
ALTER COLUMN is_premium SET DEFAULT true;

-- Nota: Si tienes un trigger 'handle_new_user' (común en Supabase auth.users -> public.profiles),
-- asegúrate de actualizar la función de base de datos para que asigne el plan_name = 'pro' también,
-- aunque con el DEFAULT de la tabla debería aplicarse automáticamente si el trigger no especifica 'plan_name'.

-- (Opcional) Si quieres actualizar la función de Supabase (handle_new_user)
-- CREATE OR REPLACE FUNCTION public.handle_new_user() 
-- RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, name, avatar_url, plan_name, is_premium)
--   VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'pro', true);
--   RETURN new;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
