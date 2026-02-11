import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

    // Group by date (YYYY-MM-DD)
    const bucketMap = new Map<string, { positive: number; negative: number; neutral: number }>();

    for (const r of reviews) {
      if (!r.date || !r.sentiment) continue;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      const entry = bucketMap.get(key) || { positive: 0, negative: 0, neutral: 0 };
      entry[r.sentiment]++;
      bucketMap.set(key, entry);
    }

    if (bucketMap.size === 0) return [];

    // Sort by date
    const sorted = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date: date.slice(5), // MM-DD
        ...counts,
      }));

    return sorted;
  }, [reviews]);

  if (trendData.length === 0) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">감성 트렌드</h3>
        <div className="flex-1 flex items-center justify-center min-h-[14rem]">
          <p className="text-sm text-muted-foreground">선택한 기간에 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-semibold text-base text-foreground mb-4 text-center">감성 트렌드</h3>
      <div className="flex-1 flex items-center justify-center min-h-[14rem]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 45%, 45%)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(160, 45%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 50%, 55%)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(0, 50%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="hsl(220, 10%, 65%)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(220, 10%, 65%)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
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
            <Area type="monotone" dataKey="positive" stroke="hsl(160, 45%, 45%)" fill="url(#positiveGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="negative" stroke="hsl(0, 50%, 55%)" fill="url(#negativeGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentTrend;
