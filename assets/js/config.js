/**
 * Konfigurasi Aplikasi Khodrat Bendahara
 * Masukkan URL Google Apps Script Web App Anda setelah melakukan deploy.
 */
const CONFIG = {
  APP_NAME: "Khodrat Bendahara",
  ORGANIZATION_NAME: "Kas Khodrat",
  PERIODE_DEFAULT: new Date().getFullYear(),
  DEFAULT_IURAN_PER_BULAN: 20000,
  
  // URL Web App dari Google Apps Script (Kosongkan atau biarkan default untuk mengaktifkan Demo Mode)
  // Contoh: "https://script.google.com/macros/s/AKfycbx.../exec"
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbzM-PSHcRAM0vSNQgNg2vhEh6K1wsuhLwZ8Otr7DCs6I0bkq0GnB3ETUXU5qjYGRSAy/exec",
  
  // Key penyimpanan lokal browser
  STORAGE_KEYS: {
    API_URL: "khodrat_gas_api_url",
    ADMIN_SESSION: "khodrat_admin_session",
    DEMO_DATA: "khodrat_demo_data"
  }
};

// Ambil API URL dari local storage jika sudah disetel lewat halaman pengaturan
function getApiUrl() {
  const customUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.API_URL);
  return customUrl && customUrl.trim() !== "" ? customUrl.trim() : CONFIG.GAS_API_URL;
}

// Simpan API URL
function saveApiUrl(url) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.API_URL, url.trim());
}

// Cek apakah sedang dalam Mode Demo (tanpa Google Sheets aktif)
function isDemoMode() {
  const url = getApiUrl();
  return !url || url.trim() === "";
}
