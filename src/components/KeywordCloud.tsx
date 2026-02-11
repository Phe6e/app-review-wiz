import { useMemo } from 'react';

interface KeywordCloudProps {
  keywords?: { text: string; weight: number }[];
}

const defaultKeywords = [
  { text: '디자인', weight: 85 }, { text: 'UI', weight: 72 }, { text: '업데이트', weight: 90 },
  { text: '배터리', weight: 65 }, { text: '기능', weight: 95 }, { text: '속도', weight: 60 },
  { text: '편리함', weight: 82 }, { text: '콘텐츠', weight: 67 }, { text: '추천', weight: 75 },
];

// Deterministic pseudo-random based on string hash
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 70%, 60%)',
  'hsl(280, 60%, 65%)',
  'hsl(152, 60%, 48%)',
  'hsl(38, 80%, 55%)',
  'hsl(340, 65%, 55%)',
];

const KeywordCloud = ({ keywords = defaultKeywords }: KeywordCloudProps) => {
  const maxWeight = Math.max(...keywords.map(k => k.weight), 1);
  const minWeight = Math.min(...keywords.map(k => k.weight));

  const items = useMemo(() => {
    // Sort by weight descending so biggest are in the center
    const sorted = [...keywords].sort((a, b) => b.weight - a.weight);
    // Reorder: place highest weight items toward center of array
    const result: typeof sorted = new Array(sorted.length);
    let left = 0, right = sorted.length - 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i % 2 === 0) result[Math.floor(sorted.length / 2) + left++] = sorted[i];
      else result[Math.floor(sorted.length / 2) - right-- + sorted.length - 1] = sorted[i];
    }
    // Filter out undefined slots and return
    return result.filter(Boolean);
  }, [keywords]);

  const getSize = (weight: number) => {
    const ratio = maxWeight === minWeight ? 0.5 : (weight - minWeight) / (maxWeight - minWeight);
    return 14 + ratio * 26;
  };

  const getOpacity = (weight: number) => {
    const ratio = maxWeight === minWeight ? 1 : (weight - minWeight) / (maxWeight - minWeight);
    return 0.55 + ratio * 0.45;
  };

  const getRotation = (text: string) => {
    const h = hashStr(text);
    const angles = [0, 0, 0, -12, 8, -6, 10, 0]; // mostly horizontal
    return angles[h % angles.length];
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">주요 키워드</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-3 items-center justify-center min-h-[180px] py-4">
        {items.map((keyword) => {
          const size = getSize(keyword.weight);
          const isBold = keyword.weight >= maxWeight * 0.85;
          const color = COLORS[hashStr(keyword.text) % COLORS.length];
          const rotation = getRotation(keyword.text);

          return (
            <span
              key={keyword.text}
              className="cursor-default transition-all duration-300 hover:scale-125 inline-block"
              style={{
                fontSize: `${size}px`,
                fontWeight: isBold ? 800 : 500,
                opacity: getOpacity(keyword.weight),
                color,
                transform: `rotate(${rotation}deg)`,
                lineHeight: 1.2,
              }}
              title={`${keyword.text}: ${keyword.weight}`}
            >
              {keyword.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default KeywordCloud;
