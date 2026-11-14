# Implementation Plan: Expense & Budget Visualizer

## Overview

Implementasi aplikasi web tiga file (HTML, CSS, Vanilla JS) untuk mencatat dan memvisualisasikan pengeluaran pribadi secara lokal di browser. Pendekatan incremental: bangun fondasi file dan struktur, lalu tambahkan modul satu per satu (StorageService, Validator, Controller, Renderer), dan akhiri dengan integrasi penuh dan wiring event listener.

## Tasks

- [ ] 1. Siapkan struktur file dan konstanta dasar
  - Buat file `index.html` dengan markup semantik lengkap: `#theme-toggle-btn`, `#card-header` (balance, monthly summary, budget input), `#card-form` (input name, amount, category, custom category), `#card-main` (transaction list + pie chart canvas)
  - Buat file `css/style.css` dengan CSS custom properties untuk palet warna (pink `#E91E8C`, teal `#008080`, cream `#FDF6EC`), variabel light/dark mode, layout card-based, dan kelas utilitas error message
  - Buat file `js/script.js` dengan konstanta `STORAGE_KEYS`, `DEFAULT_CATEGORIES`, `CHART_COLORS`, `MAX_CATEGORIES`, `MAX_AMOUNT`, `MAX_NAME_LENGTH`, `MAX_CATEGORY_NAME`, dan objek `AppState` awal
  - Tambahkan CDN script tag Chart.js v4 (jsDelivr) dengan atribut `defer` di `index.html`
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

- [ ] 2. Implementasi StorageService
  - [ ] 2.1 Tulis fungsi `StorageService.loadAll()`
    - Baca semua key (`evb_transactions`, `evb_categories`, `evb_budget`, `evb_theme`) dari `localStorage`
    - Bungkus setiap `JSON.parse` dalam `try/catch`; jika parse gagal, gunakan nilai default (array kosong, budget 0, tema `'light'`)
    - Populate `AppState` dari hasil baca
    - _Requirements: 2.3, 2.6, 2.7, 5.3_

  - [ ] 2.2 Tulis fungsi-fungsi `StorageService.save*`
    - Implementasi `saveTransactions()`, `saveCategories()`, `saveBudget()`, `saveTheme()`
    - Setiap fungsi membungkus `localStorage.setItem` dalam `try/catch`; tangkap `QuotaExceededError` dan error storage lainnya, kembalikan `false` jika gagal
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.8_

  - [ ] 2.3 Tulis property test untuk StorageService round-trip
    - **Property 3: Serialisasi dan persistensi transaksi round-trip**
    - **Validates: Requirements 2.1, 2.3, 5.5**

- [ ] 3. Implementasi Validator
  - [ ] 3.1 Tulis fungsi `validateName(value)`
    - Return `{ valid: false, message: '...' }` jika kosong, hanya whitespace, atau panjang > 100 karakter
    - Return `{ valid: true }` jika valid
    - _Requirements: 4.4_

  - [ ] 3.2 Tulis fungsi `validateAmount(value)`
    - Return `{ valid: false, message: '...' }` jika bukan angka, sama dengan nol, negatif, atau > 999999999.99
    - Return `{ valid: true }` jika valid
    - _Requirements: 4.6_

  - [ ] 3.3 Tulis fungsi `validateCategoryName(value, existing, customCount)`
    - Return `{ valid: false, message: '...' }` jika kosong, hanya whitespace, panjang > 50 karakter, nama duplikat (case-insensitive), atau `customCount >= MAX_CATEGORIES`
    - _Requirements: 7.3, 7.4, 7.5, 7.7_

  - [ ] 3.4 Tulis property test untuk Validator whitespace
    - **Property 2: Input whitespace-only selalu ditolak**
    - **Validates: Requirements 4.4, 7.3**

  - [ ] 3.5 Tulis property test untuk validasi custom category
    - **Property 7: Validasi custom category mencegah duplikat dan pelanggaran batas**
    - **Validates: Requirements 7.4, 7.5, 7.7**

- [ ] 4. Implementasi Computed Values (pure functions)
  - [ ] 4.1 Tulis `computeBalance(transactions)`
    - Return `number` — sum semua `amount` dari array transaksi; return `0` jika array kosong
    - _Requirements: 3.3, 3.6_

  - [ ] 4.2 Tulis `computeMonthlySummary(transactions)`
    - Filter transaksi yang field `date`-nya memiliki bulan dan tahun sama dengan `new Date()`, lalu sum amount-nya
    - _Requirements: 8.1, 8.2_

  - [ ] 4.3 Tulis `computeCurrentMonth()`
    - Return string nama bulan dan tahun berjalan dalam Bahasa Indonesia, misalnya `"Juli 2025"`
    - _Requirements: 8.3_

  - [ ] 4.4 Tulis `computePieData(transactions)`
    - Kelompokkan transaksi per kategori unik, hitung persentase (sum kategori / total × 100) bulatkan satu desimal, assign warna cycling dari `CHART_COLORS`
    - Return `{ labels, data, colors }`
    - _Requirements: 6.1, 6.2_

  - [ ] 4.5 Tulis `getSortedTransactions(transactions, order)`
    - Implementasikan keempat Sort_Order: `'default'` (terbaru), `'price-desc'`, `'price-asc'`, `'category-asc'` dengan aturan tiebreaker tanggal transaksi terbaru
    - _Requirements: 9.1, 9.2_

  - [ ] 4.6 Tulis `isBudgetExceeded(balance, budgetLimit)`
    - Return `true` hanya jika `balance > budgetLimit && budgetLimit > 0`
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ] 4.7 Tulis property test untuk `computeBalance` dan `addTransactionToList`
    - **Property 1: Penambahan transaksi memperbesar daftar dan mencerminkan balance**
    - **Validates: Requirements 4.5, 5.1**

  - [ ] 4.8 Tulis property test untuk `computeMonthlySummary`
    - **Property 5: Monthly Summary hanya menghitung transaksi bulan dan tahun berjalan**
    - **Validates: Requirements 8.1, 8.2**

  - [ ] 4.9 Tulis property test untuk `computePieData`
    - **Property 6: Pie chart mencerminkan proporsi kategori secara akurat**
    - **Validates: Requirements 6.1, 6.2**

  - [ ] 4.10 Tulis property test untuk `getSortedTransactions`
    - **Property 8: Pengurutan menjaga kelengkapan dan konsistensi daftar**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ] 4.11 Tulis property test untuk `isBudgetExceeded`
    - **Property 9: Budget warning mengikuti relasi balance terhadap budget limit**
    - **Validates: Requirements 10.3, 10.4, 10.5**

- [ ] 5. Checkpoint — Pastikan semua fungsi murni berjalan benar
  - Pastikan semua unit test dan property test yang ada lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [ ] 6. Implementasi ChartManager
  - [ ] 6.1 Tulis objek `ChartManager` dengan metode `init(canvasId)`, `update(data)`, `showEmpty()`
    - `init`: cek ketersediaan `window.Chart`; jika tidak ada, set flag `unavailable` dan return
    - `update`: destroy instance lama lalu buat instance Chart.js baru (pie chart) dengan `data.labels`, `data.data`, `data.colors`
    - `showEmpty`: hapus instance chart dan tampilkan teks fallback di area canvas
    - Tangani kasus Chart.js tidak tersedia dengan menampilkan pesan `"Grafik tidak tersedia. Periksa koneksi internet Anda."`
    - _Requirements: 1.4, 6.3, 6.4, 6.5_

- [ ] 7. Implementasi Renderer Functions
  - [ ] 7.1 Tulis `renderBalance()`
    - Perbarui `#balance-display` dengan nilai dari `computeBalance(AppState.transactions)`
    - Terapkan warna teal jika balance ≥ 0 dan tidak melebihi budget limit aktif, merah jika balance negatif atau melebihi budget limit
    - _Requirements: 3.3, 3.6, 10.3, 10.4, 10.5_

  - [ ] 7.2 Tulis `renderMonthlySummary()`
    - Perbarui `#monthly-summary` dengan nilai dari `computeMonthlySummary` dan label dari `computeCurrentMonth()`
    - _Requirements: 8.1, 8.3_

  - [ ] 7.3 Tulis `renderTransactionList()`
    - Set `innerHTML` elemen `#transaction-list` dengan item daftar dari `getSortedTransactions(AppState.transactions, AppState.sortOrder)`
    - Setiap item menampilkan: nama, amount berformat mata uang dengan warna teal, badge kategori, dan tombol Delete berwarna pink
    - Jika tidak ada transaksi, tampilkan pesan kosong
    - _Requirements: 5.1, 5.4, 9.2, 9.3_

  - [ ] 7.4 Tulis `renderPieChart()`
    - Jika tidak ada transaksi, panggil `ChartManager.showEmpty()`
    - Jika ada transaksi, panggil `ChartManager.update(computePieData(AppState.transactions))`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 7.5 Tulis `renderCategoryDropdown()`
    - Rebuild options `#select-category` dari `AppState.categories`
    - _Requirements: 4.1, 4.2, 7.1, 7.6_

  - [ ] 7.6 Tulis `renderTheme()`
    - Set atribut `data-theme` pada elemen `<html>` sesuai `AppState.theme`
    - _Requirements: 11.2, 11.3, 11.4_

  - [ ] 7.7 Tulis fungsi `render()` yang memanggil semua renderer di atas secara berurutan
    - _Requirements: 4.5, 5.1, 6.3, 8.2, 9.2_

- [ ] 8. Implementasi Controller Functions
  - [ ] 8.1 Tulis `addTransaction(name, amount, category)`
    - Buat objek `Transaction` baru dengan `crypto.randomUUID()` (atau fallback `Date.now() + Math.random()`) sebagai `id`, field `date` sebagai `YYYY-MM-DD`, dan `timestamp` sebagai `Date.now()`
    - Push ke `AppState.transactions`, panggil `StorageService.saveTransactions()`, panggil `render()`
    - Jika `saveTransactions()` mengembalikan `false`, tampilkan banner error storage
    - _Requirements: 2.1, 4.5, 5.1, 5.5_

  - [ ] 8.2 Tulis `deleteTransaction(id)`
    - Filter `AppState.transactions` untuk menghapus transaksi dengan `id` yang cocok
    - Panggil `StorageService.saveTransactions()`, panggil `render()`
    - _Requirements: 2.2, 5.2_

  - [ ] 8.3 Tulis `addCustomCategory(name)`
    - Validasi dengan `validateCategoryName`; jika invalid tampilkan error inline, return
    - Push ke `AppState.categories`, panggil `StorageService.saveCategories()`, panggil `render()`
    - _Requirements: 2.4, 7.2, 7.6_

  - [ ] 8.4 Tulis `setBudgetLimit(value)`
    - Parse dan validasi nilai; jika invalid tampilkan pesan error inline di bawah input budget
    - Update `AppState.budgetLimit`, panggil `StorageService.saveBudget()`, panggil `render()`
    - _Requirements: 2.5, 10.1, 10.2_

  - [ ] 8.5 Tulis `setSortOrder(order)`
    - Update `AppState.sortOrder`, panggil `render()` (tidak perlu simpan ke storage)
    - _Requirements: 9.1, 9.2_

  - [ ] 8.6 Tulis `toggleTheme()`
    - Toggle `AppState.theme` antara `'light'` dan `'dark'`
    - Panggil `StorageService.saveTheme()` lalu `render()`
    - _Requirements: 2.6, 11.2, 11.5_

  - [ ] 8.7 Tulis property test untuk `deleteTransaction` dan `computeBalance`
    - **Property 4: Penghapusan transaksi konsisten antara daftar, balance, dan storage**
    - **Validates: Requirements 2.2, 5.2**

  - [ ] 8.8 Tulis property test untuk `toggleTheme`
    - **Property 10: Toggle tema adalah operasi round-trip**
    - **Validates: Requirements 11.2, 11.5**

- [ ] 9. Implementasi `initApp()` dan event listeners
  - [ ] 9.1 Tulis fungsi `initApp()`
    - Panggil `StorageService.loadAll()` untuk populate `AppState`
    - Panggil `render()` agar UI langsung mencerminkan state awal
    - Tambahkan listener `DOMContentLoaded` sebagai entry point
    - _Requirements: 2.3, 2.6, 2.7, 11.5_

  - [ ] 9.2 Pasang event listener form submit
    - Tangkap submit `#card-form`, jalankan `validateName` dan `validateAmount`
    - Jika valid: panggil `addTransaction(...)`, reset form
    - Jika tidak valid: tampilkan pesan error inline di bawah field masing-masing, hapus error saat field dimodifikasi
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_

  - [ ] 9.3 Pasang event listener tombol tambah custom category
    - Tangkap klik `#custom-category-btn`, baca nilai `#custom-category-input`
    - Panggil `addCustomCategory(value)`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_

  - [ ] 9.4 Pasang event listener tombol Delete di transaction list
    - Gunakan event delegation pada `#transaction-list` untuk menangkap klik tombol delete
    - Baca atribut `data-id` dari tombol, panggil `deleteTransaction(id)`
    - _Requirements: 5.2_

  - [ ] 9.5 Pasang event listener dropdown sort order
    - Tangkap `change` pada `#select-sort`, panggil `setSortOrder(value)`
    - _Requirements: 9.1, 9.2_

  - [ ] 9.6 Pasang event listener input budget limit
    - Tangkap `change` atau `blur` pada input budget, panggil `setBudgetLimit(value)`
    - _Requirements: 10.1, 10.2_

  - [ ] 9.7 Pasang event listener tombol toggle tema
    - Tangkap klik `#theme-toggle-btn`, panggil `toggleTheme()`
    - _Requirements: 11.1, 11.2_

  - [ ] 9.8 Tambahkan penanganan error Chart.js CDN
    - Tambahkan atribut `onerror` pada script tag Chart.js di `index.html` untuk mendeteksi kegagalan load CDN
    - `ChartManager.init()` cek `window.Chart` sebelum membuat instance
    - _Requirements: 1.4_

- [ ] 10. Checkpoint akhir — Pastikan semua fitur terintegrasi
  - Pastikan semua test lulus dan seluruh event listener berfungsi dengan benar, tanyakan kepada pengguna jika ada pertanyaan.

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk pengembangan MVP yang lebih cepat
- Setiap task mereferensikan persyaratan spesifik untuk traceability
- Property test menggunakan framework **fast-check** (tersedia via CDN atau npm)
- Unit test dapat ditulis sebagai fungsi sederhana yang dijalankan di browser console atau Node.js
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke fase berikutnya
- Pendekatan "render penuh setiap mutasi" memudahkan debugging dan memastikan konsistensi UI

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["2.3", "3.4", "3.5", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 3, "tasks": ["4.7", "4.8", "4.9", "4.10", "4.11", "6.1"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 5, "tasks": ["7.7"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 7, "tasks": ["8.7", "8.8", "9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8"] }
  ]
}
```
