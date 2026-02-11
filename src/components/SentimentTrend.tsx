import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReviewForTrend {
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface SentimentTrendProps {
  reviews?: ReviewForTrend[];
}

const SentimentTrend = ({ reviews = [] }: SentimentTrendProps) => {
  const trendData = useMemo(() => {
    if (reviews.length === 0) return [];

    // Build monthly buckets keyed by YYYY-MM
    const buckets = new Map<string, { positive: number; negative: number; neutral: number }>();

    for (const r of reviews) {
      if (!r.date || !r.sentiment) continue;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) continue;
      const key = format(d, 'yyyy-MM');
      if (!buckets.has(key)) {
        buckets.set(key, { positive: 0, negative: 0, neutral: 0 });
      }
      const bucket = buckets.get(key)!;
      if (r.sentiment === 'positive') bucket.positive++;
      else if (r.sentiment === 'negative') bucket.negative++;
      else bucket.neutral++;
    }

    // Sort by YYYY-MM key (chronological order, handles cross-year correctly)
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, counts]) => {
        const d = parseISO(key + '-01');
        return {
          date: format(d, 'yy.M월', { locale: ko }),
          ...counts,
        };
      });
  }, [reviews]);

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">감성 트렌드</h3>
      <div className="flex-1 min-h-[200px]">
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
            <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} width={30} />
            <Tooltip
              contentStyle={{
                background: 'hsl(222, 40%, 10%)',
                border: '1px solid hsl(222, 30%, 22%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 96%)',
                fontSize: '12px',
              }}
            />
            <Area type="monotone" dataKey="positive" stroke="hsl(152, 60%, 48%)" fill="url(#positiveGrad)" strokeWidth={2} name="긍정" />
            <Area type="monotone" dataKey="negative" stroke="hsl(0, 72%, 55%)" fill="url(#negativeGrad)" strokeWidth={2} name="부정" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentTrend;
