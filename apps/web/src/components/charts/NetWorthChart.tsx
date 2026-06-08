interface NetWorthData {
  date: string;
  value: number;
}

interface NetWorthChartProps {
  data: NetWorthData[];
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  return (
    <div className="w-full h-80 bg-white/50 rounded-lg border border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">📈 Net Worth Chart</p>
        <p className="text-sm text-gray-400 mt-2">({data.length} data points)</p>
      </div>
    </div>
  );
}
