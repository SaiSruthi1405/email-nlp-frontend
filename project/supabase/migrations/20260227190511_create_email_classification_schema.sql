/*
  # Email Classification System Schema
  
  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null) - User's Gmail address
      - `gmail_token` (text) - OAuth token for Gmail API
      - `last_sync` (timestamptz) - Last time emails were synced
      - `created_at` (timestamptz)
      
    - `raw_emails`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `subject` (text)
      - `sender` (text)
      - `body` (text)
      - `date_received` (timestamptz)
      - `gmail_id` (text) - Original Gmail message ID
      - `created_at` (timestamptz)
      
    - `classified_emails`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `raw_email_id` (uuid, foreign key to raw_emails)
      - `category` (text) - job, event, important, others, spam
      - `priority` (text) - high, medium, low
      - `spam_score` (numeric)
      - `job_title` (text, nullable)
      - `company` (text, nullable)
      - `location` (text, nullable)
      - `experience_level` (text, nullable)
      - `skills` (text[], nullable)
      - `application_deadline` (timestamptz, nullable)
      - `event_title` (text, nullable)
      - `event_date` (timestamptz, nullable)
      - `event_location` (text, nullable)
      - `organizer` (text, nullable)
      - `meeting_link` (text, nullable)
      - `reminder_set` (boolean, default false)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  gmail_token text,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS raw_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text,
  sender text,
  body text,
  date_received timestamptz DEFAULT now(),
  gmail_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE raw_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emails"
  ON raw_emails FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own emails"
  ON raw_emails FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own emails"
  ON raw_emails FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own emails"
  ON raw_emails FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS classified_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_email_id uuid NOT NULL REFERENCES raw_emails(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'others',
  priority text NOT NULL DEFAULT 'low',
  spam_score numeric DEFAULT 0,
  job_title text,
  company text,
  location text,
  experience_level text,
  skills text[],
  application_deadline timestamptz,
  event_title text,
  event_date timestamptz,
  event_location text,
  organizer text,
  meeting_link text,
  reminder_set boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classified_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own classified emails"
  ON classified_emails FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own classified emails"
  ON classified_emails FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own classified emails"
  ON classified_emails FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own classified emails"
  ON classified_emails FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_raw_emails_user_id ON raw_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_emails_date ON raw_emails(date_received DESC);
CREATE INDEX IF NOT EXISTS idx_classified_emails_user_id ON classified_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_classified_emails_category ON classified_emails(category);
CREATE INDEX IF NOT EXISTS idx_classified_emails_event_date ON classified_emails(event_date);
CREATE INDEX IF NOT EXISTS idx_classified_emails_deadline ON classified_emails(application_deadline);