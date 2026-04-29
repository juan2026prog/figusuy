-- Funciones y Triggers para hacer cumplir las reglas de plan desde el backend

-- 1. Favoritos
CREATE OR REPLACE FUNCTION public.check_favorite_limit()
RETURNS trigger AS $$
DECLARE
    f_limit int;
    current_count int;
BEGIN
    f_limit := (public.get_user_plan_rules(NEW.user_id))->>'favorite_limit';
    
    IF f_limit IS NOT NULL THEN
        SELECT count(*) INTO current_count
        FROM public.user_favorites
        WHERE user_id = NEW.user_id;

        IF current_count >= f_limit THEN
            RAISE EXCEPTION 'Has alcanzado el límite de favoritos para tu plan actual. Mejora a Plus para más.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_favorite_limit ON public.user_favorites;
CREATE TRIGGER tr_check_favorite_limit
BEFORE INSERT ON public.user_favorites
FOR EACH ROW EXECUTE FUNCTION public.check_favorite_limit();

-- 2. Álbumes activos
CREATE OR REPLACE FUNCTION public.check_active_album_limit()
RETURNS trigger AS $$
DECLARE
    a_limit int;
    current_count int;
BEGIN
    IF NEW.is_active = true THEN
        a_limit := (public.get_user_plan_rules(NEW.user_id))->>'max_active_albums';
        
        IF a_limit IS NOT NULL THEN
            SELECT count(*) INTO current_count
            FROM public.user_albums
            WHERE user_id = NEW.user_id AND is_active = true AND id != NEW.id;

            IF current_count >= a_limit THEN
                RAISE EXCEPTION 'Has alcanzado el límite de álbumes activos para tu plan actual. Mejora a Plus para más.';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_active_album_limit ON public.user_albums;
CREATE TRIGGER tr_check_active_album_limit
BEFORE INSERT OR UPDATE ON public.user_albums
FOR EACH ROW EXECUTE FUNCTION public.check_active_album_limit();

-- 3. Chats (Expiración)
CREATE OR REPLACE FUNCTION public.check_chat_expiration()
RETURNS trigger AS $$
DECLARE
    chat_record public.chats%rowtype;
    exp_hours int;
    last_msg timestamptz;
BEGIN
    -- Obtener la hora del último mensaje del chat
    SELECT * INTO chat_record FROM public.chats WHERE id = NEW.chat_id;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    last_msg := chat_record.last_message_at;
    
    -- Si es el primer mensaje, pasa (last_msg es null)
    IF last_msg IS NULL THEN
        RETURN NEW;
    END IF;

    -- Obtener regla de expiración del remitente (sender_id)
    exp_hours := (public.get_user_plan_rules(NEW.sender_id))->>'chat_expiration_hours';
    
    IF exp_hours IS NOT NULL THEN
        -- Verificar si expiró
        IF (last_msg + (exp_hours || ' hours')::interval) < now() THEN
            RAISE EXCEPTION 'Este chat venció en tu plan actual. Mejora a Plus para reanudar.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_chat_expiration ON public.messages;
CREATE TRIGGER tr_check_chat_expiration
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.check_chat_expiration();

-- Crear un helper para consultar estado de chat en frontend
CREATE OR REPLACE FUNCTION public.get_chat_expiration_state(p_chat_id uuid, p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    chat_record public.chats%rowtype;
    exp_hours int;
    is_exp boolean := false;
    exp_at timestamptz := null;
BEGIN
    SELECT * INTO chat_record FROM public.chats WHERE id = p_chat_id;
    
    IF NOT FOUND THEN
        RETURN '{"is_expired": false}'::jsonb;
    END IF;

    IF chat_record.last_message_at IS NULL THEN
        RETURN '{"is_expired": false}'::jsonb;
    END IF;

    exp_hours := (public.get_user_plan_rules(p_user_id))->>'chat_expiration_hours';
    
    IF exp_hours IS NOT NULL THEN
        exp_at := chat_record.last_message_at + (exp_hours || ' hours')::interval;
        is_exp := exp_at < now();
    END IF;

    RETURN jsonb_build_object(
        'is_expired', is_exp,
        'expires_at', exp_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_chat_expiration_state(uuid, uuid) TO authenticated;
