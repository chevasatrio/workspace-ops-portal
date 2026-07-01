import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const assetUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  serialNo: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["AVAILABLE", "BORROWED", "MAINTENANCE"]).optional(),
});

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        borrowings: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { borrowDate: "desc" }
        },
        issues: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    return NextResponse.json({ data: asset });
  } catch (error) {
    console.error("GET /api/assets/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "IT_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = assetUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json({ data: asset });
  } catch (error) {
    console.error("PUT /api/assets/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "IT_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if asset is currently borrowed
    const asset = await prisma.asset.findUnique({ where: { id: params.id } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    
    if (asset.status === "BORROWED") {
      return NextResponse.json({ error: "Aset sedang dipinjam dan tidak dapat dihapus" }, { status: 400 });
    }

    await prisma.asset.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/assets/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
