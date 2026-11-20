# Project Wallet - Aplikasi Pencatatan Keuangan Pribadi

Aplikasi pencatatan keuangan modern multi-wallet dengan dukungan pencatatan pengeluaran, pemasukan, transfer antar akun, budgeting, langganan berulang, hutang/piutang, target tabungan, dan laporan keuangan.

## 🛠 Tech Stack
- **Frontend / Mobile**: React Native (Expo) + TypeScript
- **Backend API**: Node.js + Express + TypeScript + Zod
- **Database ORM**: Prisma ORM
- **Database Cloud**: PostgreSQL on Neon (Serverless Postgres)

---

## 📂 Struktur Proyek
```
project-wallet/
├── backend/                  # REST API Service
│   ├── prisma/
│   │   ├── schema.prisma     # Skema database lengkap
│   │   └── seed.ts           # Seeder kategori & dompet default
│   ├── src/
│   │   ├── lib/prisma.ts     # Prisma client instance
│   │   ├── routes/
│   │   │   ├── wallets.ts      # Multi-wallet & penyesuaian saldo
│   │   │   ├── categories.ts   # Kategori pengeluaran & pemasukan
│   │   │   ├── transactions.ts # Transaksi atomik & saldo
│   │   │   ├── budgets.ts      # Plafon anggaran & limit
│   │   │   ├── recurring.ts    # Transaksi rutin / langganan
│   │   │   ├── debts.ts        # Catatan hutang & piutang
│   │   │   ├── goals.ts        # Target tabungan (celengan)
│   │   │   └── reports.ts      # Laporan tren bulanan & kategori
│   │   └── index.ts          # Express server entrypoint
│   ├── .env.example
│   └── package.json
│
└── mobile/                   # Aplikasi Mobile Expo React Native
    ├── src/
    │   ├── api/              # Axios/Fetch client ke backend
    │   ├── screens/          # Layar Dashboard, Transaksi, Anggaran, dll
    │   ├── components/       # Komponen UI Reusable
    │   └── theme/            # Warna & styling
    └── package.json
```

---

## 🚀 Panduan Menjalankan

### 1. Menyiapkan Database Neon PostgreSQL
1. Buka [neon.tech](https://neon.tech) dan buat project baru gratis.
2. Salin **Connection String** database Postgres Anda. Formatnya:
   ```
   postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Di dalam folder `backend/`, buat file `.env` (bisa salin dari `.env.example`):
   ```bash
   cd backend
   cp .env.example .env
   ```
   Lalu isi variabel `DATABASE_URL` dengan connection string Neon Anda.

### 2. Migrasi & Seeding Database
Jalankan perintah berikut di folder `backend/`:
```bash
# Push skema tabel ke Neon PostgreSQL
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Masukkan data awal kategori & dompet default bahasa Indonesia
npm run prisma:seed
```

### 3. Menjalankan Backend Server
```bash
npm run dev
# Server akan berjalan di http://localhost:5000
```

### 4. Menjalankan Mobile App (Expo)
Buka terminal baru di folder `mobile/`:
```bash
cd mobile
npm start
```
- Tekan `a` untuk membuka di emulator Android.
- Tekan `w` untuk membuka di browser Web.
- Scan QR code dengan aplikasi **Expo Go** di HP Android / iOS fisik Anda.
