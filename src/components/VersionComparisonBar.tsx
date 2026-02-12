import { useMemo, useCallback } from 'react';
import { ArrowUp, ArrowDown, Minus, AlertTriangle, Info } from 'lucide-react';
import { ReviewResult, Store } from '@/lib/api';
import { getStoreColors } from '@/lib/storeColors';

interface KeywordItem {
  text: string;
  weight: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface Props {
  reviews: ReviewResult[];
  store: Store;
  keywords?: KeywordItem[];
}

// Amplitude Session Replay tracking helper
const trackVersionEvent = (eventName: string, props: Record<string, unknown>) => {
  try {
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.track(eventName, props);
    }
  } catch { /* noop */ }
};

const VersionComparisonBar = ({ reviews, store, keywords = [] }: Props) => {
  const colors = getStoreColors(store);

  // Smart scan: extract all versions sorted, pick latest (vB) and previous (vA)
  const { versions, vA, vB } = useMemo(() => {
    const vMap = new Map<string, ReviewResult[]>();
    for (const r of reviews) {
      if (!r.version) continue;
      const arr = vMap.get(r.version) || [];
      arr.push(r);
      vMap.set(r.version, arr);
    }

    const sorted = Array.from(vMap.keys()).sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
      }
      return 0;
    });

    const current = sorted.length > 0 ? sorted[sorted.length - 1] : '';
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : '';
    return { versions: sorted, vA: previous, vB: current };
  }, [reviews]);

  // Comparison stats: [vA] vs [vB]
  const stats = useMemo(() => {
    if (!vA || !vB) return null;
    const revA = reviews.filter(r => r.version === vA);
    const revB = reviews.filter(r => r.version === vB);
    if (revA.length === 0 || revB.length === 0) return null;

    const avgA = revA.reduce((s, r) => s + r.rating, 0) / revA.length;
    const avgB = revB.reduce((s, r) => s + r.rating, 0) / revB.length;
    const posA = revA.filter(r => r.sentiment === 'positive').length / revA.length * 100;
    const posB = revB.filter(r => r.sentiment === 'positive').length / revB.length * 100;
    const negA = revA.filter(r => r.sentiment === 'negative').length / revA.length * 100;
    const negB = revB.filter(r => r.sentiment === 'negative').length / revB.length * 100;

    return {
      ratingChange: Math.round((avgB - avgA) * 100) / 100,
      posChange: Math.round(posB - posA),
      negChange: Math.round(negB - negA),
      vA, vB,
      countA: revA.length,
      countB: revB.length,
    };
  }, [reviews, vA, vB]);

  // Single version summary
  const singleVersionStats = useMemo(() => {
    if (versions.length !== 1) return null;
    const ver = versions[0];
    const vReviews = reviews.filter(r => r.version === ver);
    if (vReviews.length === 0) return null;
    const avg = Math.round((vReviews.reduce((s, r) => s + r.rating, 0) / vReviews.length) * 100) / 100;
    const posRate = Math.round(vReviews.filter(r => r.sentiment === 'positive').length / vReviews.length * 100);
    const negRate = Math.round(vReviews.filter(r => r.sentiment === 'negative').length / vReviews.length * 100);
    return { version: ver, count: vReviews.length, avg, posRate, negRate };
  }, [reviews, versions]);

  // Pain points from latest version's negative keywords
  const painPoints = useMemo(() => {
    const latestVer = vB || (versions.length === 1 ? versions[0] : '');
    if (!latestVer) return keywords.filter(k => k.sentiment === 'negative').sort((a, b) => b.weight - a.weight).slice(0, 5);

    // Extract negative keywords specifically from latest version reviews
    const latestReviews = reviews.filter(r => r.version === latestVer && r.sentiment === 'negative' && r.keywords?.length);
    const kwMap = new Map<string, number>();
    for (const r of latestReviews) {
      for (const kw of r.keywords!) {
        kwMap.set(kw, (kwMap.get(kw) || 0) + 1);
      }
    }

    if (kwMap.size === 0) {
      return keywords.filter(k => k.sentiment === 'negative').sort((a, b) => b.weight - a.weight).slice(0, 5);
    }

    return Array.from(kwMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, weight]) => ({ text, weight, sentiment: 'negative' as const }));
  }, [reviews, keywords, vB, versions]);

  const handleBadgeClick = useCallback((keyword: string, weight: number) => {
    trackVersionEvent('pain_point_badge_clicked', {
      keyword,
      mention_count: weight,
      store,
      version: vB || versions[0] || '',
    });
  }, [store, vB, versions]);

  if (versions.length === 0) return null;

  const Arrow = ({ val }: { val: number }) => {
    if (val > 0) return <ArrowUp className="w-3 h-3" style={{ color: colors.positive }} />;
    if (val < 0) return <ArrowDown className="w-3 h-3" style={{ color: colors.negative }} />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const valColor = (val: number, invert = false) => {
    const positive = invert ? val < 0 : val > 0;
    const negative = invert ? val > 0 : val < 0;
    if (positive) return colors.positive;
    if (negative) return colors.negative;
    return undefined;
  };

  const MetricChip = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-sm border border-white/30">
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
      {children}
    </div>
  );

  const PainBadges = () => painPoints.length > 0 ? (
    <>
      <div className="w-px h-5 mx-0.5 shrink-0" style={{ background: `${colors.negative}35` }} />
      <div className="flex items-center gap-1 flex-wrap">
        <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: colors.negative }} />
        {painPoints.map(pp => (
          <button
            key={pp.text}
            type="button"
            onClick={() => handleBadgeClick(pp.text, pp.weight)}
            className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[10px] font-medium backdrop-blur-md border cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              background: `${colors.negative}10`,
              borderColor: `${colors.negative}20`,
              color: colors.negative,
            }}
          >
            {pp.text}<span className="opacity-50">({pp.weight})</span>
          </button>
        ))}
      </div>
    </>
  ) : null;

  // Single version summary mode
  if (versions.length === 1 && singleVersionStats) {
    return (
      <div className="glass-card px-4 py-2.5 animate-fade-in">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <Info className="w-3 h-3 text-muted-foreground" />
            <span className="font-display font-semibold text-xs text-foreground">v{singleVersionStats.version}</span>
            <span className="text-[10px] text-muted-foreground">({singleVersionStats.count}건)</span>
          </div>

          <MetricChip label="평균">
            <span className="text-xs font-semibold text-foreground leading-none">{singleVersionStats.avg}</span>
          </MetricChip>
          <MetricChip label="긍정">
            <span className="text-xs font-semibold leading-none" style={{ color: colors.positive }}>{singleVersionStats.posRate}%</span>
          </MetricChip>
          <MetricChip label="부정">
            <span className="text-xs font-semibold leading-none" style={{ color: colors.negative }}>{singleVersionStats.negRate}%</span>
          </MetricChip>

          <PainBadges />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="glass-card px-4 py-2.5 animate-fade-in">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Header */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-display font-semibold text-xs text-foreground">버전 비교</span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            v{stats.vA}({stats.countA}) → v{stats.vB}({stats.countB})
          </span>
        </div>

        {/* Metrics */}
        <MetricChip label="평점">
          <Arrow val={stats.ratingChange} />
          <span className="text-xs font-semibold leading-none" style={{ color: valColor(stats.ratingChange) }}>
            {stats.ratingChange > 0 ? '+' : ''}{stats.ratingChange}
          </span>
        </MetricChip>
        <MetricChip label="긍정">
          <Arrow val={stats.posChange} />
          <span className="text-xs font-semibold leading-none" style={{ color: valColor(stats.posChange) }}>
            {stats.posChange > 0 ? '+' : ''}{stats.posChange}%
          </span>
        </MetricChip>
        <MetricChip label="부정">
          <Arrow val={stats.negChange} />
          <span className="text-xs font-semibold leading-none" style={{ color: valColor(stats.negChange, true) }}>
            {stats.negChange > 0 ? '+' : ''}{stats.negChange}%
          </span>
        </MetricChip>

        <PainBadges />
      </div>
    </div>
  );
};

export default VersionComparisonBar;
