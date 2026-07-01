"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  serialNo: string;
}

export function IssueForm() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    assetId: "",
    priority: "LOW",
    description: "",
  });

  useEffect(() => {
    // Fetch all assets for the dropdown
    const fetchAssets = async () => {
      try {
        // Fetching all assets, not just available ones, because a borrowed asset might break
        const res = await fetch("/api/assets");
        if (res.ok) {
          const json = await res.json();
          setAssets(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch assets:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssets();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.details) {
          // Flatten zod errors
          const errorMsg = Object.values(json.details).flat().join(", ");
          setError(errorMsg);
        } else {
          setError(json.error || "Gagal melaporkan issue");
        }
        setSubmitting(false);
        return;
      }

      router.push("/issues");
      router.refresh();
    } catch (err) {
      console.error("Form submission error:", err);
      setError("Terjadi kesalahan sistem");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data aset...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Judul Issue
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="Contoh: Layar laptop berkedip saat dicas"
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="assetId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Aset Terdampak
          </label>
          <select
            id="assetId"
            name="assetId"
            required
            value={formData.assetId}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih Aset --</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.serialNo})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Prioritas
          </label>
          <select
            id="priority"
            name="priority"
            required
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Rendah (LOW) - Tidak mengganggu pekerjaan utama</option>
            <option value="MEDIUM">Sedang (MEDIUM) - Mengganggu sebagian pekerjaan</option>
            <option value="HIGH">Tinggi (HIGH) - Pekerjaan terhenti, butuh penanganan segera</option>
            <option value="CRITICAL">Kritis (CRITICAL) - Berdampak pada sistem luas/data hilang</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Deskripsi Detail
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Jelaskan secara detail bagaimana masalah tersebut terjadi..."
            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          ></textarea>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Link 
          href="/issues"
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {submitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Mengirim...
            </span>
          ) : (
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Laporkan Issue
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
