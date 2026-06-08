interface SpendingData {
  date: string;
  amount: number;
}

interface SpendingTrendChartProps {
  data: SpendingData[];
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  return (
    <div className="w-full h-80 bg-white/50 rounded-lg border border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">📊 Spending Trend Chart</p>
        <p className="text-sm text-gray-400 mt-2">({data.length} data points)</p>
      </div>
    </div>
  );
}
