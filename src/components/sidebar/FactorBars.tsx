'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DemandFactor } from '@/lib/scoring/types';

interface FactorBarsProps {
  factors: DemandFactor[];
}

const FACTOR_COLORS = [
  '#1B4F8A',
  '#2E75B6',
  '#5A9AD4',
  '#8BB3E0',
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DemandFactor }> }) {
  if (!active || !payload?.length) return null;
  const factor = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2 text-xs">
      <p className="font-semibold text-gray-900">{factor.name}</p>
      <p className="text-gray-600 mt-0.5">
        Raw value: <span className="font-medium">{factor.value}</span>
      </p>
      <p className="text-gray-600">
        Normalized: <span className="font-medium">{factor.normalized.toFixed(1)}</span>/100
      </p>
      <p className="text-gray-600">
        Weight: <span className="font-medium">{(factor.weight * 100).toFixed(0)}%</span>
      </p>
    </div>
  );
}

export default function FactorBars({ factors }: FactorBarsProps) {
  const chartData = factors.map((f) => ({
    ...f,
    shortName: f.name.replace(' households', '').replace(' density', '').replace(' rate', ''),
    weightLabel: `${(f.weight * 100).toFixed(0)}%`,
  }));

  return (
    <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Demand Factors
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
          barCategoryGap="20%"
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="shortName"
            width={85}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Bar dataKey="normalized" radius={[0, 4, 4, 0]} barSize={18}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={FACTOR_COLORS[i % FACTOR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between px-1 mt-1">
        {factors.map((f, i) => (
          <span key={i} className="text-[10px] text-gray-400">
            {(f.weight * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}
