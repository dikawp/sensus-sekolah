# Sistem Manajemen Keuangan Sekolah (EduFinance)

Aplikasi komprehensif untuk pengelolaan keuangan sekolah PAUD/TK dengan fitur pencatatan pendapatan, pengeluaran, tracking SPP, dan pembuatan laporan.

## 📋 Fitur Utama

### 1. Dashboard Ringkasan (Dashboard Widgets)
- **KPI Cards**: Menampilkan Saldo Total, Pemasukan Bulan Ini, Pengeluaran Bulan Ini
- **Status Dana BOSP**: Indicator khusus untuk menampilkan sisa saldo bantuan pemerintah
- **Warning Alerts**: Notifikasi untuk siswa yang belum melunasi SPP bulan berjalan
- **Tren 6 Bulan**: Grafik perbandingan pemasukan vs pengeluaran dengan visualisasi Recharts

### 2. Manajemen Pendapatan (Income Tracking)
- **Pencatatan SPP Massal**: Interface untuk input pembayaran SPP siswa dengan checkbox verification
- **Kategori Sumber Dana**: Tagging otomatis untuk SPP, Uang Pangkal, Dana BOSP, dan Hibah
- **Tracker Tunggakan**: List otomatis siswa yang belum melunasi SPP bulan berjalan
- **Monthly Navigator**: Navigasi bulan untuk melihat history pembayaran

### 3. Manajemen Pengeluaran (Expense & Budgeting)
- **Kategori Belanja PAUD**: 
  - Gaji Guru
  - APE/Mainan Edukatif
  - Buku & Alat Tulis
  - Operasional/Listrik/Air
  - Infrastruktur
  - Lainnya
- **Budget Limit Monitoring**: Progress bar per kategori dengan peringatan jika mencapai 80% anggaran
- **Status Per Kategori**: Dashboard kategori belanja dengan sisa anggaran yang tersisa

### 4. Modul Operasional & Cetak (Tools & Exports)
- **Form Input Cepat**: Modal pop-up untuk entry transaksi pemasukan/pengeluaran tanpa leave page
- **Generator Kuitansi**: Fitur cetak bukti pembayaran SPP dalam format PDF
- **Ekspor Laporan**: Export data rekapitulasi ke Excel (XLSX) untuk laporan ke dinas/yayasan

### 5. Manajemen Admin (SuperAdmin Only)
- **Daftar Admin**: Kelola akun admin dengan kemampuan tambah, edit, hapus
- **Status Aktivasi**: Aktifkan/non-aktifkan akun admin
- **Konfigurasi Anggaran**: Setup budget allocation per kategori belanja

## 🔐 Sistem Autentikasi & Role

### Role: SuperAdmin
- Akses penuh ke semua fitur
- Kelola akun admin
- Setup konfigurasi anggaran
- Email: `superadmin@sekolah.id` (password: apapun untuk demo)

### Role: Admin
- Akses ke fitur manajemen pendapatan/pengeluaran
- Lihat laporan & dashboard
- Tidak bisa kelola akun admin
- Email: `admin@sekolah.id` (password: apapun untuk demo)

## 💾 Data Persistence (Supabase)

Aplikasi ini menggunakan **Supabase** (PostgreSQL + Auth) sebagai backend utama untuk menyimpan data secara persisten dan aman di cloud. Struktur datanya meliputi:
- `users`: Data pengguna & admin (Terhubung otomatis dengan Supabase Auth via *trigger*)
- `students`: Data siswa
- `income_transactions`: Transaksi pemasukan
- `expense_transactions`: Transaksi pengeluaran
- `budget_allocations`: Alokasi anggaran per kategori
- `academic_years`: Data tahun ajaran aktif

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Backend / Database**: Supabase (PostgreSQL, Auth)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Excel Export**: xlsx (exceljs)
- **Date Handling**: date-fns
- **Icons**: lucide-react

## 🚀 Setup Project (Panduan Instalasi)

### 1. Kebutuhan Sistem (Prerequisites)
- Node.js 18+
- npm/yarn/pnpm
- Akun [Supabase](https://supabase.com) (Gratis)

### 2. Setup Supabase
1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Pergi ke **SQL Editor** di Supabase.
3. Buka file `supabase/schema.sql` yang ada di dalam repository ini, lalu _copy_ seluruh isinya.
4. _Paste_ dan **Run** script tersebut di SQL Editor Supabase. Script ini otomatis akan membuat semua tabel, _trigger_, dan pengaturan keamanan (RLS) yang diperlukan.
5. Pergi ke menu **Authentication > Providers > Email**, lalu matikan opsi **Confirm email** agar admin baru yang Anda daftarkan bisa langsung *Login* tanpa verifikasi email.

### 3. Konfigurasi Environment Variables (.env.local)
Buat file bernama `.env.local` di *root folder* proyek Anda, dan isi dengan kredensial dari Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT-ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<KODE-ANON-KEY-ANDA>
```
*Catatan: Kredensial ini bisa Anda dapatkan di dashboard Supabase pada menu **Project Settings > API**.*

### 4. Instalasi dan Menjalankan Aplikasi
Buka terminal Anda di folder proyek, lalu jalankan:

```bash
# Install semua dependencies
npm install

# Jalankan server untuk development
npm run dev
```

Aplikasi sekarang akan berjalan di `http://localhost:3000`

### 5. Membuat Akun Admin Pertama
1. Buka `http://localhost:3000` di browser Anda (Anda akan diarahkan ke halaman Login).
2. Karena belum ada akun di dalam database, silakan buat akun pertama Anda di Supabase dengan cara mendaftar secara bebas, atau Anda bisa menambahkannya secara manual di Supabase Auth Dashboard (`Authentication > Users > Add User`).
3. Akun pertama yang dibuat akan secara otomatis dimasukkan ke tabel `public.users` dengan role `admin` berkat _trigger_ dari `schema.sql`.

## 📁 Struktur Proyek Utama

```
/app
  /dashboard      - Menu utama aplikasi (Pendapatan, Pengeluaran, dll)
  /login          - Halaman Login
  layout.tsx      - Root layout (Membungkus AuthProvider & AcademicYearProvider)
  page.tsx        - Redirect utama aplikasi

/components       - Komponen antarmuka yang dapat digunakan kembali (UI, Modals, dll)
/lib              - Utilitas inti
  /supabase/      - Inisialisasi klien Supabase
  storage.ts      - Semua fungsi CRUD / query database Supabase
  types.ts        - TypeScript Interfaces
  authContext.tsx - Provider autentikasi Supabase
/supabase         - Script database (schema.sql)
```

## 🛠️ Panduan Pengembangan

### Menambah/Mengubah Kolom Database
Jika Anda ingin memodifikasi struktur database:
1. Ubah di dashboard Supabase secara langsung (Tabel Editor), ATAU
2. Tulis query SQL dan perbarui `schema.sql` sebagai dokumentasi.
3. Pastikan untuk memperbarui interface di `lib/types.ts`.
4. Perbarui fungsi *fetching* atau *upserting* di `lib/storage.ts`.

## 📄 License

Dibangun dengan antusiasme untuk mendigitalisasi pendidikan Indonesia.

---

**Version**: 1.1 (Supabase Integrated)  
**Last Updated**: Juni 2026  
**School Target**: TK/PAUD & Sederajat
