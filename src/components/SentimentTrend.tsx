import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { trendData } from '@/data/mockData';

const SentimentTrend = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">감성 트렌드</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(222, 40%, 10%)',
                border: '1px solid hsl(222, 30%, 22%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 96%)',
                fontSize: '12px',
              }}
            />
            <Area type="monotone" dataKey="positive" stroke="hsl(152, 60%, 48%)" fill="url(#positiveGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="negative" stroke="hsl(0, 72%, 55%)" fill="url(#negativeGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentTrend;
