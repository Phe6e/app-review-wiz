import { useMemo, useCallback } from 'react';
import type { ReviewResult } from '@/lib/api';

interface SplitKeywordCloudProps {
  reviews: ReviewResult[];
  externalKeywords?: { text: string; weight: number }[];
}

// Simple seeded hash for deterministic layout
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const POSITIVE_COLORS = [
  'hsl(210, 70%, 55%)', 'hsl(190, 65%, 50%)', 'hsl(152, 60%, 48%)',
  'hsl(170, 55%, 45%)', 'hsl(220, 60%, 60%)', 'hsl(200, 70%, 52%)',
];
const NEGATIVE_COLORS = [
  'hsl(0, 72%, 55%)', 'hsl(15, 75%, 50%)', 'hsl(350, 65%, 52%)',
  'hsl(25, 80%, 55%)', 'hsl(5, 70%, 48%)', 'hsl(340, 60%, 50%)',
];

function extractKeywords(reviews: ReviewResult[], type: 'positive' | 'negative'): { text: string; weight: number }[] {
  const ratingFilter = type === 'positive' ? (r: number) => r >= 4 : (r: number) => r <= 2;
  const filtered = reviews.filter(r => ratingFilter(r.rating));
  if (filtered.length === 0) return [];

  // Simple word frequency from content
  const freq = new Map<string, number>();
  const stopWords = new Set(['이', '그', '저', '것', '수', '등', '더', '좀', '잘', '너무', '정말', '아주', '매우', '있어요', '없어요', '합니다', '입니다', '해요', '하는', '되는', '같아요', '같습니다', '있습니다']);

  filtered.forEach(r => {
    const text = `${r.title || ''} ${r.content || ''}`;
    const words = text.replace(/[^\w가-힣]/g, ' ').split(/\s+/).filter(w => w.length >= 2 && !stopWords.has(w));
    words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  });

  return Array.from(freq.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([text, count]) => ({ text, weight: count }));
}

function CloudCard({
  title,
  keywords,
  colors,
  emptyText,
}: {
  title: string;
  keywords: { text: string; weight: number }[];
  colors: string[];
  emptyText: string;
}) {
  const maxWeight = Math.max(...keywords.map(k => k.weight), 1);
  const minWeight = Math.min(...keywords.map(k => k.weight), 0);

  const getSize = useCallback((w: number) => {
    const ratio = maxWeight === minWeight ? 0.5 : (w - minWeight) / (maxWeight - minWeight);
    return 13 + ratio * 28;
  }, [maxWeight, minWeight]);

  const getOpacity = useCallback((w: number) => {
    const ratio = maxWeight === minWeight ? 1 : (w - minWeight) / (maxWeight - minWeight);
    return 0.5 + ratio * 0.5;
  }, [maxWeight, minWeight]);

  // Reorder: biggest toward center
  const items = useMemo(() => {
    const sorted = [...keywords].sort((a, b) => b.weight - a.weight);
    const result: typeof sorted = [];
    let left = true;
    for (const item of sorted) {
      if (left) result.push(item);
      else result.unshift(item);
      left = !left;
    }
    return result;
  }, [keywords]);

  const ROTATIONS = [0, 0, 0, -15, 12, -8, 10, 90, -90, 0, 0, 5];

  return (
    <div className="glass-card p-5 flex-1 min-w-0">
      <h3 className="font-display font-semibold text-base text-foreground mb-3">{title}</h3>
      <div className="flex flex-wrap gap-x-3 gap-y-2 items-center justify-center min-h-[160px] py-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          items.map(kw => {
            const size = getSize(kw.weight);
            const isBold = kw.weight >= maxWeight * 0.75;
            const color = colors[hash(kw.text) % colors.length];
            const rotation = ROTATIONS[hash(kw.text) % ROTATIONS.length];

            return (
              <span
                key={kw.text}
                className="cursor-default inline-block hover:brightness-125 hover:scale-125"
                style={{
                  fontSize: `${size}px`,
                  fontWeight: isBold ? 800 : 500,
                  opacity: getOpacity(kw.weight),
                  color,
                  transform: `rotate(${rotation}deg)`,
                  lineHeight: 1.3,
                  transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                title={`${kw.text}: ${kw.weight}회`}
              >
                {kw.text}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

const SplitKeywordCloud = ({ reviews, externalKeywords }: SplitKeywordCloudProps) => {
  const positiveKw = useMemo(() => {
    const extracted = extractKeywords(reviews, 'positive');
    if (extracted.length > 0) return extracted;
    // Fallback: use first half of external keywords
    if (externalKeywords) return externalKeywords.slice(0, Math.ceil(externalKeywords.length / 2));
    return [
      { text: '디자인', weight: 85 }, { text: 'UI', weight: 72 }, { text: '편리함', weight: 82 },
      { text: '추천', weight: 75 }, { text: '기능', weight: 95 }, { text: '업데이트', weight: 90 },
      { text: '인터페이스', weight: 70 }, { text: '사용성', weight: 80 }, { text: '속도', weight: 60 },
    ];
  }, [reviews, externalKeywords]);

  const negativeKw = useMemo(() => {
    const extracted = extractKeywords(reviews, 'negative');
    if (extracted.length > 0) return extracted;
    if (externalKeywords) return externalKeywords.slice(Math.ceil(externalKeywords.length / 2));
    return [
      { text: '배터리', weight: 65 }, { text: '크래시', weight: 55 }, { text: '광고', weight: 78 },
      { text: '알림', weight: 50 }, { text: '보안', weight: 45 }, { text: '로딩', weight: 58 },
      { text: '안정성', weight: 48 }, { text: '개선', weight: 62 }, { text: '콘텐츠', weight: 67 },
    ];
  }, [reviews, externalKeywords]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CloudCard
        title="✨ 긍정 키워드"
        keywords={positiveKw}
        colors={POSITIVE_COLORS}
        emptyText="긍정 키워드 데이터 없음"
      />
      <CloudCard
        title="⚡ 부정 키워드"
        keywords={negativeKw}
        colors={NEGATIVE_COLORS}
        emptyText="부정 키워드 데이터 없음"
      />
    </div>
  );
};

export default SplitKeywordCloud;
