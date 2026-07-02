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

    // 1. Borrowings by Month (last 12 months)
    // We will do a simple aggregation here. In PostgreSQL, we could group by date_trunc, 
    // but with Prisma we can fetch logs and group in JS for simplicity or use raw query.
    // For this example, let's just group in JS.
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    
    const logs = await prisma.borrowLog.findMany({
      where: { borrowDate: { gte: twelveMonthsAgo } },
      select: { borrowDate: true }
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const borrowingsMap: Record<string, number> = {};
    
    // Initialize map for the last 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      borrowingsMap[`${months[d.getMonth()]} ${d.getFullYear()}`] = 0;
    }

    logs.forEach(log => {
      const d = new Date(log.borrowDate);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (borrowingsMap[key] !== undefined) {
        borrowingsMap[key]++;
      }
    });

    const borrowingsByMonth = Object.entries(borrowingsMap)
      .map(([month, count]) => ({ month, count }))
      .reverse();

    // 2. Assets by Category
    const categoryGroup = await prisma.asset.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    const assetsByCategory = categoryGroup.map(c => ({
      category: c.category,
      count: c._count.category
    }));

    // 3. Top Assets (most borrowed)
    const topAssetsQuery = await prisma.borrowLog.groupBy({
      by: ['assetId'],
      _count: { assetId: true },
      orderBy: { _count: { assetId: 'desc' } },
      take: 5
    });

    const topAssetsData = await Promise.all(
      topAssetsQuery.map(async (t) => {
        const asset = await prisma.asset.findUnique({ where: { id: t.assetId } });
        return {
          assetName: asset?.name || "Unknown Asset",
          borrowCount: t._count.assetId
        };
      })
    );

    return NextResponse.json({
      borrowingsByMonth,
      assetsByCategory,
      topAssets: topAssetsData
    });
  } catch (error: any) {
    console.error("Reports stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
