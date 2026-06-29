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
  },
  datasource: {
    // Connection pooler URL (port 6543) for application queries
    url: process.env["DATABASE_URL"],
    // Direct connection URL (port 5432) for Prisma migrations
    directUrl: process.env["DIRECT_URL"],
  },
});
