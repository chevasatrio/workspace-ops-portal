import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint ini akan dipanggil oleh sistem cron job (misal: Vercel Cron)
// GET /api/cron/check-overdue
export async function GET(req: Request) {
  try {
    const now = new Date();

    // 1. Cari semua peminjaman yang sedang dipinjam (APPROVED) dan melewati batas waktu (dueDate < now)
    const overdueBorrowings = await prisma.borrowLog.findMany({
      where: {
        status: "APPROVED",
        dueDate: {
          lt: now,
        },
      },
      include: {
        asset: true,
        user: true,
      },
    });

    let notificationsCreated = 0;

    for (const borrow of overdueBorrowings) {
      const link = `/borrowings`;

      // 2. Cek apakah notifikasi BORROW_OVERDUE sudah pernah dibuat untuk peminjaman ini
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: borrow.userId,
          type: "BORROW_OVERDUE",
          link: link,
          // We can ensure we don't spam by checking if a notification for this specific asset name is recent, 
          // or we just rely on the link containing the ID if we had individual borrowing pages. 
          // Since the SRS uses /borrowings, we'll store the borrow ID in the link string like /borrowings?id=...
          // to make it unique per borrow log.
        },
      });

      // Let's refine the link to include the borrow log ID so we can uniquely identify the notification
      const uniqueLink = `/borrowings?highlight=${borrow.id}`;
      
      const existingUniqueNotification = await prisma.notification.findFirst({
        where: {
          userId: borrow.userId,
          type: "BORROW_OVERDUE",
          link: uniqueLink,
        },
      });

      // 3. Jika belum ada, buat notifikasi peringatan
      if (!existingUniqueNotification) {
        await prisma.notification.create({
          data: {
            userId: borrow.userId,
            title: "Peringatan: Peminjaman Overdue",
            message: `Batas waktu pengembalian aset "${borrow.asset.name}" telah terlewat pada ${borrow.dueDate.toLocaleDateString()}. Mohon segera dikembalikan.`,
            type: "BORROW_OVERDUE",
            link: uniqueLink,
          },
        });
        notificationsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${overdueBorrowings.length} overdue items. Created ${notificationsCreated} new notifications.`,
    });
  } catch (error: any) {
    console.error("Cron check-overdue error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
