-- Enum for exchange status
CREATE TYPE exchange_status AS ENUM ('pending', 'pending_confirmation', 'completed', 'not_completed', 'disputed', 'expired');
CREATE TYPE exchange_response AS ENUM ('yes', 'not_yet', 'no');

-- Create exchange_completions table
CREATE TABLE IF NOT EXISTS public.exchange_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE UNIQUE,
    user_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
    status exchange_status DEFAULT 'pending',
    user_1_response exchange_response,
    user_2_response exchange_response,
    trigger_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_exchange_completions_chat_id ON public.exchange_completions(chat_id);
CREATE INDEX idx_exchange_completions_user_1 ON public.exchange_completions(user_1_id);
CREATE INDEX idx_exchange_completions_user_2 ON public.exchange_completions(user_2_id);
CREATE INDEX idx_exchange_completions_status ON public.exchange_completions(status);

-- RLS
ALTER TABLE public.exchange_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exchange completions"
ON public.exchange_completions FOR SELECT
USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Users can insert their own exchange completions"
ON public.exchange_completions FOR INSERT
WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Users can update their own exchange completions"
ON public.exchange_completions FOR UPDATE
USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Admin full access to exchange completions"
ON public.exchange_completions FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'god_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'god_admin')
  )
);

-- Function to handle response updates and state transitions
CREATE OR REPLACE FUNCTION handle_exchange_response(
    p_chat_id UUID,
    p_user_id UUID,
    p_response exchange_response
) RETURNS void AS $$
DECLARE
    v_exchange record;
    v_other_response exchange_response;
    v_new_status exchange_status;
BEGIN
    -- Get or create exchange completion record
    SELECT * INTO v_exchange FROM public.exchange_completions WHERE chat_id = p_chat_id;
    
    IF v_exchange IS NULL THEN
        -- create it
        INSERT INTO public.exchange_completions (chat_id, user_1_id, user_2_id, album_id)
        SELECT id, user_1, user_2, album_id FROM public.chats WHERE id = p_chat_id
        RETURNING * INTO v_exchange;
    END IF;

    -- Update the specific user response
    IF v_exchange.user_1_id = p_user_id THEN
        UPDATE public.exchange_completions SET user_1_response = p_response, updated_at = NOW() WHERE id = v_exchange.id;
        v_other_response := v_exchange.user_2_response;
    ELSE
        UPDATE public.exchange_completions SET user_2_response = p_response, updated_at = NOW() WHERE id = v_exchange.id;
        v_other_response := v_exchange.user_1_response;
    END IF;

    -- Determine new status
    IF p_response = 'not_yet' THEN
        v_new_status := 'pending';
    ELSIF p_response = 'yes' AND v_other_response = 'yes' THEN
        v_new_status := 'completed';
    ELSIF p_response = 'no' AND v_other_response = 'no' THEN
        v_new_status := 'not_completed';
    ELSIF p_response = 'yes' AND v_other_response = 'no' THEN
        v_new_status := 'disputed';
    ELSIF p_response = 'no' AND v_other_response = 'yes' THEN
        v_new_status := 'disputed';
    ELSIF p_response IN ('yes', 'no') AND v_other_response IS NULL THEN
        v_new_status := 'pending_confirmation';
    ELSE
        v_new_status := 'pending';
    END IF;

    -- Update status
    UPDATE public.exchange_completions 
    SET status = v_new_status,
        completion_time = CASE WHEN v_new_status IN ('completed', 'not_completed', 'disputed') THEN NOW() ELSE NULL END
    WHERE id = v_exchange.id;

    -- If completed, apply gamification/reputation impacts
    IF v_new_status = 'completed' THEN
        -- Safely update user_progress if it exists
        BEGIN
            UPDATE public.user_progress SET 
                current_xp = current_xp + 100, 
                completed_exchanges = COALESCE(completed_exchanges, 0) + 1 
            WHERE user_id IN (v_exchange.user_1_id, v_exchange.user_2_id);
        EXCEPTION WHEN undefined_column THEN
            -- Ignore if column completed_exchanges doesn't exist
        END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
