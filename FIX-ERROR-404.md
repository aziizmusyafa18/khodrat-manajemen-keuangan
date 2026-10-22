# 🔧 Fix Error 404 - URL Not Found

## ❌ Error yang Anda Alami

```
Failed to load resource: the server responded with a status of 404
[API] getAllData response status: 404
❌ Koneksi Google Spreadsheet gagal: Error: Server error: 404
```

---

## 🔍 Penyebab Error 404

Error 404 artinya **URL Google Apps Script tidak ditemukan**. Ini terjadi karena:

1. ❌ URL yang disimpan **salah** atau **tidak lengkap**
2. ❌ Deployment Google Apps Script **belum aktif** atau **sudah dihapus**
3. ❌ URL menggunakan `/dev` bukan `/exec`
4. ❌ Script ID salah atau deployment baru dengan ID berbeda

---

## ✅ Solusi Lengkap

### **Langkah 1: Cek URL yang Tersimpan**

1. Buka **Console Browser** (F12)
2. Di tab Console, ketik dan tekan Enter:
   ```javascript
   localStorage.getItem('KhodratBendahara_ApiUrl')
   ```
3. Lihat URL yang muncul

**Contoh URL yang BENAR:**
```
https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
```

**Ciri-ciri URL yang SALAH:**
- ❌ Berakhiran `/dev` (bukan `/exec`)
- ❌ Terlalu pendek (kurang dari 50 karakter)
- ❌ Tidak dimulai dengan `https://script.google.com/macros/s/`
- ❌ Ada spasi atau karakter aneh

---

### **Langkah 2: Deploy Ulang Google Apps Script**

Jika URL salah atau deployment tidak aktif, lakukan deploy ulang:

#### **A. Buka Google Apps Script**
1. Buka Google Spreadsheet Anda
2. Klik **Extensions** > **Apps Script**

#### **B. Cek Apakah Code.gs Sudah Benar**
- Pastikan file `Code.gs` sudah di-paste
- Pastikan ada fungsi `doGet()` dan `doPost()`
- Klik **Save** (💾)

#### **C. Jalankan initialSetup (Jika Belum)**
1. Di dropdown function, pilih **`initialSetup`**
2. Klik **Run** (▶️)
3. Izinkan permission jika diminta
4. Tunggu sampai selesai (check log)

#### **D. Deploy sebagai Web App**
1. Klik tombol **Deploy** (di kanan atas) > **New deployment**
2. Klik icon **gear** ⚙️ di samping "Select type"
3. Pilih **Web app**
4. Isi konfigurasi:
   ```
   Description:      Khodrat Bendahara API v1
   Execute as:       Me (email@gmail.com)
   Who has access:   Anyone  ← PENTING!
   ```
5. Klik **Deploy**
6. Klik **Authorize access**
7. Pilih akun Google Anda
8. Klik **Advanced** (di kiri bawah)
9. Klik **Go to "Untitled project" (unsafe)**
10. Klik **Allow**

#### **E. Salin URL yang BENAR**
Setelah deploy berhasil, akan muncul dialog:
```
Web app
URL: https://script.google.com/macros/s/AKfycbx.../exec
```

**PENTING:** Salin URL yang berakhiran `/exec` (BUKAN `/dev`)

---

### **Langkah 3: Simpan URL Baru di Aplikasi**

#### **Cara 1: Via Dashboard Admin (Rekomendasi)**

1. Buka `admin.html` di browser
2. Login (password default: `admin` atau `admin123`)
3. Klik tab **Pengaturan**
4. Di bagian **"Web App URL Google Apps Script"**:
   - Paste URL yang baru Anda salin
   - **Pastikan berakhiran `/exec`**
5. Klik **"Uji Koneksi"**
   - ✅ Jika muncul alert hijau "Koneksi berhasil!" → Berhasil!
   - ❌ Jika masih error → Cek langkah berikutnya
6. Klik **"Simpan URL API"**

#### **Cara 2: Via config.js (Alternatif)**

1. Buka file `assets/js/config.js`
2. Cari baris:
   ```javascript
   GAS_API_URL: "",
   ```
3. Ganti dengan URL Anda:
   ```javascript
   GAS_API_URL: "https://script.google.com/macros/s/AKfycbxXXXX/exec",
   ```
4. **Save file**

---

### **Langkah 4: Test Koneksi Manual**

Buka URL berikut di **browser baru** (ganti dengan URL Anda):
```
https://script.google.com/macros/s/AKfycbxXXXXXXXX/exec?action=getAllData
```

#### **Jika BERHASIL:**
Browser akan menampilkan JSON seperti ini:
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
✅ **URL sudah benar!** Kembali ke aplikasi dan simpan URL ini.

#### **Jika GAGAL:**

**A. Error 404 "Not Found"**
```
Script function not found: doGet
```
- ❌ Code.gs belum di-deploy
- ❌ Fungsi `doGet()` tidak ada di Code.gs
- **Solusi:** Deploy ulang dari Langkah 2

**B. Error 403 "Forbidden"**
```
Authorization required
```
- ❌ Deployment tidak diatur ke "Anyone"
- **Solusi:** 
  1. Klik **Deploy** > **Manage deployments**
  2. Klik ⚙️ pada deployment aktif
  3. Ubah **"Who has access"** ke **"Anyone"**
  4. Klik **Deploy**

**C. Blank Page atau Loading Terus**
- ❌ Ada error di Code.gs
- **Solusi:**
  1. Buka Apps Script
  2. Klik **Executions** (⏱️ icon di sidebar)
  3. Lihat log error
  4. Fix error di Code.gs

---

## 🔄 Checklist Troubleshooting

Gunakan checklist ini untuk memastikan setup benar:

- [ ] Google Spreadsheet sudah dibuat
- [ ] File Code.gs sudah di-paste lengkap
- [ ] File Code.gs sudah di-**Save** (💾)
- [ ] Function `initialSetup()` sudah di-**Run** (▶️) sekali
- [ ] Ada 4 sheet di Spreadsheet: **Pengaturan, Anggota, KasMasuk, KasKeluar**
- [ ] Apps Script sudah di-**Deploy** sebagai **Web app**
- [ ] **Execute as:** Me (email Anda)
- [ ] **Who has access:** **Anyone** ✅ (PENTING!)
- [ ] Permission sudah di-**Allow** (hijau)
- [ ] URL yang disalin berakhiran **`/exec`** (bukan `/dev`)
- [ ] Test URL di browser menampilkan JSON (bukan error 404)
- [ ] URL sudah disimpan di aplikasi (via Pengaturan atau config.js)
- [ ] Tombol "Uji Koneksi" menampilkan alert hijau "Berhasil!"

---

## 🆘 Masih Error 404?

Jika sudah ikuti semua langkah tapi masih error 404:

### **Kemungkinan:**
1. **URL salah ketik** → Copy ulang dengan hati-hati
2. **Deployment tidak aktif** → Cek di **Deploy > Manage deployments**
3. **Script dihapus/corrupt** → Paste ulang Code.gs dan deploy baru
4. **Account Google issue** → Logout dan login ulang di Google

### **Test Deployment:**

Buka Apps Script > **Deploy** > **Manage deployments**

Cek status deployment:
```
✅ Active deployment
   Description: Khodrat Bendahara API v1
   Version: 1
   Execute as: you@gmail.com
   Who has access: Anyone
   Web app URL: https://script.google.com/.../exec
```

Jika tidak ada deployment aktif atau status "Disabled" → Deploy ulang!

---

## 💡 Tips Debugging

### **1. Cek Console Browser**
Tekan **F12** > Tab **Console**

Error message akan memberitahu:
- URL yang digunakan
- HTTP status code
- Response dari server

### **2. Cek URL Lengkap**
```javascript
// Di Console Browser, jalankan:
console.log('API URL:', localStorage.getItem('KhodratBendahara_ApiUrl'));
```

### **3. Clear Cache**
Kadang browser cache menyebabkan masalah:
- Tekan **Ctrl + Shift + R** (hard refresh)
- Atau **Ctrl + Shift + Delete** (clear cache)

### **4. Test di Incognito/Private Window**
Buka aplikasi di **Incognito Mode** untuk memastikan tidak ada extension yang mengganggu.

---

## ✅ Setelah Fix

Setelah URL benar dan deployment aktif:

1. Refresh halaman aplikasi (**Ctrl + R**)
2. Login ke dashboard admin
3. Coba tambah anggota atau checklist kas
4. ✅ Seharusnya berhasil tanpa error 404!

---

## 📞 Bantuan Lebih Lanjut

Jika masih stuck, screenshot dan kirimkan:
1. URL yang muncul di Console Browser
2. Response saat buka URL manual di browser
3. Screenshot deployment settings di Apps Script
4. Screenshot error di Console Browser (F12)

Dengan info ini troubleshooting akan lebih mudah! 🚀
