import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SpendingData {
  month: string;
  spending: number;
  budget?: number;
  savings?: number;
}

interface SpendingTrendChartProps {
  data: SpendingData[];
  type?: 'line' | 'bar';
  showBudget?: boolean;
  showSavings?: boolean;
}

export function SpendingTrendChart({
  data,
  type = 'line',
  showBudget = true,
  showSavings = false,
}: SpendingTrendChartProps) {
  const commonProps = {
    data,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  const chartContent = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="month" stroke="#6b7280" />
      <YAxis stroke="#6b7280" />
      <Tooltip
        contentStyle={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
        }}
        formatter={(value: number) => `$${value.toFixed(2)}`}
      />
      <Legend />
      <Line
        type="monotone"
        dataKey="spending"
        stroke="#ef4444"
        strokeWidth={2}
        dot={{ fill: '#ef4444', r: 4 }}
        activeDot={{ r: 6 }}
        name="Spending"
      />
      {showBudget && (
        <Line
          type="monotone"
          dataKey="budget"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ fill: '#3b82f6', r: 4 }}
          name="Budget"
        />
      )}
      {showSavings && (
        <Line
          type="monotone"
          dataKey="savings"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
          name="Savings"
        />
      )}
    </>
  );

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart {...commonProps}>
          {chartContent}
          <Bar dataKey="spending" fill="#ef4444" />
          {showBudget && <Bar dataKey="budget" fill="#3b82f6" />}
          {showSavings && <Bar dataKey="savings" fill="#10b981" />}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart {...commonProps}>{chartContent}</LineChart>
    </ResponsiveContainer>
  );
}
