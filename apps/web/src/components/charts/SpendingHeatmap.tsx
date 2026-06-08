interface HeatmapData {
  [key: string]: number | string;
}

interface SpendingHeatmapProps {
  data: HeatmapData[];
}

export function SpendingHeatmap({ data }: SpendingHeatmapProps) {
  return (
    <div className="w-full h-80 bg-white/50 rounded-lg border border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">🔥 Spending Heatmap</p>
        <p className="text-sm text-gray-400 mt-2">({data.length} entries)</p>
      </div>
    </div>
  );
}
