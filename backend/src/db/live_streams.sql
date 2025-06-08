-- Create live_streams table
CREATE TABLE IF NOT EXISTS live_streams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    platform VARCHAR(50) NOT NULL DEFAULT 'youtube',
    stream_key VARCHAR(255),
    stream_url VARCHAR(255),
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_date ON live_streams(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_by ON live_streams(created_by);

-- Insert sample data
INSERT INTO live_streams (title, description, platform, stream_key, stream_url, scheduled_date, status, created_by)
VALUES 
    ('Company Update Meeting', 'Monthly company-wide update meeting', 'youtube', 'yt-key-1', 'https://youtube.com/stream/1', NOW() + INTERVAL '1 day', 'scheduled', 1),
    ('Product Launch Event', 'New product line announcement', 'facebook', 'fb-key-1', 'https://facebook.com/live/1', NOW() + INTERVAL '3 days', 'scheduled', 1),
    ('Training Session: New System', 'Training for the new HR system', 'youtube', 'yt-key-2', 'https://youtube.com/stream/2', NOW() + INTERVAL '5 days', 'scheduled', 1),
    ('Team Building Workshop', 'Virtual team building activities', 'zoom', 'zoom-key-1', 'https://zoom.us/j/123456', NOW() - INTERVAL '1 hour', 'live', 1); 