import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming authOptions is here
import { prisma } from "@/lib/prisma"; // Assuming prisma is here

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "IT_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { assets } = body;

    if (!Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json({ error: "Invalid data format or empty array" }, { status: 400 });
    }

    // We will try to insert in a transaction, ignoring duplicates based on serialNo
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const asset of assets) {
      if (!asset.name || !asset.category || !asset.serialNo) {
        skipped++;
        errors.push(`Missing required fields for asset: ${asset.name || "Unknown"}`);
        continue;
      }

      try {
        const existing = await prisma.asset.findUnique({
          where: { serialNo: asset.serialNo }
        });

        if (existing) {
          skipped++;
          errors.push(`Duplicate serialNo: ${asset.serialNo}`);
        } else {
          await prisma.asset.create({
            data: {
              name: asset.name,
              category: asset.category,
              serialNo: asset.serialNo,
              brand: asset.brand || null,
              description: asset.description || null,
              status: "AVAILABLE",
            }
          });

          // Also create an audit log
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: "ASSET_IMPORTED",
              entity: "Asset",
              entityId: asset.serialNo, // temporary identifier since we don't fetch back the ID to save queries
              metadata: { name: asset.name, category: asset.category }
            }
          });
          imported++;
        }
      } catch (err: any) {
        skipped++;
        errors.push(`Error inserting ${asset.serialNo}: ${err.message}`);
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
