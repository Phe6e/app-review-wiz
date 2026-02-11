import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SentimentChartProps {
  data?: { name: string; value: number; color: string }[];
  compact?: boolean;
}

const defaultData = [
  { name: '긍정', value: 52, color: 'hsl(152, 55%, 45%)' },
  { name: '부정', value: 32, color: 'hsl(0, 65%, 55%)' },
  { name: '중립', value: 16, color: 'hsl(38, 80%, 50%)' },
];

const SentimentChart = ({ data = defaultData, compact = false }: SentimentChartProps) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={compact ? '' : 'glass-card p-6'}>
      {!compact && <h3 className="font-semibold text-base text-foreground mb-4">감성 분석</h3>}
      <div className="flex items-center gap-5">
        <div className={compact ? 'w-32 h-32' : 'w-40 h-40'}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={compact ? 35 : 45}
                outerRadius={compact ? 55 : 70}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(0, 0%, 100%)"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 14%, 88%)',
                  borderRadius: '12px',
                  color: 'hsl(220, 20%, 12%)',
                  fontSize: '13px',
                  boxShadow: '0 4px 16px hsl(220 20% 12% / 0.08)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2.5">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-muted-foreground">{d.name}</span>
              <span className="text-sm font-semibold text-foreground">
                {total > 0 ? Math.round(d.value / total * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;
