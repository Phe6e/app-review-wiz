import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SentimentChartProps {
  data?: { name: string; value: number; color: string }[];
}

const defaultData = [
  { name: '긍정', value: 52, color: 'hsl(142, 71%, 45%)' },
  { name: '부정', value: 32, color: 'hsl(4, 90%, 60%)' },
  { name: '중립', value: 16, color: 'hsl(240, 4%, 56%)' },
];

const SentimentChart = ({ data = defaultData }: SentimentChartProps) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">감성 분석</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">선택한 기간에 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-semibold text-base text-foreground mb-4 text-center">감성 분석</h3>
      <div className="flex-1 flex flex-row items-center justify-center gap-6">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={58} dataKey="value" strokeWidth={0}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '10px',
                  color: 'hsl(220, 15%, 20%)',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-3">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-muted-foreground w-8">{d.name}</span>
              <span className="text-sm font-semibold text-foreground">
                {total > 0 ? Math.round(d.value / total * 100) : 0}%
              </span>
              <span className="text-xs text-muted-foreground">({d.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;
