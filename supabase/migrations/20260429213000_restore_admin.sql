DO $$ 
DECLARE
  v_user_id uuid;
BEGIN
  -- Intentamos buscar por auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'juanmacastillo2008@gmail.com';
  
  -- Si no lo encuentra en auth.users, buscamos en public.profiles por las dudas (aunque email no siempre está ahí)
  IF v_user_id IS NULL THEN
    BEGIN
        SELECT id INTO v_user_id FROM public.profiles WHERE email = 'juanmacastillo2008@gmail.com';
    EXCEPTION WHEN undefined_column THEN
        -- Ignorar si la columna no existe
    END;
  END IF;
  
  -- Si encontramos al usuario, le damos el rol
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (v_user_id, 'god_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'god_admin';
  END IF;
END $$;
