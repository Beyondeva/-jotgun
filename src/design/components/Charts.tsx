import { useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { catColor } from '../palette';
import { useAmountsHidden } from '../../lib/privacy';
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
  /** index of the picked day */
  selected?: number | null;
  onSelect?: (index: number) => void;
}

const compact = (satang: number) => {
  const b = satang / 100;
  return b >= 1000 ? `${(b / 1000).toFixed(b >= 10000 ? 0 : 1)}k` : `${Math.round(b)}`;
};

// left edge of the plot: the y-axis width plus the (negative) left margin
const AXIS = 36;
const MARGIN_LEFT = -8;

/**
 * One bar per day. With onSelect, tapping anywhere in a day's column picks it (month view
 * bars are too thin to aim at); the picked day stays inked and the others fade.
 */
export function DailyBars({ data, height = 176, selected = null, onSelect }: BarsProps) {
  const reduce = useReducedMotion();
  const hidden = useAmountsHidden();
  const pick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    const r = e.currentTarget.getBoundingClientRect();
    const left = AXIS + MARGIN_LEFT;
    const i = Math.floor(((e.clientX - r.left - left) / (r.width - left)) * data.length);
    if (i >= 0 && i < data.length) onSelect(i);
  };
  return (
    <div style={{ width: '100%', height, cursor: onSelect ? 'pointer' : undefined }} onClick={pick}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: MARGIN_LEFT }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--rule)" strokeDasharray="2 4" />
          <YAxis
            width={AXIS}
            axisLine={false}
            tickLine={false}
            tickCount={4}
            tickFormatter={hidden ? () => '' : compact}
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
              <Cell
                key={i}
                fill={d.highlight ? 'var(--accent)' : 'var(--ink)'}
                fillOpacity={selected === null ? (d.highlight ? 1 : 0.78) : i === selected ? 1 : 0.22}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
