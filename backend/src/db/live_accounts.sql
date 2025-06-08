-- Live Accounts
CREATE TABLE live_accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(100),
    account_code VARCHAR(100),
    platform VARCHAR(50),
    status VARCHAR(20),
    office_location_id INTEGER REFERENCES office_locations(id),
    main_hosts INTEGER[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_live_accounts_platform ON live_accounts(platform);
CREATE INDEX idx_live_accounts_status ON live_accounts(status);
CREATE INDEX idx_live_accounts_office_location ON live_accounts(office_location_id);

-- Example data
INSERT INTO live_accounts (account_name, account_code, platform, status, office_location_id, main_hosts) VALUES
('TikTok Official', 'TIK001', 'tiktok', 'active', 1, ARRAY[1, 2]),
('Shopee Live', 'SHOP001', 'shopee', 'active', 2, ARRAY[3, 4]),
('Others Channel', 'OTH001', 'others', 'inactive', 1, ARRAY[1]); 