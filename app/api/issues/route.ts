import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const issueSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  assetId: z.string().min(1, "Aset harus dipilih"),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        asset: {
          select: { id: true, name: true, serialNo: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: issues });
  } catch (error) {
    console.error("GET /api/issues error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = issueSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: result.data.assetId }
    });

    if (!asset) {
      return NextResponse.json({ error: "Aset tidak ditemukan" }, { status: 404 });
    }

    const issue = await prisma.issue.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        priority: result.data.priority,
        assetId: result.data.assetId,
        reportedBy: session.user.id,
        status: "OPEN"
      }
    });

    return NextResponse.json({ data: issue }, { status: 201 });
  } catch (error) {
    console.error("POST /api/issues error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
