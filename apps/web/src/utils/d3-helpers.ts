/**
 * D3.js helper utilities for Financial Hub visualizations
 */

export interface HierarchyNode {
  name: string;
  value?: number;
  children?: HierarchyNode[];
}

export interface SankeyNode {
  id: string;
  label: string;
  value: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface HeatmapData {
  month: string;
  category: string;
  value: number;
}

/**
 * Prepare data for sunburst chart
 */
export function prepareSunburstData(expenses: Record<string, number>): HierarchyNode {
  const children: HierarchyNode[] = Object.entries(expenses).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  return {
    name: 'Expenses',
    children,
  };
}

/**
 * Prepare data for sankey diagram (income → expenses)
 */
export function prepareSankeyData(
  income: number,
  expenses: Record<string, number>,
  savings: number,
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const nodes: SankeyNode[] = [
    { id: 'income', label: 'Income', value: income },
    ...Object.entries(expenses).map(([cat, _], i) => ({
      id: `expense-${i}`,
      label: cat,
      value: 0,
    })),
    { id: 'savings', label: 'Savings', value: savings },
  ];

  const links: SankeyLink[] = [
    // Income flows to each expense
    ...Object.entries(expenses).map(([cat, amount], i) => ({
      source: 'income',
      target: `expense-${i}`,
      value: amount,
    })),
    // Income flows to savings
    { source: 'income', target: 'savings', value: savings },
  ];

  return { nodes, links };
}

/**
 * Prepare data for heatmap (spending patterns)
 */
export function prepareHeatmapData(
  spending: Record<string, Record<string, number>>, // category -> month -> amount
): HeatmapData[] {
  const data: HeatmapData[] = [];

  for (const [category, months] of Object.entries(spending)) {
    for (const [month, value] of Object.entries(months)) {
      data.push({ month, category, value });
    }
  }

  return data;
}

/**
 * Calculate color intensity for heatmap
 */
export function getHeatmapColor(value: number, min: number, max: number): string {
  const normalized = (value - min) / (max - min);

  // Red gradient: white -> light red -> dark red
  if (normalized < 0.33) {
    const r = Math.round(255 + (255 - 255) * (normalized / 0.33));
    const g = Math.round(255 - 100 * (normalized / 0.33));
    const b = Math.round(255 - 100 * (normalized / 0.33));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalized < 0.66) {
    const r = 255;
    const g = Math.round(155 - 100 * ((normalized - 0.33) / 0.33));
    const b = Math.round(155 - 100 * ((normalized - 0.33) / 0.33));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const r = 255;
    const g = Math.round(55 - 30 * ((normalized - 0.66) / 0.34));
    const b = Math.round(55 - 30 * ((normalized - 0.66) / 0.34));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Prepare treemap data (hierarchical spending)
 */
export function prepareTreemapData(
  data: Record<string, Record<string, number>>,
): HierarchyNode {
  const children: HierarchyNode[] = Object.entries(data).map(([category, subcategories]) => ({
    name: category,
    children: Object.entries(subcategories).map(([name, value]) => ({
      name,
      value,
    })),
  }));

  return {
    name: 'Spending',
    children,
  };
}

/**
 * Calculate statistics for visualization
 */
export function getDataStats(data: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
} {
  if (data.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, mean, median, stdDev };
}

/**
 * Generate color scheme for categories
 */
export function getCategoryColor(category: string, index: number = 0): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#06b6d4', // cyan
  ];

  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[(hash + index) % colors.length];
}

/**
 * Format numbers for display
 */
export function formatChartNumber(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Prepare time series data
 */
export function prepareTimeSeriesData(
  data: Array<{ date: string; value: number }>,
): Array<{ date: string; value: number; formatted: string }> {
  return data.map(d => ({
    date: d.date,
    value: d.value,
    formatted: formatChartNumber(d.value),
  }));
}

/**
 * Calculate cumulative sum
 */
export function calculateCumulative(data: number[]): number[] {
  let sum = 0;
  return data.map(value => {
    sum += value;
    return sum;
  });
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(0);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }

  return result;
}
