import React from 'react';

export interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
}

interface Props {
  data: CategoryData[];
  type?: 'pie' | 'bar';
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f97316',
  '#ef4444',
  '#eab308',
  '#14b8a6',
  '#ec4899',
];

export function CategoryBreakdownChart({ data, colors }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
        <span className="text-gray-400 text-sm">No spending data yet</span>
      </div>
    );
  }

  const palette = colors && colors.length > 0 ? colors : DEFAULT_COLORS;

  const sorted = [...data].sort((a, b) => b.value - a.value);

  let displayItems: CategoryData[];
  if (sorted.length > 8) {
    const top7 = sorted.slice(0, 7);
    const restTotal = sorted.slice(7).reduce((sum, d) => sum + d.value, 0);
    displayItems = [...top7, { name: 'Other', value: restTotal }];
  } else {
    displayItems = sorted;
  }

  const total = displayItems.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-full">
      <div className="space-y-3">
        {displayItems.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          const color = palette[idx % palette.length];
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 text-sm font-medium text-gray-700 truncate min-w-0">
                {item.name}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 min-w-0">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-right text-sm font-semibold text-gray-900 w-20 flex-shrink-0">
                €{item.value.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 text-sm font-semibold text-gray-700">
        Total: €{total.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}
