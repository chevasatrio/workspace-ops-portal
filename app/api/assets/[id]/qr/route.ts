import { NextResponse } from "next/server";
import { generateQR } from "@/lib/qrcode";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const assetUrl = `${baseUrl}/assets/${id}`;
    const qrDataUrl = await generateQR(assetUrl);

    return NextResponse.json({ qrCode: qrDataUrl, assetUrl });
  } catch (error) {
    console.error("QR Code generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
