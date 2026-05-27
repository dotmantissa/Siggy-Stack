CREATE TABLE public.leaderboard_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  score integer NOT NULL CHECK (score >= 0),
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, day)
);

CREATE INDEX leaderboard_scores_day_score_idx
  ON public.leaderboard_scores (day, score DESC);

GRANT SELECT, INSERT, UPDATE ON public.leaderboard_scores TO anon, authenticated;
GRANT ALL ON public.leaderboard_scores TO service_role;

ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;

-- Public daily leaderboard: anyone can read today's + past scores.
CREATE POLICY "Anyone can read scores"
  ON public.leaderboard_scores FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can submit a score for today (wallet ownership is implicit; no signatures in this MVP).
CREATE POLICY "Anyone can insert today score"
  ON public.leaderboard_scores FOR INSERT
  TO anon, authenticated
  WITH CHECK (day = (now() AT TIME ZONE 'utc')::date);

-- Updates are only allowed to BEAT the existing score for that wallet/day.
CREATE POLICY "Anyone can update today score upward"
  ON public.leaderboard_scores FOR UPDATE
  TO anon, authenticated
  USING (day = (now() AT TIME ZONE 'utc')::date)
  WITH CHECK (day = (now() AT TIME ZONE 'utc')::date);

-- Trigger to keep updated_at fresh and prevent score decreases on UPDATE.
CREATE OR REPLACE FUNCTION public.leaderboard_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.score < OLD.score THEN
      NEW.score := OLD.score;
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER leaderboard_guard_trg
BEFORE UPDATE ON public.leaderboard_scores
FOR EACH ROW EXECUTE FUNCTION public.leaderboard_guard();