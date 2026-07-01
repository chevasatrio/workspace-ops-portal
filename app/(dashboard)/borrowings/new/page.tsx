import { BorrowForm } from "@/components/BorrowForm";
import { Suspense } from "react";

export default function NewBorrowingPage() {
  return (
    <div className="space-y-6">
      {/* We need Suspense because BorrowForm uses useSearchParams */}
      <Suspense fallback={<div className="text-center p-8 text-slate-500">Memuat form...</div>}>
        <BorrowForm />
      </Suspense>
    </div>
  );
}
