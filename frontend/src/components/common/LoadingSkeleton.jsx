import React from 'react';

export const LoadingSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-3 animate-pulse p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-4 bg-slate-100 dark:bg-slate-800 rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 6 }) => {
  return (
    <div className="w-full animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full" />
      ))}
    </div>
  );
};
