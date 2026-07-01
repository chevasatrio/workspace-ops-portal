export function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-600/20";
      case "BORROWED":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-600/20";
      case "MAINTENANCE":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-600/20";
      case "PENDING":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-600/20";
      case "APPROVED":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-indigo-600/20";
      case "REJECTED":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 ring-rose-600/20";
      case "RETURNED":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-600/20";
      case "OPEN":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 ring-sky-600/20";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-purple-600/20";
      case "RESOLVED":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 ring-teal-600/20";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 ring-slate-500/20";
    }
  };

  const getLabel = () => {
    return status.replace("_", " ");
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStyles()}`}>
      {getLabel()}
    </span>
  );
}
