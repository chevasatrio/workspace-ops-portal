import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const borrowSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  borrowDate: z.string().min(1, "Borrow date is required").refine((val) => {
    return !isNaN(new Date(val).getTime());
  }, "Tanggal mulai tidak valid"),
  dueDate: z.string().min(1, "Due date is required").refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "Tenggat waktu tidak boleh di masa lalu"),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;
    
    // Employee only sees their own borrowings
    if (session.user.role === "EMPLOYEE") {
      where.userId = session.user.id;
    }

    const borrowings = await prisma.borrowLog.findMany({
      where,
      include: {
        asset: {
          select: { id: true, name: true, category: true, serialNo: true, status: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { borrowDate: "desc" },
    });

    return NextResponse.json({ data: borrowings });
  } catch (error) {
    console.error("GET /api/borrowings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = borrowSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: result.data.assetId }
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Aset tidak tersedia untuk dipinjam" }, { status: 400 });
    }

    const borrowLog = await prisma.borrowLog.create({
      data: {
        assetId: result.data.assetId,
        userId: session.user.id,
        borrowDate: new Date(result.data.borrowDate),
        dueDate: new Date(result.data.dueDate),
        notes: result.data.notes,
        status: "PENDING"
      }
    });

    return NextResponse.json({ data: borrowLog }, { status: 201 });
  } catch (error) {
    console.error("POST /api/borrowings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
