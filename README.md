# Expense & Budget Visualizer

Aplikasi web untuk mencatat dan memvisualisasikan pengeluaran pribadi dengan antarmuka yang sederhana dan menarik.

## Fitur Utama

- ✅ Pencatatan transaksi pengeluaran
- 📊 Visualisasi pie chart berdasarkan kategori
- 💰 Total balance dan ringkasan bulanan
- 🎯 Pengaturan batas anggaran dengan peringatan visual
- 🏷️ Kategori kustom (maksimal 50)
- 🔄 Pengurutan transaksi (terbaru, harga, kategori)
- 🌓 Mode gelap dan terang
- 💾 Penyimpanan otomatis di Local Storage

## Cara Menggunakan

1. **Buka Aplikasi**: Cukup buka file index.html di browser modern (Chrome, Firefox, Edge)
2. **Tambah Transaksi**: Isi formulir dengan nama, jumlah, dan kategori, lalu klik "Tambah Transaksi"
3. **Kelola Kategori**: Tambahkan kategori kustom sesuai kebutuhan Anda
4. **Atur Budget**: Masukkan batas anggaran di bagian atas untuk mendapatkan peringatan visual
5. **Lihat Visualisasi**: Pie chart akan otomatis menampilkan proporsi pengeluaran per kategori
6. **Toggle Tema**: Klik tombol 🌙/☀️ di pojok kanan atas untuk mengubah tema

## Teknologi

- HTML5
- CSS3 (dengan CSS Variables untuk theming)
- Vanilla JavaScript (ES6+)
- Chart.js v4 (via CDN)
- Local Storage API

## Struktur File

\\\
.
├── index.html          # Struktur HTML aplikasi
├── css/
│   └── style.css       # Styling dan tema
└── js/
    └── script.js       # Logika aplikasi
\\\

## Fitur Validasi

- Nama transaksi: 1-100 karakter
- Jumlah: 0.01 - 999.999.999,99
- Kategori kustom: 1-50 karakter, tidak duplikat
- Budget limit: 0 - 999.999.999

## Browser Support

- Chrome (versi terbaru)
- Firefox (versi terbaru)
- Edge (versi terbaru)
- Safari (versi terbaru)

## Catatan

- Data disimpan secara lokal di browser menggunakan Local Storage
- Tidak ada backend atau server yang diperlukan
- Data tetap tersimpan setelah browser ditutup
- Chart.js dimuat dari CDN jsDelivr

## Lisensi

Proyek ini dibuat untuk keperluan pembelajaran.
