# HRMS CME (Human Resource Management System)

Sistem manajemen sumber daya manusia untuk perusahaan dengan fitur live streaming.

## Fitur Utama
1. Manajemen Karyawan
2. Sistem Kehadiran dengan Foto dan Lokasi
3. Manajemen Jadwal Kerja
4. Sistem Persetujuan
5. Manajemen Akun Live Streaming
6. Monitoring Real-time

## Teknologi yang Digunakan
- Frontend: React.js, Bootstrap 5, Redux
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Real-time: Socket.io

## Setup Proyek

### Prasyarat
- Node.js (v14 atau lebih baru)
- PostgreSQL
- npm atau yarn

### Instalasi

1. Clone repository
```bash
git clone [repository-url]
cd hrms-cme
```

2. Setup Frontend
```bash
cd frontend
npm install
npm start
```

3. Setup Backend
```bash
cd backend
npm install
npm run dev
```

4. Setup Database
- Buat database PostgreSQL dengan nama `hrms_cme`
- Update file `.env` di folder backend dengan konfigurasi database Anda

## Struktur Proyek
```
hrms-cme/
├── frontend/          # React frontend
├── backend/           # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── utils/
└── docs/             # Dokumentasi
```

## Kontribusi
Silakan buat issue atau pull request untuk kontribusi.

## Lisensi
[MIT License](LICENSE) 