-- bot_state v3 fields
ALTER TABLE public.bot_state
  ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dry_run boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weekly_anchor numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_anchor numeric NOT NULL DEFAULT 0;

-- signals v3 fields
ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS net_edge integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS patterns text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS h1_trend text;

-- trades v3 fields
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS regime text,
  ADD COLUMN IF NOT EXISTS close_reason text;

-- forecasts table
CREATE TABLE IF NOT EXISTS public.bot_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  direction text NOT NULL,
  strength text,
  net_edge integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'WATCHING',
  regime text,
  entry_zone text,
  sl numeric,
  tp numeric,
  rrr numeric,
  rsi numeric,
  patterns text[] NOT NULL DEFAULT '{}',
  scanned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner forecasts" ON public.bot_forecasts;
CREATE POLICY "owner forecasts" ON public.bot_forecasts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS bot_forecasts_user_scanned_idx
  ON public.bot_forecasts (user_id, scanned_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_forecasts;