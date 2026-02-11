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
    <div className="glass-card p-6">
      <h3 className="font-semibold text-base text-foreground mb-4">감성 트렌드</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152, 55%, 45%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(152, 55%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 65%, 55%)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(0, 65%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="hsl(220, 10%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
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
            <Area type="monotone" dataKey="positive" stroke="hsl(152, 55%, 45%)" fill="url(#positiveGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="negative" stroke="hsl(0, 65%, 55%)" fill="url(#negativeGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentTrend;
