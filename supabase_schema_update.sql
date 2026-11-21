-- ==============================================================================
-- HabitFlow — Atomic Habits & Behavioral Architecture Schema Migration
-- ==============================================================================

-- 1. Add Behavioral Architecture columns to habits table
ALTER TABLE habits 
  ADD COLUMN IF NOT EXISTS identity TEXT,
  ADD COLUMN IF NOT EXISTS two_minute_rule TEXT,
  ADD COLUMN IF NOT EXISTS cue_anchor TEXT,
  ADD COLUMN IF NOT EXISTS cue_location TEXT;

-- 2. Add Completion status to completions table ('full' vs 'micro' for 2-Minute Rule)
ALTER TABLE completions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'full';

-- 3. Comments for documentation
COMMENT ON COLUMN habits.identity IS 'Identity persona (e.g. The Disciplined Athlete, The Deep Thinker)';
COMMENT ON COLUMN habits.two_minute_rule IS 'Scaled emergency version of the habit taking <2 minutes';
COMMENT ON COLUMN habits.cue_anchor IS 'Habit stacking trigger cue (e.g. After pouring morning coffee)';
COMMENT ON COLUMN habits.cue_location IS 'Contextual location trigger (e.g. At study desk)';
COMMENT ON COLUMN completions.status IS 'Completion type: full or micro (2-minute rule)';
