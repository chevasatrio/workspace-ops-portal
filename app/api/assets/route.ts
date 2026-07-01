import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const assetSchema = z.object({
  name: z.string().min(1, "Nama aset wajib diisi"),
  category: z.string().min(1, "Kategori wajib diisi"),
  serialNo: z.string().min(1, "Nomor seri wajib diisi"),
  brand: z.string().min(1, "Merek wajib diisi"),
  description: z.string().optional(),
  status: z.enum(["AVAILABLE", "BORROWED", "MAINTENANCE"]).default("AVAILABLE"),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { serialNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [assets, total, available, borrowed, maintenance] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.asset.count({ where }),
      prisma.asset.count({ where: { ...where, status: "AVAILABLE" } }),
      prisma.asset.count({ where: { ...where, status: "BORROWED" } }),
      prisma.asset.count({ where: { ...where, status: "MAINTENANCE" } }),
    ]);

    return NextResponse.json({
      data: assets,
      meta: { total, available, borrowed, maintenance },
    });
  } catch (error) {
    console.error("GET /api/assets error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "IT_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = assetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    // Cek apakah serial number sudah ada
    const existing = await prisma.asset.findUnique({
      where: { serialNo: result.data.serialNo }
    });

    if (existing) {
      return NextResponse.json({ error: "Nomor seri sudah terdaftar" }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: result.data,
    });

    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (error) {
    console.error("POST /api/assets error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
