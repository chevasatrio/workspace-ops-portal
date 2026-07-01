import type { Role, Status, BorrowStatus, IssueState, Priority } from "@prisma/client";

// ─── NextAuth Session Extension ──────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// ─── API Response Types ──────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    available?: number;
    borrowed?: number;
    maintenance?: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
}

// ─── Dashboard Types ─────────────────────────────────────
export interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  activeBorrowings: number;
  openIssues: number;
}

// ─── Re-export Prisma enums for convenience ──────────────
export type { Role, Status, BorrowStatus, IssueState, Priority };
