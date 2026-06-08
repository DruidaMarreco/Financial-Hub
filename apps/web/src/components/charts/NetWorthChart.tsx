import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

interface NetWorthData {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface NetWorthChartProps {
  data: NetWorthData[];
  showComposed?: boolean;
}

export function NetWorthChart({ data, showComposed = false }: NetWorthChartProps) {
  if (showComposed) {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => `$${(value / 1000).toFixed(1)}K`}
          />
          <Legend />
          <Bar dataKey="liabilities" fill="#ef4444" name="Liabilities" opacity={0.8} />
          <Area type="monotone" dataKey="assets" fill="#3b82f6" stroke="#2563eb" name="Assets" />
          <Line type="monotone" dataKey="netWorth" stroke="#10b981" strokeWidth={3} name="Net Worth" />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: number) => `$${(value / 1000).toFixed(1)}K`}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="assets"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorAssets)"
          name="Assets"
        />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorNetWorth)"
          name="Net Worth"
          stackId="1"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
