"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
export default function BorrowingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "IT_ADMIN";

  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBorrowings = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/borrowings${query}`);
      if (res.ok) {
        const json = await res.json();
        setBorrowings(json.data);
      }
    } catch (error) {
      console.error("Error fetching borrowings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowings();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/borrowings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchBorrowings();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengupdate status");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Daftar Peminjaman
        </h2>
        <Link 
          href="/borrowings/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Ajukan Peminjaman
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Aktif (Approved)</option>
            <option value="RETURNED">Selesai (Returned)</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                {isAdmin && <th className="px-6 py-4">Peminjam</th>}
                <th className="px-6 py-4">Aset</th>
                <th className="px-6 py-4">Tanggal Pengajuan</th>
                <th className="px-6 py-4">Tenggat Waktu</th>
                <th className="px-6 py-4">Status</th>
                {isAdmin && <th className="px-6 py-4 text-right">Aksi Admin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : borrowings.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-0">
                    <EmptyState 
                      icon={ClipboardList} 
                      title="Tidak Ada Peminjaman" 
                      description="Belum ada riwayat peminjaman aset yang tercatat saat ini." 
                    />
                  </td>
                </tr>
              ) : (
                borrowings.map((borrow) => (
                  <tr key={borrow.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {isAdmin && (
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {borrow.user?.name}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">{borrow.asset?.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{borrow.asset?.serialNo}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <p>{new Date(borrow.borrowDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(borrow.borrowDate).toLocaleTimeString("id-ID", { timeStyle: "short" })}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <p>{new Date(borrow.dueDate).toLocaleDateString("id-ID", { dateStyle: "medium" })}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(borrow.dueDate).toLocaleTimeString("id-ID", { timeStyle: "short" })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={borrow.status} />
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {borrow.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(borrow.id, "APPROVED")}
                                title="Setujui"
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(borrow.id, "REJECTED")}
                                title="Tolak"
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {borrow.status === "APPROVED" && (
                            <button
                              onClick={() => handleUpdateStatus(borrow.id, "RETURNED")}
                              title="Tandai Dikembalikan"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
