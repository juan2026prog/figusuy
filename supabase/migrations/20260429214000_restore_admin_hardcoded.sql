INSERT INTO public.user_roles (user_id, role) 
VALUES ('633f1113-49fa-4601-a025-df13ef4b0f16', 'god_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'god_admin';
