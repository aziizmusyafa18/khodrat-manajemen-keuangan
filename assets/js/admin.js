/**
 * Logika Dashboard Admin Khodrat Bendahara
 * File: assets/js/admin.js
 */

// State Admin
let adminState = {
  data: null,
  selectedYear: new Date().getFullYear(),
  memberMap: {}
};

// Event saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initLoginEvents();
  initAdminEvents();
});

/**
 * Cek Sesi Login Admin
 */
function checkAuth() {
  const sessionToken = sessionStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_SESSION);
  const loginScreen = document.getElementById("loginScreen");
  const adminApp = document.getElementById("adminApp");

  if (sessionToken) {
    loginScreen.classList.add("d-none");
    adminApp.classList.remove("d-none");
    loadAdminData();
  } else {
    loginScreen.classList.remove("d-none");
    adminApp.classList.add("d-none");
    
    // Tampilkan notifikasi mode demo pada login jika URL belum disetel
    const hint = document.getElementById("loginHint");
    if (isDemoMode()) {
      hint.innerHTML = 'Mode Demo Aktif: Password default adalah <code>admin</code>';
    } else {
      hint.innerHTML = 'Masukkan password admin yang telah dikonfigurasi.';
    }
  }
}

/**
 * Event Listener Login Screen
 */
function initLoginEvents() {
  const formLogin = document.getElementById("formLogin");
  const passwordInput = document.getElementById("adminPassword");
  const togglePassBtn = document.getElementById("togglePasswordBtn");
  const loginError = document.getElementById("loginError");
  const submitBtn = document.getElementById("btnLoginSubmit");
  const btnText = document.getElementById("btnLoginText");
  const btnSpinner = document.getElementById("btnLoginSpinner");

  // Toggle tampilkan password
  togglePassBtn.addEventListener("click", () => {
    const isPassword = passwordInput.getAttribute("type") === "password";
    passwordInput.setAttribute("type", isPassword ? "text" : "password");
    togglePassBtn.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
  });

  // Submit Login
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.add("d-none");
    btnText.classList.add("d-none");
    btnSpinner.classList.remove("d-none");
    submitBtn.disabled = true;

    const password = passwordInput.value;

    try {
      const res = await ApiService.postAction("login", { password });
      if (res.success) {
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_SESSION, res.token || "admin_active");
        checkAuth();
      } else {
        loginError.textContent = res.message || "Password salah!";
        loginError.classList.remove("d-none");
      }
    } catch (err) {
      loginError.textContent = "Terjadi kegagalan koneksi: " + err.message;
      loginError.classList.remove("d-none");
    } finally {
      btnText.classList.remove("d-none");
      btnSpinner.classList.add("d-none");
      submitBtn.disabled = false;
    }
  });

  // Logout
  document.getElementById("btnLogout").addEventListener("click", () => {
    if (confirm("Apakah Anda yakin ingin keluar dari halaman admin?")) {
      sessionStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_SESSION);
      checkAuth();
    }
  });
}

/**
 * Muat seluruh data ke Dashboard Admin
 */
async function loadAdminData() {
  const refreshIcon = document.getElementById("adminRefreshIcon");
  if (refreshIcon) refreshIcon.classList.add("spin-animation");

  try {
    const res = await ApiService.getAllData();
    
    // Cek jika response error (success: false)
    if (!res.success) {
      throw new Error(res.message || "Gagal memuat data dari server");
    }
    
    adminState.data = res.data;

    // Tampilkan notifikasi jika demo mode
    const demoBanner = document.getElementById("demoNoticeBanner");
    if (res.isDemo || isDemoMode()) {
      demoBanner.classList.remove("d-none");
    } else {
      demoBanner.classList.add("d-none");
    }

    // Buat map anggota untuk kemudahan lookup
    adminState.memberMap = {};
    (adminState.data.anggota || []).forEach(a => {
      adminState.memberMap[a.id] = a;
    });

    // Setup filter tahun
    setupAdminTahunFilter();

    // Isi data form pengaturan
    populatePengaturanForm();

    // Render semua tampilan
    renderAdminAll();

  } catch (err) {
    console.error("Gagal memuat data admin:", err);
    alert(`❌ ${err.message}\n\nPeriksa:\n• Koneksi internet\n• URL API sudah benar\n• Google Apps Script deployment aktif\n• Akses diatur ke "Anyone"\n\nBuka Console Browser (F12) untuk detail error.`);
  } finally {
    if (refreshIcon) refreshIcon.classList.remove("spin-animation");
  }
}

/**
 * Inisialisasi Event Listener Admin
 */
function initAdminEvents() {
  // Tombol Refresh
  document.getElementById("btnAdminRefresh").addEventListener("click", () => {
    loadAdminData();
  });

  // Ganti Filter Tahun
  document.getElementById("adminFilterTahun").addEventListener("change", (e) => {
    adminState.selectedYear = parseInt(e.target.value);
    renderAdminAll();
  });

  // Search Riwayat Kas Masuk
  document.getElementById("searchRiwayatKasMasuk").addEventListener("input", () => {
    renderRiwayatKasMasukTable();
  });

  // Form Tambah Kas Masuk Manual
  document.getElementById("formTambahKasMasuk").addEventListener("submit", handleTambahKasMasuk);

  // Form Tambah Kas Keluar
  document.getElementById("formTambahKasKeluar").addEventListener("submit", handleTambahKasKeluar);

  // Form Tambah / Edit Anggota
  document.getElementById("formAnggota").addEventListener("submit", handleSimpanAnggota);

  // Form Pengaturan URL GAS
  document.getElementById("formApiUrl").addEventListener("submit", handleSaveGasUrl);
  document.getElementById("btnTestApi").addEventListener("click", handleTestApiUrl);

  // Form Pengaturan Kas
  document.getElementById("formPengaturanKas").addEventListener("submit", handleSavePengaturanKas);

  // Form Ganti Password Admin
  document.getElementById("formGantiPassword").addEventListener("submit", handleGantiPassword);

  // Reset Data Demo
  document.getElementById("btnResetDemo").addEventListener("click", handleResetDemo);
}

/**
 * Setup Dropdown Tahun
 */
function setupAdminTahunFilter() {
  const filterTahun = document.getElementById("adminFilterTahun");
  const currentYear = new Date().getFullYear();
  const years = new Set([currentYear]);

  if (adminState.data.kasMasuk) {
    adminState.data.kasMasuk.forEach(km => {
      if (km.tahun) years.add(parseInt(km.tahun));
    });
  }
  if (adminState.data.kasKeluar) {
    adminState.data.kasKeluar.forEach(kk => {
      if (kk.tanggal) {
        const y = new Date(kk.tanggal).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
  }

  const sortedYears = Array.from(years).sort((a, b) => b - a);
  filterTahun.innerHTML = "";
  sortedYears.forEach(year => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = `Tahun ${year}`;
    if (year === adminState.selectedYear) opt.selected = true;
    filterTahun.appendChild(opt);
  });
}

/**
 * Render Semua Tampilan Admin
 */
function renderAdminAll() {
  renderOverviewStats();
  renderAdminMatrixKas();
  renderRiwayatKasMasukTable();
  renderAdminPengeluaranTable();
  renderAdminAnggotaTable();
}

/**
 * 1. Render Tab Overview Stats
 */
function renderOverviewStats() {
  const { kasMasuk, kasKeluar } = adminState.data;
  const year = adminState.selectedYear;

  const kmTahunIni = (kasMasuk || []).filter(km => parseInt(km.tahun) === year);
  const totalMasuk = kmTahunIni.reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);

  const kkTahunIni = (kasKeluar || []).filter(kk => new Date(kk.tanggal).getFullYear() === year);
  const totalKeluar = kkTahunIni.reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);

  const totalMasukSemua = (kasMasuk || []).reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);
  const totalKeluarSemua = (kasKeluar || []).reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);
  const saldoAktual = totalMasukSemua - totalKeluarSemua;

  document.getElementById("ovStatMasuk").textContent = formatRupiah(totalMasuk);
  document.getElementById("ovSubMasuk").textContent = `Tahun ${year} (${kmTahunIni.length} transaksi)`;

  document.getElementById("ovStatKeluar").textContent = formatRupiah(totalKeluar);
  document.getElementById("ovSubKeluar").textContent = `Tahun ${year} (${kkTahunIni.length} pengeluaran)`;

  document.getElementById("ovStatSaldo").textContent = formatRupiah(saldoAktual);
}

/**
 * 2. Render Matriks Kas Masuk Admin (Dengan Tombol Toggle Cepat)
 */
function renderAdminMatrixKas() {
  const tbody = document.getElementById("adminTableMatrixBody");
  const year = adminState.selectedYear;
  const anggotaList = (adminState.data.anggota || []).filter(a => a.status !== "Nonaktif");
  const kasMasukList = adminState.data.kasMasuk || [];
  const defaultNominal = (adminState.data.settings && adminState.data.settings.iuranNominal) || CONFIG.DEFAULT_IURAN_PER_BULAN;

  // Petakan kas masuk
  const mapKas = {};
  kasMasukList.forEach(km => {
    if (parseInt(km.tahun) === year) {
      if (!mapKas[km.anggotaId]) mapKas[km.anggotaId] = {};
      mapKas[km.anggotaId][parseInt(km.bulan)] = km;
    }
  });

  tbody.innerHTML = "";

  anggotaList.forEach(ang => {
    const tr = document.createElement("tr");
    let rowHtml = `<td><strong>${escapeHtml(ang.nama)}</strong></td>`;
    let totalBayarAnggota = 0;

    for (let bulan = 1; bulan <= 12; bulan++) {
      const record = mapKas[ang.id] ? mapKas[ang.id][bulan] : null;

      if (record) {
        const nom = parseInt(record.nominal) || 0;
        totalBayarAnggota += nom;
        rowHtml += `
          <td>
            <button class="btn-toggle-kas paid" 
              data-anggota-id="${ang.id}" 
              data-anggota-nama="${escapeHtml(ang.nama)}" 
              data-bulan="${bulan}" 
              data-tahun="${year}" 
              data-nominal="${nom}" 
              title="Lunas (${formatRupiah(nom)}). Klik untuk membatalkan">
              <i class="bi bi-check-lg"></i>
            </button>
          </td>
        `;
      } else {
        rowHtml += `
          <td>
            <button class="btn-toggle-kas unpaid" 
              data-anggota-id="${ang.id}" 
              data-anggota-nama="${escapeHtml(ang.nama)}" 
              data-bulan="${bulan}" 
              data-tahun="${year}" 
              data-nominal="${defaultNominal}" 
              title="Belum Bayar. Klik untuk menandai lunas">
              <i class="bi bi-dash"></i>
            </button>
          </td>
        `;
      }
    }

    rowHtml += `<td class="fw-bold text-success text-end">${formatRupiah(totalBayarAnggota)}</td>`;
    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });

  // Pasang listener pada tombol checklist toggle
  tbody.querySelectorAll(".btn-toggle-kas").forEach(btn => {
    btn.addEventListener("click", async () => {
      const anggotaId = btn.getAttribute("data-anggota-id");
      const anggotaNama = btn.getAttribute("data-anggota-nama");
      const bulan = parseInt(btn.getAttribute("data-bulan"));
      const tahun = parseInt(btn.getAttribute("data-tahun"));
      const nominal = parseInt(btn.getAttribute("data-nominal"));

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" style="width: 10px; height: 10px;"></span>';

      try {
        const res = await ApiService.postAction("toggleKasMasuk", {
          anggotaId,
          anggotaNama,
          bulan,
          tahun,
          nominal
        });

        if (res.success) {
          // OPTIMASI: Hanya reload data kas masuk, tidak perlu reload semua
          const dataRes = await ApiService.getAllData();
          if (dataRes.success) {
            adminState.data.kasMasuk = dataRes.data.kasMasuk;
            
            // Re-render hanya bagian yang berubah
            renderOverviewStats();
            renderAdminMatrixKas();
            renderRiwayatKasMasukTable();
          } else {
            throw new Error(dataRes.message || "Gagal memuat data terbaru");
          }
        } else {
          alert("Gagal mengubah status: " + res.message);
          btn.disabled = false;
        }
      } catch (err) {
        alert("Terjadi kesalahan: " + err.message);
        btn.disabled = false;
      }
    });
  });
}

/**
 * 3. Render Tabel Riwayat Transaksi Kas Masuk
 */
function renderRiwayatKasMasukTable() {
  const tbody = document.getElementById("tableRiwayatKasMasukBody");
  const query = (document.getElementById("searchRiwayatKasMasuk").value || "").toLowerCase().trim();
  const year = adminState.selectedYear;
  const kasMasukList = adminState.data.kasMasuk || [];

  const filtered = kasMasukList.filter(km => {
    const matchYear = parseInt(km.tahun) === year;
    const matchQuery = !query || (km.anggotaNama && km.anggotaNama.toLowerCase().includes(query));
    return matchYear && matchQuery;
  });

  // Urutkan tanggal terbaru
  filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Belum ada riwayat transaksi kas masuk untuk tahun ${year}.</td></tr>`;
    return;
  }

  filtered.forEach(km => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="ps-3">${formatTanggalIndo(km.tanggal)}</td>
      <td><strong>${escapeHtml(km.anggotaNama)}</strong></td>
      <td><span class="badge bg-light text-dark border">${NAMA_BULAN[parseInt(km.bulan) - 1]} ${km.tahun}</span></td>
      <td class="text-end fw-bold text-success">${formatRupiah(km.nominal)}</td>
      <td><span class="badge bg-secondary bg-opacity-10 text-secondary">${km.metode || "Tunai"}</span></td>
      <td><small class="text-muted">${escapeHtml(km.keterangan || "-")}</small></td>
      <td class="text-center">
        <button class="btn btn-outline-danger btn-sm py-0 px-2 btn-hapus-km" data-id="${km.id}" title="Hapus Transaksi">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Listener Hapus Kas Masuk
  tbody.querySelectorAll(".btn-hapus-km").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Apakah Anda yakin ingin menghapus catatan kas masuk ini?")) {
        btn.disabled = true;
        const res = await ApiService.postAction("deleteKasMasuk", { id });
        if (res.success) {
          // OPTIMASI: Hanya reload data kas masuk
          const dataRes = await ApiService.getAllData();
          if (dataRes.success) {
            adminState.data.kasMasuk = dataRes.data.kasMasuk;
            renderOverviewStats();
            renderAdminMatrixKas();
            renderRiwayatKasMasukTable();
          }
        } else {
          alert("Gagal menghapus: " + res.message);
          btn.disabled = false;
        }
      }
    });
  });
}

/**
 * 4. Render Tabel Pengeluaran Admin
 */
function renderAdminPengeluaranTable() {
  const tbody = document.getElementById("adminTablePengeluaranBody");
  const emptyState = document.getElementById("adminEmptyPengeluaran");
  const year = adminState.selectedYear;
  const kasKeluarList = adminState.data.kasKeluar || [];

  const filtered = kasKeluarList.filter(kk => new Date(kk.tanggal).getFullYear() === year);
  filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  filtered.forEach(kk => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="ps-3">${formatTanggalIndo(kk.tanggal)}</td>
      <td><span class="badge bg-light text-dark border">${escapeHtml(kk.kategori || "Umum")}</span></td>
      <td>
        <div class="fw-bold">${escapeHtml(kk.keperluan)}</div>
        ${kk.keterangan ? `<small class="text-muted d-block">${escapeHtml(kk.keterangan)}</small>` : ""}
      </td>
      <td class="text-end fw-bold text-danger">${formatRupiah(kk.nominal)}</td>
      <td>${escapeHtml(kk.pj || "-")}</td>
      <td class="text-center">
        ${kk.buktiUrl && kk.buktiUrl.trim() !== "" ? `
          <a href="${kk.buktiUrl}" target="_blank" class="btn btn-outline-primary btn-sm py-0 px-2" title="Buka Bukti Nota">
            <i class="bi bi-box-arrow-up-right"></i>
          </a>
        ` : `<span class="text-muted fs-8">-</span>`}
      </td>
      <td class="text-center">
        <button class="btn btn-outline-danger btn-sm py-0 px-2 btn-hapus-kk" data-id="${kk.id}" title="Hapus Pengeluaran">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Pasang listener hapus pengeluaran
  tbody.querySelectorAll(".btn-hapus-kk").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?")) {
        btn.disabled = true;
        const res = await ApiService.postAction("deleteKasKeluar", { id });
        if (res.success) {
          // OPTIMASI: Hanya reload data kas keluar
          const dataRes = await ApiService.getAllData();
          if (dataRes.success) {
            adminState.data.kasKeluar = dataRes.data.kasKeluar;
            renderOverviewStats();
            renderAdminPengeluaranTable();
          }
        } else {
          alert("Gagal menghapus: " + res.message);
          btn.disabled = false;
        }
      }
    });
  });
}

/**
 * 5. Render Tabel Anggota
 */
function renderAdminAnggotaTable() {
  const tbody = document.getElementById("adminTableAnggotaBody");
  const anggotaList = adminState.data.anggota || [];

  tbody.innerHTML = "";

  if (anggotaList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Belum ada data anggota terdaftar.</td></tr>`;
    return;
  }

  anggotaList.forEach(ang => {
    const tr = document.createElement("tr");
    const isAktif = ang.status !== "Nonaktif";
    // Pastikan noHp adalah string sebelum menggunakan replace
    const noHpStr = ang.noHp ? String(ang.noHp) : "";
    const waLink = noHpStr ? `https://wa.me/${noHpStr.replace(/^0/, "62").replace(/\D/g, "")}` : null;

    tr.innerHTML = `
      <td class="ps-3"><span class="badge bg-light text-dark border">${ang.id}</span></td>
      <td><strong>${escapeHtml(ang.nama)}</strong></td>
      <td>
        ${noHpStr ? `
          <a href="${waLink}" target="_blank" class="text-decoration-none text-success">
            <i class="bi bi-whatsapp me-1"></i> ${noHpStr}
          </a>
        ` : `<span class="text-muted fs-8">-</span>`}
      </td>
      <td>
        <span class="badge ${isAktif ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${isAktif ? 'text-success' : 'text-secondary'} border">
          ${isAktif ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td class="text-center">
        <button class="btn btn-outline-secondary btn-sm py-0 px-2 me-1 btn-edit-ang" data-id="${ang.id}" title="Edit Data">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm py-0 px-2 btn-hapus-ang" data-id="${ang.id}" title="Hapus Anggota">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Listener Edit Anggota
  tbody.querySelectorAll(".btn-edit-ang").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const member = adminState.memberMap[id];
      if (member) {
        openModalEditAnggota(member);
      }
    });
  });

  // Listener Hapus Anggota
  tbody.querySelectorAll(".btn-hapus-ang").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Apakah Anda yakin ingin menghapus anggota ini?")) {
        btn.disabled = true;
        const res = await ApiService.postAction("deleteAnggota", { id });
        if (res.success) {
          // OPTIMASI: Hanya reload data anggota
          const dataRes = await ApiService.getAllData();
          if (dataRes.success) {
            adminState.data.anggota = dataRes.data.anggota;
            
            // Update member map
            adminState.memberMap = {};
            (adminState.data.anggota || []).forEach(a => {
              adminState.memberMap[a.id] = a;
            });
            
            renderAdminAnggotaTable();
          }
        } else {
          alert("Gagal menghapus: " + res.message);
          btn.disabled = false;
        }
      }
    });
  });
}

/**
 * 6. Penanganan Modal & Forms
 */

// Modal Tambah Kas Masuk Manual
window.openModalTambahKasMasuk = function() {
  const selectAnggota = document.getElementById("kmInputAnggota");
  const defaultNominal = (adminState.data.settings && adminState.data.settings.iuranNominal) || CONFIG.DEFAULT_IURAN_PER_BULAN;

  selectAnggota.innerHTML = "";
  (adminState.data.anggota || []).forEach(ang => {
    const opt = document.createElement("option");
    opt.value = ang.id;
    opt.textContent = `${ang.nama} (${ang.id})`;
    selectAnggota.appendChild(opt);
  });

  const now = new Date();
  document.getElementById("kmInputBulan").value = now.getMonth() + 1;
  document.getElementById("kmInputTahun").value = adminState.selectedYear || now.getFullYear();
  document.getElementById("kmInputNominal").value = defaultNominal;
  document.getElementById("kmInputTanggal").value = now.toISOString().split("T")[0];
  document.getElementById("kmInputKeterangan").value = "";

  const modal = new bootstrap.Modal(document.getElementById("modalTambahKasMasuk"));
  modal.show();
};

async function handleTambahKasMasuk(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitKasMasuk");
  btn.disabled = true;

  const anggotaId = document.getElementById("kmInputAnggota").value;
  const anggota = adminState.memberMap[anggotaId];
  const payload = {
    anggotaId,
    anggotaNama: anggota ? anggota.nama : "",
    bulan: document.getElementById("kmInputBulan").value,
    tahun: document.getElementById("kmInputTahun").value,
    nominal: document.getElementById("kmInputNominal").value,
    metode: document.getElementById("kmInputMetode").value,
    tanggal: document.getElementById("kmInputTanggal").value,
    keterangan: document.getElementById("kmInputKeterangan").value
  };

  try {
    const res = await ApiService.postAction("addKasMasuk", payload);
    if (res.success) {
      bootstrap.Modal.getInstance(document.getElementById("modalTambahKasMasuk")).hide();
      
      // OPTIMASI: Hanya reload data kas masuk
      const dataRes = await ApiService.getAllData();
      if (dataRes.success) {
        adminState.data.kasMasuk = dataRes.data.kasMasuk;
        
        // Re-render yang relevan
        renderOverviewStats();
        renderAdminMatrixKas();
        renderRiwayatKasMasukTable();
      } else {
        throw new Error(dataRes.message || "Gagal memuat data terbaru");
      }
    } else {
      alert("Gagal menyimpan: " + res.message);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

// Modal Tambah Kas Keluar
window.openModalTambahKasKeluar = function() {
  document.getElementById("formTambahKasKeluar").reset();
  document.getElementById("kkInputTanggal").value = new Date().toISOString().split("T")[0];

  const modal = new bootstrap.Modal(document.getElementById("modalTambahKasKeluar"));
  modal.show();
};

async function handleTambahKasKeluar(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitKasKeluar");
  btn.disabled = true;

  const payload = {
    keperluan: document.getElementById("kkInputKeperluan").value,
    kategori: document.getElementById("kkInputKategori").value,
    nominal: document.getElementById("kkInputNominal").value,
    tanggal: document.getElementById("kkInputTanggal").value,
    pj: document.getElementById("kkInputPj").value,
    buktiUrl: document.getElementById("kkInputBuktiUrl").value,
    keterangan: document.getElementById("kkInputKeterangan").value
  };

  try {
    const res = await ApiService.postAction("addKasKeluar", payload);
    if (res.success) {
      bootstrap.Modal.getInstance(document.getElementById("modalTambahKasKeluar")).hide();
      
      // OPTIMASI: Hanya reload data kas keluar
      const dataRes = await ApiService.getAllData();
      if (dataRes.success) {
        adminState.data.kasKeluar = dataRes.data.kasKeluar;
        
        // Re-render yang relevan
        renderOverviewStats();
        renderAdminPengeluaranTable();
      } else {
        throw new Error(dataRes.message || "Gagal memuat data terbaru");
      }
    } else {
      alert("Gagal menyimpan pengeluaran: " + res.message);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

// Modal Tambah / Edit Anggota
window.openModalTambahAnggota = function() {
  document.getElementById("formAnggota").reset();
  document.getElementById("anggotaEditId").value = "";
  document.getElementById("modalAnggotaTitle").textContent = "Tambah Anggota Baru";
  const modal = new bootstrap.Modal(document.getElementById("modalAnggota"));
  modal.show();
};

function openModalEditAnggota(member) {
  document.getElementById("anggotaEditId").value = member.id;
  document.getElementById("anggotaInputNama").value = member.nama;
  document.getElementById("anggotaInputNoHp").value = member.noHp || "";
  document.getElementById("anggotaInputStatus").value = member.status || "Aktif";
  document.getElementById("modalAnggotaTitle").textContent = `Edit Anggota (${member.id})`;
  const modal = new bootstrap.Modal(document.getElementById("modalAnggota"));
  modal.show();
}

async function handleSimpanAnggota(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitAnggota");
  btn.disabled = true;

  const editId = document.getElementById("anggotaEditId").value;
  const isEdit = editId && editId.trim() !== "";

  const payload = {
    id: editId,
    nama: document.getElementById("anggotaInputNama").value,
    noHp: document.getElementById("anggotaInputNoHp").value,
    status: document.getElementById("anggotaInputStatus").value
  };

  try {
    const action = isEdit ? "updateAnggota" : "addAnggota";
    const res = await ApiService.postAction(action, payload);
    if (res.success) {
      bootstrap.Modal.getInstance(document.getElementById("modalAnggota")).hide();
      
      // OPTIMASI: Hanya reload data anggota, tidak perlu reload semua
      const dataRes = await ApiService.getAllData();
      if (dataRes.success) {
        adminState.data.anggota = dataRes.data.anggota;
        
        // Update member map
        adminState.memberMap = {};
        (adminState.data.anggota || []).forEach(a => {
          adminState.memberMap[a.id] = a;
        });
        
        // Re-render hanya tabel anggota
        renderAdminAnggotaTable();
      } else {
        throw new Error(dataRes.message || "Gagal memuat data terbaru");
      }
    } else {
      alert("Gagal menyimpan: " + res.message);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

/**
 * 7. Tab Pengaturan & Integrasi API
 */
function populatePengaturanForm() {
  document.getElementById("inputGasUrl").value = getApiUrl();
  const settings = adminState.data.settings || {};
  document.getElementById("setOrgName").value = settings.orgName || "";
  document.getElementById("setIuranNominal").value = settings.iuranNominal || CONFIG.DEFAULT_IURAN_PER_BULAN;
}

function handleSaveGasUrl(e) {
  e.preventDefault();
  const url = document.getElementById("inputGasUrl").value;
  saveApiUrl(url);
  alert("URL Google Apps Script berhasil disimpan! Aplikasi akan memuat ulang data.");
  loadAdminData();
}

async function handleTestApiUrl() {
  const url = document.getElementById("inputGasUrl").value.trim();
  if (!url) {
    alert("Silakan masukkan URL Google Apps Script terlebih dahulu.");
    return;
  }
  const btn = document.getElementById("btnTestApi");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menguji...';

  try {
    const testRes = await fetch(`${url}?action=getAllData`);
    if (testRes.ok) {
      const data = await testRes.json();
      if (data.success) {
        alert("Sukses! Berhasil terhubung ke Google Spreadsheet Database.");
      } else {
        alert("Terhubung ke URL, namun respons database: " + JSON.stringify(data));
      }
    } else {
      alert("Gagal terhubung! Status HTTP: " + testRes.status);
    }
  } catch (err) {
    alert("Gagal koneksi: Pastikan Deployment Web App di Apps Script disetel ke 'Anyone' (Siapa saja). Detail: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Uji Koneksi';
  }
}

async function handleSavePengaturanKas(e) {
  e.preventDefault();
  const orgName = document.getElementById("setOrgName").value;
  const iuranNominal = parseInt(document.getElementById("setIuranNominal").value);

  const res = await ApiService.postAction("updateSettings", { orgName, iuranNominal });
  if (res.success) {
    alert("Pengaturan kas berhasil disimpan!");
    loadAdminData();
  } else {
    alert("Gagal menyimpan: " + res.message);
  }
}

async function handleGantiPassword(e) {
  e.preventDefault();
  const newPass = document.getElementById("setNewPassword").value;
  if (!confirm("Apakah Anda yakin ingin mengganti password admin?")) return;

  const res = await ApiService.postAction("updateSettings", { adminPassword: newPass });
  if (res.success) {
    alert("Password admin berhasil diperbarui! Silakan gunakan password baru pada login berikutnya.");
    document.getElementById("setNewPassword").value = "";
  } else {
    alert("Gagal mengubah password: " + res.message);
  }
}

async function handleResetDemo() {
  if (confirm("Apakah Anda yakin ingin mengembalikan data simulasi demo ke keadaan awal?")) {
    await ApiService.postAction("resetDemoData");
    alert("Data demo berhasil di-reset!");
    loadAdminData();
  }
}

/**
 * Helper Escape HTML mencegah XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
