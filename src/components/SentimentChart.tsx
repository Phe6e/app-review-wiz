import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Store } from '@/lib/api';
import { getStoreColors } from '@/lib/storeColors';

interface SentimentChartProps {
  data?: { name: string; value: number; color: string }[];
  store?: Store;
}

const SentimentChart = ({ data, store = 'apple' }: SentimentChartProps) => {
  const colors = getStoreColors(store);

  const chartData = data || [
    { name: 'ポジティブ', value: 52, color: colors.positive },
    { name: 'ネガティブ', value: 32, color: colors.negative },
    { name: 'ニュートラル', value: 16, color: colors.neutral },
  ];

  // Override colors from store palette
  const coloredData = chartData.map(d => {
    if (d.name === 'ポジティブ') return { ...d, color: colors.positive };
    if (d.name === 'ネガティブ') return { ...d, color: colors.negative };
    return { ...d, color: colors.neutral };
  });

  const total = coloredData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">感情分析</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">選択した期間にデータがありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-semibold text-base text-foreground mb-4 text-center">感情分析</h3>
      <div className="flex-1 flex flex-row items-center justify-center gap-6">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <linearGradient id="sentGradPos" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={colors.gradPos[0]} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={colors.gradPos[1]} stopOpacity={0.75} />
                </linearGradient>
                <linearGradient id="sentGradNeg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={colors.gradNeg[0]} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={colors.gradNeg[1]} stopOpacity={0.75} />
                </linearGradient>
                <linearGradient id="sentGradNeu" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={colors.gradNeu[0]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={colors.gradNeu[1]} stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <Pie data={coloredData} cx="50%" cy="50%" innerRadius={36} outerRadius={58} dataKey="value" strokeWidth={0}>
                {coloredData.map((entry, index) => {
                  const gradId = entry.name === 'ポジティブ' ? 'url(#sentGradPos)' : entry.name === 'ネガティブ' ? 'url(#sentGradNeg)' : 'url(#sentGradNeu)';
                  return <Cell key={index} fill={gradId} />;
                })}
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
          {coloredData.map(d => (
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
