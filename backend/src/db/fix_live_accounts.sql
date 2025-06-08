-- Hapus tabel jika sudah ada
DROP TABLE IF EXISTS live_accounts CASCADE;

-- Buat ulang tabel dengan struktur yang benar
CREATE TABLE live_accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    account_code VARCHAR(100),
    platform VARCHAR(50),
    location VARCHAR(100),
    start_time TIME,
    end_time TIME,
    total_hosts INTEGER DEFAULT 0,
    main_hosts INTEGER[] DEFAULT '{}',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tambahkan data contoh
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
('TikTok Official', 'TIK001', 'tiktok', 'Jakarta', '10:00:00', '12:00:00', 2, ARRAY[1, 2], 1),
('Shopee Live', 'SHOP001', 'shopee', 'Surabaya', '14:00:00', '16:00:00', 1, ARRAY[3], 1),
('Others Channel', 'OTH001', 'others', 'Bandung', '09:00:00', '11:00:00', 1, ARRAY[1], 1); 