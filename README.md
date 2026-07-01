# IT Asset & Knowledge Management System

Sistem manajemen aset IT internal, peminjaman barang, pelaporan kerusakan (issue tracker), dan sentralisasi basis pengetahuan (knowledge base).

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 3.x](https://tailwindcss.com/)
- **Database**: PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM**: [Prisma v7](https://www.prisma.io/) dengan `@prisma/adapter-pg`
- **Authentication**: [NextAuth.js v4](https://next-auth.js.org/) (Credentials Provider dengan bcrypt)
- **CMS**: [Strapi v4](https://strapi.io/) *(untuk fitur Knowledge Base - menyusul di Fase 6)*

## Struktur Proyek Saat Ini

- `/app`: App Router Next.js (berisi route autentikasi dan API).
- `/app/api`: Backend API.
- `/lib`: Helper, auth config, singleton prisma client.
- `/prisma`: Schema prisma (`schema.prisma`) dan script seeder (`seed.ts`).
- `/types`: Typescript interfaces tambahan.

---
*Dibuat menggunakan Next.js + Prisma + Supabase.*
