// Prisma configuration for Prisma v7+
// Database URLs are configured here instead of schema.prisma
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js convention), fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Use DIRECT_URL (port 5432) for Prisma CLI operations (migrations, push, seed)
    // The app itself will use DATABASE_URL (port 6543 pooler) via PrismaClient
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
