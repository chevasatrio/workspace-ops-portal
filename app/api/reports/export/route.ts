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
    const type = searchParams.get('type') || 'assets';

    let csvData = "";
    let filename = "";

    if (type === "assets") {
      const assets = await prisma.asset.findMany();
      if (assets.length === 0) {
        return new Response("No data", { status: 404 });
      }
      
      // Basic CSV generation
      const headers = ["ID", "Name", "Category", "SerialNo", "Brand", "Status", "CreatedAt"].join(",");
      const rows = assets.map(a => 
        `"${a.id}","${a.name}","${a.category}","${a.serialNo}","${a.brand || ''}","${a.status}","${a.createdAt.toISOString()}"`
      ).join("\n");
      
      csvData = `${headers}\n${rows}`;
      filename = "assets-export.csv";
    } else if (type === "borrowings") {
      const borrowings = await prisma.borrowLog.findMany({
        include: { asset: true, user: true }
      });
      if (borrowings.length === 0) {
        return new Response("No data", { status: 404 });
      }

      const headers = ["ID", "Asset Name", "User Name", "Borrow Date", "Due Date", "Status"].join(",");
      const rows = borrowings.map(b => 
        `"${b.id}","${b.asset.name}","${b.user.name}","${b.borrowDate.toISOString()}","${b.dueDate.toISOString()}","${b.status}"`
      ).join("\n");

      csvData = `${headers}\n${rows}`;
      filename = "borrowings-export.csv";
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return new Response(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Reports export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
