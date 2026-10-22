/**
 * =========================================================================
 * KHODRAT BENDAHARA - BACKEND GOOGLE APPS SCRIPT
 * =========================================================================
 * Petunjuk Instalasi:
 * 1. Buat Google Spreadsheet baru di Google Drive (https://sheets.new)
 * 2. Beri nama file, misal: "Database Kas Khodrat"
 * 3. Buka menu Extensions (Ekstensi) > Apps Script
 * 4. Hapus semua kode yang ada di Apps Script, lalu Paste SELURUH isi file ini.
 * 5. Klik icon "Save" (Simpan).
 * 6. Jalankan fungsi 'initialSetup' sekali (pilih function 'initialSetup' di toolbar, lalu klik Run).
 * 7. Klik tombol "Deploy" (Terapkan) di kanan atas > "New deployment" (Penerapan baru).
 * 8. Pilih jenis "Web app" (Aplikasi Web).
 * 9. Konfigurasi:
 *    - Description: "Khodrat Bendahara API v1"
 *    - Execute as: "Me" (Saya / akun email Anda)
 *    - Who has access: "Anyone" (Siapa saja, bahkan anonim - PENTING agar web frontend bisa baca/tulis)
 * 10. Klik "Deploy", izinkan hak akses (Review Permissions > Advanced > Go to Untitled (unsafe) > Allow).
 * 11. Salin "Web app URL" (akhiran /exec) dan simpan ke web frontend Anda!
 * =========================================================================
 */

const SHEET_NAMES = {
  PENGATURAN: "Pengaturan",
  ANGGOTA: "Anggota",
  KAS_MASUK: "KasMasuk",
  KAS_KELUAR: "KasKeluar"
};

/**
 * Setup otomatis lembar kerja dan header jika spreadsheet masih kosong
 */
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Pengaturan
  let sheetPengaturan = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  if (!sheetPengaturan) {
    sheetPengaturan = ss.insertSheet(SHEET_NAMES.PENGATURAN);
    sheetPengaturan.appendRow(["Kunci", "Nilai"]);
    sheetPengaturan.appendRow(["orgName", "Komunitas Khodrat"]);
    sheetPengaturan.appendRow(["iuranNominal", 20000]);
    sheetPengaturan.appendRow(["periode", new Date().getFullYear()]);
    sheetPengaturan.appendRow(["adminPassword", "admin123"]);
    sheetPengaturan.getRange(1, 1, 1, 2).setFontWeight("bold");
  }

  // 2. Sheet Anggota
  let sheetAnggota = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
  if (!sheetAnggota) {
    sheetAnggota = ss.insertSheet(SHEET_NAMES.ANGGOTA);
    sheetAnggota.appendRow(["id", "nama", "noHp", "status"]);
    sheetAnggota.appendRow(["A001", "Ahmad Fauzi", "081234567890", "Aktif"]);
    sheetAnggota.appendRow(["A002", "Budi Santoso", "081234567891", "Aktif"]);
    sheetAnggota.appendRow(["A003", "Citra Lestari", "081234567892", "Aktif"]);
    sheetAnggota.getRange(1, 1, 1, 4).setFontWeight("bold");
  }

  // 3. Sheet KasMasuk
  let sheetKasMasuk = ss.getSheetByName(SHEET_NAMES.KAS_MASUK);
  if (!sheetKasMasuk) {
    sheetKasMasuk = ss.insertSheet(SHEET_NAMES.KAS_MASUK);
    sheetKasMasuk.appendRow(["id", "tanggal", "anggotaId", "anggotaNama", "bulan", "tahun", "nominal", "metode", "keterangan"]);
    sheetKasMasuk.getRange(1, 1, 1, 9).setFontWeight("bold");
  }

  // 4. Sheet KasKeluar
  let sheetKasKeluar = ss.getSheetByName(SHEET_NAMES.KAS_KELUAR);
  if (!sheetKasKeluar) {
    sheetKasKeluar = ss.insertSheet(SHEET_NAMES.KAS_KELUAR);
    sheetKasKeluar.appendRow(["id", "tanggal", "kategori", "keperluan", "nominal", "pj", "buktiUrl", "keterangan"]);
    sheetKasKeluar.getRange(1, 1, 1, 8).setFontWeight("bold");
  }

  // Hapus 'Sheet1' default jika ada
  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  Logger.log("Inisialisasi Database Kas Khodrat Berhasil!");
}

/**
 * Handle Request GET dari Frontend
 */
function doGet(e) {
  try {
    initialSetup(); // Pastikan struktur siap
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Baca data Pengaturan
    const sheetPengaturan = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    const settingsRows = sheetPengaturan.getDataRange().getValues();
    const settings = {};
    for (let i = 1; i < settingsRows.length; i++) {
      if (settingsRows[i][0]) {
        settings[settingsRows[i][0]] = settingsRows[i][1];
      }
    }
    // Sembunyikan password asli dari respons publik demi keamanan
    delete settings.adminPassword;

    // Baca data Anggota
    const sheetAnggota = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
    const anggota = getSheetDataAsObjects(sheetAnggota);

    // Baca data Kas Masuk
    const sheetKasMasuk = ss.getSheetByName(SHEET_NAMES.KAS_MASUK);
    const kasMasuk = getSheetDataAsObjects(sheetKasMasuk);

    // Baca data Kas Keluar
    const sheetKasKeluar = ss.getSheetByName(SHEET_NAMES.KAS_KELUAR);
    const kasKeluar = getSheetDataAsObjects(sheetKasKeluar);

    const result = {
      success: true,
      data: {
        settings,
        anggota,
        kasMasuk,
        kasKeluar
      }
    };

    return respondJSON(result);
  } catch (error) {
    return respondJSON({ success: false, message: error.toString() });
  }
}

/**
 * Handle Request POST dari Frontend (Admin & Mutasi Data)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Verifikasi Login
    if (action === "login") {
      const sheetPengaturan = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
      const rows = sheetPengaturan.getDataRange().getValues();
      let currentPass = "admin123";
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === "adminPassword") {
          currentPass = String(rows[i][1]);
          break;
        }
      }

      if (String(payload.password) === currentPass) {
        return respondJSON({ success: true, message: "Login berhasil", token: "gas_auth_" + new Date().getTime() });
      } else {
        return respondJSON({ success: false, message: "Password admin salah!" });
      }
    }

    // Aksi: Catat Kas Masuk
    if (action === "addKasMasuk") {
      const sheet = ss.getSheetByName(SHEET_NAMES.KAS_MASUK);
      const newId = "KM-" + new Date().getTime().toString().slice(-6);
      sheet.appendRow([
        newId,
        payload.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd"),
        payload.anggotaId,
        payload.anggotaNama,
        parseInt(payload.bulan),
        parseInt(payload.tahun),
        parseInt(payload.nominal),
        payload.metode || "Tunai",
        payload.keterangan || ""
      ]);
      return respondJSON({ success: true, message: "Kas masuk berhasil disimpan" });
    }

    // Aksi: Toggle Kas Masuk (Lunas / Belum dari checklist matriks)
    if (action === "toggleKasMasuk") {
      const sheet = ss.getSheetByName(SHEET_NAMES.KAS_MASUK);
      const rows = sheet.getDataRange().getValues();
      const { anggotaId, anggotaNama, bulan, tahun, nominal } = payload;

      let foundRowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (
          String(rows[i][2]) === String(anggotaId) &&
          parseInt(rows[i][4]) === parseInt(bulan) &&
          parseInt(rows[i][5]) === parseInt(tahun)
        ) {
          foundRowIndex = i + 1; // 1-indexed untuk deleteRow
          break;
        }
      }

      if (foundRowIndex > 0) {
        sheet.deleteRow(foundRowIndex);
        return respondJSON({ success: true, action: "removed", message: "Status diubah menjadi BELUM LUNAS" });
      } else {
        const newId = "KM-" + new Date().getTime().toString().slice(-6);
        const tgl = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
        sheet.appendRow([
          newId,
          tgl,
          anggotaId,
          anggotaNama,
          parseInt(bulan),
          parseInt(tahun),
          parseInt(nominal),
          "Tunai",
          "Iuran Bulan " + bulan
        ]);
        return respondJSON({ success: true, action: "added", message: "Status diubah menjadi LUNAS" });
      }
    }

    // Aksi: Hapus Kas Masuk
    if (action === "deleteKasMasuk") {
      const sheet = ss.getSheetByName(SHEET_NAMES.KAS_MASUK);
      deleteRowById(sheet, payload.id);
      return respondJSON({ success: true, message: "Catatan kas masuk berhasil dihapus" });
    }

    // Aksi: Tambah Kas Keluar
    if (action === "addKasKeluar") {
      const sheet = ss.getSheetByName(SHEET_NAMES.KAS_KELUAR);
      const newId = "KK-" + new Date().getTime().toString().slice(-6);
      sheet.appendRow([
        newId,
        payload.tanggal || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd"),
        payload.kategori || "Lainnya",
        payload.keperluan,
        parseInt(payload.nominal),
        payload.pj || "-",
        payload.buktiUrl || "",
        payload.keterangan || ""
      ]);
      return respondJSON({ success: true, message: "Pengeluaran dana berhasil dicatat" });
    }

    // Aksi: Hapus Kas Keluar
    if (action === "deleteKasKeluar") {
      const sheet = ss.getSheetByName(SHEET_NAMES.KAS_KELUAR);
      deleteRowById(sheet, payload.id);
      return respondJSON({ success: true, message: "Catatan pengeluaran berhasil dihapus" });
    }

    // Aksi: Tambah Anggota
    if (action === "addAnggota") {
      const sheet = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
      const nextId = "A" + String(sheet.getLastRow()).padStart(3, "0");
      sheet.appendRow([
        nextId,
        payload.nama,
        payload.noHp || "",
        payload.status || "Aktif"
      ]);
      return respondJSON({ success: true, message: "Anggota baru berhasil ditambahkan" });
    }

    // Aksi: Update Anggota
    if (action === "updateAnggota") {
      const sheet = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(payload.id)) {
          if (payload.nama) sheet.getRange(i + 1, 2).setValue(payload.nama);
          if (payload.noHp !== undefined) sheet.getRange(i + 1, 3).setValue(payload.noHp);
          if (payload.status) sheet.getRange(i + 1, 4).setValue(payload.status);
          return respondJSON({ success: true, message: "Data anggota berhasil diperbarui" });
        }
      }
      return respondJSON({ success: false, message: "Anggota tidak ditemukan" });
    }

    // Aksi: Hapus Anggota
    if (action === "deleteAnggota") {
      const sheet = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
      deleteRowById(sheet, payload.id);
      return respondJSON({ success: true, message: "Anggota berhasil dihapus" });
    }

    // Aksi: Update Pengaturan (Termasuk Ganti Password)
    if (action === "updateSettings") {
      const sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
      const rows = sheet.getDataRange().getValues();
      const keysToUpdate = ["orgName", "iuranNominal", "periode", "adminPassword"];

      keysToUpdate.forEach(key => {
        if (payload[key] !== undefined && payload[key] !== "") {
          let updated = false;
          for (let i = 1; i < rows.length; i++) {
            if (rows[i][0] === key) {
              sheet.getRange(i + 1, 2).setValue(payload[key]);
              updated = true;
              break;
            }
          }
          if (!updated) {
            sheet.appendRow([key, payload[key]]);
          }
        }
      });

      return respondJSON({ success: true, message: "Pengaturan berhasil diperbarui" });
    }

    return respondJSON({ success: false, message: "Aksi tidak dikenali: " + action });
  } catch (error) {
    return respondJSON({ success: false, message: error.toString() });
  }
}

/**
 * Helper: Hapus baris berdasarkan ID di kolom pertama (index 0)
 */
function deleteRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/**
 * Helper: Konversi data Sheet menjadi Array of Objects
 */
function getSheetDataAsObjects(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  const results = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Abaikan baris kosong
    if (!row[0] && !row[1]) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      // Format tanggal jika objek Date
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
      }
      obj[headers[j]] = val;
    }
    results.push(obj);
  }
  return results;
}

/**
 * Helper: Output JSON dengan header CORS
 */
function respondJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
