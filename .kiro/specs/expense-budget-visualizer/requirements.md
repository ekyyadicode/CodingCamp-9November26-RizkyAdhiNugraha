# Requirements Document

## Introduction

Expense & Budget Visualizer adalah aplikasi web berbasis client-side yang memungkinkan pengguna mencatat, mengelola, dan memvisualisasikan pengeluaran pribadi mereka. Aplikasi ini dibangun menggunakan HTML, CSS, dan Vanilla JavaScript tanpa framework, dengan data yang disimpan secara lokal menggunakan Local Storage API. Desain menggunakan palet warna Merah Muda (Pink), Teal, dan Krem (Cream) dengan layout berbasis card. Aplikasi mencakup fitur pencatatan transaksi, visualisasi pie chart, ringkasan bulanan, pengelolaan kategori kustom, pengurutan transaksi, batas anggaran, dan mode gelap/terang.

## Glossary

- **Application**: Aplikasi web Expense & Budget Visualizer yang berjalan di browser
- **Transaction**: Satu catatan pengeluaran yang terdiri dari nama, jumlah (amount), kategori, dan tanggal pencatatan
- **Category**: Kelompok pengeluaran (misalnya Food, Transport, Fun) yang digunakan untuk mengklasifikasikan transaksi
- **Custom_Category**: Kategori baru yang ditambahkan oleh pengguna di luar kategori default
- **Balance**: Total akumulasi seluruh jumlah transaksi yang tercatat
- **Budget_Limit**: Batas maksimum pengeluaran yang ditetapkan oleh pengguna sebagai ambang peringatan
- **Monthly_Summary**: Ringkasan total pengeluaran yang diakumulasi dari transaksi pada bulan dan tahun berjalan
- **Transaction_List**: Daftar seluruh transaksi yang telah dicatat dan ditampilkan kepada pengguna
- **Pie_Chart**: Visualisasi grafis lingkaran yang menampilkan proporsi pengeluaran berdasarkan kategori
- **Storage**: Local Storage API browser yang digunakan untuk menyimpan data transaksi, kategori, budget limit, dan preferensi tema
- **Dark_Mode**: Tema tampilan gelap yang menggantikan tema terang (Light_Mode) default
- **Light_Mode**: Tema tampilan terang default dengan latar belakang warna Krem
- **Sort_Order**: Urutan tampilan transaksi berdasarkan kriteria tertentu (harga atau kategori)
- **Form**: Formulir input "Add Transaction" untuk memasukkan data transaksi baru
- **Validator**: Komponen yang memvalidasi input Form sebelum transaksi disimpan

## Requirements

### Requirement 1: Struktur File dan Teknologi

**User Story:** As a developer, I want the application to use a standard three-file structure with Vanilla JavaScript, so that the codebase is easy to maintain and runs without any build tools or framework dependencies.

#### Acceptance Criteria

1. THE Application SHALL consist of exactly three files: `index.html`, `css/style.css`, dan `js/script.js`
2. THE Application SHALL use only HTML, CSS, dan Vanilla JavaScript tanpa framework atau library eksternal, kecuali Chart.js untuk visualisasi grafik
3. THE Application SHALL load Chart.js melalui CDN script tag di dalam `index.html`
4. IF Chart.js gagal dimuat dari CDN, THEN THE Application SHALL menampilkan pesan informatif kepada pengguna bahwa grafik tidak tersedia sementara fungsionalitas pencatatan transaksi tetap berjalan normal
5. THE Application SHALL dapat dijalankan langsung di browser modern terkini (Chrome, Firefox, Edge) tanpa memerlukan proses build, kompilasi, atau instalasi dependensi apapun

---

### Requirement 2: Penyimpanan Data dengan Local Storage

**User Story:** As a user, I want my transaction data to persist after closing and reopening the browser, so that I don't lose my expense records.

#### Acceptance Criteria

1. WHEN pengguna menambahkan sebuah Transaction, THE Storage SHALL menyimpan seluruh daftar transaksi ke Local Storage dalam format JSON
2. WHEN pengguna menghapus sebuah Transaction, THE Storage SHALL memperbarui data di Local Storage agar mencerminkan penghapusan tersebut
3. WHEN pengguna membuka atau me-refresh halaman Application, THE Application SHALL memuat ulang data transaksi dari Local Storage dan menampilkannya; IF data transaksi di Local Storage tidak dapat dibaca atau bukan format JSON yang valid, THEN THE Application SHALL mengabaikan data tersebut dan menampilkan daftar transaksi kosong dengan nilai Balance sebesar nol
4. WHEN pengguna menambahkan sebuah Custom_Category, THE Storage SHALL menyimpan daftar kategori kustom ke Local Storage dengan maksimum 50 Custom_Category
5. WHEN pengguna mengatur Budget_Limit, THE Storage SHALL menyimpan nilai Budget_Limit ke Local Storage, dimana nilai Budget_Limit harus berada dalam rentang 0,01 hingga 999.999.999,99
6. WHEN pengguna mengubah tema (Dark_Mode atau Light_Mode), THE Storage SHALL menyimpan preferensi tema ke Local Storage; IF tidak ada preferensi tema yang tersimpan di Local Storage, THEN THE Application SHALL menampilkan tampilan dengan tema Light_Mode sebagai default
7. WHEN pengguna membuka Application untuk pertama kali tanpa data tersimpan, THE Application SHALL menampilkan daftar transaksi kosong dan nilai Balance sebesar nol
8. IF Local Storage tidak tersedia atau kapasitas Local Storage telah penuh saat THE Storage mencoba menyimpan data, THEN THE Application SHALL menampilkan pesan error yang mengindikasikan kegagalan penyimpanan dan mempertahankan data yang sudah tersimpan sebelumnya tanpa perubahan

---

### Requirement 3: Tampilan Layout dan Desain UI

**User Story:** As a user, I want a clean and visually appealing card-based layout with a consistent color palette, so that the application is comfortable and easy to read.

#### Acceptance Criteria

1. WHILE Light_Mode is active, THE Application SHALL display the page background in cream color
2. THE Application SHALL display each card with white or light cream background and a subtle box-shadow
3. THE Application SHALL display the first card at the top containing the title "Expense & Budget Visualizer", label "TOTAL BALANCE", and the Balance value in large font size with teal color
4. THE Application SHALL display the second card in the middle containing the "Add Transaction" form
5. THE Application SHALL display the third card at the bottom using a two-column grid layout with Transaction_List in the left column and Pie_Chart in the right column
6. IF Balance value is negative, THEN THE Application SHALL display the Balance value in red color instead of teal
7. WHILE Light_Mode is inactive (Dark_Mode active), THE Application SHALL display the page background in dark color
8. THE Application SHALL display each card with minimum 16 pixels spacing between consecutive cards vertically

---

### Requirement 4: Formulir Tambah Transaksi

**User Story:** As a user, I want to add a new expense transaction using a form, so that I can record my spending with a name, amount, and category.

#### Acceptance Criteria

1. THE Form SHALL menyediakan input teks untuk nama transaksi dengan panjang maksimal 100 karakter, input angka untuk jumlah (amount) dengan rentang nilai 0.01 hingga 999.999.999,99, dan dropdown untuk memilih Category
2. THE Form SHALL menyediakan dropdown Category dengan pilihan default: Food, Transport, dan Fun
3. THE Form SHALL menyediakan tombol submit dengan lebar penuh (full-width)
4. WHEN pengguna mengklik tombol submit dengan satu atau lebih field kosong, THE Validator SHALL mencegah penyimpanan transaksi dan menampilkan pesan error secara inline di bawah setiap field yang kosong
5. WHEN pengguna mengklik tombol submit dengan semua field terisi valid, THE Application SHALL menyimpan Transaction baru, memperbarui Transaction_List, memperbarui nilai Balance, memperbarui Pie_Chart, dan me-reset Form ke kondisi kosong
6. WHEN pengguna mengisi field amount dengan nilai yang bukan angka, sama dengan nol, bernilai negatif, atau melebihi 999.999.999,99, THE Validator SHALL mencegah penyimpanan transaksi dan menampilkan pesan error secara inline di bawah field amount

---

### Requirement 5: Daftar Riwayat Transaksi

**User Story:** As a user, I want to see a list of all my recorded transactions with their details, so that I can review and manage my expense history.

#### Acceptance Criteria

1. THE Transaction_List SHALL menampilkan setiap Transaction dengan informasi: nama transaksi (maksimal 100 karakter), jumlah dalam format mata uang dengan warna Teal, badge nama Category, dan tombol "Delete" berwarna Merah Muda, diurutkan berdasarkan waktu pencatatan dari yang terbaru ke yang terlama
2. WHEN pengguna mengklik tombol "Delete" pada sebuah Transaction, THE Application SHALL menghapus Transaction tersebut dari Transaction_List, memperbarui nilai Balance, memperbarui Pie_Chart, dan memperbarui data di Storage
3. IF Storage tidak tersedia saat halaman dimuat, THEN THE Application SHALL menampilkan Transaction_List kosong tanpa menampilkan data transaksi
4. IF Transaction_List tidak memiliki Transaction tersimpan, THEN THE Application SHALL menampilkan pesan indikasi bahwa belum ada transaksi yang tercatat
5. WHEN halaman dimuat, THE Application SHALL menampilkan seluruh Transaction yang tersimpan di Storage sehingga jumlah Transaction yang tampil sama dengan jumlah Transaction yang tersimpan di Storage

---

### Requirement 6: Visualisasi Pie Chart

**User Story:** As a user, I want to see a pie chart showing my spending breakdown by category, so that I can understand where my money goes visually.

#### Acceptance Criteria

1. THE Pie_Chart SHALL menampilkan setiap Category yang memiliki minimal satu transaksi sebagai slice tersendiri, di mana setiap slice menampilkan nama Category dan persentase kontribusinya terhadap total pengeluaran dibulatkan ke satu desimal
2. THE Pie_Chart SHALL menggunakan kombinasi warna Merah Muda, Teal, dan Krem secara berulang (cycling) untuk setiap slice, sehingga Category ke-N mendapatkan warna pada posisi ((N-1) mod 3) + 1 dari urutan tersebut
3. WHEN sebuah Transaction ditambahkan atau dihapus, THE Pie_Chart SHALL diperbarui secara otomatis dalam waktu kurang dari 1 detik tanpa perlu me-refresh halaman
4. WHEN tidak ada transaksi yang tercatat, THE Pie_Chart SHALL menampilkan pesan yang menyatakan bahwa belum ada data pengeluaran untuk ditampilkan, tanpa menampilkan slice apapun
5. THE Pie_Chart SHALL diberi judul "Spending by Category"

---

### Requirement 7: Kategori Kustom

**User Story:** As a user, I want to add my own custom spending categories beyond the defaults, so that I can organize my expenses according to my personal needs.

#### Acceptance Criteria

1. THE Form SHALL menyediakan input teks dan tombol tambah di dekat dropdown Category agar pengguna dapat menambahkan Custom_Category baru
2. WHEN pengguna memasukkan nama kategori baru yang tidak kosong, tidak hanya berisi spasi, dan panjangnya antara 1 hingga 50 karakter, lalu mengklik tombol tambah, THE Application SHALL menambahkan Custom_Category ke bagian bawah daftar dropdown Category dan menyimpannya ke Storage
3. IF nama Custom_Category yang dimasukkan pengguna hanya berisi spasi atau kosong, THEN THE Application SHALL mencegah penambahan dan menampilkan pesan yang mengindikasikan bahwa nama kategori tidak boleh kosong
4. WHEN pengguna memasukkan nama Custom_Category yang sudah ada (tidak case-sensitive), THE Application SHALL mencegah penambahan duplikat dan menampilkan pesan yang mengindikasikan bahwa kategori tersebut sudah ada
5. IF pengguna memasukkan nama Custom_Category yang panjangnya melebihi 50 karakter, THEN THE Application SHALL mencegah penambahan dan menampilkan pesan yang mengindikasikan batas maksimum panjang nama kategori
6. WHEN pengguna membuka Application setelah sebelumnya menambahkan Custom_Category, THE Application SHALL memuat dan menampilkan semua Custom_Category yang tersimpan di dalam dropdown Category
7. IF jumlah Custom_Category yang tersimpan telah mencapai 50 kategori, THEN THE Application SHALL mencegah penambahan kategori baru dan menampilkan pesan yang mengindikasikan batas maksimum Custom_Category telah tercapai

---

### Requirement 8: Ringkasan Bulanan

**User Story:** As a user, I want to see a summary of my total spending for the current month, so that I can monitor my monthly budget progress.

#### Acceptance Criteria

1. WHEN pengguna membuka halaman Application, THE Application SHALL menampilkan Monthly_Summary berupa total pengeluaran dari seluruh Transaction yang dicatat pada bulan dan tahun kalender berjalan berdasarkan tanggal sistem, dengan nilai Rp 0 jika tidak ada Transaction pada bulan berjalan
2. WHEN sebuah Transaction ditambahkan atau dihapus, THE Application SHALL memperbarui nilai Monthly_Summary dalam waktu tidak lebih dari 1 detik setelah perubahan tersebut tersimpan
3. WHEN pengguna membuka halaman Application, THE Application SHALL menampilkan label nama bulan dan tahun berjalan berdampingan dengan nilai Monthly_Summary

---

### Requirement 9: Pengurutan Transaksi

**User Story:** As a user, I want to sort my transaction list by price or category, so that I can find and analyze my expenses more easily.

#### Acceptance Criteria

1. THE Application SHALL menyediakan dropdown Sort_Order di atas Transaction_List dengan tepat empat pilihan: urutan default (terbaru berdasarkan tanggal transaksi, jika tanggal sama maka diurutkan berdasarkan waktu pencatatan terbaru), berdasarkan harga (tinggi ke rendah, jika harga sama maka diurutkan berdasarkan tanggal transaksi terbaru), berdasarkan harga (rendah ke tinggi, jika harga sama maka diurutkan berdasarkan tanggal transaksi terbaru), dan berdasarkan kategori (A-Z tidak case-sensitive, jika kategori sama maka diurutkan berdasarkan tanggal transaksi terbaru)
2. WHEN pengguna memilih sebuah Sort_Order, THE Transaction_List SHALL menampilkan ulang seluruh transaksi sesuai Sort_Order yang dipilih dalam waktu kurang dari 300 milidetik
3. WHEN sebuah Transaction ditambahkan atau dihapus saat Sort_Order aktif bukan default, THE Transaction_List SHALL tetap menerapkan Sort_Order yang sedang aktif terhadap daftar transaksi yang telah diperbarui

---

### Requirement 10: Batas Anggaran (Budget Limit)

**User Story:** As a user, I want to set a budget limit so that I get a visual warning when my total spending exceeds the threshold I defined.

#### Acceptance Criteria

1. THE Application SHALL menyediakan input angka agar pengguna dapat mengatur nilai Budget_Limit dengan rentang nilai antara 0 hingga 999.999.999
2. IF pengguna memasukkan nilai Budget_Limit berupa angka negatif atau bukan angka, THEN THE Application SHALL menolak input tersebut dan menampilkan pesan kesalahan yang menginformasikan bahwa nilai harus berupa angka positif
3. WHEN nilai Balance melebihi nilai Budget_Limit yang telah ditetapkan dan Budget_Limit lebih besar dari nol, THE Application SHALL mengubah warna teks nilai Balance dari Teal menjadi Merah
4. WHEN nilai Balance sama dengan atau di bawah nilai Budget_Limit, THE Application SHALL menampilkan warna teks nilai Balance dalam warna Teal normal
5. WHEN Budget_Limit diatur dengan nilai nol atau kolom Budget_Limit dibiarkan kosong, THE Application SHALL menampilkan warna teks nilai Balance dalam warna Teal normal tanpa memunculkan peringatan

---

### Requirement 11: Mode Gelap dan Terang (Dark/Light Mode)

**User Story:** As a user, I want to toggle between dark and light mode, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Application SHALL menyediakan tombol toggle Dark_Mode atau Light_Mode yang ditempatkan di pojok kanan atas layar pada posisi fixed sehingga tetap terlihat saat pengguna melakukan scroll
2. WHEN pengguna mengklik tombol toggle, THE Application SHALL beralih antara Dark_Mode dan Light_Mode dalam waktu tidak lebih dari 300 milidetik dan segera menyimpan preferensi tema ke Storage
3. WHILE Dark_Mode aktif, THE Application SHALL menampilkan seluruh elemen UI (background, card, teks, ikon, komponen interaktif) dengan tema gelap di mana aksen warna Teal dan Merah Muda memiliki rasio kontras minimal 4.5:1 terhadap warna background sesuai standar WCAG AA
4. WHILE Light_Mode aktif, THE Application SHALL menampilkan seluruh elemen UI (background, card, teks, ikon, komponen interaktif) dengan latar belakang warna Krem di mana aksen warna Teal dan Merah Muda memiliki rasio kontras minimal 4.5:1 terhadap warna background sesuai standar WCAG AA
5. WHEN pengguna membuka Application, IF preferensi tema tersimpan ada di Storage, THEN THE Application SHALL memuat dan menerapkan preferensi tema tersebut sebelum konten pertama kali dirender
6. IF Storage tidak tersedia saat Application dimuat, THEN THE Application SHALL menampilkan tampilan dengan tema Light_Mode sebagai default tanpa menampilkan pesan error terkait tema
