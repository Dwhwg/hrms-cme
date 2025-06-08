-- Schedule Configuration
CREATE TABLE schedule_config (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES live_accounts(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    slot_qty INTEGER NOT NULL,
    switch_host_every INTEGER NOT NULL, -- in minutes
    total_host_by_day INTEGER NOT NULL,
    with_cohost BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_schedule_config_account_id ON schedule_config(account_id);

-- Example data
INSERT INTO schedule_config (
    account_id,
    start_time,
    end_time,
    duration,
    slot_qty,
    switch_host_every,
    total_host_by_day,
    with_cohost
) VALUES 
(1, '09:00:00', '17:00:00', 60, 8, 60, 2, true),  -- TikTok Official
(2, '10:00:00', '18:00:00', 60, 8, 60, 2, false), -- Shopee Live
(3, '11:00:00', '19:00:00', 60, 8, 60, 2, true);  -- Others Channel 