"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Trash2, Edit, AlertTriangle } from "lucide-react";
import { AssetModal } from "@/components/AssetModal";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "IT_ADMIN";
  
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchAsset = async () => {
    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      if (!id) return;

      const res = await fetch(`/api/assets/${id}`);
      if (res.ok) {
        const json = await res.json();
        setAsset(json.data);
      } else {
        router.push("/assets");
      }
    } catch (error) {
      console.error("Error fetching asset details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchAsset();
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus aset ini?")) return;
    
    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/assets");
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus aset.");
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data...</div>;
  if (!asset) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets" className="p-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex-1">
          Detail Aset
        </h2>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button 
              onClick={handleDelete}
              className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{asset.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400">{asset.brand} &bull; {asset.category}</p>
                </div>
                <StatusBadge status={asset.status} />
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Informasi Detail</h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Nomor Seri</dt>
                  <dd className="mt-1 text-sm font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded w-fit border border-slate-200 dark:border-slate-700">{asset.serialNo}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Didaftarkan Pada</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{new Date(asset.createdAt).toLocaleDateString("id-ID")}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Deskripsi</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">{asset.description || "-"}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Riwayat Peminjaman</h4>
            {asset.borrowings && asset.borrowings.length > 0 ? (
              <div className="space-y-4">
                {asset.borrowings.map((borrow: any) => (
                  <div key={borrow.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{borrow.user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(borrow.borrowDate).toLocaleDateString("id-ID")} - {borrow.returnDate ? new Date(borrow.returnDate).toLocaleDateString("id-ID") : "Belum dikembalikan"}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <StatusBadge status={borrow.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">Belum ada riwayat peminjaman.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Riwayat Issue
            </h4>
            {asset.issues && asset.issues.length > 0 ? (
              <div className="space-y-4">
                {asset.issues.map((issue: any) => (
                  <div key={issue.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge status={issue.status} />
                      <span className="text-xs text-slate-500">{new Date(issue.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white mb-1 line-clamp-1">{issue.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pelapor: {issue.reporter.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">Belum ada issue dilaporkan.</div>
            )}
          </div>
        </div>
      </div>

      <AssetModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        asset={asset}
        onSuccess={() => {
          fetchAsset();
        }}
      />
    </div>
  );
}
