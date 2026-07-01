"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Plus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Asset {
  id: string;
  name: string;
  serialNo: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
  resolvedAt: string | null;
  user: User;
  asset: Asset;
}

const PriorityBadge = ({ priority }: { priority: Issue["priority"] }) => {
  const map = {
    LOW: { color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", label: "Low" },
    MEDIUM: { color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800", label: "Medium" },
    HIGH: { color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800", label: "High" },
    CRITICAL: { color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800", label: "Critical" },
  };

  const style = map[priority];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.color}`}>
      {style.label}
    </span>
  );
};

const IssueStatusBadge = ({ status }: { status: Issue["status"] }) => {
  const map = {
    OPEN: { icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", label: "Open" },
    IN_PROGRESS: { icon: Clock, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20", label: "In Progress" },
    RESOLVED: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", label: "Resolved" },
  };

  const style = map[status];
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${style.bg} ${style.color}`}>
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {style.label}
    </span>
  );
};

export default function IssuesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "IT_ADMIN";
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.append("status", statusFilter);
      if (priorityFilter) query.append("priority", priorityFilter);
      
      const res = await fetch(`/api/issues?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setIssues(json.data);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, priorityFilter]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!isAdmin) return;
    
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        fetchIssues(); // Refresh data
      } else {
        alert("Gagal mengupdate status");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Issue Tracker</h2>
        <Link 
          href="/issues/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Lapor Kendala
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Semua Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Semua Prioritas</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Judul & Deskripsi</th>
                <th className="px-6 py-4">Aset Terdampak</th>
                <th className="px-6 py-4">Pelapor</th>
                <th className="px-6 py-4">Status & Prioritas</th>
                {isAdmin && <th className="px-6 py-4 text-right">Aksi Admin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center">Memuat data...</div>
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada issue yang ditemukan.
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white mb-1">{issue.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-2 max-w-xs" title={issue.description}>
                        {issue.description}
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        Dilaporkan: {formatDate(issue.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{issue.asset.name}</div>
                      <div className="font-mono text-xs text-slate-500 mt-1">{issue.asset.serialNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 dark:text-slate-300">{issue.user.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{issue.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        <IssueStatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right align-top">
                        <select
                          disabled={updatingId === issue.id}
                          value={issue.status}
                          onChange={(e) => handleStatusUpdate(issue.id, e.target.value)}
                          className="px-2 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="OPEN">Set: Open</option>
                          <option value="IN_PROGRESS">Set: In Progress</option>
                          <option value="RESOLVED">Set: Resolved</option>
                        </select>
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
