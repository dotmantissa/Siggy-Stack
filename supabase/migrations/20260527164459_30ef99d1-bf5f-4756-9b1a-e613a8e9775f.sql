CREATE OR REPLACE FUNCTION public.leaderboard_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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