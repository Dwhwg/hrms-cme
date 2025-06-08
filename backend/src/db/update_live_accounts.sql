-- Menambahkan kolom yang diperlukan ke tabel live_accounts
ALTER TABLE live_accounts
ADD COLUMN IF NOT EXISTS account_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS platform VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS total_hosts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS main_hosts INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Menambahkan data contoh jika tabel kosong
INSERT INTO live_accounts (
    account_name,
    account_code,
    platform,
    location,
    start_time,
    end_time,
    total_hosts,
    main_hosts,
    created_by
) VALUES
('TikTok Official', 'TIK001', 'tiktok', 'Jakarta', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 hours', 2, ARRAY[1, 2], 1),
('Shopee Live', 'SHOP001', 'shopee', 'Surabaya', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '3 days', 1, ARRAY[3], 1),
('Others Channel', 'OTH001', 'others', 'Bandung', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '4 days', 1, ARRAY[1], 1)
ON CONFLICT DO NOTHING; 