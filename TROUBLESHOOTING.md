# 🔧 Panduan Troubleshooting Koneksi Database

## ❌ Masalah: "Gagal memuat data dari server"

Jika Anda mendapat error ketika mencoba menambah anggota atau melakukan operasi lainnya, ikuti langkah-langkah troubleshooting berikut:

---

## 📋 Checklist Debugging

### 1️⃣ **Buka Console Browser (F12)**

Tekan **F12** pada browser Anda, lalu pilih tab **Console**. Lihat pesan error yang muncul:

```
[API] Mengirim POST action: addAnggota {nama: "...", noHp: "..."}
[API] URL: https://script.google.com/macros/s/.../exec
[API] Response status: 403
[API] Response tidak OK: 403 Forbidden
```

Pesan error ini akan memberi tahu kita masalah sebenarnya.

---

## 🔍 Penyebab Umum & Solusi

### ⚠️ **Error 403 Forbidden**

**Penyebab:** Google Apps Script tidak di-deploy dengan akses "Anyone"

**Solusi:**
1. Buka Google Apps Script Anda
2. Klik **Deploy** > **Manage deployments**
3. Klik ⚙️ (gear icon) pada deployment yang aktif
4. Pastikan **"Who has access"** diatur ke **"Anyone"** (bukan "Only myself")
5. Klik **Deploy**
6. Salin URL baru dan update di config.js atau Pengaturan Admin

---

### ⚠️ **Error 404 Not Found**

**Penyebab:** URL Web App salah atau deployment belum aktif

**Solusi:**
1. Pastikan URL yang Anda gunakan berakhiran `/exec` (BUKAN `/dev`)
2. URL yang benar: `https://script.google.com/macros/s/AKfycbx.../exec`
3. Coba deploy ulang:
   - Buka Apps Script > **Deploy** > **New deployment**
   - Pilih **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**

---

### ⚠️ **Error CORS / Network Error**

**Penyebab:** Browser memblokir request karena CORS atau koneksi internet

**Solusi:**
1. Pastikan koneksi internet stabil
2. Coba akses URL Google Spreadsheet secara langsung di browser untuk test
3. Matikan extension browser yang mungkin memblokir (AdBlock, Privacy Badger, dll)
4. Coba browser lain (Chrome, Firefox, Edge)

---

### ⚠️ **Error "Spreadsheet not found"**

**Penyebab:** Function `initialSetup()` belum dijalankan atau sheet tidak ada

**Solusi:**
1. Buka Google Apps Script
2. Pilih function **`initialSetup`** di dropdown toolbar
3. Klik tombol **Run** (▶️)
4. Izinkan permission jika diminta
5. Cek Google Spreadsheet Anda, harus ada 4 sheet:
   - Pengaturan
   - Anggota
   - KasMasuk
   - KasKeluar

---

### ⚠️ **URL API Tidak Tersimpan**

**Penyebab:** URL belum diset di config.js atau Pengaturan Admin

**Solusi:**

**Metode 1: Via Pengaturan Admin**
1. Buka `admin.html` di browser
2. Login (password default: `admin123`)
3. Masuk ke tab **Pengaturan**
4. Paste URL Web App Anda ke field **"Web App URL Google Apps Script"**
5. Klik **"Uji Koneksi"** untuk test
6. Jika berhasil, klik **"Simpan URL API"**

**Metode 2: Edit config.js**
1. Buka file `assets/js/config.js`
2. Cari baris `GAS_API_URL: ""`
3. Ganti dengan URL Anda:
   ```javascript
   GAS_API_URL: "https://script.google.com/macros/s/AKfycbx.../exec",
   ```
4. Save file

---

## 🧪 Test Koneksi Manual

### Test GET Request (Ambil Data)

Buka URL berikut di browser Anda:
```
https://script.google.com/macros/s/[YOUR-SCRIPT-ID]/exec?action=getAllData
```

**Jika berhasil, akan muncul JSON:**
```json
{
  "success": true,
  "data": {
    "settings": {...},
    "anggota": [...],
    "kasMasuk": [...],
    "kasKeluar": [...]
  }
}
```

**Jika gagal:**
- Error 403: Deployment belum diatur "Anyone"
- Error 404: URL salah atau deployment tidak aktif
- Blank page: Script error, cek Apps Script logs

---

## 📊 Cek Logs Google Apps Script

1. Buka Google Apps Script
2. Klik **Executions** (⏱️ icon) di sidebar kiri
3. Lihat log eksekusi terakhir
4. Jika ada error, akan muncul pesan merah dengan detail

---

## 🔄 Reset ke Mode Demo

Jika masih bermasalah, Anda bisa kembali ke Mode Demo:

**Metode 1: Hapus URL API**
1. Buka tab **Pengaturan** di admin
2. Hapus URL API
3. Save
4. Aplikasi akan otomatis beralih ke Mode Demo

**Metode 2: Edit config.js**
```javascript
GAS_API_URL: "", // Kosongkan untuk Mode Demo
```

**Metode 3: Reset Local Storage**
Buka Console Browser (F12) dan jalankan:
```javascript
localStorage.clear();
location.reload();
```

---

## ✅ Verifikasi Setup Lengkap

Gunakan checklist ini untuk memastikan setup Anda benar:

- [ ] Google Spreadsheet sudah dibuat
- [ ] Code.gs sudah di-paste dan di-save
- [ ] Function `initialSetup()` sudah dijalankan sekali
- [ ] Ada 4 sheet: Pengaturan, Anggota, KasMasuk, KasKeluar
- [ ] Apps Script sudah di-deploy sebagai **Web app**
- [ ] Execute as: **Me**
- [ ] Who has access: **Anyone** ✅ (PENTING!)
- [ ] URL Web App berakhiran `/exec`
- [ ] URL sudah disimpan di config.js atau Pengaturan Admin
- [ ] Test koneksi berhasil (alert hijau)

---

## 🆘 Masih Bermasalah?

Jika masih error setelah mengikuti semua langkah:

1. **Screenshot** pesan error di Console Browser (F12)
2. **Screenshot** konfigurasi deployment di Google Apps Script
3. **Screenshot** URL yang Anda gunakan
4. **Copy-paste** pesan error lengkap

Dengan informasi ini, troubleshooting akan lebih mudah!

---

## 💡 Tips Tambahan

### Gunakan Mode Demo untuk Testing

Mode Demo menggunakan localStorage browser, cocok untuk:
- Testing UI/UX tanpa setup backend
- Demo ke klien/tim
- Development offline

### Deploy Versi Baru

Setiap kali edit Code.gs:
1. Klik **Deploy** > **Manage deployments**
2. Klik ⚙️ pada deployment aktif
3. Klik **Version**: **New version**
4. Klik **Deploy**
5. URL tetap sama, tidak perlu update config

### Browser Cache

Jika perubahan tidak muncul:
- Tekan **Ctrl+Shift+R** (hard refresh)
- Atau clear cache browser

---

## 📞 Kontak

Jika masih ada kendala, silakan hubungi developer atau buka issue di repository GitHub.
