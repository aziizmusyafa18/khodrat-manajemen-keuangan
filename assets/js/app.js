/**
 * Logika Landing Page Transparansi Kas
 * File: assets/js/app.js
 */

// Global State Landing Page
let appState = {
  data: null,
  selectedYear: new Date().getFullYear(),
  chartArusKas: null,
  chartKategori: null
};

// Event saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initEventListeners();
});

/**
 * Inisialisasi awal aplikasi
 */
async function initApp() {
  // Set tahun di footer
  document.getElementById("footerYear").textContent = new Date().getFullYear();

  // Muat data dari API / Local Demo
  await loadData();
}

/**
 * Muat data dari Backend / Demo
 */
async function loadData() {
  const loading = document.getElementById("loadingIndicator");
  const dashboard = document.getElementById("mainDashboard");
  const refreshIcon = document.getElementById("refreshIcon");

  loading.classList.remove("d-none");
  dashboard.classList.add("d-none");
  if (refreshIcon) refreshIcon.classList.add("spin-animation");

  try {
    const res = await ApiService.getAllData();
    
    // Cek jika response error (success: false)
    if (!res.success) {
      throw new Error(res.message || "Gagal memuat data dari server");
    }
    
    appState.data = res.data;

    // Tampilkan notifikasi mode demo jika aktif
    const demoBanner = document.getElementById("demoNoticeBanner");
    if (res.isDemo || isDemoMode()) {
      demoBanner.classList.remove("d-none");
    } else {
      demoBanner.classList.add("d-none");
    }

    // Update profil / info organisasi di UI
    const settings = appState.data.settings || {};
    if (settings.orgName) {
      document.getElementById("navOrgName").textContent = settings.orgName;
      document.getElementById("heroTitle").textContent = `Portal Transparansi Kas ${settings.orgName}`;
    }
    const iuranNominal = settings.iuranNominal || CONFIG.DEFAULT_IURAN_PER_BULAN;
    document.getElementById("labelNominalIuran").textContent = formatRupiah(iuranNominal);

    // Setup opsi dropdown tahun
    setupTahunFilter();

    // Render seluruh komponen
    renderAll();

    // Waktu update terakhir
    const now = new Date();
    document.getElementById("lastUpdated").textContent = now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) + " WIB";

  } catch (err) {
    console.error("Gagal memuat data:", err);
    alert(`❌ ${err.message}\n\nPeriksa koneksi internet atau konfigurasi Google Apps Script.`);
  } finally {
    loading.classList.add("d-none");
    dashboard.classList.remove("d-none");
    if (refreshIcon) refreshIcon.classList.remove("spin-animation");
  }
}

/**
 * Event Listeners untuk interaksi user
 */
function initEventListeners() {
  // Ganti Filter Tahun
  const filterTahun = document.getElementById("filterTahun");
  filterTahun.addEventListener("change", (e) => {
    appState.selectedYear = parseInt(e.target.value);
    document.getElementById("labelTahunKas").textContent = appState.selectedYear;
    renderAll();
  });

  // Tombol Refresh
  const btnRefresh = document.getElementById("btnRefresh");
  btnRefresh.addEventListener("click", () => {
    loadData();
  });

  // Pencarian Pengeluaran
  const searchPengeluaran = document.getElementById("searchPengeluaran");
  searchPengeluaran.addEventListener("input", () => {
    renderPengeluaranTable();
  });

  // Filter Kategori Pengeluaran
  const filterKategori = document.getElementById("filterKategoriPengeluaran");
  filterKategori.addEventListener("change", () => {
    renderPengeluaranTable();
  });

  // Pencarian Anggota di Matriks
  const searchAnggota = document.getElementById("searchAnggota");
  searchAnggota.addEventListener("input", () => {
    renderMatrixKasTable();
  });
}

/**
 * Setup pilihan Tahun pada filter dropdown
 */
function setupTahunFilter() {
  const filterTahun = document.getElementById("filterTahun");
  const currentYear = new Date().getFullYear();
  const years = new Set([currentYear]);

  // Ambil tahun-tahun yang ada di data kas masuk & keluar
  if (appState.data.kasMasuk) {
    appState.data.kasMasuk.forEach(km => {
      if (km.tahun) years.add(parseInt(km.tahun));
    });
  }
  if (appState.data.kasKeluar) {
    appState.data.kasKeluar.forEach(kk => {
      if (kk.tanggal) {
        const y = new Date(kk.tanggal).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
  }

  // Susun dropdown
  const sortedYears = Array.from(years).sort((a, b) => b - a);
  filterTahun.innerHTML = "";
  sortedYears.forEach(year => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = `Tahun ${year}`;
    if (year === appState.selectedYear) opt.selected = true;
    filterTahun.appendChild(opt);
  });

  document.getElementById("labelTahunKas").textContent = appState.selectedYear;
}

/**
 * Render seluruh halaman
 */
function renderAll() {
  renderSummaryCards();
  populateKategoriFilter();
  renderPengeluaranTable();
  renderMatrixKasTable();
  renderCharts();
}

/**
 * 1. Render Kartu Ringkasan (Pemasukan, Pengeluaran, Saldo Kas)
 */
function renderSummaryCards() {
  const { kasMasuk, kasKeluar } = appState.data;
  const year = appState.selectedYear;

  // Kas Masuk Tahun ini
  const kmTahunIni = (kasMasuk || []).filter(km => parseInt(km.tahun) === year);
  const totalMasukTahun = kmTahunIni.reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);

  // Kas Keluar Tahun ini
  const kkTahunIni = (kasKeluar || []).filter(kk => {
    const y = new Date(kk.tanggal).getFullYear();
    return y === year;
  });
  const totalKeluarTahun = kkTahunIni.reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);

  // Total Kas Keseluruhan Akumulasi (Saldo Aktual Kas)
  const totalMasukSemua = (kasMasuk || []).reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);
  const totalKeluarSemua = (kasKeluar || []).reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);
  const saldoAktual = totalMasukSemua - totalKeluarSemua;

  // Render ke DOM
  document.getElementById("statKasMasuk").textContent = formatRupiah(totalMasukTahun);
  document.getElementById("subKasMasuk").textContent = `Tahun ${year} (${kmTahunIni.length} transaksi)`;

  document.getElementById("statKasKeluar").textContent = formatRupiah(totalKeluarTahun);
  document.getElementById("subKasKeluar").textContent = `Tahun ${year} (${kkTahunIni.length} kegiatan)`;

  document.getElementById("statSaldoKas").textContent = formatRupiah(saldoAktual);
  document.getElementById("subSaldoKas").textContent = `Akumulasi s.d ${year}`;
}

/**
 * Isi dropdown pilihan kategori pengeluaran
 */
function populateKategoriFilter() {
  const filterKategori = document.getElementById("filterKategoriPengeluaran");
  const selectedCat = filterKategori.value;
  const kasKeluar = appState.data.kasKeluar || [];

  const kategoriSet = new Set();
  kasKeluar.forEach(kk => {
    if (kk.kategori && kk.kategori.trim()) {
      kategoriSet.add(kk.kategori.trim());
    }
  });

  filterKategori.innerHTML = '<option value="">Semua Kategori</option>';
  Array.from(kategoriSet).sort().forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selectedCat) opt.selected = true;
    filterKategori.appendChild(opt);
  });
}

/**
 * 2. Render Tabel Transparansi Pengeluaran
 */
function renderPengeluaranTable() {
  const tbody = document.getElementById("tablePengeluaranBody");
  const emptyState = document.getElementById("emptyPengeluaran");
  const countEl = document.getElementById("countPengeluaran");
  const subtotalEl = document.getElementById("subtotalPengeluaran");

  const query = (document.getElementById("searchPengeluaran").value || "").toLowerCase().trim();
  const selectedCat = document.getElementById("filterKategoriPengeluaran").value;
  const year = appState.selectedYear;

  const rawList = appState.data.kasKeluar || [];

  // Filter berdasarkan tahun, pencarian, dan kategori
  const filtered = rawList.filter(item => {
    const itemYear = new Date(item.tanggal).getFullYear();
    const matchYear = itemYear === year;
    const matchCat = !selectedCat || item.kategori === selectedCat;
    const matchSearch = !query || 
      (item.keperluan && item.keperluan.toLowerCase().includes(query)) ||
      (item.pj && item.pj.toLowerCase().includes(query)) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(query));

    return matchYear && matchCat && matchSearch;
  });

  // Urutkan tanggal terbaru ke terlama
  filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("d-none");
    countEl.textContent = "Menampilkan 0 data pengeluaran";
    subtotalEl.textContent = formatRupiah(0);
    return;
  }

  emptyState.classList.add("d-none");
  let subtotal = 0;

  filtered.forEach(item => {
    const nom = parseInt(item.nominal) || 0;
    subtotal += nom;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="ps-3"><span class="fw-semibold">${formatTanggalIndo(item.tanggal)}</span></td>
      <td>
        <span class="badge bg-light text-dark border px-2 py-1">${item.kategori || "Umum"}</span>
      </td>
      <td>
        <div class="fw-bold text-dark">${escapeHtml(item.keperluan)}</div>
        ${item.keterangan ? `<small class="text-muted d-block">${escapeHtml(item.keterangan)}</small>` : ""}
      </td>
      <td class="text-end fw-bold text-danger">${formatRupiah(nom)}</td>
      <td>
        <span class="d-inline-flex align-items-center gap-1">
          <i class="bi bi-person text-muted"></i> ${escapeHtml(item.pj || "-")}
        </span>
      </td>
      <td class="text-center">
        ${item.buktiUrl && item.buktiUrl.trim() !== "" ? `
          <button class="btn btn-outline-primary btn-sm py-0 px-2 btn-view-bukti" data-url="${encodeURI(item.buktiUrl)}" data-title="${escapeHtml(item.keperluan)}">
            <i class="bi bi-image"></i> Nota
          </button>
        ` : `
          <span class="text-muted fs-8">-</span>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });

  countEl.textContent = `Menampilkan ${filtered.length} data pengeluaran`;
  subtotalEl.textContent = formatRupiah(subtotal);

  // Pasang listener untuk tombol modal nota
  document.querySelectorAll(".btn-view-bukti").forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      const title = btn.getAttribute("data-title");
      openModalBukti(url, title);
    });
  });
}

/**
 * 3. Render Matriks Pembayaran Kas Anggota (Jan - Des)
 */
function renderMatrixKasTable() {
  const tbody = document.getElementById("tableMatrixKasBody");
  const emptyState = document.getElementById("emptyAnggota");
  const countAnggotaEl = document.getElementById("countAnggota");
  const totalMatrixEl = document.getElementById("totalKasMasukMatrix");

  const query = (document.getElementById("searchAnggota").value || "").toLowerCase().trim();
  const year = appState.selectedYear;

  const anggotaList = appState.data.anggota || [];
  const kasMasukList = appState.data.kasMasuk || [];

  // Filter anggota berdasarkan pencarian
  const filteredAnggota = anggotaList.filter(a => {
    if (a.status && a.status.toLowerCase() === "nonaktif") return false;
    if (!query) return true;
    return a.nama && a.nama.toLowerCase().includes(query);
  });

  tbody.innerHTML = "";

  if (filteredAnggota.length === 0) {
    emptyState.classList.remove("d-none");
    countAnggotaEl.textContent = "0 anggota aktif";
    totalMatrixEl.textContent = formatRupiah(0);
    return;
  }

  emptyState.classList.add("d-none");

  // Petakan kas masuk per anggota dan per bulan: Map[anggotaId][bulan] -> record
  const mapKas = {};
  kasMasukList.forEach(km => {
    if (parseInt(km.tahun) === year) {
      if (!mapKas[km.anggotaId]) mapKas[km.anggotaId] = {};
      mapKas[km.anggotaId][parseInt(km.bulan)] = km;
    }
  });

  let totalKasTerkumpulTahun = 0;

  filteredAnggota.forEach(ang => {
    const tr = document.createElement("tr");

    // Kolom Nama Anggota
    let rowHtml = `<td><strong>${escapeHtml(ang.nama)}</strong></td>`;

    let totalBayarAnggota = 0;

    // 12 Bulan (1 = Jan s.d 12 = Des)
    for (let bulan = 1; bulan <= 12; bulan++) {
      const record = mapKas[ang.id] ? mapKas[ang.id][bulan] : null;

      if (record) {
        const nominal = parseInt(record.nominal) || 0;
        totalBayarAnggota += nominal;
        rowHtml += `
          <td>
            <span class="badge-paid" title="Lunas: ${formatRupiah(nominal)} (${record.metode || 'Tunai'})">
              <i class="bi bi-check2"></i>
            </span>
          </td>
        `;
      } else {
        rowHtml += `
          <td>
            <span class="badge-unpaid" title="Belum Bayar">
              <i class="bi bi-dash"></i>
            </span>
          </td>
        `;
      }
    }

    totalKasTerkumpulTahun += totalBayarAnggota;

    // Kolom Total Terbayar Anggota
    rowHtml += `<td class="fw-bold text-success text-end">${formatRupiah(totalBayarAnggota)}</td>`;

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });

  countAnggotaEl.textContent = `Total ${filteredAnggota.length} anggota`;
  totalMatrixEl.textContent = formatRupiah(totalKasTerkumpulTahun);
}

/**
 * 4. Render Grafik Keuangan dengan Chart.js
 */
function renderCharts() {
  renderChartArusKas();
  renderChartKategoriPengeluaran();
}

/**
 * Grafik Arus Kas Batang (Pemasukan vs Pengeluaran per Bulan)
 */
function renderChartArusKas() {
  const ctx = document.getElementById("chartArusKas");
  if (!ctx) return;

  const year = appState.selectedYear;
  const kasMasuk = appState.data.kasMasuk || [];
  const kasKeluar = appState.data.kasKeluar || [];

  // Hitung pemasukan per bulan
  const incomePerMonth = new Array(12).fill(0);
  kasMasuk.forEach(km => {
    if (parseInt(km.tahun) === year) {
      const m = parseInt(km.bulan) - 1;
      if (m >= 0 && m < 12) {
        incomePerMonth[m] += parseInt(km.nominal) || 0;
      }
    }
  });

  // Hitung pengeluaran per bulan
  const expensePerMonth = new Array(12).fill(0);
  kasKeluar.forEach(kk => {
    const d = new Date(kk.tanggal);
    if (d.getFullYear() === year) {
      const m = d.getMonth();
      if (m >= 0 && m < 12) {
        expensePerMonth[m] += parseInt(kk.nominal) || 0;
      }
    }
  });

  if (appState.chartArusKas) {
    appState.chartArusKas.destroy();
  }

  appState.chartArusKas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
      datasets: [
        {
          label: "Pemasukan Kas",
          data: incomePerMonth,
          backgroundColor: "rgba(22, 101, 52, 0.82)",  /* hijau petang */
          borderColor: "#14532d",
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: "Pengeluaran Kas",
          data: expensePerMonth,
          backgroundColor: "rgba(185, 28, 28, 0.78)",  /* merah gelap */
          borderColor: "#991b1b",
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: "top",
          labels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", weight: 600 }
          }
        },
        tooltip: {
          titleFont: { family: "'Plus Jakarta Sans', sans-serif" },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif" },
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatRupiah(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: 500 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(226, 232, 240, 0.6)" },
          ticks: {
            font: { family: "'Plus Jakarta Sans', sans-serif" },
            callback: function(value) {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + " Jt";
              if (value >= 1000) return (value / 1000).toFixed(0) + " Rb";
              return value;
            }
          }
        }
      }
    }
  });
}

/**
 * Grafik Donut: Kategori Pengeluaran
 */
function renderChartKategoriPengeluaran() {
  const ctx = document.getElementById("chartKategoriPengeluaran");
  const emptyPie = document.getElementById("emptyPieChart");
  if (!ctx) return;

  const year = appState.selectedYear;
  const kasKeluar = appState.data.kasKeluar || [];

  const catMap = {};
  kasKeluar.forEach(kk => {
    const d = new Date(kk.tanggal);
    if (d.getFullYear() === year) {
      const cat = kk.kategori || "Lainnya";
      catMap[cat] = (catMap[cat] || 0) + (parseInt(kk.nominal) || 0);
    }
  });

  const labels = Object.keys(catMap);
  const values = Object.values(catMap);

  if (appState.chartKategori) {
    appState.chartKategori.destroy();
  }

  if (labels.length === 0 || values.every(v => v === 0)) {
    ctx.classList.add("d-none");
    emptyPie.classList.remove("d-none");
    return;
  }

  ctx.classList.remove("d-none");
  emptyPie.classList.add("d-none");

  appState.chartKategori = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#1e40af", // Blue 800
            "#2563eb", // Blue 600
            "#60a5fa", // Blue 400
            "#93c5fd", // Blue 300
            "#059669", // Emerald
            "#f59e0b", // Amber
            "#e11d48", // Rose
            "#64748b"  // Slate
          ],
          borderWidth: 2,
          borderColor: "#ffffff"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: "bottom",
          labels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", weight: 500 },
            boxWidth: 12,
            padding: 14
          }
        },
        tooltip: {
          titleFont: { family: "'Plus Jakarta Sans', sans-serif" },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif" },
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${formatRupiah(context.raw)}`;
            }
          }
        }
      },
      cutout: "68%"
    }
  });
}

/**
 * Modal Bukti Pengeluaran
 */
function openModalBukti(url, title) {
  const contentEl = document.getElementById("buktiContent");
  const externalBtn = document.getElementById("btnOpenExternalBukti");

  externalBtn.href = url;

  // Cek apakah URL adalah gambar
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url) || url.includes("drive.google.com/thumbnail") || url.includes("lh3.googleusercontent.com");

  if (isImage) {
    contentEl.innerHTML = `
      <p class="fw-semibold text-dark mb-2">${title}</p>
      <img src="${url}" alt="Bukti Pengeluaran" class="img-fluid rounded border shadow-sm" style="max-height: 400px; object-fit: contain;">
    `;
  } else {
    contentEl.innerHTML = `
      <div class="py-4">
        <i class="bi bi-file-earmark-text fs-1 text-primary"></i>
        <h6 class="fw-bold mt-2">${title}</h6>
        <p class="text-muted small">Tautan bukti berada pada URL eksternal atau Google Drive.</p>
        <a href="${url}" target="_blank" class="btn btn-primary btn-sm px-3 mt-1">
          <i class="bi bi-box-arrow-up-right me-1"></i> Buka Tautan Dokumen Bukti
        </a>
      </div>
    `;
  }

  const modal = new bootstrap.Modal(document.getElementById("modalBuktiNota"));
  modal.show();
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
