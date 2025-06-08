-- Add include_off_day column and modify off_day_date column
ALTER TABLE work_schedules
ADD COLUMN include_off_day VARCHAR(3) NOT NULL DEFAULT 'no' CHECK (include_off_day IN ('yes', 'no')),
ADD COLUMN off_day_date DATE NULL;

-- Add constraint to ensure off_day_date is set when include_off_day is 'yes'
ALTER TABLE work_schedules
ADD CONSTRAINT chk_off_day_date 
CHECK (
    (include_off_day = 'yes' AND off_day_date IS NOT NULL) OR
    (include_off_day = 'no' AND off_day_date IS NULL)
);

-- Add constraint to ensure off_day_date is between start_date and end_date when set
ALTER TABLE work_schedules
ADD CONSTRAINT chk_off_day_date_range
CHECK (
    off_day_date IS NULL OR
    (off_day_date >= start_date AND off_day_date <= end_date)
);

-- Update existing records
UPDATE work_schedules
SET include_off_day = CASE 
    WHEN off_day = true THEN 'yes'
    ELSE 'no'
END;

-- Drop old off_day column as it's replaced by include_off_day
ALTER TABLE work_schedules
DROP COLUMN off_day; 