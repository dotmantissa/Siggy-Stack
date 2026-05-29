CREATE TABLE public.gsiggy_eligibility (
  wallet_address text PRIMARY KEY,
  eligible boolean NOT NULL DEFAULT false,
  best_score integer NOT NULL DEFAULT 0,
  best_tier integer NOT NULL DEFAULT 0,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.gsiggy_eligibility TO anon;
GRANT SELECT, INSERT, UPDATE ON public.gsiggy_eligibility TO authenticated;
GRANT ALL ON public.gsiggy_eligibility TO service_role;

ALTER TABLE public.gsiggy_eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read eligibility"
  ON public.gsiggy_eligibility FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert eligibility"
  ON public.gsiggy_eligibility FOR INSERT
  WITH CHECK (true);

-- Guard: never downgrade eligibility/best_score/best_tier on update.
CREATE OR REPLACE FUNCTION public.gsiggy_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Eligibility is sticky: once true, stays true.
    IF OLD.eligible = true THEN
      NEW.eligible := true;
      IF NEW.unlocked_at IS NULL THEN
        NEW.unlocked_at := OLD.unlocked_at;
      END IF;
    END IF;
    IF NEW.eligible = true AND NEW.unlocked_at IS NULL THEN
      NEW.unlocked_at := now();
    END IF;
    IF NEW.best_score < OLD.best_score THEN
      NEW.best_score := OLD.best_score;
    END IF;
    IF NEW.best_tier < OLD.best_tier THEN
      NEW.best_tier := OLD.best_tier;
    END IF;
    NEW.updated_at := now();
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.eligible = true AND NEW.unlocked_at IS NULL THEN
      NEW.unlocked_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER gsiggy_guard_trigger
  BEFORE INSERT OR UPDATE ON public.gsiggy_eligibility
  FOR EACH ROW EXECUTE FUNCTION public.gsiggy_guard();

CREATE POLICY "Anyone can update eligibility"
  ON public.gsiggy_eligibility FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX gsiggy_eligible_idx ON public.gsiggy_eligibility (eligible) WHERE eligible = true;