
# Project Design & Planning

**Mata Kuliah:** Kapita Selekta Program Studi S1 Rekayasa Perangkat Lunak

## Kelompok 3

| Nama | NIM |
|--------|--------|
| Satria Ramadhan | 2311104026 |
| Muhammad Mahrus Ali | 2311104006 |
| M. Zaky Hadiyan Saputra | 20104059 |

Tahun Akademik 2025/2026

---

# 1. Latar Belakang

Di era digital saat ini, proses rekrutmen kerja semakin kompetitif dan menuntut kandidat untuk memiliki Curriculum Vitae (CV) yang terstruktur, profesional, dan sesuai dengan kebutuhan industri.

CV merupakan dokumen penting yang menjadi tahap awal penilaian oleh perusahaan dalam proses seleksi kerja. Namun, masih banyak pencari kerja, khususnya mahasiswa dan fresh graduate, yang mengalami kesulitan dalam menyusun CV yang efektif dan sesuai standar rekrutmen.

Permasalahan ini sering terjadi karena kurangnya pemahaman mengenai format CV yang baik, kesalahan dalam penulisan pengalaman kerja, penggunaan kata-kata yang kurang profesional, serta ketidaksesuaian antara isi CV dengan posisi pekerjaan yang dilamar.

Di sisi lain, proses evaluasi CV secara manual oleh recruiter memerlukan waktu yang cukup lama, terutama ketika perusahaan menerima ratusan hingga ribuan lamaran.

Perkembangan teknologi Artificial Intelligence (AI) dan Natural Language Processing (NLP) membuka peluang besar untuk menghadirkan solusi otomatis dalam proses evaluasi CV.

Berdasarkan kondisi tersebut, pengembangan aplikasi berbasis web yang mampu menilai kualitas CV secara otomatis menggunakan AI menjadi sangat relevan. Sistem ini diharapkan dapat membantu pengguna dalam mengevaluasi CV mereka sebelum dikirimkan ke perusahaan.

---

# 2. Rumusan Masalah

1. Bagaimana merancang dan membangun aplikasi berbasis web yang dapat melakukan penilaian CV secara otomatis?
2. Bagaimana mengintegrasikan Artificial Intelligence untuk menganalisis kualitas isi dan struktur CV?
3. Bagaimana sistem memberikan skor penilaian serta rekomendasi perbaikan yang relevan?
4. Bagaimana mengukur tingkat akurasi dan efektivitas sistem?
5. Bagaimana memastikan aplikasi mudah digunakan oleh mahasiswa dan fresh graduate?

---

# 3. Tujuan Proyek

## Tujuan Umum

Mengembangkan aplikasi web berbasis Artificial Intelligence yang mampu menganalisis, menilai, dan memberikan rekomendasi perbaikan terhadap Curriculum Vitae secara otomatis.

## Tujuan Khusus

1. Merancang arsitektur sistem yang terintegrasi dengan AI.
2. Mengembangkan fitur unggah CV PDF dan DOCX.
3. Mengimplementasikan ekstraksi teks dari dokumen CV.
4. Mengembangkan analisis berbasis NLP.
5. Mengembangkan algoritma penilaian CV.
6. Menghasilkan skor evaluasi otomatis.
7. Menyediakan feedback dan rekomendasi perbaikan.
8. Melakukan pengujian performa sistem.
9. Mengevaluasi usability aplikasi.

---

# 4. Studi Literatur

## 4.1 Artificial Intelligence dalam Sistem Rekrutmen

Artificial Intelligence memungkinkan mesin melakukan analisis data dan pengambilan keputusan secara otomatis.

### Keunggulan

- Efisiensi waktu seleksi
- Objektivitas penilaian
- Skalabilitas tinggi
- Analisis data dalam jumlah besar

### Tantangan

- Akurasi model
- Kualitas data

## 4.2 Natural Language Processing

NLP memungkinkan komputer memahami bahasa manusia.

Digunakan untuk:

- Text Classification
- Information Extraction
- Semantic Analysis
- Document Summarization

Dalam evaluasi CV, NLP digunakan untuk:

- Mengekstrak informasi penting
- Menilai profesionalitas bahasa
- Mengidentifikasi kata kunci
- Menilai relevansi konten

## 4.3 Applicant Tracking System (ATS)

Kelemahan ATS:

- Hanya keyword matching
- Tidak memahami konteks
- Tidak memberikan feedback

## 4.4 Gap Analysis

| Solusi | Kekurangan |
|----------|----------|
| ATS Tradisional | Hanya keyword matching |
| Sistem lama | Tidak interaktif |
| Platform komersial | Berbayar |
| NLP sederhana | Analisis terbatas |

Gap utama:

- Gratis
- Mudah diakses
- Analisis komprehensif
- Rekomendasi detail
- Cocok untuk mahasiswa dan fresh graduate

---

# 5. Requirement Engineering

## 5.1 Stakeholder

| Stakeholder | Peran | Kebutuhan |
|------------|--------|-----------|
| User | Upload CV dan menerima analisis | Cepat dan mudah digunakan |
| Admin | Monitoring sistem | Dashboard dan log |
| AI Service | Analisis CV | Input terstruktur |

## 5.2 User Stories

Sebagai seseorang yang ingin melamar pekerjaan, saya ingin mengetahui kualitas CV yang saya buat agar dapat meningkatkan peluang diterima bekerja.

## 5.3 Use Case

### User

- Registrasi
- Login
- Upload CV
- Melihat hasil analisis
- Melihat rekomendasi
- Mengunduh hasil
- Melihat riwayat

### Admin

- Login
- Dashboard
- Monitoring user
- Monitoring log

### AI Service

- Ekstraksi teks
- Analisis CV
- Memberikan skor
- Memberikan rekomendasi

## 5.4 Functional Requirements

| Kode | Requirement |
|--------|------------|
| FR-01 | Registrasi dan login user |
| FR-02 | Upload PDF/DOCX |
| FR-03 | Ekstraksi teks |
| FR-04 | Identifikasi bagian CV |
| FR-05 | Analisis kualitas CV |
| FR-06 | Menampilkan skor |
| FR-07 | Menampilkan rekomendasi |
| FR-08 | Highlight bagian penting |
| FR-09 | Menyimpan hasil |
| FR-10 | Riwayat analisis |
| FR-11 | Notifikasi error |
| FR-12 | Dashboard admin |

## 5.5 Non Functional Requirements

| Kode | Kategori | Requirement |
|--------|----------|------------|
| NFR-01 | Performance | Maksimal 10 detik |
| NFR-02 | Performance | 50 request/jam |
| NFR-03 | Security | HTTPS |
| NFR-04 | Security | Akses terbatas |
| NFR-05 | Privacy | Data minimal |
| NFR-06 | Reliability | Error handling |
| NFR-07 | Usability | Mudah digunakan |
| NFR-08 | Usability | Responsive |
| NFR-09 | Scalability | Mudah dikembangkan |
| NFR-10 | Maintainability | Mudah dimodifikasi |
| NFR-11 | Auditability | Logging |
| NFR-12 | Accuracy | Konsisten |

---

# 6. Desain Sistem

## 6.1 Arsitektur Sistem

### Teknologi

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- OpenAI API
- Vercel

## 6.2 Komponen Utama

| Komponen | Tanggung Jawab |
|-----------|---------------|
| Next.js App | Frontend dan API |
| Supabase Auth | Autentikasi |
| Supabase Storage | Penyimpanan CV |
| CV Parser | Ekstraksi teks |
| OpenAI Service | Analisis CV |
| Results Module | Menampilkan hasil |
| Admin Dashboard | Monitoring |
| Supabase Database | Menyimpan data |

## 6.3 Alur Aplikasi

1. User login menggunakan Supabase Auth.
2. User mengunggah CV.
3. File disimpan pada Supabase Storage.
4. Sistem melakukan ekstraksi teks.
5. Teks dikirim ke OpenAI API.
6. OpenAI menghasilkan skor dan rekomendasi.
7. Hasil disimpan ke Supabase PostgreSQL.
8. Dashboard menampilkan hasil kepada pengguna.

---

# 7. Integrasi Teknologi

## Frontend & Backend

Framework utama menggunakan Next.js 15 dengan App Router.

Keunggulan:

- Fullstack Framework
- Server Side Rendering
- Route Handlers
- SEO Friendly
- High Performance

## Database

Menggunakan Supabase PostgreSQL.

Data yang disimpan:

- User
- CV
- Analysis Result
- Recommendation
- Log Aktivitas

## Authentication

Menggunakan Supabase Auth.

Fitur:

- Email & Password
- Session Management
- JWT
- Row Level Security

## File Storage

Menggunakan Supabase Storage untuk menyimpan dokumen CV.

## AI Service

Menggunakan OpenAI API untuk:

- Analisis CV
- Pemberian skor
- Rekomendasi perbaikan

---

# 8. Rencana Pengembangan

| Tahap | Aktivitas | Durasi |
|---------|----------|---------|
| Analisis Kebutuhan | Studi Literatur | Minggu 1 |
| Desain Sistem | UML & Database | Minggu 1-2 |
| UI/UX | Wireframe | Minggu 2 |
| Implementasi Frontend | Next.js | Minggu 3-4 |
| Implementasi Backend | Route Handler | Minggu 4-5 |
| Integrasi AI | OpenAI API | Minggu 5-6 |
| Integrasi Supabase | Database & Auth | Minggu 6 |
| Testing | Pengujian Sistem | Minggu 7 |
| Finalisasi | Dokumentasi | Minggu 8 |

## Pembagian Tugas

| Nama | Tanggung Jawab |
|--------|---------------|
| Satria Ramadhan | Backend, Database, Supabase |
| Muhammad Mahrus Ali | Frontend, UI/UX |
| M. Zaky Hadiyan Saputra | AI Integration, Testing |

## Target MVP

- Registrasi/Login
- Upload CV
- Analisis CV
- Skor Evaluasi
- Rekomendasi
- Riwayat Analisis

---

# 9. Kesimpulan

AI-Based CV Assessment Website merupakan solusi berbasis Artificial Intelligence yang dirancang untuk membantu mahasiswa dan fresh graduate meningkatkan kualitas Curriculum Vitae mereka sebelum melamar pekerjaan.

Melalui integrasi Next.js, Supabase, dan OpenAI API, sistem mampu memberikan analisis CV secara otomatis, objektif, dan real-time. Selain membantu pencari kerja, aplikasi ini juga berpotensi mendukung institusi pendidikan dalam meningkatkan kesiapan karier mahasiswa.