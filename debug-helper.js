/**
 * HELPER DEBUGGING - COPY PASTE KE CONSOLE BROWSER (F12)
 * 
 * Gunakan fungsi ini untuk cek URL API dan troubleshoot error 404
 */

// 1. Cek URL yang tersimpan
function checkApiUrl() {
  const url = localStorage.getItem('KhodratBendahara_ApiUrl');
  
  console.log('=== CEK URL API ===');
  console.log('URL tersimpan:', url || '(KOSONG - Mode Demo)');
  
  if (!url || url.trim() === '') {
    console.warn('⚠️ URL KOSONG - Aplikasi dalam Mode Demo');
    console.log('Solusi: Isi URL di tab Pengaturan > Web App URL');
    return;
  }
  
  // Validasi format URL
  const isValidFormat = url.startsWith('https://script.google.com/macros/s/');
  const hasExecEnding = url.endsWith('/exec');
  const hasDevEnding = url.endsWith('/dev');
  
  console.log('\n=== VALIDASI URL ===');
  console.log('✓ Format benar:', isValidFormat ? '✅' : '❌');
  console.log('✓ Berakhiran /exec:', hasExecEnding ? '✅' : '❌');
  console.log('✗ Berakhiran /dev:', hasDevEnding ? '❌ SALAH!' : '✅');
  console.log('✓ Panjang minimal:', url.length > 50 ? '✅' : '❌');
  
  if (!isValidFormat) {
    console.error('❌ Format URL salah!');
    console.log('URL harus dimulai dengan: https://script.google.com/macros/s/');
  }
  
  if (hasDevEnding) {
    console.error('❌ URL berakhiran /dev (SALAH!)');
    console.log('Ganti /dev dengan /exec di akhir URL');
    console.log('URL yang benar:', url.replace('/dev', '/exec'));
  }
  
  if (!hasExecEnding && !hasDevEnding) {
    console.error('❌ URL tidak berakhiran /exec atau /dev');
    console.log('Pastikan URL berakhiran /exec');
  }
  
  console.log('\n=== TEST KONEKSI ===');
  console.log('Buka URL ini di browser baru untuk test:');
  console.log(url + '?action=getAllData');
  console.log('\nJika berhasil, akan muncul JSON data.');
  console.log('Jika error 404, berarti deployment tidak aktif.');
}

// 2. Reset URL (hapus URL tersimpan, kembali ke Mode Demo)
function resetApiUrl() {
  localStorage.removeItem('KhodratBendahara_ApiUrl');
  console.log('✅ URL API dihapus. Aplikasi akan kembali ke Mode Demo.');
  console.log('Refresh halaman untuk melihat perubahan.');
}

// 3. Set URL baru (untuk debugging cepat)
function setApiUrl(newUrl) {
  if (!newUrl) {
    console.error('❌ URL tidak boleh kosong!');
    console.log('Contoh: setApiUrl("https://script.google.com/macros/s/AKfycbx.../exec")');
    return;
  }
  
  localStorage.setItem('KhodratBendahara_ApiUrl', newUrl.trim());
  console.log('✅ URL API tersimpan:', newUrl.trim());
  console.log('Refresh halaman untuk melihat perubahan.');
}

// 4. Test koneksi ke URL
async function testConnection() {
  const url = localStorage.getItem('KhodratBendahara_ApiUrl');
  
  if (!url || url.trim() === '') {
    console.error('❌ URL kosong! Isi URL terlebih dahulu.');
    return;
  }
  
  console.log('🔄 Testing koneksi ke:', url);
  console.log('Tunggu...');
  
  try {
    const response = await fetch(url + '?action=getAllData', {
      method: 'GET',
      mode: 'cors'
    });
    
    console.log('Response status:', response.status);
    
    if (response.status === 404) {
      console.error('❌ ERROR 404 - URL tidak ditemukan!');
      console.log('\nPenyebab:');
      console.log('1. Deployment Google Apps Script belum aktif');
      console.log('2. URL salah atau Script ID salah');
      console.log('3. Apps Script dihapus atau disabled');
      console.log('\nSolusi: Deploy ulang Google Apps Script!');
      console.log('Lihat panduan: FIX-ERROR-404.md');
      return;
    }
    
    if (response.status === 403) {
      console.error('❌ ERROR 403 - Akses ditolak!');
      console.log('\nPenyebab:');
      console.log('Deployment tidak diatur ke "Anyone"');
      console.log('\nSolusi:');
      console.log('1. Buka Apps Script > Deploy > Manage deployments');
      console.log('2. Klik ⚙️ pada deployment aktif');
      console.log('3. Ubah "Who has access" ke "Anyone"');
      console.log('4. Klik Deploy');
      return;
    }
    
    if (!response.ok) {
      console.error('❌ ERROR', response.status, response.statusText);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }
    
    const data = await response.json();
    console.log('✅ KONEKSI BERHASIL!');
    console.log('Response data:', data);
    
    if (data.success && data.data) {
      console.log('\n📊 Data Summary:');
      console.log('- Anggota:', data.data.anggota?.length || 0);
      console.log('- Kas Masuk:', data.data.kasMasuk?.length || 0);
      console.log('- Kas Keluar:', data.data.kasKeluar?.length || 0);
      console.log('\n✅ Database terhubung dengan baik!');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\nPenyebab mungkin:');
    console.log('1. Koneksi internet bermasalah');
    console.log('2. CORS error (cek deployment setting)');
    console.log('3. URL salah format');
    console.log('\nError details:', error);
  }
}

// 5. Lihat semua data localStorage
function checkAllStorage() {
  console.log('=== SEMUA DATA LOCALSTORAGE ===');
  console.log('API URL:', localStorage.getItem('KhodratBendahara_ApiUrl') || '(kosong)');
  console.log('Demo Data:', localStorage.getItem('KhodratBendahara_DemoData') ? 'Ada' : '(kosong)');
  console.log('Admin Token:', localStorage.getItem('KhodratBendahara_AdminToken') ? 'Ada' : '(kosong)');
}

// 6. Clear semua data (reset total)
function clearAllData() {
  if (!confirm('Yakin ingin menghapus SEMUA data termasuk URL API?')) {
    console.log('Dibatalkan.');
    return;
  }
  
  localStorage.removeItem('KhodratBendahara_ApiUrl');
  localStorage.removeItem('KhodratBendahara_DemoData');
  localStorage.removeItem('KhodratBendahara_AdminToken');
  
  console.log('✅ Semua data dihapus!');
  console.log('Refresh halaman untuk kembali ke Mode Demo fresh.');
}

// Tampilkan helper
console.log('%c🔧 HELPER DEBUGGING TERSEDIA', 'color: #16a34a; font-size: 16px; font-weight: bold;');
console.log('\n📝 Fungsi yang tersedia:\n');
console.log('1. checkApiUrl()       - Cek URL yang tersimpan & validasi format');
console.log('2. testConnection()    - Test koneksi ke Google Apps Script');
console.log('3. setApiUrl(url)      - Set URL baru');
console.log('4. resetApiUrl()       - Hapus URL (kembali ke Mode Demo)');
console.log('5. checkAllStorage()   - Lihat semua data localStorage');
console.log('6. clearAllData()      - Hapus semua data (reset total)');
console.log('\n💡 Mulai dengan: checkApiUrl()');
console.log('💡 Untuk test: testConnection()\n');
