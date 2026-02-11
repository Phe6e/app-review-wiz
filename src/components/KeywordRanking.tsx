import { useMemo } from 'react';

interface KeywordItem {
  text: string;
  weight: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface KeywordRankingProps {
  keywords?: KeywordItem[];
  onKeywordClick?: (keyword: string) => void;
  activeKeyword?: string | null;
}

const KeywordRanking = ({ keywords = [], onKeywordClick, activeKeyword }: KeywordRankingProps) => {
  const { positive, negative } = useMemo(() => {
    const pos = keywords
      .filter(k => k.sentiment === 'positive')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);
    const neg = keywords
      .filter(k => k.sentiment === 'negative')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);
    return { positive: pos, negative: neg };
  }, [keywords]);

  const maxPos = positive[0]?.weight || 1;
  const maxNeg = negative[0]?.weight || 1;

  const renderList = (
    items: KeywordItem[],
    maxWeight: number,
    color: 'positive' | 'negative',
  ) => {
    const barBg = color === 'positive' ? 'bg-primary/20' : 'bg-destructive/20';
    const barFill = color === 'positive' ? 'bg-primary' : 'bg-destructive';
    const rankColor = color === 'positive' ? 'text-primary' : 'text-destructive';

    return items.map((item, idx) => {
      const pct = (item.weight / maxWeight) * 100;
      const isActive = activeKeyword === item.text;
      return (
        <button
          key={item.text}
          onClick={() => onKeywordClick?.(item.text)}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 text-left group
            ${isActive ? 'bg-secondary ring-1 ring-primary/40' : 'hover:bg-secondary/60'}`}
        >
          <span className={`text-xs font-display font-bold w-5 text-right ${rankColor}`}>
            {idx + 1}
          </span>
          <span className="text-sm font-medium text-foreground min-w-[60px] truncate">
            {item.text}
          </span>
          <div className={`flex-1 h-5 ${barBg} rounded-full overflow-hidden`}>
            <div
              className={`h-full ${barFill} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right font-display tabular-nums">
            {item.weight}
          </span>
        </button>
      );
    });
  };

  const hasData = positive.length > 0 || negative.length > 0;

  return (
    <div className="glass-card p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">주요 키워드 TOP 10</h3>
        {activeKeyword && (
          <button
            onClick={() => onKeywordClick?.('')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md bg-secondary/60"
          >
            필터 해제
          </button>
        )}
      </div>

      {!hasData ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          앱을 검색하면 키워드 분석 결과가 표시됩니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-sm font-medium text-muted-foreground">긍정 키워드</span>
            </div>
            <div className="flex flex-col gap-1">
              {positive.length > 0 ? renderList(positive, maxPos, 'positive') : (
                <p className="text-xs text-muted-foreground py-4 text-center">데이터 없음</p>
              )}
            </div>
          </div>

          {/* Negative */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <span className="text-sm font-medium text-muted-foreground">부정 키워드</span>
            </div>
            <div className="flex flex-col gap-1">
              {negative.length > 0 ? renderList(negative, maxNeg, 'negative') : (
                <p className="text-xs text-muted-foreground py-4 text-center">데이터 없음</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordRanking;
