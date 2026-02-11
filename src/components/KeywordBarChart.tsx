import { useMemo } from 'react';

interface KeywordItem {
  text: string;
  weight: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface KeywordBarChartProps {
  keywords?: KeywordItem[];
}

const KeywordBarChart = ({ keywords = [] }: KeywordBarChartProps) => {
  const rows = useMemo(() => {
    const pos = keywords
      .filter(k => k.sentiment === 'positive')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    const neg = keywords
      .filter(k => k.sentiment === 'negative')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    const maxLen = Math.max(pos.length, neg.length, 1);
    const maxWeight = Math.max(
      ...pos.map(k => k.weight),
      ...neg.map(k => k.weight),
      1
    );

    const result = [];
    for (let i = 0; i < maxLen; i++) {
      result.push({
        posText: pos[i]?.text || '',
        posWeight: pos[i]?.weight || 0,
        negText: neg[i]?.text || '',
        negWeight: neg[i]?.weight || 0,
        posWidth: pos[i] ? (pos[i].weight / maxWeight) * 100 : 0,
        negWidth: neg[i] ? (neg[i].weight / maxWeight) * 100 : 0,
      });
    }
    return result;
  }, [keywords]);

  if (rows.length === 0 || (rows[0].posWeight === 0 && rows[0].negWeight === 0)) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">주요 키워드</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-semibold text-base text-foreground mb-2 text-center">주요 키워드</h3>
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(210, 55%, 55%)' }} />
          <span className="text-xs text-muted-foreground">← 긍정</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">부정 →</span>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(0, 50%, 58%)' }} />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-0 h-7">
            {/* Positive keyword text - left edge */}
            <span className="text-xs text-muted-foreground w-16 text-right truncate pr-2 flex-shrink-0">
              {row.posText}
            </span>
            {/* Positive bar - grows right-to-left */}
            <div className="flex-1 flex justify-end">
              <div
                className="h-5 rounded-l-md transition-all duration-500"
                style={{
                  width: `${row.posWidth}%`,
                  background: `hsl(${210 + i * 5}, 55%, ${55 + i * 3}%)`,
                  minWidth: row.posWidth > 0 ? '4px' : '0',
                }}
              />
            </div>
            {/* Center divider */}
            <div className="w-px h-5 bg-border flex-shrink-0 mx-0.5" />
            {/* Negative bar - grows left-to-right */}
            <div className="flex-1 flex justify-start">
              <div
                className="h-5 rounded-r-md transition-all duration-500"
                style={{
                  width: `${row.negWidth}%`,
                  background: `hsl(${i * 5}, 50%, ${58 + i * 2}%)`,
                  minWidth: row.negWidth > 0 ? '4px' : '0',
                }}
              />
            </div>
            {/* Negative keyword text - right edge */}
            <span className="text-xs text-muted-foreground w-16 text-left truncate pl-2 flex-shrink-0">
              {row.negText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeywordBarChart;
