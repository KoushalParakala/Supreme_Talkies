-- Additive: one reaction per member per line (🔥 or ❤️ or 👏).
-- Do NOT run supabase_master.sql eraser on production.

DELETE FROM public.green_room_reactions
WHERE ctid IN (
  SELECT ctid FROM (
    SELECT ctid,
      row_number() OVER (
        PARTITION BY message_id, user_id
        ORDER BY created_at DESC, kind
      ) AS rn
    FROM public.green_room_reactions
  ) ranked
  WHERE rn > 1
);

ALTER TABLE public.green_room_reactions
  DROP CONSTRAINT IF EXISTS green_room_reactions_pkey;

ALTER TABLE public.green_room_reactions
  ADD PRIMARY KEY (message_id, user_id);
