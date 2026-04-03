import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Store } from '@/lib/api';
import { getStoreColors } from '@/lib/storeColors';

interface ReviewForTrend {
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface SentimentTrendProps {
  reviews?: ReviewForTrend[];
  store?: Store;
}

const SentimentTrend = ({ reviews = [], store = 'apple' }: SentimentTrendProps) => {
  const colors = getStoreColors(store);

  const trendData = useMemo(() => {
    if (reviews.length === 0) return [];
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
    return Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date: date.slice(5), ...counts }));
  }, [reviews]);

  if (trendData.length === 0) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">感情トレンド</h3>
        <div className="flex-1 flex items-center justify-center min-h-[14rem]">
          <p className="text-sm text-muted-foreground">選択した期間にデータがありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-semibold text-base text-foreground mb-4 text-center">感情トレンド</h3>
      <div className="flex-1 flex items-center justify-center min-h-[14rem] px-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.positive} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colors.positive} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.negative} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colors.negative} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 92%)" vertical={false} />
            <XAxis dataKey="date" stroke="hsl(240, 4%, 56%)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(240, 4%, 56%)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: '12px',
                color: 'hsl(220, 15%, 20%)',
                fontSize: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              }}
            />
            <Area type="monotone" dataKey="positive" name="ポジティブ" stroke={colors.positive} fill="url(#positiveGrad)" strokeWidth={2.5} strokeLinecap="round" dot={false} strokeOpacity={0.8} />
            <Area type="monotone" dataKey="negative" name="ネガティブ" stroke={colors.negative} fill="url(#negativeGrad)" strokeWidth={2.5} strokeLinecap="round" dot={false} strokeOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentTrend;
