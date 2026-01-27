-- Fix missing columns in jobs table
-- Add drafts_created and total_targets columns to unblock drafting

-- Add drafts_created column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'drafts_created'
    ) THEN
        ALTER TABLE jobs ADD COLUMN drafts_created INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added drafts_created column to jobs table';
    ELSE
        RAISE NOTICE 'drafts_created column already exists';
    END IF;
END $$;

-- Add total_targets column if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'total_targets'
    ) THEN
        ALTER TABLE jobs ADD COLUMN total_targets INTEGER NULL;
        RAISE NOTICE 'Added total_targets column to jobs table';
    ELSE
        RAISE NOTICE 'total_targets column already exists';
    END IF;
END $$;

-- Update existing jobs to have default drafts_created = 0
UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_drafts_created ON jobs(drafts_created);

-- Show current jobs table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;
