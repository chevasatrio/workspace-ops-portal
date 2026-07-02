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
5. **Notifikasi & Audit** — Jejak aktivitas lengkap dan alert otomatis untuk due date / overdue.
6. **Pelaporan data** — Export riwayat dan visualisasi utilisasi aset untuk kebutuhan manajemen.

### 1.2 Tujuan Sistem

| No | Tujuan | Indikator Keberhasilan |
|----|--------|----------------------|
| T1 | Menggantikan pencatatan manual (spreadsheet/kertas) | Semua transaksi peminjaman tercatat di database |
| T2 | Transparansi status aset real-time | Status AVAILABLE/BORROWED/MAINTENANCE update otomatis |
| T3 | Mempercepat pelaporan kerusakan | Karyawan bisa submit issue < 2 menit |
| T4 | Sentralisasi dokumen SOP IT | Artikel terbaru dapat diakses tanpa minta via email |
| T5 | Keterlacakan penuh (traceability) | Setiap aksi tercatat di audit log dengan timestamp & aktor |
| T6 | Identifikasi aset fisik cepat | Scan QR code → langsung buka halaman detail aset |
| T7 | Pelaporan untuk manajemen | Export CSV + grafik utilisasi aset tersedia |

### 1.3 Batasan Sistem (Out of Scope)

- Tidak menangani procurement / pembelian aset baru
- Tidak terintegrasi dengan sistem HR/payroll
- Tidak memiliki notifikasi push/email (notifikasi in-app saja di v1)

---

## 2. Aktor & Peran

| Aktor | Role Enum | Hak Akses |
|-------|-----------|-----------|
| **Karyawan** | `EMPLOYEE` | Lihat katalog aset, scan QR, ajukan peminjaman, lapor issue, baca Knowledge Base, lihat notifikasi milik sendiri |
| **IT Admin** | `IT_ADMIN` | Semua akses EMPLOYEE + kelola aset (CRUD + bulk import), approve/reject peminjaman, update status issue, kelola jadwal maintenance, lihat audit log, export laporan, tulis artikel di CMS |

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
│   POSTGRESQL DB    │                │ REST API          │
│   (Port 5432)      │                │ (ditarik ke       │
│   - users          │                │  Next.js pages)   │
│   - assets         │◀───────────────┘                   │
│   - borrow_logs    │                                    │
│   - issues         │                                    │
│   - notifications  │                                    │
│   - audit_logs     │                                    │
│   - maintenance    │                                    │
└────────────────────┘                                    │
```

### 3.1 Pembagian Tanggung Jawab

| Layer | Teknologi | Tanggung Jawab |
|-------|-----------|----------------|
| **Frontend** | Next.js 14 (App Router) | UI/UX, routing, client-side filtering, QR render |
| **API Layer** | Next.js API Routes | Business logic, validasi, autentikasi session |
| **ORM** | Prisma | Query database, type-safety, migrasi skema |
| **Database** | PostgreSQL | Persistensi data dinamis (user, aset, log, notif, audit) |
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
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hash
  role      Role     @default(EMPLOYEE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  borrowings    BorrowLog[]
  issues        Issue[]
  notifications Notification[]
  auditLogs     AuditLog[]
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
  qrCode      String?  // base64 QR image atau URL
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  borrowings   BorrowLog[]
  issues       Issue[]
  maintenances MaintenanceSchedule[]
}

// ─── BORROW LOGS ─────────────────────────────────────────
model BorrowLog {
  id          String       @id @default(cuid())
  assetId     String
  userId      String
  borrowDate  DateTime     @default(now())
  returnDate  DateTime?
  dueDate     DateTime     // deadline pengembalian
  status      BorrowStatus @default(PENDING)
  notes       String?      // catatan dari peminjam
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

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

// ─── NOTIFICATIONS ───────────────────────────────────────
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  link      String?          // URL halaman terkait (misal: /borrowings/clx...)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id])
}

// ─── AUDIT LOGS ──────────────────────────────────────────
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String   // "ASSET_CREATED" | "BORROW_APPROVED" | "ISSUE_RESOLVED" | dll
  entity     String   // "Asset" | "BorrowLog" | "Issue"
  entityId   String   // ID record yang diubah
  metadata   Json?    // data tambahan: { before: {...}, after: {...} }
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

// ─── MAINTENANCE SCHEDULE ────────────────────────────────
model MaintenanceSchedule {
  id           String            @id @default(cuid())
  assetId      String
  title        String            // "Service rutin Q1 2025"
  description  String?
  scheduledAt  DateTime          // kapan maintenance dijadwalkan
  completedAt  DateTime?
  status       MaintenanceStatus @default(SCHEDULED)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  asset Asset @relation(fields: [assetId], references: [id])
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

enum NotificationType {
  BORROW_APPROVED    // peminjaman disetujui
  BORROW_REJECTED    // peminjaman ditolak
  BORROW_DUE_SOON   // due date H-1
  BORROW_OVERDUE    // melewati due date
  ISSUE_UPDATED     // status issue berubah
  MAINTENANCE_DUE   // jadwal maintenance tiba
}

enum MaintenanceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### 4.2 Relasi Antar Tabel

```
                         ┌──────────────────┐
                         │      User        │
                         └──┬───┬───┬───┬──┘
                            │1  │1  │1  │1
                     ┌──────┘   │   │   └──────────────┐
                     │N         │N  │N                  │N
               BorrowLog   Issue  Notification      AuditLog
                     │N         │N
              ┌──────┴──────────┴──────┐
              │         Asset          │
              └──────────┬─────────────┘
                         │1
                         │N
                 MaintenanceSchedule
```

- `User` → `BorrowLog` : One-to-Many
- `User` → `Issue` : One-to-Many
- `User` → `Notification` : One-to-Many
- `User` → `AuditLog` : One-to-Many
- `Asset` → `BorrowLog` : One-to-Many
- `Asset` → `Issue` : One-to-Many
- `Asset` → `MaintenanceSchedule` : One-to-Many

---

## 5. Struktur Folder Proyek

```
it-asset-management/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Layout dengan sidebar + notif bell
│   │   ├── page.tsx                  # Dashboard Overview
│   │   ├── assets/
│   │   │   ├── page.tsx              # Katalog Aset (tabel + filter)
│   │   │   ├── import/page.tsx       # Bulk Import CSV [IT_ADMIN]
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Detail Aset + QR code
│   │   │       └── qr/page.tsx       # Halaman QR fullscreen (untuk print/scan)
│   │   ├── borrowings/
│   │   │   ├── page.tsx              # Riwayat Peminjaman
│   │   │   └── new/page.tsx          # Form Ajukan Peminjaman
│   │   ├── issues/
│   │   │   ├── page.tsx              # Daftar Issue
│   │   │   └── new/page.tsx          # Form Lapor Issue
│   │   ├── maintenance/
│   │   │   ├── page.tsx              # Daftar Jadwal Maintenance [IT_ADMIN]
│   │   │   └── new/page.tsx          # Form Tambah Jadwal
│   │   ├── notifications/
│   │   │   └── page.tsx              # Semua Notifikasi
│   │   ├── audit/
│   │   │   └── page.tsx              # Audit Log [IT_ADMIN]
│   │   ├── reports/
│   │   │   └── page.tsx              # Laporan & Export [IT_ADMIN]
│   │   └── knowledge-base/
│   │       ├── page.tsx              # Daftar Artikel (dari Strapi)
│   │       └── [slug]/page.tsx       # Detail Artikel
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── assets/
│       │   ├── route.ts              # GET (list + filter), POST (create)
│       │   ├── import/route.ts       # POST (bulk CSV)
│       │   └── [id]/
│       │       ├── route.ts          # GET, PUT, DELETE
│       │       └── qr/route.ts       # GET (generate/fetch QR)
│       ├── borrowings/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/route.ts         # PUT (approve/reject/return)
│       ├── issues/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/route.ts         # PUT (update status)
│       ├── maintenance/
│       │   ├── route.ts              # GET, POST
│       │   └── [id]/route.ts         # PUT, DELETE
│       ├── notifications/
│       │   ├── route.ts              # GET (milik user login)
│       │   └── [id]/read/route.ts    # PUT (mark as read)
│       ├── audit/route.ts            # GET [IT_ADMIN]
│       └── reports/
│           ├── export/route.ts       # GET → stream CSV
│           └── stats/route.ts        # GET → data grafik utilisasi
│
├── components/
│   ├── ui/                           # Komponen atom (Button, Badge, Input, dll)
│   ├── AssetTable.tsx
│   ├── AssetFilterBar.tsx
│   ├── AssetQRCode.tsx               # Render QR + tombol download/print
│   ├── BorrowForm.tsx
│   ├── IssueForm.tsx
│   ├── NotificationBell.tsx          # Icon bell + dropdown notif
│   ├── NotificationItem.tsx
│   ├── AuditLogTable.tsx
│   ├── MaintenanceForm.tsx
│   ├── ReportChart.tsx               # Grafik utilisasi (Recharts)
│   ├── BulkImportForm.tsx            # Upload + preview CSV
│   ├── StatusBadge.tsx
│   └── Sidebar.tsx
│
├── lib/
│   ├── prisma.ts                     # Singleton Prisma Client
│   ├── auth.ts                       # NextAuth config
│   ├── strapi.ts                     # Strapi fetch helper
│   ├── audit.ts                      # Helper: createAuditLog()
│   ├── notification.ts               # Helper: createNotification()
│   ├── qrcode.ts                     # Helper: generateQR()
│   └── utils.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── types/index.ts
├── .env.local
├── next.config.js
└── package.json
```

---

## 6. Halaman & Fitur Detail

### 6.1 Halaman Login (`/login`)

**Aktor**: Semua pengguna

Form login dengan email + password. Setelah berhasil, redirect ke `/` (dashboard).

**Logika**: `NextAuth.js` dengan `CredentialsProvider`, password diverifikasi `bcrypt.compare()`, session menyimpan `{ id, name, email, role }`.

---

### 6.2 Halaman Dashboard (`/`)

**Aktor**: Semua pengguna yang sudah login

**Widget Statistik**:

| Widget | Data | Akses |
|--------|------|-------|
| Total Aset | `COUNT(Asset)` | Semua |
| Aset Tersedia | `COUNT(Asset WHERE status=AVAILABLE)` | Semua |
| Peminjaman Aktif | `COUNT(BorrowLog WHERE status=APPROVED)` | Semua |
| Issue Terbuka | `COUNT(Issue WHERE status IN [OPEN, IN_PROGRESS])` | Semua |
| Peminjaman Saya (5 terbaru) | `BorrowLog WHERE userId = session.id` | EMPLOYEE |
| Pending Approval | `BorrowLog WHERE status=PENDING` | IT_ADMIN |
| Maintenance Minggu Ini | `MaintenanceSchedule WHERE scheduledAt BETWEEN now AND +7d` | IT_ADMIN |
| Notifikasi Belum Dibaca | `COUNT(Notification WHERE userId=session.id AND isRead=false)` | Semua |

---

### 6.3 Halaman Katalog Aset (`/assets`)

**Filter**: category (dropdown), status (tab pill), search by name/serialNo (debounce 300ms)

**Kolom Tabel**:

| Kolom | Keterangan |
|-------|------------|
| Nama Aset | Nama + brand |
| Kategori | Badge berwarna per kategori |
| Serial Number | Monospace font |
| Status | Badge: hijau/kuning/merah |
| QR | Icon scan kecil → buka `/assets/[id]/qr` |
| Aksi | "Pinjam" (EMPLOYEE) / "Edit" + "Hapus" (IT_ADMIN) |

**Tombol IT_ADMIN**:
- "Tambah Aset" → modal form
- "Import CSV" → `/assets/import`

**Form Tambah/Edit Aset**:
```
- name*        : text input
- category*    : select dropdown
- serialNo*    : text input (unique validation)
- brand        : text input (opsional)
- description  : textarea (opsional)
- status*      : select (default: AVAILABLE)
```

---

### 6.4 Halaman Detail Aset (`/assets/[id]`)

Section yang ditampilkan:
1. **Info Aset** — semua field dari model `Asset`
2. **QR Code Aset** — tampilkan QR + tombol "Download PNG" + "Print"
3. **Riwayat Peminjaman** — tabel `BorrowLog` untuk aset ini
4. **Riwayat Issue** — tabel `Issue` untuk aset ini
5. **Jadwal Maintenance** — tabel `MaintenanceSchedule` (IT_ADMIN: + tombol "Tambah Jadwal")
6. **Tombol Aksi**:
   - "Pinjam Aset" → `/borrowings/new?assetId=xxx` (jika AVAILABLE)
   - "Lapor Kerusakan" → `/issues/new?assetId=xxx`
   - "Edit Aset" (IT_ADMIN only)

---

### 6.5 Halaman QR Code (`/assets/[id]/qr`)

**Deskripsi**: Halaman fullscreen QR code untuk keperluan cetak label fisik aset.

**Konten**:
- QR code besar (encode URL: `https://domain.com/assets/[id]`)
- Nama aset + serial number di bawah QR
- Tombol "Download sebagai PNG"
- Tombol "Cetak" (trigger `window.print()`)

**Library**: `qrcode` (`npm install qrcode @types/qrcode`)

**Implementasi**:
```ts
// lib/qrcode.ts
import QRCode from 'qrcode'

export async function generateQR(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 400, margin: 2 })
}
```

---

### 6.6 Halaman Bulk Import Aset (`/assets/import`) `[IT_ADMIN]`

**Deskripsi**: Upload file CSV untuk menambah banyak aset sekaligus.

**Format CSV yang Diterima**:
```csv
name,category,serialNo,brand,description
Laptop Dell XPS 13,Laptop,DL-XPS-001,Dell,Untuk developer
iPhone 14 Pro,Mobile Device,APL-IP14-001,Apple,Device testing iOS
```

**Flow UI**:
1. Upload file CSV (drag & drop atau file picker)
2. Preview tabel hasil parsing (tampilkan 5 baris pertama + total row)
3. Validasi: highlight baris yang error (serialNo duplikat, kolom kosong)
4. Tombol "Import [N] Aset" → POST ke `/api/assets/import`
5. Tampilkan hasil: "42 aset berhasil diimport, 2 dilewati (duplikat)"

**Library**: `papaparse` untuk parsing CSV di client.

---

### 6.7 Halaman Pengajuan Peminjaman (`/borrowings/new`)

**Field Form**:
```
- assetId*  : hidden (dari query param) atau select aset AVAILABLE
- dueDate*  : date picker (minimum: besok)
- notes     : textarea (alasan peminjaman)
```

**Logika Submit**: POST ke `/api/borrowings` → buat `BorrowLog` status `PENDING` → buat `Notification` untuk IT_ADMIN bahwa ada pengajuan baru.

---

### 6.8 Halaman Daftar Peminjaman (`/borrowings`)

**EMPLOYEE**: Hanya peminjaman milik sendiri.

**IT_ADMIN**: Semua peminjaman dengan tab Pending / Aktif / Selesai.

**Aksi per Row**:

| Aksi | Siapa | Kondisi | Side effect |
|------|-------|---------|-------------|
| Approve | IT_ADMIN | PENDING | Status → APPROVED, Asset → BORROWED, kirim notif ke peminjam, tulis audit log |
| Reject | IT_ADMIN | PENDING | Status → REJECTED, kirim notif ke peminjam, tulis audit log |
| Tandai Dikembalikan | IT_ADMIN | APPROVED | Status → RETURNED, `returnDate` = now(), Asset → AVAILABLE, tulis audit log |

---

### 6.9 Halaman Issue Tracker (`/issues`)

**Filter**: status (All/Open/In Progress/Resolved), priority (All/Low/Medium/High/Critical)

**Kolom Tabel**: Judul, Aset Terdampak, Dilaporkan Oleh, Priority, Status, Tanggal

**Update Status** (IT_ADMIN): `OPEN` → `IN_PROGRESS` → `RESOLVED`. Saat RESOLVED: `resolvedAt = now()`, kirim notif ke pelapor, tulis audit log.

---

### 6.10 Halaman Maintenance Schedule (`/maintenance`) `[IT_ADMIN]`

**Deskripsi**: Kalender/tabel jadwal perawatan aset.

**Tampilan**: Tabel dengan filter bulan + status (SCHEDULED/IN_PROGRESS/COMPLETED).

**Kolom**: Aset, Judul Maintenance, Jadwal, Status, Aksi

**Form Tambah Jadwal**:
```
- assetId*      : select aset
- title*        : text input
- description   : textarea
- scheduledAt*  : datetime picker
```

**Logika**: Saat `scheduledAt` tiba dan status masih `SCHEDULED`, sistem otomatis:
1. Update status aset menjadi `MAINTENANCE`
2. Buat notifikasi untuk IT_ADMIN

> Implementasi: gunakan cron job ringan di Next.js (misal dengan `node-cron` atau via Vercel Cron Jobs) yang berjalan tiap pagi untuk mengecek jadwal.

---

### 6.11 Halaman Notifikasi (`/notifications`)

**Deskripsi**: Inbox notifikasi in-app milik user yang sedang login.

**Tampilan**: List item notifikasi, diurutkan terbaru di atas.

**Setiap Item**:
- Icon sesuai tipe notifikasi
- Judul + pesan
- Timestamp relatif ("2 jam lalu", "kemarin")
- Indikator unread (dot biru)
- Klik item → mark as read + redirect ke `link`

**Notification Bell** (di navbar/sidebar): Icon bell dengan badge angka unread. Polling setiap 30 detik via `setInterval` + `fetch('/api/notifications?unreadOnly=true')`.

**Tipe Notifikasi & Trigger**:

| Tipe | Kapan Dikirim | Penerima |
|------|--------------|----------|
| `BORROW_APPROVED` | Admin approve peminjaman | Peminjam |
| `BORROW_REJECTED` | Admin reject peminjaman | Peminjam |
| `BORROW_DUE_SOON` | H-1 sebelum due date | Peminjam |
| `BORROW_OVERDUE` | Hari H melewati due date | Peminjam + IT_ADMIN |
| `ISSUE_UPDATED` | Status issue berubah | Pelapor issue |
| `MAINTENANCE_DUE` | Hari H maintenance | Semua IT_ADMIN |

---

### 6.12 Halaman Audit Log (`/audit`) `[IT_ADMIN]`

**Deskripsi**: Tabel lengkap semua aktivitas sistem, siapa melakukan apa dan kapan.

**Filter**: entity (Asset/BorrowLog/Issue), action, user, rentang tanggal

**Kolom Tabel**:

| Kolom | Contoh |
|-------|--------|
| Waktu | 02 Jul 2025, 14:30 |
| Aktor | Cheva Satrio (IT_ADMIN) |
| Aksi | `BORROW_APPROVED` |
| Entity | BorrowLog #clx... |
| Detail | Klik "Lihat detail" → tampilkan JSON metadata |

**Helper `lib/audit.ts`**:
```ts
export async function createAuditLog(params: {
  userId: string
  action: string
  entity: string
  entityId: string
  metadata?: object
}) {
  return prisma.auditLog.create({ data: params })
}
```

Panggil `createAuditLog()` setiap kali ada aksi penting di API route (approve, reject, update status, CRUD aset).

---

### 6.13 Halaman Laporan & Export (`/reports`) `[IT_ADMIN]`

**Deskripsi**: Dashboard laporan + tombol export untuk kebutuhan manajemen.

**Section 1 — Grafik Utilisasi Aset**:
- Bar chart: jumlah peminjaman per bulan (12 bulan terakhir)
- Pie chart: distribusi aset per kategori
- Library: `recharts`

**Section 2 — Tabel Ringkasan**:
- Aset paling sering dipinjam (top 5)
- Karyawan paling aktif meminjam (top 5)
- Issue terlama belum resolved

**Section 3 — Export**:
- "Export Riwayat Peminjaman (CSV)" → download file dengan semua `BorrowLog`
- "Export Daftar Aset (CSV)" → download semua `Asset`
- "Export Issue (CSV)" → download semua `Issue`

**Implementasi Export** (API route stream CSV):
```ts
// app/api/reports/export/route.ts
import { stringify } from 'csv-stringify/sync'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'borrowings' | 'assets' | 'issues'

  // ... query data dari Prisma
  const csv = stringify(data, { header: true })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-export.csv"`,
    },
  })
}
```

**Library**: `csv-stringify` (`npm install csv-stringify`)

---

### 6.14 Halaman Knowledge Base (`/knowledge-base`)

**Sumber Data**: Strapi CMS (bukan Prisma)

Grid kartu artikel, masing-masing menampilkan thumbnail (opsional), judul, kategori, tanggal publish, dan ringkasan singkat.

**Halaman Detail** (`/knowledge-base/[slug]`): Render rich text dari Strapi, navigasi breadcrumb.

**Strapi Content Type**:
```
Collection: Article
Fields:
  - title       (Text)
  - slug        (UID, from title)
  - category    (Enumeration: SOP_JARINGAN | TROUBLESHOOTING | KEBIJAKAN | TUTORIAL)
  - content     (Rich Text / Blocks)
  - summary     (Text, max 200 char)
  - thumbnail   (Media, opsional)
  - publishedAt (auto via Strapi draft/publish)
```

---

## 7. API Contract

### 7.1 Asset Endpoints

```
GET    /api/assets              → List aset (query: ?category=&status=&search=)
POST   /api/assets              → Buat aset baru [IT_ADMIN]
POST   /api/assets/import       → Bulk import dari CSV [IT_ADMIN]
GET    /api/assets/:id          → Detail aset + borrowings + issues + maintenance
PUT    /api/assets/:id          → Update aset [IT_ADMIN]
DELETE /api/assets/:id          → Hapus aset [IT_ADMIN]
GET    /api/assets/:id/qr       → Generate / fetch QR code (base64)
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
GET    /api/issues              → List issue (query: ?status=&priority=)
POST   /api/issues              → Buat laporan issue baru
GET    /api/issues/:id          → Detail issue
PUT    /api/issues/:id          → Update status [IT_ADMIN]
```

### 7.4 Maintenance Endpoints

```
GET    /api/maintenance         → List jadwal maintenance (query: ?month=&status=)
POST   /api/maintenance         → Buat jadwal baru [IT_ADMIN]
PUT    /api/maintenance/:id     → Update status jadwal [IT_ADMIN]
DELETE /api/maintenance/:id     → Hapus jadwal [IT_ADMIN]
```

### 7.5 Notification Endpoints

```
GET    /api/notifications       → List notifikasi user login (query: ?unreadOnly=true)
PUT    /api/notifications/:id/read  → Mark satu notifikasi as read
PUT    /api/notifications/read-all  → Mark semua notifikasi as read
```

### 7.6 Audit & Report Endpoints

```
GET    /api/audit               → List audit log [IT_ADMIN] (query: ?entity=&action=&userId=&from=&to=)
GET    /api/reports/stats       → Data grafik utilisasi (bar + pie chart)
GET    /api/reports/export      → Download CSV (query: ?type=borrowings|assets|issues)
```

### 7.7 Contoh Response Body

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
      "qrCode": "data:image/png;base64,...",
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

**`GET /api/notifications` Response**:
```json
{
  "data": [
    {
      "id": "clx...",
      "type": "BORROW_APPROVED",
      "title": "Peminjaman disetujui",
      "message": "Laptop Dell XPS 13 siap kamu ambil.",
      "isRead": false,
      "link": "/borrowings/clx...",
      "createdAt": "2025-07-01T10:00:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

**`GET /api/reports/stats` Response**:
```json
{
  "borrowingsByMonth": [
    { "month": "Jan", "count": 12 },
    { "month": "Feb", "count": 18 }
  ],
  "assetsByCategory": [
    { "category": "Laptop", "count": 15 },
    { "category": "Mobile Device", "count": 20 }
  ],
  "topAssets": [
    { "assetName": "iPhone 14 Pro", "borrowCount": 24 }
  ]
}
```

---

## 8. Environment Variables

Buat file `.env.local` di root proyek:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/it_asset_db"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Strapi CMS
STRAPI_URL="http://localhost:1337"
STRAPI_API_TOKEN="your-strapi-api-token"

# App URL (untuk generate QR code)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 9. Urutan Implementasi (Vibecode Roadmap)

Ikuti urutan ini **step by step**. Jangan lanjut ke fase berikutnya sebelum yang sekarang bisa dijalankan dan di-test.

### ✅ Fase 0 — Setup Project (Est: 30 menit)
- [ ] `npx create-next-app@latest it-asset-management --typescript --tailwind --app`
- [ ] Install dependencies core: `prisma @prisma/client next-auth bcryptjs @types/bcryptjs zod`
- [ ] Init Prisma: `npx prisma init`
- [ ] Setup PostgreSQL lokal (Docker: `docker run -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres`)
- [ ] Copy `schema.prisma` dari Section 4.1
- [ ] Jalankan `npx prisma migrate dev --name init`
- [ ] Buat `lib/prisma.ts` (singleton client)
- [ ] **TEST**: `npx prisma studio` → pastikan semua tabel terbuat (7 tabel)

### ✅ Fase 1 — Autentikasi (Est: 1-2 jam)
- [ ] Buat `lib/auth.ts` dengan `CredentialsProvider` NextAuth
- [ ] Buat `/api/auth/[...nextauth]/route.ts`
- [ ] Buat `prisma/seed.ts` → seed 1 IT_ADMIN + 2 EMPLOYEE + 10 aset dummy
- [ ] Jalankan `npx prisma db seed`
- [ ] Buat halaman `/login` dengan form
- [ ] Setup `middleware.ts` proteksi route (redirect ke login jika belum auth)
- [ ] **TEST**: Login berhasil → redirect ke `/`, logout bersih, akses `/assets` tanpa login → redirect ke `/login`

### ✅ Fase 2 — Manajemen Aset (Est: 2-3 jam)
- [ ] Buat `GET /api/assets` dengan filter query params
- [ ] Buat `POST /api/assets` (guard: IT_ADMIN only) + tulis `AuditLog`
- [ ] Buat `PUT /api/assets/:id` + `DELETE /api/assets/:id` + tulis `AuditLog`
- [ ] Buat halaman `/assets` dengan tabel + filter bar
- [ ] Buat modal form tambah & edit aset (IT_ADMIN)
- [ ] Buat halaman `/assets/[id]`
- [ ] **TEST**: CRUD aset berjalan, filter bekerja, role guard aktif, audit log tercatat

### ✅ Fase 3 — QR Code (Est: 1 jam)
- [ ] Install: `npm install qrcode @types/qrcode`
- [ ] Buat `lib/qrcode.ts` helper `generateQR(url)`
- [ ] Buat `GET /api/assets/:id/qr`
- [ ] Tambahkan QR display di halaman `/assets/[id]`
- [ ] Buat halaman `/assets/[id]/qr` (fullscreen untuk print)
- [ ] **TEST**: QR ter-generate, scan QR → buka halaman aset yang benar

### ✅ Fase 4 — Peminjaman (Est: 2-3 jam)
- [ ] Buat `POST /api/borrowings` + buat `Notification` untuk IT_ADMIN
- [ ] Buat `GET /api/borrowings`
- [ ] Buat `PUT /api/borrowings/:id` (approve/reject/return) + `Notification` + `AuditLog`
- [ ] Pastikan status aset update otomatis
- [ ] Buat halaman `/borrowings/new`
- [ ] Buat halaman `/borrowings` dengan tab Pending/Aktif/Selesai
- [ ] **TEST**: Flow lengkap ajukan → approve → notif muncul → kembalikan → aset AVAILABLE

### ✅ Fase 5 — Notifikasi (Est: 1-2 jam)
- [ ] Buat `GET /api/notifications`
- [ ] Buat `PUT /api/notifications/:id/read` dan `PUT /api/notifications/read-all`
- [ ] Buat komponen `NotificationBell` (polling 30 detik)
- [ ] Buat halaman `/notifications`
- [ ] **TEST**: Notifikasi muncul setelah approve/reject, mark as read bekerja, badge count akurat

### ✅ Fase 6 — Issue Tracker (Est: 1-2 jam)
- [ ] Buat `POST /api/issues` dan `GET /api/issues`
- [ ] Buat `PUT /api/issues/:id` + `Notification` + `AuditLog`
- [ ] Buat halaman `/issues` dengan filter status & priority
- [ ] Buat halaman `/issues/new`
- [ ] **TEST**: Submit issue → IT Admin update status → notif ke pelapor → audit log tercatat

### ✅ Fase 7 — Maintenance Schedule (Est: 1-2 jam)
- [ ] Buat CRUD `/api/maintenance`
- [ ] Buat halaman `/maintenance` (IT_ADMIN)
- [ ] Buat form tambah jadwal
- [ ] Implementasi cron check: `npm install node-cron` → cek jadwal yang jatuh tempo tiap pagi
- [ ] **TEST**: Tambah jadwal → muncul di tabel → saat tanggal tiba, aset masuk MAINTENANCE

### ✅ Fase 8 — Audit Log (Est: 1 jam)
- [ ] Pastikan semua API route sudah memanggil `createAuditLog()`
- [ ] Buat `GET /api/audit` dengan filter
- [ ] Buat halaman `/audit` (IT_ADMIN)
- [ ] **TEST**: Lakukan beberapa aksi → semua tercatat di audit log dengan benar

### ✅ Fase 9 — Laporan & Export (Est: 2 jam)
- [ ] Install: `npm install csv-stringify recharts`
- [ ] Buat `GET /api/reports/stats`
- [ ] Buat `GET /api/reports/export`
- [ ] Buat halaman `/reports` dengan grafik Recharts + tombol export
- [ ] **TEST**: Download CSV valid (bisa dibuka di Excel), grafik menampilkan data yang benar

### ✅ Fase 10 — Bulk Import CSV (Est: 1-2 jam)
- [ ] Install: `npm install papaparse @types/papaparse`
- [ ] Buat `POST /api/assets/import`
- [ ] Buat halaman `/assets/import` dengan drag & drop + preview + validasi
- [ ] **TEST**: Upload CSV 20 baris → semua terimport → duplikat serialNo di-skip dengan pesan error

### ✅ Fase 11 — Dashboard (Est: 1 jam)
- [ ] Buat `GET /api/dashboard` yang return semua aggregat
- [ ] Build halaman `/` dengan semua widget
- [ ] **TEST**: Semua widget menampilkan angka akurat sesuai data di DB

### ✅ Fase 12 — Knowledge Base + CMS (Est: 2-3 jam)
- [ ] Install & jalankan Strapi: `npx create-strapi-app@latest cms --quickstart`
- [ ] Buat Content Type `Article` di Strapi admin
- [ ] Generate API Token → simpan ke `.env.local`
- [ ] Buat `lib/strapi.ts` helper
- [ ] Buat halaman `/knowledge-base` dan `/knowledge-base/[slug]`
- [ ] **TEST**: Artikel di Strapi muncul di Next.js

### ✅ Fase 13 — Polish & Deploy (Est: 2+ jam)
- [ ] Responsive design (mobile-friendly untuk semua halaman)
- [ ] Dark mode (Tailwind `dark:` classes)
- [ ] Global search bar di navbar (cari aset + issue + artikel)
- [ ] Loading states & error handling di semua form
- [ ] Empty states yang informatif
- [ ] Deploy PostgreSQL ke Railway / Supabase
- [ ] Deploy Strapi ke Railway
- [ ] Deploy Next.js ke Vercel
- [ ] Set semua ENV variables di platform masing-masing

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
zod              3.x
qrcode           1.x
papaparse        5.x
csv-stringify    6.x
recharts         2.x
node-cron        3.x
PostgreSQL       15.x
Strapi           4.x
```

**UI Component Library** (pilih salah satu):
- `shadcn/ui` — Pilihan utama, Tailwind-based, sangat customizable
- `@radix-ui/react-*` — Jika mau lebih low-level

---

## 11. Catatan Keamanan

| Aspek | Implementasi |
|-------|-------------|
| Password | Hash dengan `bcrypt` (salt rounds: 12) |
| Session | JWT via NextAuth, simpan di httpOnly cookie |
| Role Guard | Validasi `session.user.role` di setiap API route |
| Input Validation | `zod` untuk validasi semua request body |
| SQL Injection | Prisma parameterized queries by default |
| CSV Import | Validasi tipe data + sanitasi setiap baris sebelum insert |
| QR Code | URL di-encode, tidak menyimpan data sensitif dalam QR |
| Audit Trail | Setiap aksi destruktif tercatat di `AuditLog` |

---

## 12. Nilai Portofolio yang Ditonjolkan

```
✦ Decoupled Architecture   → Pemisahan data dinamis (Prisma) vs konten editorial (CMS)
✦ Relational Data Model    → One-to-Many kompleks: User ↔ Asset ↔ BorrowLog ↔ Issue ↔ Notification
✦ Role-Based Access        → Guard di level API dan UI, dua role dengan privilege berbeda
✦ Real-World Domain        → Issue Tracker + Audit Log = analog alur kerja tim QA
✦ Enterprise Features      → Audit log, bulk import, QR code, laporan = fitur sistem internal nyata
✦ Type Safety              → Prisma generated types + TypeScript end-to-end + Zod validation
✦ Full-Stack Next.js       → API routes + React frontend dalam satu codebase
✦ Data Visualization       → Recharts untuk grafik utilisasi → kemampuan mengolah data jadi insight
✦ Traceability             → Setiap perubahan tercatat lengkap dengan aktor dan timestamp
```

---

*SRS ini adalah living document. Update sesuai perubahan requirement saat development.*
