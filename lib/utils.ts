import { type ClassValue, clsx } from "clsx";

/**
 * Utility to merge class names (for Tailwind CSS)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format tanggal ke locale Indonesia
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format tanggal + waktu
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Warna badge berdasarkan status aset
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-800";
    case "BORROWED":
      return "bg-amber-100 text-amber-800";
    case "MAINTENANCE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Warna badge berdasarkan priority
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "LOW":
      return "bg-blue-100 text-blue-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "HIGH":
      return "bg-orange-100 text-orange-800";
    case "CRITICAL":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Warna badge berdasarkan borrow status
 */
export function getBorrowStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "RETURNED":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Warna badge berdasarkan issue state
 */
export function getIssueStateColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-red-100 text-red-800";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-800";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
