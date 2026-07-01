"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MonitorSmartphone, CheckCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

interface DashboardData {
  stats: {
    totalAssets: number;
    availableAssets: number;
    activeBorrowings: number;
    openIssues: number;
  };
  myBorrowings: any[];
  pendingBorrowings: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "IT_ADMIN";
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Selamat datang, {session?.user?.name?.split(" ")[0]}! 👋
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Berikut adalah ringkasan aktivitas dan status aset IT saat ini.
        </p>
      </div>

      {/* STATS WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-blue-100 text-sm font-medium">Total Aset</span>
            <span className="text-4xl font-bold">{data.stats.totalAssets}</span>
          </div>
          <MonitorSmartphone className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-400 opacity-30 transform group-hover:scale-110 transition-transform duration-300" />
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-emerald-100 text-sm font-medium">Aset Tersedia</span>
            <span className="text-4xl font-bold">{data.stats.availableAssets}</span>
          </div>
          <CheckCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-400 opacity-30 transform group-hover:scale-110 transition-transform duration-300" />
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-amber-100 text-sm font-medium">Peminjaman Aktif</span>
            <span className="text-4xl font-bold">{data.stats.activeBorrowings}</span>
          </div>
          <Clock className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-400 opacity-30 transform group-hover:scale-110 transition-transform duration-300" />
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-rose-100 text-sm font-medium">Issue Terbuka</span>
            <span className="text-4xl font-bold">{data.stats.openIssues}</span>
          </div>
          <AlertTriangle className="absolute -bottom-4 -right-4 w-24 h-24 text-rose-400 opacity-30 transform group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ROLE SPECIFIC WIDGETS */}
        
        {isAdmin ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">Menunggu Persetujuan</h3>
              <Link href="/borrowings" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center">
                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="p-0 flex-1">
              {data.pendingBorrowings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Tidak ada permintaan peminjaman yang menunggu.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.pendingBorrowings.map((borrow) => (
                    <li key={borrow.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-slate-900 dark:text-white">{borrow.asset.name}</span>
                        <span className="text-xs text-slate-500">{formatDate(borrow.borrowDate)}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Diajukan oleh: <span className="font-medium text-slate-700 dark:text-slate-300">{borrow.user.name}</span>
                      </div>
                      <Link 
                        href={`/borrowings`}
                        className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md inline-block hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        Tinjau Permintaan
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">Peminjaman Terbaru Saya</h3>
              <Link href="/borrowings" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center">
                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="p-0 flex-1">
              {data.myBorrowings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Kamu belum melakukan peminjaman aset.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.myBorrowings.map((borrow) => (
                    <li key={borrow.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{borrow.asset.name}</div>
                        <div className="text-xs text-slate-500 mt-1">Tanggal: {formatDate(borrow.borrowDate)}</div>
                      </div>
                      <div>
                        {/* We use a simplified status display here since BorrowStatus component might be in Borrowings page only */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          borrow.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          borrow.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          borrow.status === 'RETURNED' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {borrow.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* QUICK ACTIONS WIDGET */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="font-semibold text-slate-900 dark:text-white">Aksi Cepat</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link 
              href="/assets" 
              className="flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-slate-800 dark:hover:border-slate-700 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <MonitorSmartphone className="w-6 h-6" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white text-sm text-center">Jelajahi Aset</span>
            </Link>

            <Link 
              href="/issues/new" 
              className="flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-slate-800 dark:hover:border-slate-700 transition-all group"
            >
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white text-sm text-center">Lapor Kendala</span>
            </Link>

            <Link 
              href="/borrowings/new" 
              className="flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-slate-800 dark:hover:border-slate-700 transition-all group col-span-2"
            >
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <span className="font-medium text-slate-900 dark:text-white text-sm text-center">Ajukan Peminjaman Baru</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
