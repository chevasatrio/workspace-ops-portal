# IT Asset & Knowledge Management System

Sistem manajemen aset IT internal, peminjaman barang, pelaporan kerusakan (issue tracker), dan sentralisasi basis pengetahuan (knowledge base).

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 3.x](https://tailwindcss.com/)
- **Database**: PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM**: [Prisma v7](https://www.prisma.io/) dengan `@prisma/adapter-pg`
- **Authentication**: [NextAuth.js v4](https://next-auth.js.org/) (Credentials Provider dengan bcrypt)
- **CMS**: [Strapi v4](https://strapi.io/) *(untuk fitur Knowledge Base - menyusul di Fase 6)*

## Persiapan Lingkungan (Environment Variables)

Salin file `.env.local.example` (jika ada) ke `.env.local` atau buat file `.env.local` di root folder dengan isi berikut:

```env
# Supabase PostgreSQL Database (Transaction connection pooler - port 6543)
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"

# Direct Connection untuk keperluan migrasi Prisma (port 5432)
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/postgres"

# NextAuth.js
NEXTAUTH_SECRET="buat_secret_bebas_minimal_32_karakter"
NEXTAUTH_URL="http://localhost:3000"

# Strapi CMS (Untuk Fase 6)
STRAPI_URL="http://localhost:1337"
STRAPI_API_TOKEN=""
```

## Instalasi & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Sinkronisasi Schema Database**
   Pastikan URL database Anda (khususnya `DIRECT_URL`) benar, kemudian jalankan:
   ```bash
   npx prisma db push
   ```
   *(Opsional: Jika ada error koneksi PrismaClient, pastikan `@prisma/adapter-pg` & `pg` telah di-install dengan baik).*

3. **Generate Prisma Client**
   Jika Prisma client belum ter-generate otomatis:
   ```bash
   npx prisma generate
   ```

4. **Seeding Database Dummy Data**
   Jalankan perintah berikut untuk mengisi database dengan akun dummy dan beberapa data aset:
   ```bash
   npx prisma db seed
   ```

##  Akun Uji Coba (Dummy Accounts)

Setelah menjalankan `npx prisma db seed`, Anda dapat login menggunakan kredensial berikut:

| Peran (Role) | Email | Password |
|--------------|-------|----------|
| **Admin** | `admin@company.com` | `admin123` |
| **Karyawan 1** | `john@company.com` | `employee123` |
| **Karyawan 2** | `jane@company.com` | `employee123` |

## Menjalankan Aplikasi

Jalankan mode pengembangan (development server):

```bash
npm run dev
```

Akses [http://localhost:3000](http://localhost:3000) di browser Anda. Aplikasi akan me-redirect Anda ke halaman `/login` jika belum melakukan autentikasi.

## Struktur Proyek Saat Ini

- `/app`: App Router Next.js (berisi route autentikasi dan API).
- `/app/api`: Backend API.
- `/lib`: Helper, auth config, singleton prisma client.
- `/prisma`: Schema prisma (`schema.prisma`) dan script seeder (`seed.ts`).
- `/types`: Typescript interfaces tambahan.

---
*Dibuat menggunakan Next.js + Prisma + Supabase.*
