-- Add category field to checkins table
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_checkins_category ON checkins(category);

-- Add comment
COMMENT ON COLUMN checkins.category IS 'Checkin category: restaurant, attraction, accommodation, cafe, shopping, nature, activity, transportation, other';
