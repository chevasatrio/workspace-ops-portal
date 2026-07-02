"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";

export default function AssetQRCodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [assetUrl, setAssetUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await fetch(`/api/assets/${resolvedParams.id}/qr`);
        if (res.ok) {
          const data = await res.json();
          setQrCode(data.qrCode);
          setAssetUrl(data.assetUrl);
        }
      } catch (err) {
        console.error("Failed to fetch QR code", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
  }, [resolvedParams.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrCode) return;
    const a = document.createElement("a");
    a.href = qrCode;
    a.download = `asset-${resolvedParams.id}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-background">
      <div className="w-full max-w-md bg-card border border-border shadow-sm rounded-lg p-8 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-8 print:hidden">
          <Link
            href={`/assets/${resolvedParams.id}`}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-xl font-semibold">Asset QR Code</h1>
        </div>

        {loading ? (
          <div className="w-64 h-64 flex items-center justify-center bg-muted animate-pulse rounded-md mb-6">
            <span className="text-muted-foreground">Loading QR...</span>
          </div>
        ) : qrCode ? (
          <div className="bg-white p-4 rounded-xl mb-6">
            <Image
              src={qrCode}
              alt="Asset QR Code"
              width={256}
              height={256}
              className="w-64 h-64"
            />
          </div>
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-destructive/10 text-destructive rounded-md mb-6">
            Failed to load QR
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            {resolvedParams.id}
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-[250px] break-all">
            {assetUrl}
          </p>
        </div>

        <div className="flex gap-4 print:hidden">
          <button
            onClick={handleDownload}
            disabled={!qrCode}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handlePrint}
            disabled={!qrCode}
            className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
