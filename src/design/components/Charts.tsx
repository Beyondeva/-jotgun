import { useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { catColor } from '../palette';
import { Money } from './Money';
import type { Slice } from './StackedBar';

export type { Slice };

interface DonutProps {
  data: Slice[];
  size?: number;
  label?: string;
  onSelect?: (slice: Slice) => void;
}

/** Thin ring; the total sits in the middle. Used on the summary page. */
export function DonutChart({ data, size = 176, label = 'รวม', onSelect }: DonutProps) {
  const reduce = useReducedMotion();
  const total = data.reduce((s, d) => s + d.value, 0);
  const empty = total === 0;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={empty ? [{ id: 'empty', value: 1 }] : data}
          dataKey="value"
          nameKey="name"
          innerRadius={size / 2 - 14}
          outerRadius={size / 2}
          startAngle={90}
          endAngle={-270}
          paddingAngle={empty || data.length < 2 ? 0 : 1.5}
          stroke="none"
          isAnimationActive={!reduce}
          animationDuration={700}
          animationEasing="ease-out"
          onClick={(_, i) => !empty && onSelect?.(data[i])}
        >
          {empty ? <Cell fill="var(--rule)" /> : data.map((d) => <Cell key={d.id} fill={catColor(d.color).ink} style={{ cursor: onSelect ? 'pointer' : undefined, outline: 'none' }} />)}
        </Pie>
      </PieChart>
      <div className="donut__center">
        <span className="donut__label">{label}</span>
        <Money value={total} size="md" />
      </div>
    </div>
  );
}

interface BarsProps {
  data: { label: string; value: number; highlight?: boolean }[];
  height?: number;
}

const compact = (satang: number) => {
  const b = satang / 100;
  return b >= 1000 ? `${(b / 1000).toFixed(b >= 10000 ? 0 : 1)}k` : `${Math.round(b)}`;
};

export function DailyBars({ data, height = 176 }: BarsProps) {
  const reduce = useReducedMotion();
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -8 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--rule)" strokeDasharray="2 4" />
          <YAxis
            width={36}
            axisLine={false}
            tickLine={false}
            tickCount={4}
            tickFormatter={compact}
            tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'var(--font-figure)' }}
          />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: 'var(--rule-strong)' }}
            tickLine={false}
            tick={{ fill: 'var(--ink-2)', fontSize: 12, fontFamily: 'var(--font-body)' }}
            interval={0}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={!reduce} animationDuration={500} minPointSize={2}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.highlight ? 'var(--accent)' : 'var(--ink)'} fillOpacity={d.highlight ? 1 : 0.78} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
