"use client";

import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AssetModal } from "@/components/AssetModal";
import EmptyState from "@/components/EmptyState";
interface Asset {
  id: string;
  name: string;
  category: string;
  serialNo: string;
  brand: string;
  status: string;
}

export default function AssetsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "IT_ADMIN";
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (statusFilter) query.append("status", statusFilter);
      
      const res = await fetch(`/api/assets?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAssets(json.data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Katalog Aset</h2>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Aset
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari aset berdasarkan nama atau serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Semua Status</option>
            <option value="AVAILABLE">Tersedia</option>
            <option value="BORROWED">Dipinjam</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Nama Aset</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Serial No.</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center">Memuat data...</div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState 
                      icon={Search} 
                      title="Tidak Ada Aset" 
                      description="Aset yang Anda cari tidak ditemukan. Coba ubah kata kunci pencarian atau filter status." 
                    />
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{asset.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{asset.category}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{asset.serialNo}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/assets/${asset.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          fetchAssets();
        }}
      />
    </div>
  );
}
