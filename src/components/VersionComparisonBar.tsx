import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-react';
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

const VersionComparisonBar = ({ reviews, store, keywords = [] }: Props) => {
  const colors = getStoreColors(store);

  const versions = useMemo(() => {
    const vSet = new Set<string>();
    for (const r of reviews) {
      if (r.version) vSet.add(r.version);
    }
    return Array.from(vSet).sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
      }
      return 0;
    });
  }, [reviews]);

  const [selectedA, selectedB] = useMemo(() => {
    if (versions.length < 2) return [versions[0] || '', ''];
    return [versions[versions.length - 2], versions[versions.length - 1]];
  }, [versions]);

  const stats = useMemo(() => {
    if (!selectedA || !selectedB) return null;
    const revA = reviews.filter(r => r.version === selectedA);
    const revB = reviews.filter(r => r.version === selectedB);
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
      vA: selectedA,
      vB: selectedB,
      countA: revA.length,
      countB: revB.length,
    };
  }, [reviews, selectedA, selectedB]);

  // Pain points: top negative keywords
  const painPoints = useMemo(() => {
    const negKws = keywords
      .filter(k => k.sentiment === 'negative')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
    return negKws;
  }, [keywords]);

  if (versions.length < 2 || !stats) return null;

  const Arrow = ({ val }: { val: number }) => {
    if (val > 0) return <ArrowUp className="w-3.5 h-3.5" style={{ color: colors.positive }} />;
    if (val < 0) return <ArrowDown className="w-3.5 h-3.5" style={{ color: colors.negative }} />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const valColor = (val: number, invert = false) => {
    const positive = invert ? val < 0 : val > 0;
    const negative = invert ? val > 0 : val < 0;
    if (positive) return colors.positive;
    if (negative) return colors.negative;
    return undefined;
  };

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h4 className="font-display font-semibold text-sm text-foreground">버전별 비교</h4>
        <span className="text-xs text-muted-foreground">
          v{stats.vA} ({stats.countA}건) → v{stats.vB} ({stats.countB}건)
        </span>
      </div>

      {/* Metrics row */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
          <span className="text-xs text-muted-foreground">평균 평점</span>
          <Arrow val={stats.ratingChange} />
          <span className="text-sm font-semibold" style={{ color: valColor(stats.ratingChange) }}>
            {stats.ratingChange > 0 ? '+' : ''}{stats.ratingChange}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
          <span className="text-xs text-muted-foreground">긍정 비율</span>
          <Arrow val={stats.posChange} />
          <span className="text-sm font-semibold" style={{ color: valColor(stats.posChange) }}>
            {stats.posChange > 0 ? '+' : ''}{stats.posChange}%
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
          <span className="text-xs text-muted-foreground">부정 비율</span>
          <Arrow val={stats.negChange} />
          <span className="text-sm font-semibold" style={{ color: valColor(stats.negChange, true) }}>
            {stats.negChange > 0 ? '+' : ''}{stats.negChange}%
          </span>
        </div>
      </div>

      {/* Pain Points separator + badges */}
      {painPoints.length > 0 && (
        <>
          <div className="my-4 h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${colors.negative}33, transparent)` }} />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-1">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: colors.negative }} />
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">주요 과제</span>
            </div>
            {painPoints.map(pp => (
              <span
                key={pp.text}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border"
                style={{
                  background: `${colors.negative}12`,
                  borderColor: `${colors.negative}25`,
                  color: colors.negative,
                }}
              >
                {pp.text}
                <span className="opacity-60">({pp.weight})</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VersionComparisonBar;
