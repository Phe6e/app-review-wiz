import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface KeywordItem {
  text: string;
  weight: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface KeywordBarChartProps {
  keywords?: KeywordItem[];
}

const KeywordBarChart = ({ keywords = [] }: KeywordBarChartProps) => {
  const chartData = useMemo(() => {
    const pos = keywords
      .filter(k => k.sentiment === 'positive')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(k => ({ text: k.text, value: -k.weight, type: 'positive' as const }));

    const neg = keywords
      .filter(k => k.sentiment === 'negative')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(k => ({ text: k.text, value: k.weight, type: 'negative' as const }));

    // Interleave: positive on top (negative values = left), negative below (positive values = right)
    const all = [...pos, ...neg];
    return all;
  }, [keywords]);

  const tooltipStyle = {
    background: 'hsl(222, 40%, 10%)',
    border: '1px solid hsl(222, 30%, 22%)',
    borderRadius: '8px',
    color: 'hsl(210, 40%, 96%)',
    fontSize: '12px',
  };

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 10;
    return Math.max(...chartData.map(d => Math.abs(d.value)), 1);
  }, [chartData]);

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-display font-semibold text-lg text-foreground mb-2 text-center">주요 키워드</h3>
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(199, 70%, 55%)' }} />
          <span className="text-xs text-muted-foreground">긍정 ←</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">→ 부정</span>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(0, 72%, 55%)' }} />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 32, 180)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
              <XAxis
                type="number"
                domain={[-maxVal, maxVal]}
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => String(Math.abs(v))}
              />
              <YAxis
                type="category"
                dataKey="text"
                stroke="hsl(215, 20%, 55%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [Math.abs(v), '빈도']}
              />
              <ReferenceLine x={0} stroke="hsl(215, 20%, 35%)" strokeWidth={1} />
              <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={16}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.type === 'positive'
                      ? `hsl(${190 + i * 8}, 65%, ${52 + i * 2}%)`
                      : `hsl(${i * 8}, 70%, ${52 + i * 2}%)`
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground">데이터 없음</p>
        )}
      </div>
    </div>
  );
};

export default KeywordBarChart;
