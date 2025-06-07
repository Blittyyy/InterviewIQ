-- Add trial-related columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster trial status lookups
CREATE INDEX IF NOT EXISTS idx_users_trial_active ON users(trial_active); 