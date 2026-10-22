/**
 * API Service untuk Khodrat Bendahara
 * Menghubungkan Frontend ke Google Apps Script Web App (Spreadsheet Database)
 * Serta menyediakan fallback Data Demo (Local Storage) untuk kemudahan pengujian awal.
 */

// Data Dummy Awal jika belum terhubung ke Google Spreadsheet
const DEFAULT_INITIAL_DEMO_DATA = {
  settings: {
    orgName: "Komunitas Khodrat",
    iuranNominal: 20000,
    periode: new Date().getFullYear(),
    adminPassword: "admin"
  },
  anggota: [
    { id: "A001", nama: "Ahmad Fauzi", noHp: "081234567890", status: "Aktif" },
    { id: "A002", nama: "Budi Santoso", noHp: "081234567891", status: "Aktif" },
    { id: "A003", nama: "Citra Lestari", noHp: "081234567892", status: "Aktif" },
    { id: "A004", nama: "Dedi Prasetyo", noHp: "081234567893", status: "Aktif" },
    { id: "A005", nama: "Eka Wulandari", noHp: "081234567894", status: "Aktif" },
    { id: "A006", nama: "Fajar Nugraha", noHp: "081234567895", status: "Aktif" }
  ],
  kasMasuk: [
    { id: "KM-001", tanggal: "2026-01-05", anggotaId: "A001", anggotaNama: "Ahmad Fauzi", bulan: 1, tahun: 2026, nominal: 20000, metode: "Transfer", keterangan: "Kas Januari" },
    { id: "KM-002", tanggal: "2026-01-07", anggotaId: "A002", anggotaNama: "Budi Santoso", bulan: 1, tahun: 2026, nominal: 20000, metode: "Tunai", keterangan: "Kas Januari" },
    { id: "KM-003", tanggal: "2026-01-10", anggotaId: "A003", anggotaNama: "Citra Lestari", bulan: 1, tahun: 2026, nominal: 20000, metode: "Transfer", keterangan: "Kas Januari" },
    { id: "KM-004", tanggal: "2026-01-12", anggotaId: "A004", anggotaNama: "Dedi Prasetyo", bulan: 1, tahun: 2026, nominal: 20000, metode: "Tunai", keterangan: "Kas Januari" },
    { id: "KM-005", tanggal: "2026-02-05", anggotaId: "A001", anggotaNama: "Ahmad Fauzi", bulan: 2, tahun: 2026, nominal: 20000, metode: "Transfer", keterangan: "Kas Februari" },
    { id: "KM-006", tanggal: "2026-02-08", anggotaId: "A002", anggotaNama: "Budi Santoso", bulan: 2, tahun: 2026, nominal: 20000, metode: "Tunai", keterangan: "Kas Februari" },
    { id: "KM-007", tanggal: "2026-02-10", anggotaId: "A005", anggotaNama: "Eka Wulandari", bulan: 2, tahun: 2026, nominal: 20000, metode: "Transfer", keterangan: "Kas Februari" }
  ],
  kasKeluar: [
    { id: "KK-001", tanggal: "2026-01-15", kategori: "Konsumsi", keperluan: "Snack Rapat Bulanan", nominal: 35000, pj: "Ahmad Fauzi", buktiUrl: "", keterangan: "Beli gorengan dan air mineral" },
    { id: "KK-002", tanggal: "2026-01-20", kategori: "Operasional", keperluan: "Fotokopi & ATK Kas", nominal: 15000, pj: "Budi Santoso", buktiUrl: "", keterangan: "Buku kas dan materai" },
    { id: "KK-003", tanggal: "2026-02-14", kategori: "Sosial", keperluan: "Menjenguk Anggota Sakit", nominal: 50000, pj: "Citra Lestari", buktiUrl: "", keterangan: "Parcel buah" }
  ]
};

// Inisialisasi Mock Data di Local Storage jika belum ada
function getDemoStorage() {
  const data = localStorage.getItem(CONFIG.STORAGE_KEYS.DEMO_DATA);
  if (!data) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.DEMO_DATA, JSON.stringify(DEFAULT_INITIAL_DEMO_DATA));
    return DEFAULT_INITIAL_DEMO_DATA;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_INITIAL_DEMO_DATA;
  }
}

function saveDemoStorage(data) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.DEMO_DATA, JSON.stringify(data));
}

/**
 * Service API Utama
 */
const ApiService = {
  /**
   * Mengambil seluruh data untuk landing page dan dashboard
   */
  async getAllData() {
    const apiUrl = getApiUrl();
    
    if (isDemoMode()) {
      console.log("[API] Mode Demo aktif, menggunakan data lokal");
      return { success: true, data: getDemoStorage(), isDemo: true };
    }

    console.log(`[API] Mengambil data dari: ${apiUrl}`);
    
    try {
      const response = await fetch(`${apiUrl}?action=getAllData`, {
        method: "GET",
        mode: "cors"
      });
      
      console.log(`[API] getAllData response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] getAllData error: ${response.status} ${response.statusText}`);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const resJson = await response.json();
      console.log("[API] getAllData berhasil:", resJson);
      return { success: true, data: resJson.data || resJson, isDemo: false };
    } catch (err) {
      console.error("❌ Koneksi Google Spreadsheet gagal:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      // OPSI 1: Jangan auto-switch ke demo, return error
      return { 
        success: false, 
        message: `Gagal terhubung ke database: ${err.message}. Periksa koneksi internet atau deployment Google Apps Script.`,
        isDemo: false 
      };
      
      // OPSI 2: Auto-switch ke demo (uncomment jika ingin fallback otomatis)
      // console.warn("⚠️ Beralih ke Mode Demo sebagai fallback");
      // return { 
      //   success: true, 
      //   data: getDemoStorage(), 
      //   isDemo: true,
      //   warning: "Tidak dapat terhubung ke Google Spreadsheet. Menggunakan data demo lokal." 
      // };
    }
  },

  /**
   * Mengirim request POST ke Apps Script
   */
  async postAction(action, payload) {
    const apiUrl = getApiUrl();

    // Mode Demo: Operasi dilakukan di LocalStorage
    if (isDemoMode()) {
      return this._handleDemoPost(action, payload);
    }

    try {
      console.log(`[API] Mengirim POST action: ${action}`, payload);
      console.log(`[API] URL: ${apiUrl}`);
      
      // Menggunakan text/plain agar tidak memicu CORS Preflight OPTIONS yang sering gagal di GAS
      const response = await fetch(apiUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({ action, ...payload })
      });

      console.log(`[API] Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`[API] Response tidak OK: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error(`[API] Response text:`, text);
        return { 
          success: false, 
          message: `Server error: ${response.status} ${response.statusText}. Pastikan Google Apps Script sudah di-deploy dengan akses "Anyone".` 
        };
      }

      const resJson = await response.json();
      console.log(`[API] Response JSON:`, resJson);
      return resJson;
    } catch (err) {
      console.error("[API] Gagal melakukan aksi API:", err);
      console.error("[API] Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      return { 
        success: false, 
        message: `Terjadi kesalahan koneksi: ${err.message}. Periksa Console Browser (F12) untuk detail.` 
      };
    }
  },

  /**
   * Logika fallback untuk Mode Demo (Offline/Local)
   */
  _handleDemoPost(action, payload) {
    const store = getDemoStorage();

    switch (action) {
      case "login": {
        const inputPass = payload.password;
        const validPass = store.settings.adminPassword || "admin";
        if (inputPass === validPass) {
          const token = "demo_token_" + Date.now();
          return { success: true, token, message: "Login Berhasil (Demo Mode)" };
        }
        return { success: false, message: "Password salah! Password default: 'admin'" };
      }

      case "addKasMasuk": {
        const newRecord = {
          id: "KM-" + Date.now().toString().slice(-4),
          tanggal: payload.tanggal || new Date().toISOString().split("T")[0],
          anggotaId: payload.anggotaId,
          anggotaNama: payload.anggotaNama,
          bulan: parseInt(payload.bulan),
          tahun: parseInt(payload.tahun),
          nominal: parseInt(payload.nominal),
          metode: payload.metode || "Tunai",
          keterangan: payload.keterangan || ""
        };
        store.kasMasuk.push(newRecord);
        saveDemoStorage(store);
        return { success: true, message: "Pembayaran kas berhasil dicatat!", data: newRecord };
      }

      case "toggleKasMasuk": {
        // Toggle pembayaran dari matriks checklist
        const { anggotaId, anggotaNama, bulan, tahun, nominal } = payload;
        const idx = store.kasMasuk.findIndex(
          km => km.anggotaId === anggotaId && parseInt(km.bulan) === parseInt(bulan) && parseInt(km.tahun) === parseInt(tahun)
        );

        if (idx >= 0) {
          // Jika sudah ada, hapus (uncheck)
          store.kasMasuk.splice(idx, 1);
          saveDemoStorage(store);
          return { success: true, action: "removed", message: "Status pembayaran diubah menjadi BELUM LUNAS" };
        } else {
          // Jika belum ada, catat bayar
          const newRec = {
            id: "KM-" + Date.now().toString().slice(-4),
            tanggal: new Date().toISOString().split("T")[0],
            anggotaId,
            anggotaNama,
            bulan: parseInt(bulan),
            tahun: parseInt(tahun),
            nominal: parseInt(nominal),
            metode: "Tunai",
            keterangan: `Iuran Bulan ${bulan}`
          };
          store.kasMasuk.push(newRec);
          saveDemoStorage(store);
          return { success: true, action: "added", message: "Status pembayaran diubah menjadi LUNAS" };
        }
      }

      case "deleteKasMasuk": {
        const id = payload.id;
        store.kasMasuk = store.kasMasuk.filter(km => km.id !== id);
        saveDemoStorage(store);
        return { success: true, message: "Catatan kas masuk berhasil dihapus" };
      }

      case "addKasKeluar": {
        const newExpense = {
          id: "KK-" + Date.now().toString().slice(-4),
          tanggal: payload.tanggal,
          kategori: payload.kategori || "Lainnya",
          keperluan: payload.keperluan,
          nominal: parseInt(payload.nominal),
          pj: payload.pj || "-",
          buktiUrl: payload.buktiUrl || "",
          keterangan: payload.keterangan || ""
        };
        store.kasKeluar.push(newExpense);
        saveDemoStorage(store);
        return { success: true, message: "Pengeluaran dana berhasil dicatat!", data: newExpense };
      }

      case "deleteKasKeluar": {
        const id = payload.id;
        store.kasKeluar = store.kasKeluar.filter(kk => kk.id !== id);
        saveDemoStorage(store);
        return { success: true, message: "Catatan pengeluaran berhasil dihapus" };
      }

      case "addAnggota": {
        const newId = "A" + String(store.anggota.length + 1).padStart(3, "0");
        const newMember = {
          id: newId,
          nama: payload.nama,
          noHp: payload.noHp ? String(payload.noHp) : "", // Konversi ke string
          status: payload.status || "Aktif"
        };
        store.anggota.push(newMember);
        saveDemoStorage(store);
        return { success: true, message: "Anggota baru berhasil ditambahkan", data: newMember };
      }

      case "updateAnggota": {
        const idx = store.anggota.findIndex(a => a.id === payload.id);
        if (idx >= 0) {
          // Pastikan noHp selalu string
          const updatedData = { ...payload };
          if (updatedData.noHp !== undefined) {
            updatedData.noHp = updatedData.noHp ? String(updatedData.noHp) : "";
          }
          store.anggota[idx] = { ...store.anggota[idx], ...updatedData };
          saveDemoStorage(store);
          return { success: true, message: "Data anggota berhasil diperbarui" };
        }
        return { success: false, message: "Anggota tidak ditemukan" };
      }

      case "deleteAnggota": {
        store.anggota = store.anggota.filter(a => a.id !== payload.id);
        saveDemoStorage(store);
        return { success: true, message: "Anggota berhasil dihapus" };
      }

      case "updateSettings": {
        store.settings = { ...store.settings, ...payload };
        saveDemoStorage(store);
        return { success: true, message: "Pengaturan berhasil disimpan" };
      }

      case "resetDemoData": {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.DEMO_DATA);
        return { success: true, message: "Data demo berhasil di-reset ke default" };
      }

      default:
        return { success: false, message: "Aksi tidak dikenali" };
    }
  }
};

// Helper Format Rupiah
function formatRupiah(number) {
  if (isNaN(number)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

// Helper Format Tanggal Indonesia
function formatTanggalIndo(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

// Nama-nama bulan Indonesia
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
