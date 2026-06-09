import React from 'react';

export interface SpendingData {
  date: string;
  amount: number;
}

interface Props {
  data: SpendingData[];
}

export function SpendingTrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 bg-gray-50 rounded-lg">
        <span className="text-gray-400 text-sm">No spending data yet</span>
      </div>
    );
  }

  const shown = data.slice(-6);
  const maxAmount = Math.max(...shown.map((d) => d.amount), 1);
  const avgAmount = shown.reduce((s, d) => s + d.amount, 0) / shown.length;

  return (
    <div className="w-full">
      <div className="text-xs text-gray-400 mb-2">
        Avg: €{avgAmount.toFixed(0)}/mo
      </div>
      <div className="flex items-end gap-2 h-36">
        {shown.map((d, idx) => (
          <div
            key={`${d.date}-${idx}`}
            className="flex flex-col items-center gap-1 min-w-0"
            style={{ flex: 1 }}
          >
            <div
              className="bg-blue-500 rounded-t-md w-full hover:bg-blue-600 transition-all"
              style={{ height: `${Math.max(4, (d.amount / maxAmount) * 120)}px` }}
            />
            <span className="text-xs text-gray-500 truncate w-full text-center">
              {d.date}
            </span>
            <span className="text-xs font-semibold text-gray-700">
              €{Math.round(d.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
