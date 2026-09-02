-- Additive: membership / assignment / reaction lookup indexes.
-- Do NOT run supabase_master.sql eraser on production.

CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.project_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.project_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assign_user ON public.campaign_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_pres_react_user       ON public.presentation_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_aud_react_user         ON public.audience_reactions(user_id);
