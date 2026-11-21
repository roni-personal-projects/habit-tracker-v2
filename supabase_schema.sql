-- ==============================================================================
-- HabitFlow — Complete Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================
-- This script is IDEMPOTENT: Safe to run on both a brand-new database or an
-- existing HabitFlow project to add the new Atomic Habits behavioral fields.
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CATEGORIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Activity',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  "order" INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 3. HABITS TABLE (Including Atomic Habits & Behavioral Architecture)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily' | 'weekly' | 'monthly' | 'custom'
  interval INTEGER,
  selected_days INTEGER[], -- Array of day indices [0-6] for weekly recurrence
  "order" INTEGER NOT NULL DEFAULT 0,
  start_date TEXT, -- YYYY-MM-DD
  end_date TEXT,   -- YYYY-MM-DD
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Ensure Atomic Habits columns exist if updating an existing table
ALTER TABLE public.habits 
  ADD COLUMN IF NOT EXISTS identity TEXT,
  ADD COLUMN IF NOT EXISTS two_minute_rule TEXT,
  ADD COLUMN IF NOT EXISTS cue_anchor TEXT,
  ADD COLUMN IF NOT EXISTS cue_location TEXT;

-- ==============================================================================
-- 4. COMPLETIONS TABLE (Supporting Full vs. 2-Min Micro Habits)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT NOT NULL DEFAULT 'full', -- 'full' | 'micro'
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Ensure status column exists if updating an existing table
ALTER TABLE public.completions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'full';

-- 4.1 Deduplicate any existing completions before creating the unique constraint
DELETE FROM public.completions a USING public.completions b
WHERE a.ctid < b.ctid
  AND a.habit_id = b.habit_id
  AND a.date = b.date;

-- 4.2 Prevent duplicate completions for the same habit on the same date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'completions_habit_id_date_unique'
  ) THEN
    ALTER TABLE public.completions ADD CONSTRAINT completions_habit_id_date_unique UNIQUE (habit_id, date);
  END IF;
END $$;

-- ==============================================================================
-- 5. SLEEP LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  sleep_time TEXT NOT NULL, -- HH:mm
  wake_time TEXT NOT NULL,  -- HH:mm
  duration NUMERIC(4, 2) NOT NULL, -- Duration in decimal hours
  category TEXT NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 6. SCREEN TIME LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.screen_time_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  duration NUMERIC(5, 2) NOT NULL, -- Duration in hours
  category TEXT NOT NULL, -- 'Productivity', 'Social', 'Entertainment', 'Gaming', 'Other'
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 7. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_category_id ON public.habits(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON public.completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON public.completions(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_screen_time_user_date ON public.screen_time_logs(user_id, date);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_time_logs ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for Clerk authenticated client queries
-- (Clerk authenticates client-side, passes user_id in queries)
DO $$
BEGIN
  -- Categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow user access') THEN
    CREATE POLICY "Allow user access" ON public.categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Habits
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'Allow user access') THEN
    CREATE POLICY "Allow user access" ON public.habits FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Completions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'completions' AND policyname = 'Allow user access') THEN
    CREATE POLICY "Allow user access" ON public.completions FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Sleep Logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sleep_logs' AND policyname = 'Allow user access') THEN
    CREATE POLICY "Allow user access" ON public.sleep_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Screen Time Logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'screen_time_logs' AND policyname = 'Allow user access') THEN
    CREATE POLICY "Allow user access" ON public.screen_time_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 9. SUPABASE REALTIME REPLICATION (For instant sync across devices)
-- ==============================================================================
DO $$
BEGIN
  -- Add tables to the supabase_realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
  EXCEPTION WHEN duplicate_object THEN END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  EXCEPTION WHEN duplicate_object THEN END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.completions;
  EXCEPTION WHEN duplicate_object THEN END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sleep_logs;
  EXCEPTION WHEN duplicate_object THEN END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.screen_time_logs;
  EXCEPTION WHEN duplicate_object THEN END;
END $$;
