"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between">
          <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex gap-4 items-center">
              <div className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
