import { useMemo } from 'react';
import { getHeatmapColor, getDataStats } from '../../utils/d3-helpers';

interface HeatmapData {
  month: string;
  category: string;
  value: number;
}

interface SpendingHeatmapProps {
  data: HeatmapData[];
  months?: string[];
  categories?: string[];
}

export function SpendingHeatmap({ data, months, categories }: SpendingHeatmapProps) {
  const { heatmapMatrix, allMonths, allCategories, minValue, maxValue } = useMemo(() => {
    // Extract unique months and categories
    const uniqueMonths = months || [...new Set(data.map(d => d.month))].sort();
    const uniqueCategories = categories || [...new Set(data.map(d => d.category))].sort();

    // Create matrix
    const matrix: Record<string, Record<string, number>> = {};
    uniqueCategories.forEach(cat => {
      matrix[cat] = {};
      uniqueMonths.forEach(month => {
        const item = data.find(d => d.category === cat && d.month === month);
        matrix[cat][month] = item?.value || 0;
      });
    });

    // Get min/max for color scaling
    const allValues = data.map(d => d.value);
    const stats = getDataStats(allValues);

    return {
      heatmapMatrix: matrix,
      allMonths: uniqueMonths,
      allCategories: uniqueCategories,
      minValue: stats.min,
      maxValue: stats.max,
    };
  }, [data, months, categories]);

  const cellWidth = Math.max(60, 400 / allMonths.length);
  const cellHeight = 40;

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Header row with months */}
        <div className="flex">
          <div style={{ width: 150, height: cellHeight }} className="flex items-center font-semibold text-gray-700 bg-gray-50 border-r border-gray-200" />
          {allMonths.map(month => (
            <div
              key={month}
              style={{ width: cellWidth, height: cellHeight }}
              className="flex items-center justify-center font-medium text-gray-600 bg-gray-50 border-r border-gray-200 text-sm"
            >
              {month}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {allCategories.map(category => (
          <div key={category} className="flex border-b border-gray-200">
            {/* Category label */}
            <div
              style={{ width: 150, height: cellHeight }}
              className="flex items-center font-medium text-gray-700 bg-gray-50 border-r border-gray-200 px-3 text-sm"
            >
              {category}
            </div>

            {/* Heatmap cells */}
            {allMonths.map(month => {
              const value = heatmapMatrix[category][month];
              const color = getHeatmapColor(value, minValue, maxValue);

              return (
                <div
                  key={`${category}-${month}`}
                  style={{
                    width: cellWidth,
                    height: cellHeight,
                    backgroundColor: color,
                  }}
                  className="flex items-center justify-center border-r border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  title={`${category} - ${month}: $${value.toFixed(2)}`}
                >
                  <span className="text-xs font-medium text-gray-800">
                    ${(value / 100).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Spending Intensity:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6" style={{ backgroundColor: getHeatmapColor(minValue, minValue, maxValue) }} />
            <span className="text-xs text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6" style={{ backgroundColor: getHeatmapColor((minValue + maxValue) / 2, minValue, maxValue) }} />
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6" style={{ backgroundColor: getHeatmapColor(maxValue, minValue, maxValue) }} />
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
