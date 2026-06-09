import React from 'react';

export interface NetWorthData {
  date: string;
  value: number;
}

interface Props {
  data: NetWorthData[];
}

export function NetWorthChart({ data }: Props) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <span className="text-gray-400 text-sm text-center px-4">
          Not enough data yet — connect accounts to see your net worth history
        </span>
      </div>
    );
  }

  const currentValue = data[data.length - 1].value;

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = (rawMax - rawMin) * 0.1 || rawMax * 0.1 || 10;
  const paddedMin = rawMin - pad;
  const paddedMax = rawMax + pad;
  const valueRange = paddedMax - paddedMin || 1;

  const n = data.length;
  const xStart = 50;
  const xEnd = 490;
  const yTop = 10;
  const yBottom = 110;
  const chartHeight = yBottom - yTop;
  const chartWidth = xEnd - xStart;

  const pts = data.map((d, i) => ({
    x: xStart + (i / (n - 1)) * chartWidth,
    y: yBottom - ((d.value - paddedMin) / valueRange) * chartHeight,
  }));

  const areaPath =
    `M ${pts[0].x},${yBottom} ` +
    pts.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${pts[pts.length - 1].x},${yBottom} Z`;

  const polylinePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');

  // Y-axis reference lines at min, mid, max
  const refLevels = [
    { value: rawMin, y: yBottom - ((rawMin - paddedMin) / valueRange) * chartHeight },
    { value: (rawMin + rawMax) / 2, y: yBottom - (((rawMin + rawMax) / 2 - paddedMin) / valueRange) * chartHeight },
    { value: rawMax, y: yBottom - ((rawMax - paddedMin) / valueRange) * chartHeight },
  ];

  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;

  return (
    <div className="w-full">
      <div className="text-2xl font-bold text-blue-600 mb-2">
        €{currentValue.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <svg
        width="100%"
        viewBox="0 0 500 140"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: '140px' }}
      >
        <defs>
          <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis reference lines */}
        {refLevels.map((ref, i) => (
          <g key={i}>
            <line
              x1={xStart}
              y1={ref.y}
              x2={xEnd}
              y2={ref.y}
              stroke="#e5e7eb"
              strokeDasharray="4,4"
            />
            <text
              x={xStart - 5}
              y={ref.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#9ca3af"
            >
              €{Math.round(ref.value).toLocaleString('en-IE')}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#nwGrad)" />

        {/* Line */}
        <polyline
          points={polylinePoints}
          stroke="#3b82f6"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Dots (only if 10 or fewer points) */}
        {n <= 10 &&
          pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" />
          ))}

        {/* X-axis date labels */}
        <text x={pts[0].x} y="130" textAnchor="start" fontSize="10" fill="#9ca3af">
          {firstDate}
        </text>
        <text
          x={pts[pts.length - 1].x}
          y="130"
          textAnchor="end"
          fontSize="10"
          fill="#9ca3af"
        >
          {lastDate}
        </text>
      </svg>
    </div>
  );
}
