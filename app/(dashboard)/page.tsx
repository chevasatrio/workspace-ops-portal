import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
      </div>
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <p className="text-slate-600 dark:text-slate-400">
          Selamat datang, <span className="font-semibold text-slate-900 dark:text-white">{session?.user?.name}</span>! 
          Ini adalah halaman dashboard utama. (Dalam pengembangan - Fase 5)
        </p>
      </div>
    </div>
  );
}
