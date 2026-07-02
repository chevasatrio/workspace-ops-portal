import { NextResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "IT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100, // limit to 100 recent for now
    });

    return NextResponse.json({ data: logs });
  } catch (error: any) {
    console.error("Audit log fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
