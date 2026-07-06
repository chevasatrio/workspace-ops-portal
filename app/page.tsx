import Link from "next/link";
import { MonitorSmartphone, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 pointer-events-none" />
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-48 -left-48 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <MonitorSmartphone className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            OpsPortal
          </span>
        </div>
        <div>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            Masuk
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 text-center mt-20 mb-32 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 border border-blue-100 dark:border-blue-800/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Sistem Manajemen Aset IT
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
          Kelola Aset IT dengan{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Mudah & Efisien
          </span>
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed">
          OpsPortal memudahkan Anda untuk meminjam, melacak, dan melaporkan kendala pada aset perusahaan. 
          Semua dalam satu platform yang terintegrasi.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5"
          >
            Masuk ke Portal
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid sm:grid-cols-3 gap-8 mt-24 text-left">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <MonitorSmartphone className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Peminjaman Aset</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Ajukan peminjaman laptop, proyektor, dan perangkat lainnya dengan alur persetujuan otomatis.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Lacak Status</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Ketahui siapa yang sedang menggunakan perangkat dan riwayat perawatannya secara transparan.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Laporan Cepat</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Laporkan kerusakan atau isu teknis dengan mudah untuk segera ditangani oleh tim IT.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-slate-500 dark:text-slate-400 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} OpsPortal. Hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
