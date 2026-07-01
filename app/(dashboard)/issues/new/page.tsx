import { IssueForm } from "@/components/IssueForm";

export default function NewIssuePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Laporkan Kendala
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Buat tiket pelaporan baru untuk masalah pada perangkat atau sistem.
        </p>
      </div>

      <IssueForm />
    </div>
  );
}
