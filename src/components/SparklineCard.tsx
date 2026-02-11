import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import type { ReviewResult } from '@/lib/api';

interface SparklineCardProps {
  reviews: ReviewResult[];
}

const SparklineCard = ({ reviews }: SparklineCardProps) => {
  const { avg, dailyCounts } = useMemo(() => {
    const now = new Date();
    const counts: number[] = Array(7).fill(0);
    reviews.forEach(r => {
      const d = new Date(r.date);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) counts[6 - diff]++;
    });
    const total = counts.reduce((a, b) => a + b, 0);
    return { avg: Math.round((total / 7) * 10) / 10, dailyCounts: counts };
  }, [reviews]);

  const max = Math.max(...dailyCounts, 1);
  const points = dailyCounts.map((v, i) => {
    const x = (i / 6) * 60;
    const y = 24 - (v / max) * 20;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="glass-card p-5 flex items-center gap-4 animate-fade-in">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <Activity className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">리뷰 밀도 (7일)</p>
        <p className="text-xl font-display font-bold text-foreground">
          <AnimatedNumber value={avg} formatFn={n => (Math.round(n * 10) / 10).toFixed(1)} />
          <span className="text-sm font-normal text-muted-foreground ml-1">건/일</span>
        </p>
      </div>
      <svg width="64" height="28" viewBox="0 0 64 28" className="flex-shrink-0">
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {dailyCounts.map((v, i) => (
          <circle
            key={i}
            cx={(i / 6) * 60 + 2}
            cy={24 - (v / max) * 20}
            r="2"
            fill="hsl(var(--primary))"
            opacity={i === 6 ? 1 : 0.4}
          />
        ))}
      </svg>
    </div>
  );
};

export default SparklineCard;
