import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
});

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const borrowLog = await prisma.borrowLog.findUnique({
      where: { id: params.id },
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!borrowLog) return NextResponse.json({ error: "Borrow record not found" }, { status: 404 });

    // Users can only view their own borrow logs unless they are admin
    if (session.user.role !== "IT_ADMIN" && borrowLog.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: borrowLog });
  } catch (error) {
    console.error("GET /api/borrowings/[id] error:", error);
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
    const result = updateStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status } = result.data;

    // Use transaction to ensure data integrity
    const updatedBorrowLog = await prisma.$transaction(async (tx) => {
      const borrowLog = await tx.borrowLog.findUnique({
        where: { id: params.id },
        include: { asset: true }
      });

      if (!borrowLog) {
        throw new Error("Borrow record not found");
      }

      let assetStatus = borrowLog.asset.status;
      let returnDate = borrowLog.returnDate;

      if (status === "APPROVED") {
        if (borrowLog.status !== "PENDING") throw new Error("Can only approve PENDING requests");
        if (assetStatus !== "AVAILABLE") throw new Error("Asset is not available");
        assetStatus = "BORROWED";
      } else if (status === "REJECTED") {
        if (borrowLog.status !== "PENDING") throw new Error("Can only reject PENDING requests");
        // assetStatus remains unchanged (presumably AVAILABLE)
      } else if (status === "RETURNED") {
        if (borrowLog.status !== "APPROVED") throw new Error("Can only return APPROVED assets");
        assetStatus = "AVAILABLE";
        returnDate = new Date();
      }

      // Update the asset status if it changed
      if (assetStatus !== borrowLog.asset.status) {
        await tx.asset.update({
          where: { id: borrowLog.assetId },
          data: { status: assetStatus }
        });
      }

      // Update the borrow log
      return tx.borrowLog.update({
        where: { id: params.id },
        data: {
          status,
          returnDate
        },
        include: {
          asset: true,
          user: { select: { id: true, name: true, email: true } }
        }
      });
    });

    return NextResponse.json({ data: updatedBorrowLog });
  } catch (error: any) {
    console.error("PUT /api/borrowings/[id] error:", error);
    const message = error.message || "Internal Server Error";
    const status = message.includes("not found") ? 404 : (message.includes("Can only") || message.includes("not available")) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
