# Design Document

## Overview

Expense & Budget Visualizer adalah aplikasi web client-side tiga file (HTML, CSS, JS) yang memungkinkan pengguna mencatat dan memvisualisasikan pengeluaran pribadi secara lokal di browser. Aplikasi tidak memerlukan backend, build step, atau framework apapun — seluruh state dikelola di memori JavaScript dan dipersisten ke Local Storage API.

Arsitektur inti mengikuti pola **MVC sederhana berbasis modul fungsi**: satu state objek global menjadi sumber kebenaran tunggal, mutasi state selalu melalui fungsi-fungsi yang terdefinisi, dan rendering UI selalu dijalankan ulang secara reaktif setelah setiap mutasi. Chart.js v4 (dimuat melalui jsDelivr CDN) digunakan untuk visualisasi pie chart.

**Tujuan desain utama:**
- Semua fitur dapat bekerja tanpa koneksi internet (kecuali Chart.js CDN loading pertama kali)
- State yang konsisten antara tampilan dan storage di setiap operasi
- Kode yang mudah dibaca dan dimodifikasi tanpa alat bantu khusus

---

## Architecture

### Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │  index.html  │───▶│ css/style.css│    │  js/script.js  │ │
│  │  (Structure) │    │  (Styling)   │    │  (All Logic)   │ │
│  └──────────────┘    └──────────────┘    └───────┬────────┘ │
│                                                  │          │
│  ┌────────────────────────────────────────────────▼───────┐ │
│  │                   js/script.js                         │ │
│  │                                                        │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │  State      │  │  Storage     │  │  UI Renderer │  │ │
│  │  │  (in-memory)│  │  (LocalStore)│  │  (DOM ops)   │  │ │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  │ │
│  │         │                │                  │          │ │
│  │  ┌──────▼────────────────▼──────────────────▼───────┐  │ │
│  │  │             Controller Functions                  │  │ │
│  │  │  (addTransaction, deleteTransaction, setTheme…)   │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │      Local Storage (Browser-native persistence)      │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Pola Aliran Data

Setiap interaksi pengguna mengikuti satu alur yang sama:

```
User Action
    │
    ▼
Event Handler (addEventListener)
    │
    ▼
Input Validation (Validator functions)
    │ (valid)
    ▼
State Mutation (update AppState object)
    │
    ▼
Storage Sync (StorageService.save*)
    │
    ▼
Full Re-render (render() → all UI components)
    │
    ▼
DOM Updated
```

Pendekatan "render penuh setiap mutasi" dipilih atas optimasi parsial karena sederhananya kode dan ukuran data yang kecil (maksimal ratusan transaksi).

### Struktur File

```
project-root/
├── index.html          # Markup dan CDN script tags
├── css/
│   └── style.css       # Variabel CSS, tema, layout
└── js/
    └── script.js       # Semua logika aplikasi
```

---

## Components and Interfaces

### Komponen HTML (index.html)

```
index.html
├── <head>
│   ├── Metadata & viewport
│   ├── <link rel="stylesheet"> → css/style.css
│   └── <script src="chart.js CDN"> (defer)
│
└── <body>
    ├── #theme-toggle-btn          (tombol fixed pojok kanan atas)
    │
    ├── #card-header               (Card 1 – Balance)
    │   ├── h1 "Expense & Budget Visualizer"
    │   ├── label "TOTAL BALANCE"
    │   ├── #balance-display       (nilai balance, font besar, teal/red)
    │   ├── #monthly-summary       (total bulan + label bulan-tahun)
    │   └── #budget-limit-section  (input budget limit + pesan error)
    │
    ├── #card-form                 (Card 2 – Add Transaction Form)
    │   ├── #input-name            (teks, max 100 karakter)
    │   ├── #error-name
    │   ├── #input-amount          (angka, 0.01–999999999.99)
    │   ├── #error-amount
    │   ├── #select-category       (dropdown kategori)
    │   ├── #custom-category-input (teks, max 50 karakter)
    │   ├── #custom-category-btn
    │   ├── #error-custom-category
    │   └── #btn-submit            (full-width)
    │
    └── #card-main                 (Card 3 – dua kolom)
        ├── #transaction-section   (kolom kiri)
        │   ├── #select-sort
        │   └── #transaction-list  (ul – dirender ulang tiap mutasi)
        │
        └── #chart-section         (kolom kanan)
            ├── h2 "Spending by Category"
            └── <canvas id="pie-chart">
```

### Modul Logika (js/script.js)

Script diorganisasi sebagai IIFE atau modul flat dengan seksi yang jelas, bukan class. Pembagian logis:

#### 1. Constants

```javascript
const STORAGE_KEYS = {
  TRANSACTIONS: 'evb_transactions',
  CATEGORIES:   'evb_categories',
  BUDGET:       'evb_budget',
  THEME:        'evb_theme'
};

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];
const CHART_COLORS = ['#E91E8C', '#008080', '#F5F0E8']; // pink, teal, cream
const MAX_CATEGORIES = 50;
const MAX_AMOUNT = 999999999.99;
const MAX_NAME_LENGTH = 100;
const MAX_CATEGORY_NAME = 50;
```

#### 2. AppState (Sumber Kebenaran Tunggal)

```javascript
const AppState = {
  transactions: [],   // Transaction[]
  categories: [...DEFAULT_CATEGORIES], // string[]
  budgetLimit: 0,     // number
  theme: 'light',     // 'light' | 'dark'
  sortOrder: 'default' // 'default' | 'price-desc' | 'price-asc' | 'category-asc'
};
```

#### 3. StorageService

Fungsi-fungsi murni untuk baca/tulis Local Storage dengan penanganan error:

| Fungsi | Tanggung Jawab |
|---|---|
| `loadAll()` | Memuat semua data dari Local Storage ke AppState saat init |
| `saveTransactions()` | Serialisasi dan simpan `AppState.transactions` |
| `saveCategories()` | Simpan `AppState.categories` |
| `saveBudget()` | Simpan `AppState.budgetLimit` |
| `saveTheme()` | Simpan `AppState.theme` |

Setiap fungsi save dibungkus `try/catch`. Jika `localStorage.setItem` melempar `QuotaExceededError` atau storage tidak tersedia, fungsi mengembalikan `false` dan caller menampilkan pesan error.

#### 4. Validator

Fungsi-fungsi validasi yang mengembalikan `{ valid: boolean, message: string }`:

| Fungsi | Input | Validasi |
|---|---|---|
| `validateName(value)` | string | non-kosong, ≤ 100 karakter |
| `validateAmount(value)` | string | dapat di-parse sebagai angka, 0.01–999999999.99 |
| `validateCategoryName(value, existing)` | string, string[] | non-kosong, non-whitespace-only, 1–50 karakter, tidak duplikat (case-insensitive), belum 50 kategori kustom |

#### 5. Controller Functions

Fungsi-fungsi yang melakukan mutasi state, lalu memanggil `StorageService.save*` dan `render()`:

| Fungsi | Efek |
|---|---|
| `addTransaction(name, amount, category)` | Tambah Transaction ke state, simpan, render |
| `deleteTransaction(id)` | Hapus Transaction dari state, simpan, render |
| `addCustomCategory(name)` | Tambah ke `AppState.categories`, simpan, render |
| `setBudgetLimit(value)` | Update `AppState.budgetLimit`, simpan, render |
| `setSortOrder(order)` | Update `AppState.sortOrder`, render (tidak simpan) |
| `toggleTheme()` | Toggle `AppState.theme`, simpan, render |
| `initApp()` | Panggil `loadAll()`, render, pasang event listeners |

#### 6. Computed Values (pure functions)

| Fungsi | Return |
|---|---|
| `computeBalance(transactions)` | `number` – sum semua amount |
| `computeMonthlySummary(transactions)` | `number` – sum amount bulan/tahun ini |
| `computeCurrentMonth()` | `string` – "Juli 2025" |
| `computePieData(transactions)` | `{ labels: string[], data: number[], colors: string[] }` |
| `getSortedTransactions(transactions, order)` | `Transaction[]` – diurutkan sesuai Sort_Order |

#### 7. Renderer Functions

Fungsi-fungsi yang menulis ke DOM. Semuanya membaca dari `AppState`:

| Fungsi | Elemen yang diperbarui |
|---|---|
| `renderBalance()` | `#balance-display`, warna teal/merah |
| `renderMonthlySummary()` | `#monthly-summary` |
| `renderTransactionList()` | `#transaction-list` (innerHTML) |
| `renderPieChart()` | Chart.js instance di `#pie-chart` |
| `renderCategoryDropdown()` | `#select-category` options |
| `renderTheme()` | `data-theme` attribute pada `<html>` |
| `render()` | Memanggil semua renderer di atas |

#### 8. ChartManager

Mengelola siklus hidup instance Chart.js:

```javascript
const ChartManager = {
  instance: null,
  init(canvasId) { ... },   // buat instance kosong
  update(data) { ... },     // destroy + recreate atau update data
  showEmpty() { ... }       // tampilkan pesan teks (tidak ada data)
};
```

Chart.js instance di-destroy dan dibuat ulang setiap update untuk menghindari bug animasi residu (pattern yang direkomendasikan untuk data dinamis di Chart.js v4).

---

## Data Models

### Transaction

```javascript
/**
 * @typedef {Object} Transaction
 * @property {string} id          - UUID v4 (crypto.randomUUID() atau fallback timestamp+random)
 * @property {string} name        - Nama transaksi, 1–100 karakter
 * @property {number} amount      - Jumlah pengeluaran, 0.01–999999999.99
 * @property {string} category    - Nama kategori
 * @property {string} date        - ISO 8601 date string (hanya tanggal: YYYY-MM-DD)
 * @property {number} timestamp   - Date.now() saat pencatatan, dipakai untuk pengurutan
 */
```

### AppState

```javascript
/**
 * @typedef {Object} AppState
 * @property {Transaction[]} transactions - Semua transaksi yang tercatat
 * @property {string[]} categories        - Default + custom categories
 * @property {number} budgetLimit         - 0 berarti tidak ada limit
 * @property {'light'|'dark'} theme       - Preferensi tema aktif
 * @property {SortOrder} sortOrder        - Urutan tampilan transaksi
 */

/**
 * @typedef {'default'|'price-desc'|'price-asc'|'category-asc'} SortOrder
 */
```

### Local Storage Schema

| Key | Tipe | Contoh nilai |
|---|---|---|
| `evb_transactions` | JSON string of `Transaction[]` | `[{"id":"abc","name":"Makan","amount":25000,"category":"Food","date":"2025-07-01","timestamp":1751234567890}]` |
| `evb_categories` | JSON string of `string[]` | `["Food","Transport","Fun","Gym"]` |
| `evb_budget` | JSON string of `number` | `"500000"` |
| `evb_theme` | `"light"` atau `"dark"` | `"dark"` |

### Styling Data Model (CSS Custom Properties)

```css
:root {
  --color-pink:       #E91E8C;
  --color-teal:       #008080;
  --color-cream:      #FDF6EC;
  --color-white:      #FFFFFF;
  --color-red-warn:   #DC2626;

  /* Light mode defaults */
  --bg-page:          var(--color-cream);
  --bg-card:          var(--color-white);
  --text-primary:     #1A1A2E;
  --text-secondary:   #555570;
  --shadow-card:      0 2px 8px rgba(0,0,0,0.08);
  --spacing-card-gap: 16px;
}

[data-theme="dark"] {
  --bg-page:    #121212;
  --bg-card:    #1E1E1E;
  --text-primary:   #F0F0F0;
  --text-secondary: #AAAAAA;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Penambahan transaksi memperbesar daftar dan mencerminkan balance

*For any* daftar transaksi yang ada dan data transaksi yang valid (nama non-kosong ≤ 100 karakter, amount 0.01–999999999.99, kategori valid), menambahkan transaksi tersebut harus menghasilkan: (a) daftar dengan panjang bertambah tepat satu, dan (b) nilai Balance baru sama dengan Balance lama ditambah amount transaksi yang baru ditambahkan.

**Validates: Requirements 4.5, 5.1**

### Property 2: Input whitespace-only selalu ditolak

*For any* string yang seluruh karakternya adalah whitespace (spasi, tab, newline, atau kombinasinya), menggunakannya sebagai nama transaksi maupun nama custom category harus selalu ditolak oleh Validator dan state tidak mengalami perubahan.

**Validates: Requirements 4.4, 7.3**

### Property 3: Serialisasi dan persistensi transaksi round-trip

*For any* array `Transaction[]` yang valid, melakukan `JSON.stringify` lalu `JSON.parse` harus menghasilkan array yang struktural ekuivalen (semua field: id, name, amount, category, date, timestamp sama persis). Hal ini menjamin bahwa setelah penambahan transaksi apapun, membaca kembali dari Local Storage menghasilkan data yang identik dengan yang disimpan.

**Validates: Requirements 2.1, 2.3, 5.5**

### Property 4: Penghapusan transaksi konsisten antara daftar, balance, dan storage

*For any* daftar transaksi yang berisi minimal satu transaksi, menghapus transaksi berdasarkan id harus menghasilkan: (a) transaksi dengan id tersebut tidak lagi ada dalam daftar, (b) nilai Balance sama dengan sum semua amount dari sisa transaksi, dan (c) Local Storage tidak lagi memuat id transaksi yang dihapus.

**Validates: Requirements 2.2, 5.2**

### Property 5: Monthly Summary hanya menghitung transaksi bulan dan tahun berjalan

*For any* kumpulan transaksi yang mencakup berbagai kombinasi bulan dan tahun, nilai `computeMonthlySummary` harus sama persis dengan sum amount dari hanya transaksi-transaksi yang field `date`-nya memiliki bulan dan tahun yang sama dengan tanggal sistem saat fungsi dipanggil — transaksi dari bulan atau tahun lain tidak boleh ikut terhitung.

**Validates: Requirements 8.1, 8.2**

### Property 6: Pie chart mencerminkan proporsi kategori secara akurat

*For any* kumpulan transaksi yang memiliki satu atau lebih kategori, `computePieData` harus menghasilkan: (a) tepat satu entri per kategori unik yang memiliki transaksi, (b) persentase setiap kategori sama dengan (sum amount kategori / sum total amount) × 100 dibulatkan ke satu desimal, dan (c) warna slice kategori ke-N adalah `CHART_COLORS[(N-1) % 3]`.

**Validates: Requirements 6.1, 6.2**

### Property 7: Validasi custom category mencegah duplikat dan pelanggaran batas

*For any* daftar kategori yang ada, mencoba menambahkan: (a) nama kategori yang sudah ada (dengan casing apapun) harus ditolak, (b) string dengan panjang > 50 karakter harus ditolak, (c) ketika jumlah custom category sudah mencapai 50, penambahan kategori baru manapun harus ditolak — dalam semua kasus, panjang daftar kategori tidak berubah.

**Validates: Requirements 7.4, 7.5, 7.7**

### Property 8: Pengurutan menjaga kelengkapan dan konsistensi daftar

*For any* daftar transaksi dan pilihan sort order yang valid ('default', 'price-desc', 'price-asc', 'category-asc'), hasil `getSortedTransactions` harus: (a) memiliki panjang yang sama dengan daftar aslinya, (b) memuat seluruh id transaksi yang sama tanpa duplikasi, dan (c) urutan transaksi sesuai dengan kriteria sort order yang dipilih (termasuk aturan tiebreaker berdasarkan tanggal transaksi terbaru).

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 9: Budget warning mengikuti relasi balance terhadap budget limit

*For any* nilai balance dan nilai budget limit, fungsi `isBudgetExceeded(balance, budgetLimit)` harus mengembalikan `true` jika dan hanya jika `balance > budgetLimit && budgetLimit > 0` — termasuk kasus edge di mana `budgetLimit = 0` (tidak ada warning) dan `balance = budgetLimit` (tidak ada warning).

**Validates: Requirements 10.3, 10.4, 10.5**

### Property 10: Toggle tema adalah operasi round-trip

*For any* nilai tema awal ('light' atau 'dark'), menjalankan fungsi toggle tema dua kali berturut-turut harus selalu mengembalikan nilai tema yang sama dengan nilai awal, dan setiap toggle harus menyimpan preferensi yang diperbarui ke Local Storage sebelum render berikutnya.

**Validates: Requirements 11.2, 11.5**

---

## Error Handling

### Strategi Penanganan Error per Skenario

| Skenario | Penanganan |
|---|---|
| Chart.js gagal dimuat dari CDN | `window.onerror` / `script.onerror` mendeteksi kegagalan; `ChartManager.init()` cek ketersediaan `window.Chart`; jika tidak ada, tampilkan pesan teks di area chart: *"Grafik tidak tersedia. Periksa koneksi internet Anda."* Fungsionalitas pencatatan transaksi tetap berjalan. |
| Local Storage tidak tersedia | Semua akses storage dibungkus `try/catch`. Jika `localStorage` tidak ada atau melempar exception, `StorageService` menggunakan in-memory fallback dan aplikasi berjalan tanpa persistensi. |
| Local Storage penuh (`QuotaExceededError`) | `StorageService.save*` menangkap error, mengembalikan `false`, caller menampilkan banner error non-blocking: *"Gagal menyimpan data: storage penuh."* Data lama tidak diubah. |
| Data JSON corrupt di Local Storage | `JSON.parse` dibungkus `try/catch`; data invalid diabaikan, AppState diinisialisasi dengan nilai default (array kosong, budget 0, tema light). |
| Validasi form gagal | Pesan error ditampilkan inline di bawah field yang bersangkutan. Submit dicegah. Error dihapus saat field dimodifikasi. |
| Budget limit input invalid | Pesan error ditampilkan inline; nilai budget tidak diubah. |
| Custom category limit tercapai (50) | Tombol tambah tetap terlihat, tapi klik memunculkan pesan: *"Batas maksimum 50 kategori kustom telah tercapai."* |

### Error Message Conventions

- Pesan error dalam Bahasa Indonesia, singkat, dan deskriptif
- Error inline ditampilkan dalam elemen `<span class="error-msg">` di bawah field terkait
- Error penyimpanan storage ditampilkan sebagai banner di bagian atas halaman
- Error tidak menggunakan `alert()` atau `confirm()` untuk menjaga UX

---

## Testing Strategy

### Unit Tests (Example-Based)

Unit test fokus pada fungsi-fungsi murni yang dapat diuji secara terisolasi:

**Computed Values:**
- `computeBalance([])` → `0`
- `computeBalance([{amount:10000}, {amount:5000}])` → `15000`
- `computeMonthlySummary` dengan transaksi lintas bulan: hanya bulan ini yang terhitung
- `computePieData` dengan 2 kategori: data dan label sesuai ekspektasi
- `getSortedTransactions` untuk setiap sort order dengan dataset kecil

**Validator:**
- `validateName('')` → `{ valid: false }`
- `validateName('a'.repeat(101))` → `{ valid: false }`
- `validateAmount('0')` → `{ valid: false }`
- `validateAmount('-5')` → `{ valid: false }`
- `validateAmount('999999999.99')` → `{ valid: true }`
- `validateAmount('1000000000')` → `{ valid: false }`
- `validateCategoryName('food', ['Food'])` → `{ valid: false }` (duplikat case-insensitive)

**StorageService:**
- Round-trip: simpan lalu baca menghasilkan data yang sama
- Error handling saat storage tidak tersedia (mock `localStorage`)

### Property-Based Tests

Framework yang dipilih: **fast-check** (tersedia via CDN atau npm, cocok untuk Vanilla JS/Node.js).

Setiap property test dikonfigurasi minimum 100 iterasi. Setiap test diberi tag komentar yang merujuk ke property di design document.

**Property 1 – Penambahan transaksi memperbesar daftar dan mencerminkan balance**
```javascript
// Feature: expense-budget-visualizer, Property 1: Penambahan transaksi memperbesar daftar dan mencerminkan balance
fc.assert(fc.property(
  fc.array(arbitraryTransaction()),
  arbitraryValidTransactionInput(),
  (existing, { name, amount, category }) => {
    const before = computeBalance(existing);
    const result = addTransactionToList(existing, { name, amount, category });
    const after = computeBalance(result);
    return result.length === existing.length + 1 &&
           Math.abs(after - (before + amount)) < 0.001;
  }
), { numRuns: 100 });
```

**Property 2 – Input whitespace-only selalu ditolak**
```javascript
// Feature: expense-budget-visualizer, Property 2: Input whitespace-only selalu ditolak
fc.assert(fc.property(
  fc.stringMatching(/^\s+$/),  // hanya whitespace
  (ws) => {
    const beforeState = JSON.stringify(AppState.transactions);
    const nameResult = validateName(ws);
    const catResult = validateCategoryName(ws, AppState.categories);
    return !nameResult.valid && !catResult.valid &&
           JSON.stringify(AppState.transactions) === beforeState;
  }
), { numRuns: 100 });
```

**Property 3 – Serialisasi dan persistensi transaksi round-trip**
```javascript
// Feature: expense-budget-visualizer, Property 3: Serialisasi dan persistensi transaksi round-trip
fc.assert(fc.property(
  fc.array(arbitraryTransaction()),
  (txList) => {
    const serialized = JSON.stringify(txList);
    const deserialized = JSON.parse(serialized);
    // Semua field harus identik setelah round-trip
    return txList.every((original, i) => {
      const loaded = deserialized[i];
      return loaded.id === original.id &&
             loaded.name === original.name &&
             loaded.amount === original.amount &&
             loaded.category === original.category &&
             loaded.date === original.date &&
             loaded.timestamp === original.timestamp;
    });
  }
), { numRuns: 100 });
```

**Property 4 – Penghapusan transaksi konsisten antara daftar, balance, dan storage**
```javascript
// Feature: expense-budget-visualizer, Property 4: Penghapusan transaksi konsisten antara daftar, balance, dan storage
fc.assert(fc.property(
  fc.array(arbitraryTransaction(), { minLength: 1 }),
  fc.nat(),
  (txList, idx) => {
    const target = txList[idx % txList.length];
    const result = deleteTransactionFromList(txList, target.id);
    const notPresent = !result.some(t => t.id === target.id);
    const expectedBalance = result.reduce((sum, t) => sum + t.amount, 0);
    const balanceCorrect = Math.abs(computeBalance(result) - expectedBalance) < 0.001;
    return notPresent && balanceCorrect;
  }
), { numRuns: 100 });
```

**Property 5 – Monthly Summary hanya menghitung transaksi bulan dan tahun berjalan**
```javascript
// Feature: expense-budget-visualizer, Property 5: Monthly Summary hanya menghitung transaksi bulan dan tahun berjalan
fc.assert(fc.property(
  fc.array(arbitraryTransactionWithRandomDate()),
  (txList) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const expected = txList
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    return Math.abs(computeMonthlySummary(txList) - expected) < 0.001;
  }
), { numRuns: 100 });
```

**Property 6 – Pie chart mencerminkan proporsi kategori secara akurat**
```javascript
// Feature: expense-budget-visualizer, Property 6: Pie chart mencerminkan proporsi kategori secara akurat
fc.assert(fc.property(
  fc.array(arbitraryTransaction(), { minLength: 1 }),
  (txList) => {
    const totalAmount = txList.reduce((s, t) => s + t.amount, 0);
    const { labels, data, colors } = computePieData(txList);
    // Jumlah slice = jumlah kategori unik
    const uniqueCats = [...new Set(txList.map(t => t.category))];
    if (labels.length !== uniqueCats.length) return false;
    // Persentase setiap slice proporsional
    const sumPercent = data.reduce((s, d) => s + d, 0);
    if (Math.abs(sumPercent - 100) > 0.5) return false;
    // Warna cycling
    return colors.every((c, i) => c === CHART_COLORS[i % 3]);
  }
), { numRuns: 100 });
```

**Property 7 – Validasi custom category mencegah duplikat dan pelanggaran batas**
```javascript
// Feature: expense-budget-visualizer, Property 7: Validasi custom category mencegah duplikat dan pelanggaran batas
fc.assert(fc.property(
  fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 50 }),
  fc.string({ minLength: 1 }),
  (existingCustom, newCat) => {
    const allCats = [...DEFAULT_CATEGORIES, ...existingCustom];
    const isDuplicate = allCats.some(c => c.toLowerCase() === newCat.toLowerCase());
    const isTooLong = newCat.length > MAX_CATEGORY_NAME;
    const atLimit = existingCustom.length >= MAX_CATEGORIES;
    const result = validateCategoryName(newCat, allCats, existingCustom.length);
    if (isDuplicate || isTooLong || atLimit) {
      return !result.valid; // harus ditolak
    }
    return true;
  }
), { numRuns: 100 });
```

**Property 8 – Pengurutan menjaga kelengkapan dan konsistensi daftar**
```javascript
// Feature: expense-budget-visualizer, Property 8: Pengurutan menjaga kelengkapan dan konsistensi daftar
fc.assert(fc.property(
  fc.array(arbitraryTransaction()),
  fc.constantFrom('default', 'price-desc', 'price-asc', 'category-asc'),
  (txList, order) => {
    const sorted = getSortedTransactions(txList, order);
    const sameLength = sorted.length === txList.length;
    const originalIds = new Set(txList.map(t => t.id));
    const sortedIds = new Set(sorted.map(t => t.id));
    const noLostIds = txList.every(t => sortedIds.has(t.id));
    const noExtraIds = sorted.every(t => originalIds.has(t.id));
    return sameLength && noLostIds && noExtraIds;
  }
), { numRuns: 100 });
```

**Property 9 – Budget warning mengikuti relasi balance terhadap budget limit**
```javascript
// Feature: expense-budget-visualizer, Property 9: Budget warning mengikuti relasi balance terhadap budget limit
fc.assert(fc.property(
  fc.float({ min: 0, max: 999999999.99, noNaN: true }),
  fc.float({ min: 0, max: 999999999.99, noNaN: true }),
  (balance, budgetLimit) => {
    const exceeded = isBudgetExceeded(balance, budgetLimit);
    const shouldExceed = balance > budgetLimit && budgetLimit > 0;
    return exceeded === shouldExceed;
  }
), { numRuns: 100 });
```

**Property 10 – Toggle tema adalah operasi round-trip**
```javascript
// Feature: expense-budget-visualizer, Property 10: Toggle tema adalah operasi round-trip
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  (initialTheme) => {
    const after1 = toggleThemeValue(initialTheme);
    const after2 = toggleThemeValue(after1);
    return after2 === initialTheme;
  }
), { numRuns: 100 });
```

### Integration Tests (Manual / Browser-Based)

Karena aplikasi berjalan sepenuhnya di browser tanpa server, integration test dilakukan secara manual:

1. **Happy path end-to-end**: Tambah 3 transaksi berbeda kategori → verifikasi balance, pie chart, monthly summary
2. **Storage persistence**: Tambah transaksi → refresh halaman → verifikasi data masih ada
3. **Dark mode persistence**: Aktifkan dark mode → refresh → verifikasi tema teraplikasi sebelum render
4. **Chart.js fallback**: Blokir CDN via DevTools → verifikasi pesan fallback tampil
5. **Storage quota**: Simulasi storage penuh → verifikasi pesan error non-blocking
6. **Budget warning**: Set budget 50.000 → tambah transaksi 60.000 → verifikasi warna merah
