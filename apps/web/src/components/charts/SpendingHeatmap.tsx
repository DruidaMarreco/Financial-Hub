import React from 'react';

export interface HeatmapData {
  day: string;
  amount: number;
}

interface Props {
  data: HeatmapData[];
}

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function SpendingHeatmap({ data }: Props) {
  if (!data || data.length === 0 || data.every((d) => d.amount === 0)) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg">
        <span className="text-gray-400 text-sm">No spending data yet</span>
      </div>
    );
  }

  const maxAmt = Math.max(...data.map((d) => d.amount), 1);

  // Reorder data to match DAY_ORDER
  const ordered = DAY_ORDER.map((day) => {
    const found = data.find((d) => d.day === day);
    return found ?? { day, amount: 0 };
  });

  const maxDay = ordered.reduce(
    (best, d) => (d.amount > best.amount ? d : best),
    ordered[0]
  );

  return (
    <div className="w-full">
      <div className="flex gap-2">
        {ordered.map((d) => {
          const intensity = d.amount / maxAmt;
          const isMax = d.day === maxDay.day && d.amount > 0;
          const isDark = intensity > 0.5;

          return (
            <div
              key={d.day}
              className={`flex-1 rounded-xl p-3 text-center border ${
                isMax ? 'ring-2 ring-blue-500 border-blue-100' : 'border-blue-100'
              }`}
              style={{
                backgroundColor:
                  intensity > 0
                    ? `rgba(59,130,246,${intensity * 0.75})`
                    : 'rgba(243,244,246,1)',
              }}
            >
              <div
                className={`text-xs font-bold ${
                  intensity === 0
                    ? 'text-gray-400'
                    : isDark
                    ? 'text-white'
                    : 'text-gray-800'
                }`}
              >
                {d.day}
              </div>
              <div
                className={`text-xs mt-1 ${
                  intensity === 0
                    ? 'text-gray-400'
                    : isDark
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                €{d.amount.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>↓ Low</span>
        <span>High ↑</span>
      </div>
    </div>
  );
}
