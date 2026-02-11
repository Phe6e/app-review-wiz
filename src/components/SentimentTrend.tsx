import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ReviewForTrend {
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface SentimentTrendProps {
  reviews?: ReviewForTrend[];
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const SentimentTrend = ({ reviews = [] }: SentimentTrendProps) => {
  const trendData = useMemo(() => {
    const buckets = MONTH_LABELS.map(label => ({ date: label, positive: 0, negative: 0, neutral: 0 }));

    if (reviews.length === 0) return buckets;

    for (const r of reviews) {
      if (!r.date || !r.sentiment) continue;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) continue;
      const month = d.getMonth();
      if (r.sentiment === 'positive') buckets[month].positive++;
      else if (r.sentiment === 'negative') buckets[month].negative++;
      else buckets[month].neutral++;
    }

    let lastNonEmpty = -1;
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (buckets[i].positive + buckets[i].negative + buckets[i].neutral > 0) { lastNonEmpty = i; break; }
    }
    if (lastNonEmpty === -1) return buckets;
    return buckets.slice(0, lastNonEmpty + 1);
  }, [reviews]);

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4 text-center">감성 트렌드</h3>
      <div className="flex-1 flex items-center justify-center min-h-[14rem]">
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
