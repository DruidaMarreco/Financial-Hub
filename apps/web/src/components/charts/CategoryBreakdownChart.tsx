import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

const DEFAULT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
];

export function CategoryBreakdownChart({
  data,
  type = 'pie',
  colors = DEFAULT_COLORS,
}: CategoryBreakdownChartProps) {
  // Calculate percentages if not provided
  const processedData = data.map(item => ({
    ...item,
    percentage: item.percentage || (item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100,
  }));

  const commonTooltip = (
    <Tooltip
      contentStyle={{
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
      }}
      formatter={(value: number, name: string) => {
        if (name === 'value') {
          return `$${value.toFixed(2)}`;
        }
        return `${value.toFixed(1)}%`;
      }}
    />
  );

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={processedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
          <YAxis stroke="#6b7280" />
          {commonTooltip}
          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={processedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name} ${percentage?.toFixed(1)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        {commonTooltip}
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
