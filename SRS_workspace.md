# 📋 SRS — IT Asset & Knowledge Management System
> **Vibecode Reference Document** · Stack: Next.js · Prisma · PostgreSQL · Strapi CMS

---

## 0. Cara Baca Dokumen Ini

Dokumen ini adalah **Software Requirements Specification (SRS)** yang dirancang sebagai panduan vibecode step-by-step. Setiap section disusun berurutan — dari konteks bisnis → arsitektur → skema DB → fitur per halaman → API contract → urutan implementasi.

> ⚡ **Prinsip vibecode**: Baca satu section, implementasi sampai selesai dan bisa di-test, baru lanjut section berikutnya. Jangan skip.

---

## 1. Latar Belakang & Tujuan Sistem

### 1.1 Konteks Bisnis

Tim IT di sebuah perusahaan (QA/Developer environment) membutuhkan sistem terpusat untuk:

1. **Manajemen aset** — Inventaris laptop, mobile device testing, monitor, server, dan periferal lainnya.
2. **Peminjaman aset** — Karyawan bisa mengajukan pinjam aset; IT Admin menyetujui/menolak.
3. **Pelaporan kerusakan** — Karyawan melaporkan issue pada aset yang dipinjam (mirip bug tracker internal).
4. **Knowledge Base** — Dokumentasi SOP jaringan, panduan troubleshooting, dan kebijakan peminjaman yang bisa dibaca semua karyawan.

### 1.2 Tujuan Sistem

| No | Tujuan | Indikator Keberhasilan |
|----|--------|----------------------|
| T1 | Menggantikan pencatatan manual (spreadsheet/kertas) | Semua transaksi peminjaman tercatat di database |
| T2 | Transparansi status aset real-time | Status AVAILABLE/BORROWED/MAINTENANCE update otomatis |
| T3 | Mempercepat pelaporan kerusakan | Karyawan bisa submit issue < 2 menit |
| T4 | Sentralisasi dokumen SOP IT | Artikel terbaru dapat diakses tanpa minta via email |

### 1.3 Batasan Sistem (Out of Scope)

- Tidak menangani procurement / pembelian aset baru
- Tidak terintegrasi dengan sistem HR/payroll
- Tidak memiliki fitur notifikasi email/push (bisa ditambah di v2)

---

## 2. Aktor & Peran

| Aktor | Role Enum | Hak Akses |
|-------|-----------|-----------|
| **Karyawan** | `EMPLOYEE` | Lihat katalog aset, ajukan peminjaman, lapor issue, baca Knowledge Base |
| **IT Admin** | `IT_ADMIN` | Semua akses EMPLOYEE + kelola aset (CRUD), approve/reject peminjaman, update status issue, tulis artikel di CMS |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                      │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────┐
│                  NEXT.JS APP (Port 3000)                 │
│                                                         │
│  ┌─────────────────┐     ┌──────────────────────────┐  │
│  │   Pages/App     │     │    API Routes (/api/*)    │  │
│  │  (React UI)     │────▶│  (Server-side logic)      │  │
│  └─────────────────┘     └──────────┬───────────────┘  │
└─────────────────────────────────────┼───────────────────┘
                                      │
              ┌───────────────────────┼───────────────────┐
              │                       │                   │
┌─────────────▼──────┐   ┌────────────▼────────┐         │
│   PRISMA CLIENT    │   │   STRAPI CMS         │         │
│   (ORM Layer)      │   │   (Port 1337)        │         │
└─────────────┬──────┘   │   Knowledge Base     │         │
              │           │   Articles           │         │
┌─────────────▼──────┐   └────────────┬────────┘         │
│   POSTGRESQL DB    │                │ REST/GraphQL API  │
│   (Port 5432)      │                │ (ditarik ke       │
│   - users          │                │  Next.js pages)   │
│   - assets         │◀───────────────┘                   │
│   - borrow_logs    │                                    │
│   - issues         │                                    │
└────────────────────┘                                    │
```

### 3.1 Pembagian Tanggung Jawab

| Layer | Teknologi | Tanggung Jawab |
|-------|-----------|----------------|
| **Frontend** | Next.js 14 (App Router) | UI/UX, routing, client-side filtering |
| **API Layer** | Next.js API Routes | Business logic, validasi, autentikasi session |
| **ORM** | Prisma | Query database, type-safety, migrasi skema |
| **Database** | PostgreSQL | Persistensi data dinamis (user, aset, log) |
| **CMS** | Strapi v4 | Konten statis/semi-statis (artikel SOP, knowledge base) |
| **Auth** | NextAuth.js | Session management, login, role-based guard |

---

## 4. Skema Database (Prisma)

### 4.1 `schema.prisma` Lengkap

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── USERS ───────────────────────────────────────────────
model User {
  id        String     @id @default(cuid())
  name      String
  email     String     @unique
  password  String     // bcrypt hash
  role      Role       @default(EMPLOYEE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  borrowings BorrowLog[]
  issues     Issue[]
}

// ─── ASSETS ──────────────────────────────────────────────
model Asset {
  id          String   @id @default(cuid())
  name        String
  category    String   // "Mobile Device" | "Laptop" | "Monitor" | "Server" | "Peripheral"
  serialNo    String   @unique
  brand       String?
  description String?
  status      Status   @default(AVAILABLE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  borrowings BorrowLog[]
  issues     Issue[]
}

// ─── BORROW LOGS ─────────────────────────────────────────
model BorrowLog {
  id          String    @id @default(cuid())
  assetId     String
  userId      String
  borrowDate  DateTime  @default(now())
  returnDate  DateTime?
  dueDate     DateTime  // deadline pengembalian
  status      BorrowStatus @default(PENDING)
  notes       String?   // catatan dari peminjam
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  asset Asset @relation(fields: [assetId], references: [id])
  user  User  @relation(fields: [userId], references: [id])
}

// ─── ISSUES ──────────────────────────────────────────────
model Issue {
  id          String     @id @default(cuid())
  title       String
  description String
  status      IssueState @default(OPEN)
  priority    Priority   @default(MEDIUM)
  assetId     String
  reportedBy  String
  resolvedAt  DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  asset Asset @relation(fields: [assetId], references: [id])
  user  User  @relation(fields: [reportedBy], references: [id])
}

// ─── ENUMS ───────────────────────────────────────────────
enum Role {
  EMPLOYEE
  IT_ADMIN
}

enum Status {
  AVAILABLE
  BORROWED
  MAINTENANCE
}

enum BorrowStatus {
  PENDING    // menunggu persetujuan IT Admin
  APPROVED   // disetujui, aset sedang dipinjam
  REJECTED   // ditolak
  RETURNED   // sudah dikembalikan
}

enum IssueState {
  OPEN
  IN_PROGRESS
  RESOLVED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### 4.2 Relasi Antar Tabel

```
User ──────────────────────────────────────────────────┐
 │ 1                                                   │ 1
 │                                                     │
 ▼ N                                                   ▼ N
BorrowLog ──── N:1 ────▶ Asset ◀──── N:1 ──── Issue
```

- `User` → `BorrowLog` : One-to-Many (1 user bisa punya banyak log peminjaman)
- `Asset` → `BorrowLog` : One-to-Many (1 aset bisa dipinjam berkali-kali)
- `User` → `Issue` : One-to-Many (1 user bisa lapor banyak issue)
- `Asset` → `Issue` : One-to-Many (1 aset bisa punya banyak laporan kerusakan)

---

## 5. Struktur Folder Proyek

```
it-asset-management/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Layout dengan sidebar
│   │   ├── page.tsx              # Dashboard Overview
│   │   ├── assets/
│   │   │   ├── page.tsx          # Katalog Aset (tabel + filter)
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Detail Aset
│   │   ├── borrowings/
│   │   │   ├── page.tsx          # Riwayat Peminjaman saya
│   │   │   └── new/
│   │   │       └── page.tsx      # Form Ajukan Peminjaman
│   │   ├── issues/
│   │   │   ├── page.tsx          # Daftar Issue
│   │   │   └── new/
│   │   │       └── page.tsx      # Form Lapor Issue
│   │   └── knowledge-base/
│   │       ├── page.tsx          # Daftar Artikel (dari CMS)
│   │       └── [slug]/
│   │           └── page.tsx      # Detail Artikel
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth handler
│       ├── assets/
│       │   ├── route.ts          # GET (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts      # GET, PUT, DELETE
│       ├── borrowings/
│       │   ├── route.ts          # GET, POST
│       │   └── [id]/
│       │       └── route.ts      # PUT (approve/reject/return)
│       └── issues/
│           ├── route.ts          # GET, POST
│           └── [id]/
│               └── route.ts      # PUT (update status)
│
├── components/
│   ├── ui/                       # Komponen atom (Button, Badge, Input)
│   ├── AssetTable.tsx
│   ├── AssetFilterBar.tsx
│   ├── BorrowForm.tsx
│   ├── IssueForm.tsx
│   ├── StatusBadge.tsx
│   └── Sidebar.tsx
│
├── lib/
│   ├── prisma.ts                 # Singleton Prisma Client
│   ├── auth.ts                   # NextAuth config
│   ├── strapi.ts                 # Strapi fetch helper
│   └── utils.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                   # Data awal untuk dev
│
├── types/
│   └── index.ts                  # TypeScript interfaces
│
├── .env.local                    # ENV variables (jangan di-commit!)
├── next.config.js
└── package.json
```

---

## 6. Halaman & Fitur Detail

### 6.1 Halaman Login (`/login`)

**Aktor**: Semua pengguna

**Deskripsi**: Form login dengan email + password. Setelah berhasil, redirect ke `/` (dashboard).

**Komponen UI**:
- Input email
- Input password (toggle show/hide)
- Button "Masuk"
- Pesan error jika credentials salah

**Logika**:
- Gunakan `NextAuth.js` dengan `CredentialsProvider`
- Password diverifikasi dengan `bcrypt.compare()`
- Session menyimpan `{ id, name, email, role }`

---

### 6.2 Halaman Dashboard (`/`)

**Aktor**: Semua pengguna yang sudah login

**Deskripsi**: Ringkasan statistik dan aktivitas terkini.

**Widget yang Ditampilkan**:

| Widget | Data | Akses |
|--------|------|-------|
| Total Aset | `COUNT(Asset)` | Semua |
| Aset Tersedia | `COUNT(Asset WHERE status=AVAILABLE)` | Semua |
| Peminjaman Aktif | `COUNT(BorrowLog WHERE status=APPROVED)` | Semua |
| Issue Terbuka | `COUNT(Issue WHERE status=OPEN OR IN_PROGRESS)` | Semua |
| Peminjaman Saya | `BorrowLog WHERE userId = session.id` (5 terbaru) | EMPLOYEE |
| Semua Peminjaman Pending | `BorrowLog WHERE status=PENDING` | IT_ADMIN |

---

### 6.3 Halaman Katalog Aset (`/assets`)

**Aktor**: Semua pengguna

**Deskripsi**: Tabel aset yang bisa di-filter dan dicari.

**Fitur Filter**:
- Filter by `category` (dropdown): All / Mobile Device / Laptop / Monitor / Server / Peripheral
- Filter by `status` (tab/pill): All / Available / Borrowed / Maintenance
- Search by `name` atau `serialNo` (input teks, debounce 300ms)

**Kolom Tabel**:
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| Nama Aset | Text | Nama + brand |
| Kategori | Badge | Warna per kategori |
| Serial Number | Text | Monospace font |
| Status | Badge | Warna: hijau/kuning/merah |
| Aksi | Button | "Pinjam" (EMPLOYEE) / "Edit" (IT_ADMIN) |

**Tombol Tambah Aset** (IT_ADMIN only): Membuka modal/form tambah aset.

**Form Tambah/Edit Aset** (IT_ADMIN):
```
- name*        : text input
- category*    : select dropdown
- serialNo*    : text input (unique validation)
- brand        : text input (optional)
- description  : textarea (optional)
- status*      : select (default: AVAILABLE)
```

---

### 6.4 Halaman Detail Aset (`/assets/[id]`)

**Deskripsi**: Informasi lengkap satu aset.

**Section yang Ditampilkan**:
1. **Info Aset** — semua field dari model `Asset`
2. **Riwayat Peminjaman** — tabel `BorrowLog` untuk aset ini (peminjam, tanggal, status)
3. **Riwayat Issue** — tabel `Issue` untuk aset ini (judul, status, priority, tanggal)
4. **Tombol Aksi**:
   - "Pinjam Aset" → redirect ke `/borrowings/new?assetId=xxx` (jika AVAILABLE)
   - "Lapor Kerusakan" → redirect ke `/issues/new?assetId=xxx`
   - "Edit Aset" (IT_ADMIN only)

---

### 6.5 Halaman Pengajuan Peminjaman (`/borrowings/new`)

**Aktor**: EMPLOYEE, IT_ADMIN

**Deskripsi**: Form mengajukan peminjaman aset.

**Field Form**:
```
- assetId*     : hidden (dari query param) atau select dropdown aset AVAILABLE
- dueDate*     : date picker (minimum: besok)
- notes        : textarea (alasan/keperluan peminjaman)
```

**Logika Submit**:
1. POST ke `/api/borrowings`
2. Server validasi: aset harus berstatus `AVAILABLE`
3. Buat `BorrowLog` dengan `status: PENDING`
4. Tampilkan pesan sukses: "Pengajuan peminjaman berhasil dikirim, menunggu persetujuan IT Admin"

---

### 6.6 Halaman Daftar Peminjaman (`/borrowings`)

**EMPLOYEE view**: Hanya menampilkan peminjaman milik user yang login.

**IT_ADMIN view**: Menampilkan semua peminjaman dengan tab:
- **Pending** — perlu action approve/reject
- **Aktif** — sedang dipinjam
- **Selesai** — sudah dikembalikan/ditolak

**Aksi per Row**:

| Aksi | Siapa | Kondisi |
|------|-------|---------|
| Approve | IT_ADMIN | Status = PENDING |
| Reject | IT_ADMIN | Status = PENDING |
| Tandai Dikembalikan | IT_ADMIN | Status = APPROVED |
| Lihat Detail | Semua | Selalu |

**Saat Approve**: Status `BorrowLog` → `APPROVED`, Status `Asset` → `BORROWED`

**Saat Tandai Dikembalikan**: Status `BorrowLog` → `RETURNED`, `returnDate` diisi `now()`, Status `Asset` → `AVAILABLE`

---

### 6.7 Halaman Issue Tracker (`/issues`)

**Deskripsi**: Daftar semua laporan kerusakan/masalah aset.

**Filter**:
- Filter by `status`: All / Open / In Progress / Resolved
- Filter by `priority`: All / Low / Medium / High / Critical

**Kolom Tabel**:
| Kolom | Keterangan |
|-------|------------|
| Judul Issue | Klik untuk buka detail |
| Aset Terdampak | Nama aset yang dilaporkan |
| Dilaporkan Oleh | Nama user |
| Priority | Badge berwarna |
| Status | Badge berwarna |
| Tanggal | `createdAt` |

**Form Lapor Issue** (`/issues/new`):
```
- title*       : text input (max 100 char)
- assetId*     : select dropdown (semua aset)
- priority*    : select (LOW / MEDIUM / HIGH / CRITICAL)
- description* : textarea (detail masalah)
```

**Update Status Issue** (IT_ADMIN):
- Dropdown inline di tabel atau halaman detail
- Transisi: `OPEN` → `IN_PROGRESS` → `RESOLVED`
- Saat `RESOLVED`: `resolvedAt` diisi `now()`

---

### 6.8 Halaman Knowledge Base (`/knowledge-base`)

**Sumber Data**: Strapi CMS (bukan Prisma)

**Deskripsi**: Daftar artikel dokumentasi IT yang ditulis admin di Strapi.

**Tampilan**: Grid kartu artikel, masing-masing menampilkan:
- Thumbnail (opsional)
- Judul artikel
- Kategori (SOP Jaringan / Troubleshooting / Kebijakan / Tutorial)
- Tanggal publish
- Ringkasan singkat

**Halaman Detail Artikel** (`/knowledge-base/[slug]`):
- Render konten rich text dari Strapi
- Navigasi breadcrumb
- Tombol "Kembali ke Knowledge Base"

**Strapi Content Type yang Dibutuhkan**:
```
Collection: Article
Fields:
  - title       (Text)
  - slug        (UID, from title)
  - category    (Enumeration: SOP_JARINGAN | TROUBLESHOOTING | KEBIJAKAN | TUTORIAL)
  - content     (Rich Text / Blocks)
  - summary     (Text, max 200 char)
  - thumbnail   (Media, optional)
  - publishedAt (auto via Strapi draft/publish)
```

---

## 7. API Contract

### 7.1 Asset Endpoints

```
GET    /api/assets              → List semua aset (support query: ?category=&status=&search=)
POST   /api/assets              → Buat aset baru [IT_ADMIN]
GET    /api/assets/:id          → Detail satu aset + borrowings + issues
PUT    /api/assets/:id          → Update aset [IT_ADMIN]
DELETE /api/assets/:id          → Hapus aset [IT_ADMIN] (soft delete / validasi tidak sedang dipinjam)
```

### 7.2 Borrowing Endpoints

```
GET    /api/borrowings          → List peminjaman (EMPLOYEE: milik sendiri | IT_ADMIN: semua)
POST   /api/borrowings          → Ajukan peminjaman baru
GET    /api/borrowings/:id      → Detail log peminjaman
PUT    /api/borrowings/:id      → Update status (approve/reject/return) [IT_ADMIN]
```

### 7.3 Issue Endpoints

```
GET    /api/issues              → List issue (support query: ?status=&priority=)
POST   /api/issues              → Buat laporan issue baru
GET    /api/issues/:id          → Detail issue
PUT    /api/issues/:id          → Update status issue [IT_ADMIN]
```

### 7.4 Contoh Response Body

**`GET /api/assets` Response**:
```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Laptop Dell XPS 13",
      "category": "Laptop",
      "serialNo": "DL-XPS-2024-001",
      "brand": "Dell",
      "status": "AVAILABLE",
      "createdAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "available": 28,
    "borrowed": 10,
    "maintenance": 4
  }
}
```

**`POST /api/borrowings` Request Body**:
```json
{
  "assetId": "clx...",
  "dueDate": "2024-02-15",
  "notes": "Untuk keperluan testing fitur mobile di project Q1"
}
```

---

## 8. Environment Variables

Buat file `.env.local` di root proyek dengan isi:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/it_asset_db"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Strapi CMS
STRAPI_URL="http://localhost:1337"
STRAPI_API_TOKEN="your-strapi-api-token"
```

---

## 9. Urutan Implementasi (Vibecode Roadmap)

Ikuti urutan ini **step by step**. Jangan lanjut ke fase berikutnya sebelum yang sekarang bisa dijalankan dan di-test.

### ✅ Fase 0 — Setup Project (Est: 30 menit)
- [ ] `npx create-next-app@latest it-asset-management --typescript --tailwind --app`
- [ ] Install dependencies: `prisma`, `@prisma/client`, `next-auth`, `bcryptjs`, `@types/bcryptjs`
- [ ] Init Prisma: `npx prisma init`
- [ ] Setup PostgreSQL lokal (via Docker atau install langsung)
- [ ] Copy `schema.prisma` dari Section 4.1
- [ ] Jalankan `npx prisma migrate dev --name init`
- [ ] Buat `lib/prisma.ts` (singleton client)
- [ ] **TEST**: `npx prisma studio` → pastikan semua tabel terbuat

### ✅ Fase 1 — Autentikasi (Est: 1-2 jam)
- [ ] Buat `lib/auth.ts` dengan `CredentialsProvider` NextAuth
- [ ] Buat `/api/auth/[...nextauth]/route.ts`
- [ ] Buat `prisma/seed.ts` → seed 1 user IT_ADMIN + 2 user EMPLOYEE
- [ ] Jalankan `npx prisma db seed`
- [ ] Buat halaman `/login` dengan form
- [ ] Setup middleware proteksi route (redirect ke login jika belum auth)
- [ ] **TEST**: Login berhasil → redirect ke `/`, logout bersih

### ✅ Fase 2 — Manajemen Aset (Est: 2-3 jam)
- [ ] Buat `GET /api/assets` dengan filter query params
- [ ] Buat `POST /api/assets` (guard: IT_ADMIN only)
- [ ] Buat `PUT /api/assets/:id` dan `DELETE /api/assets/:id`
- [ ] Buat halaman `/assets` dengan tabel + filter bar
- [ ] Buat modal/form tambah & edit aset (IT_ADMIN)
- [ ] Buat halaman `/assets/[id]`
- [ ] Seed beberapa aset dummy
- [ ] **TEST**: CRUD aset berjalan, filter bekerja, role guard aktif

### ✅ Fase 3 — Peminjaman (Est: 2-3 jam)
- [ ] Buat `POST /api/borrowings`
- [ ] Buat `GET /api/borrowings`
- [ ] Buat `PUT /api/borrowings/:id` (approve/reject/return)
- [ ] Buat halaman `/borrowings/new` dengan form
- [ ] Buat halaman `/borrowings` dengan tab Pending/Aktif/Selesai
- [ ] Pastikan status aset update otomatis saat approve/return
- [ ] **TEST**: Flow lengkap: ajukan → approve → kembalikan → aset kembali AVAILABLE

### ✅ Fase 4 — Issue Tracker (Est: 1-2 jam)
- [ ] Buat `POST /api/issues` dan `GET /api/issues`
- [ ] Buat `PUT /api/issues/:id`
- [ ] Buat halaman `/issues` dengan filter status & priority
- [ ] Buat halaman `/issues/new` dengan form
- [ ] **TEST**: Submit issue → IT Admin update status → status berubah di UI

### ✅ Fase 5 — Dashboard (Est: 1 jam)
- [ ] Buat `GET /api/dashboard` yang return semua aggregat count
- [ ] Build halaman `/` dengan widget statistik
- [ ] **TEST**: Widget menampilkan angka yang akurat

### ✅ Fase 6 — Knowledge Base + CMS (Est: 2-3 jam)
- [ ] Install & jalankan Strapi: `npx create-strapi-app@latest cms --quickstart`
- [ ] Buat Content Type `Article` di Strapi admin
- [ ] Generate API Token di Strapi → simpan ke `.env.local`
- [ ] Buat `lib/strapi.ts` helper untuk fetch artikel
- [ ] Buat halaman `/knowledge-base` (fetch dari Strapi)
- [ ] Buat halaman `/knowledge-base/[slug]`
- [ ] **TEST**: Artikel yang dibuat di Strapi muncul di Next.js

### ✅ Fase 7 — Polish & Deploy (Est: 2+ jam)
- [ ] Responsive design (mobile-friendly)
- [ ] Loading states & error handling di semua form
- [ ] Empty states yang informatif
- [ ] Deploy PostgreSQL ke Railway / Supabase
- [ ] Deploy Strapi ke Railway
- [ ] Deploy Next.js ke Vercel
- [ ] Set semua ENV variables di Vercel & Railway

---

## 10. Tech Stack & Versi

```
Next.js          14.x   (App Router)
React            18.x
TypeScript       5.x
Tailwind CSS     3.x
Prisma           5.x
@prisma/client   5.x
next-auth        4.x
bcryptjs         2.x
PostgreSQL       15.x
Strapi           4.x
```

**Rekomendasi UI Component Library** (pilih salah satu):
- `shadcn/ui` — Pilihan utama, unstyled + Tailwind, sangat customizable
- `@radix-ui/react-*` — Jika mau lebih low-level

---

## 11. Catatan Keamanan

| Aspek | Implementasi |
|-------|-------------|
| Password | Hash dengan `bcrypt` (salt rounds: 12) |
| Session | JWT via NextAuth, simpan di httpOnly cookie |
| Role Guard | Validasi `session.user.role` di setiap API route |
| Input Validation | Gunakan `zod` untuk validasi request body |
| SQL Injection | Prisma menggunakan parameterized queries by default |
| CORS | Next.js API routes hanya menerima request dari origin yang sama |

---

## 12. Nilai Portofolio yang Ditonjolkan

```
✦ Decoupled Architecture  → Pemisahan data dinamis (Prisma) vs konten editorial (CMS)
✦ Relational Data Model   → One-to-Many yang nyata: Asset ↔ BorrowLog ↔ Issue
✦ Role-Based Access       → Guard di level API dan UI
✦ Real-World Domain       → Issue Tracker = analog bug tracker di tim QA
✦ Type Safety             → Prisma generated types + TypeScript end-to-end
✦ Full-Stack Next.js      → API routes + React frontend dalam satu codebase
```

---

*SRS ini adalah living document. Update sesuai perubahan requirement saat development.*
