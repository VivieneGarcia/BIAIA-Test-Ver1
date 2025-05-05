-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}'
);

-- Create appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  notes TEXT,
  reminder BOOLEAN DEFAULT TRUE
);

-- Create journal_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mood_type TEXT NOT NULL CHECK (mood_type IN ('positive', 'negative', 'neutral')),
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  date DATE NOT NULL
);

-- Create weekly_tips table if it doesn't exist
CREATE TABLE IF NOT EXISTS weekly_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number INTEGER NOT NULL UNIQUE CHECK (week_number >= 1 AND week_number <= 40),
  baby_development TEXT NOT NULL,
  mother_development TEXT NOT NULL,
  advice TEXT NOT NULL
);

-- Add RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_tips ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON appointments FOR DELETE
  USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly tips policies (everyone can view)
CREATE POLICY "Anyone can view weekly tips"
  ON weekly_tips FOR SELECT
  USING (true);

-- Insert some sample weekly tips data if the table is empty
INSERT INTO weekly_tips (week_number, baby_development, mother_development, advice)
SELECT 
  week_num,
  'During week ' || week_num || ', your baby continues to develop and grow.',
  'Your body is adapting to support your growing baby during week ' || week_num || '.',
  'Stay hydrated, eat nutritious foods, and get plenty of rest during week ' || week_num || '.'
FROM generate_series(1, 40) AS week_num
WHERE NOT EXISTS (SELECT 1 FROM weekly_tips WHERE week_number = week_num);
