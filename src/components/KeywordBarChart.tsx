import { useMemo, useState } from 'react';
import { Store } from '@/lib/api';
import { getStoreColors } from '@/lib/storeColors';

interface KeywordItem {
  text: string;
  weight: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface KeywordBarChartProps {
  keywords?: KeywordItem[];
  store?: Store;
}

interface TooltipState {
  visible: boolean;
  text: string;
  weight: number;
  sentiment: string;
  x: number;
  y: number;
}

const KeywordBarChart = ({ keywords = [], store = 'apple' }: KeywordBarChartProps) => {
  const colors = getStoreColors(store);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, text: '', weight: 0, sentiment: '', x: 0, y: 0 });

  const rows = useMemo(() => {
    const pos = keywords.filter(k => k.sentiment === 'positive').sort((a, b) => b.weight - a.weight).slice(0, 5);
    const neg = keywords.filter(k => k.sentiment === 'negative').sort((a, b) => b.weight - a.weight).slice(0, 5);
    const maxLen = Math.max(pos.length, neg.length, 1);
    const maxWeight = Math.max(...pos.map(k => k.weight), ...neg.map(k => k.weight), 1);
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

  const showTooltip = (e: React.MouseEvent, text: string, weight: number, sentiment: string) => {
    const rect = (e.currentTarget as HTMLElement).closest('.glass-card')?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ visible: true, text, weight, sentiment, x: e.clientX - rect.left, y: e.clientY - rect.top - 40 });
  };
  const hideTooltip = () => setTooltip(prev => ({ ...prev, visible: false }));

  if (rows.length === 0 || (rows[0].posWeight === 0 && rows[0].negWeight === 0)) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">主要キーワード</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">データなし</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full relative">
      <h3 className="font-semibold text-base text-foreground mb-2 text-center">主要キーワード</h3>
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.positive }} />
          <span className="text-xs text-muted-foreground">← ポジティブ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">ネガティブ →</span>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.negative }} />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-0 h-7">
            <span className="text-xs text-muted-foreground w-16 text-right truncate pr-2 flex-shrink-0 cursor-default"
              onMouseEnter={e => row.posText && showTooltip(e, row.posText, row.posWeight, 'ポジティブ')}
              onMouseMove={e => row.posText && showTooltip(e, row.posText, row.posWeight, 'ポジティブ')}
              onMouseLeave={hideTooltip}>{row.posText}</span>
            <div className="flex-1 flex justify-end">
              <div className="h-5 rounded-full transition-all duration-500 cursor-pointer"
                style={{
                  width: `${row.posWidth}%`,
                  background: `linear-gradient(90deg, ${colors.gradPos[1]}, ${colors.gradPos[0]})`,
                  minWidth: row.posWidth > 0 ? '6px' : '0',
                  opacity: 0.85,
                }}
                onMouseEnter={e => row.posText && showTooltip(e, row.posText, row.posWeight, 'ポジティブ')}
                onMouseMove={e => row.posText && showTooltip(e, row.posText, row.posWeight, 'ポジティブ')}
                onMouseLeave={hideTooltip} />
            </div>
            <div className="w-px h-5 bg-border flex-shrink-0 mx-0.5" />
            <div className="flex-1 flex justify-start">
              <div className="h-5 rounded-full transition-all duration-500 cursor-pointer"
                style={{
                  width: `${row.negWidth}%`,
                  background: `linear-gradient(90deg, ${colors.gradNeg[0]}, ${colors.gradNeg[1]})`,
                  minWidth: row.negWidth > 0 ? '6px' : '0',
                  opacity: 0.85,
                }}
                onMouseEnter={e => row.negText && showTooltip(e, row.negText, row.negWeight, 'ネガティブ')}
                onMouseMove={e => row.negText && showTooltip(e, row.negText, row.negWeight, 'ネガティブ')}
                onMouseLeave={hideTooltip} />
            </div>
            <span className="text-xs text-muted-foreground w-16 text-left truncate pl-2 flex-shrink-0 cursor-default"
              onMouseEnter={e => row.negText && showTooltip(e, row.negText, row.negWeight, 'ネガティブ')}
              onMouseMove={e => row.negText && showTooltip(e, row.negText, row.negWeight, 'ネガティブ')}
              onMouseLeave={hideTooltip}>{row.negText}</span>
          </div>
        ))}
      </div>
      {tooltip.visible && (
        <div className="absolute z-50 pointer-events-none animate-fade-in"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px`, transform: 'translateX(-50%)' }}>
          <div className="px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              color: 'hsl(220, 15%, 20%)',
              whiteSpace: 'nowrap',
            }}>
            <span className="font-semibold">{tooltip.text}</span>
            <span className="text-muted-foreground ml-2">{tooltip.sentiment} · {tooltip.weight}回</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordBarChart;
