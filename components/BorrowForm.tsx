"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

interface Asset {
  id: string;
  name: string;
  serialNo: string;
  brand: string;
}

export function BorrowForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAssetId = searchParams.get("assetId") || "";

  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    assetId: initialAssetId,
    borrowDate: "",
    dueDate: "",
    notes: "",
  });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch("/api/assets?status=AVAILABLE");
        if (res.ok) {
          const json = await res.json();
          setAvailableAssets(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch assets", e);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/borrowings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)[0];
          setError(Array.isArray(firstError) ? firstError[0] : "Validation Error");
        } else {
          setError(data.error || "Gagal mengajukan peminjaman.");
        }
        return;
      }

      router.push("/borrowings");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  // Min date/time for inputs is current local time
  const now = new Date();
  // Adjust to local time timezone offset to get correct string for datetime-local
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localNow = new Date(now.getTime() - tzOffset);
  const minDateTimeString = localNow.toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/borrowings" className="p-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Formulir Peminjaman</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ajukan peminjaman aset untuk kebutuhan kerja.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Aset yang Dipinjam <span className="text-red-500">*</span>
              </label>
              {loadingAssets ? (
                <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memuat daftar aset...
                </div>
              ) : (
                <select
                  name="assetId"
                  required
                  value={formData.assetId}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white appearance-none"
                >
                  <option value="" disabled>-- Pilih Aset yang Tersedia --</option>
                  {availableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.brand}) - {asset.serialNo}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tanggal Awal Peminjaman <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    type="datetime-local"
                    name="borrowDate"
                    required
                    min={minDateTimeString}
                    value={formData.borrowDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tanggal Akhir Peminjaman <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    type="datetime-local"
                    name="dueDate"
                    required
                    min={formData.borrowDate || minDateTimeString}
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500">Maksimal peminjaman akan dievaluasi oleh IT Admin.</p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Keperluan (Catatan)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Deskripsikan secara singkat untuk keperluan apa aset ini dipinjam."
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white resize-none"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading || loadingAssets}
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengajukan...
                  </>
                ) : (
                  "Ajukan Peminjaman"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
