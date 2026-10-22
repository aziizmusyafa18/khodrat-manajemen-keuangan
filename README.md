# 💼 Khodrat Bendahara - Sistem Transparansi & Pencatatan Kas Terpadu

Aplikasi web modern, ringan, dan akuntabel untuk pencatatan iuran kas bulanan serta transparansi pengeluaran dana organisasi/komunitas. Dibuat menggunakan **Native Web (HTML5, Vanilla JavaScript, CSS)** dan **Bootstrap 5**, dengan database **Google Spreadsheet** melalui **Google Apps Script**.

Aplikasi ini dapat langsung di-deploy secara gratis ke **Vercel**, **Netlify**, atau **GitHub Pages** tanpa perlu mengelola server database tersendiri.

---

## 🌟 Fitur Utama

### 1. 🌐 Landing Page Publik (Transparansi Terbuka untuk Anggota)
- **Ringkasan Finansial Real-time**: Total Kas Masuk, Total Pengeluaran, dan Saldo Aktual Kas yang tersisa.
- **Transparansi Pengeluaran Dana**: Daftar lengkap uang keluar, tanggal, kategori, keperluan, nominal, penanggung jawab (PJ), dan tombol intip bukti nota.
- **Matriks Pembayaran Kas Anggota (Jan - Des)**: Tabel transparansi iuran kas per anggota dari Januari hingga Desember dengan badge lunas/belum bayar, pencarian nama anggota, dan filter tahun.
- **Grafik Interaktif (Chart.js)**: Visualisasi arus kas per bulan (Pemasukan vs Pengeluaran) dan proporsi kategori pengeluaran.
- **Print / Cetak Laporan**: Tombol siap cetak / simpan ke format PDF yang rapi.

### 2. 🛡️ Dashboard Admin (Bendahara)
- **Sistem Keamanan Login**: Akses admin terlindungi password dengan enkripsi sesi.
- **Checklist Matriks Kas Masuk Cepat**: Bendahara dapat mencentang langsung status pembayaran kas anggota hanya dengan satu kali klik tanpa perlu mengisi formulir panjang.
- **Input Kas Masuk Manual**: Opsi input transaksi dengan nominal khusus, metode transfer/tunai, tanggal, dan catatan tambahan.
- **Pencatatan Kas Keluar**: Tambah rincian belanja, kategori, nominal, penanggung jawab, serta tautan foto bukti/nota (Google Drive / Imgur).
- **Manajemen Anggota**: Tambah, edit nama/status, hapus anggota, serta tautan cepat ke WhatsApp anggota.
- **Pengaturan Lengkap**: Ubah nama kas, nominal iuran bulanan default, ganti password admin, dan uji koneksi Google Sheets.
- **Mode Demo Bawaan**: Aplikasi langsung dapat dicoba secara lokal tanpa perlu langsung mengonfigurasi spreadsheet.

---

## 📁 Struktur Direktori

```text
khodrat-bendahara/
├── index.html              # Landing Page Publik (Transparansi Anggota)
├── admin.html              # Dashboard Admin Bendahara
├── vercel.json             # Konfigurasi deployment Vercel
├── README.md               # Dokumentasi dan panduan setup
├── assets/
│   ├── css/
│   │   └── style.css       # Styling kustom Bootstrap 5 responsif
│   └── js/
│       ├── config.js       # Konfigurasi aplikasi & URL API
│       ├── api.js          # Service komunikasi data (GAS & Local Demo fallback)
│       ├── app.js          # Logika Landing Page & visualisasi grafik
│       └── admin.js        # Logika Dashboard Admin & operasi CRUD
└── google-apps-script/
    └── Code.gs             # Backend API Google Apps Script (Spreadsheet)
```

---

## 🚀 Panduan Setup Database Google Spreadsheet

Aplikasi ini menggunakan Google Spreadsheet sebagai database gratis yang aman dan mudah dikelola langsung dari Google Drive Anda.

### Langkah 1: Buat Spreadsheet Baru
1. Buka browser dan kunjungi [Google Sheets](https://sheets.new).
2. Beri nama spreadsheet Anda, misalnya: `Database Kas Khodrat`.

### Langkah 2: Pasang Google Apps Script
1. Pada menu atas Spreadsheet, klik **Extensions (Ekstensi)** > **Apps Script**.
2. Hapus seluruh kode bawaan yang ada di editor.
3. Buka file [`google-apps-script/Code.gs`](google-apps-script/Code.gs) di proyek ini, **salin semua isinya**, lalu **tempelkan** ke editor Apps Script.
4. Klik icon **Save (Simpan)** di toolbar Apps Script.

### Langkah 3: Inisialisasi Database
1. Di toolbar Apps Script sebelah tombol "Debug", pastikan fungsi yang terpilih adalah **`initialSetup`**.
2. Klik tombol **Run (Jalankan)**.
3. Jika muncul jendela otorisasi izin (*Authorization Required*):
   - Klik **Review permissions** (Tinjau Izin).
   - Pilih akun Google Anda.
   - Klik **Advanced** (Lanjutan) di kiri bawah > klik **Go to Untitled project (unsafe)**.
   - Klik **Allow** (Izinkan).
4. Periksa spreadsheet Anda, kini akan otomatis terbuat 4 lembar kerja: `Pengaturan`, `Anggota`, `KasMasuk`, dan `KasKeluar`.

### Langkah 4: Deploy sebagai Web App
1. Di kanan atas Apps Script, klik tombol biru **Deploy (Terapkan)** > **New deployment (Penerapan baru)**.
2. Klik ikon gerigi di samping *Select type*, lalu pilih **Web app (Aplikasi Web)**.
3. Isi konfigurasi berikut:
   - **Description**: `Khodrat Bendahara API v1`
   - **Execute as (Jalankan sebagai)**: `Me (Saya)`
   - **Who has access (Siapa yang memiliki akses)**: **`Anyone (Siapa saja)`** *(PENTING: Pilih 'Anyone' agar frontend dapat mengambil & menyimpan data tanpa error CORS)*.
4. Klik **Deploy**.
5. Salin tautan **Web app URL** yang berakhiran `/exec`. Contoh:
   ```text
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

---

## ⚙️ Menghubungkan Web ke Google Spreadsheet

Anda memiliki 2 cara mudah untuk menghubungkan Web ke Spreadsheet:

### Cara 1: Lewat Dashboard Admin (Tanpa Edit Kode)
1. Buka `admin.html` di browser Anda.
2. Login dengan password default demo: `admin`.
3. Buka tab **Pengaturan**.
4. Tempelkan URL Web App yang telah Anda salin ke form **Web App URL Google Apps Script**, lalu klik **Uji Koneksi** dan **Simpan URL API**.
5. Selesai! Web Anda kini terhubung langsung ke Google Sheets.

### Cara 2: Lewat File Konfigurasi
Buka file [`assets/js/config.js`](assets/js/config.js), lalu isi variabel `GAS_API_URL`:
```javascript
GAS_API_URL: "https://script.google.com/macros/s/AKfycbx.../exec",
```

---

## 🌐 Panduan Deploy ke Vercel

Aplikasi ini sudah dilengkapi file konfigurasi [`vercel.json`](vercel.json) dan siap di-deploy dalam hitungan menit:

### Cara Melalui Vercel Dashboard (Rekomendasi):
1. Buat repositori baru di GitHub (misal: `khodrat-bendahara`) dan push kode proyek ini ke repositori tersebut:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Khodrat Bendahara"
   git branch -M main
   git remote add origin https://github.com/USERNAME/khodrat-bendahara.git
   git push -u origin main
   ```
2. Buka [Vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
3. Klik **Add New...** > **Project**.
4. Pilih repositori `khodrat-bendahara`, lalu klik **Import**.
5. Pada bagian **Framework Preset**, biarkan **Other**.
6. Klik **Deploy**.
7. Dalam beberapa detik, web Anda sudah live dan memiliki URL publik aktif (misal: `https://khodrat-bendahara.vercel.app`)!

---

## 💡 Tips & Catatan Keamanan

1. **Password Admin Default**:
   - Mode Demo: `admin`
   - Google Spreadsheet Awal: `admin123`
   - *Sangat disarankan segera mengganti password admin melalui menu **Tab Pengaturan > Ganti Password Admin** setelah instalasi selesai.*
2. **Unggah Bukti Nota**:
   - Anda dapat mengunggah foto nota ke Google Drive organisasi, lalu ubah izin berbagi menjadi *Anyone with the link can view* (Siapa saja yang memiliki link dapat melihat), kemudian salin tautan file tersebut ke kolom bukti saat mencatat pengeluaran.
3. **Data Offline / Mode Demo**:
   - Jika URL Spreadsheet belum diisi atau koneksi internet bermasalah, aplikasi otomatis beralih ke Mode Demo sehingga Anda tetap bisa mendemonstrasikan antarmuka aplikasi dengan lancar.

---

## 📄 Lisensi
Dilisensikan di bawah lisensi MIT. Bebas digunakan dan dikembangkan untuk organisasi, kas kelas, kas RT/RW, kas komunitas, maupun perkumpulan lainnya.
