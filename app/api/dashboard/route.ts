import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    const userId = session.user.id;

    // Aggregate counts for all users (or depending on role, but generally these are system-wide)
    const totalAssets = await prisma.asset.count();
    const availableAssets = await prisma.asset.count({ where: { status: "AVAILABLE" } });
    const activeBorrowings = await prisma.borrowLog.count({ where: { status: "APPROVED" } });
    const openIssues = await prisma.issue.count({ where: { status: "OPEN" } });

    let myBorrowings: any[] = [];
    let pendingBorrowings: any[] = [];

    if (role === "EMPLOYEE") {
      // Get latest 5 borrowings for employee
      myBorrowings = await prisma.borrowLog.findMany({
        where: { userId },
        include: { asset: { select: { name: true, serialNo: true } } },
        orderBy: { borrowDate: "desc" },
        take: 5,
      });
    } else if (role === "IT_ADMIN") {
      // Get pending borrowing requests for IT Admin
      pendingBorrowings = await prisma.borrowLog.findMany({
        where: { status: "PENDING" },
        include: { 
          asset: { select: { name: true, serialNo: true } },
          user: { select: { name: true, email: true } } 
        },
        orderBy: { borrowDate: "asc" },
        take: 5,
      });
    }

    return NextResponse.json({
      data: {
        stats: {
          totalAssets,
          availableAssets,
          activeBorrowings,
          openIssues
        },
        myBorrowings,
        pendingBorrowings
      }
    });

  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
