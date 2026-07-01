import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 12;

/**
 * Seed script untuk data awal development
 * Jalankan: npx tsx prisma/seed.ts
 */
async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── USERS ────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
  const employeePassword = await bcrypt.hash("employee123", SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      name: "IT Admin",
      email: "admin@company.com",
      password: adminPassword,
      role: "IT_ADMIN",
    },
  });

  const john = await prisma.user.upsert({
    where: { email: "john@company.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john@company.com",
      password: employeePassword,
      role: "EMPLOYEE",
    },
  });

  const jane = await prisma.user.upsert({
    where: { email: "jane@company.com" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "jane@company.com",
      password: employeePassword,
      role: "EMPLOYEE",
    },
  });

  console.log("✅ Users created:", { admin: admin.email, john: john.email, jane: jane.email });

  // ─── ASSETS ───────────────────────────────────────────
  const assets = await Promise.all([
    prisma.asset.upsert({
      where: { serialNo: "DL-XPS-2024-001" },
      update: {},
      create: {
        name: "Laptop Dell XPS 13",
        category: "Laptop",
        serialNo: "DL-XPS-2024-001",
        brand: "Dell",
        description: "Laptop untuk development, RAM 16GB, SSD 512GB",
        status: "AVAILABLE",
      },
    }),
    prisma.asset.upsert({
      where: { serialNo: "AP-MBP-2024-001" },
      update: {},
      create: {
        name: "MacBook Pro 14 inch",
        category: "Laptop",
        serialNo: "AP-MBP-2024-001",
        brand: "Apple",
        description: "MacBook Pro M3 untuk design & development",
        status: "AVAILABLE",
      },
    }),
    prisma.asset.upsert({
      where: { serialNo: "SM-S24-2024-001" },
      update: {},
      create: {
        name: "Samsung Galaxy S24",
        category: "Mobile Device",
        serialNo: "SM-S24-2024-001",
        brand: "Samsung",
        description: "Device untuk QA testing Android",
        status: "AVAILABLE",
      },
    }),
    prisma.asset.upsert({
      where: { serialNo: "AP-IP15-2024-001" },
      update: {},
      create: {
        name: "iPhone 15 Pro",
        category: "Mobile Device",
        serialNo: "AP-IP15-2024-001",
        brand: "Apple",
        description: "Device untuk QA testing iOS",
        status: "BORROWED",
      },
    }),
    prisma.asset.upsert({
      where: { serialNo: "LG-27UL-2024-001" },
      update: {},
      create: {
        name: 'LG 27" 4K Monitor',
        category: "Monitor",
        serialNo: "LG-27UL-2024-001",
        brand: "LG",
        description: "Monitor 4K IPS untuk workstation",
        status: "AVAILABLE",
      },
    }),
    prisma.asset.upsert({
      where: { serialNo: "DL-R740-2024-001" },
      update: {},
      create: {
        name: "Dell PowerEdge R740",
        category: "Server",
        serialNo: "DL-R740-2024-001",
        brand: "Dell",
        description: "Server untuk staging environment",
        status: "MAINTENANCE",
      },
    }),
    prisma.asset.upsert({
      where: { serialNo: "LG-MK850-2024-001" },
      update: {},
      create: {
        name: "Logitech MX Keys + MX Master 3",
        category: "Peripheral",
        serialNo: "LG-MK850-2024-001",
        brand: "Logitech",
        description: "Keyboard & Mouse wireless combo",
        status: "AVAILABLE",
      },
    }),
    prisma.asset.upsert({
      where: { serialNo: "LN-T14-2024-001" },
      update: {},
      create: {
        name: "Lenovo ThinkPad T14",
        category: "Laptop",
        serialNo: "LN-T14-2024-001",
        brand: "Lenovo",
        description: "Laptop bisnis untuk karyawan",
        status: "AVAILABLE",
      },
    }),
  ]);

  console.log(`✅ Assets created: ${assets.length} items`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
