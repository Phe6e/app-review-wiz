import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { sentimentData } from '@/data/mockData';

const SentimentChart = () => {
  const total = sentimentData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">감성 분석</h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                strokeWidth={0}
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(222 40% 10%)',
                  border: '1px solid hsl(222 30% 22%)',
                  borderRadius: '8px',
                  color: 'hsl(210 40% 96%)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-3">
          {sentimentData.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-muted-foreground">{d.name}</span>
              <span className="text-sm font-display font-semibold text-foreground">{Math.round(d.value / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;
