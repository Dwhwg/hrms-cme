-- Drop existing work_schedules table if exists
DROP TABLE IF EXISTS work_schedules;

-- Create new work_schedules table with updated structure
CREATE TABLE work_schedules (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    position VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    office_location_id INTEGER REFERENCES office_locations(id),
    off_day BOOLEAN DEFAULT false,
    live_account_id INTEGER REFERENCES live_accounts(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for better query performance
CREATE INDEX idx_work_schedules_employee ON work_schedules(employee_id);
CREATE INDEX idx_work_schedules_position ON work_schedules(position);
CREATE INDEX idx_work_schedules_date_range ON work_schedules(start_date, end_date);
CREATE INDEX idx_work_schedules_office_location ON work_schedules(office_location_id);
CREATE INDEX idx_work_schedules_live_account ON work_schedules(live_account_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_work_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_schedules_updated_at
    BEFORE UPDATE ON work_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_work_schedules_updated_at(); 