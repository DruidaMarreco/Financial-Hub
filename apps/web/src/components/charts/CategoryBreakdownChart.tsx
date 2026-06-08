interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  type?: 'pie' | 'bar';
  colors?: string[];
}

export function CategoryBreakdownChart({
  data,
  type = 'pie',
  colors,
}: CategoryBreakdownChartProps) {
  return (
    <div className="w-full h-80 bg-white/50 rounded-lg border border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">Chart visualization coming soon</p>
        <p className="text-sm text-gray-400 mt-2">({data.length} categories)</p>
      </div>
    </div>
  );
}
