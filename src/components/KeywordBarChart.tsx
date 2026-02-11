import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface KeywordItem {
  text: string;
  weight: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface KeywordBarChartProps {
  keywords?: KeywordItem[];
}

const KeywordBarChart = ({ keywords = [] }: KeywordBarChartProps) => {
  const { positiveData, negativeData } = useMemo(() => {
    const pos = keywords
      .filter(k => k.sentiment === 'positive')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
    const neg = keywords
      .filter(k => k.sentiment === 'negative')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
    return { positiveData: pos, negativeData: neg };
  }, [keywords]);

  const tooltipStyle = {
    background: 'hsl(222, 40%, 10%)',
    border: '1px solid hsl(222, 30%, 22%)',
    borderRadius: '8px',
    color: 'hsl(210, 40%, 96%)',
    fontSize: '12px',
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4 text-center">주요 키워드</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Positive */}
        <div>
          <p className="text-xs font-medium text-center mb-2" style={{ color: 'hsl(199, 70%, 55%)' }}>긍정 Top 5</p>
          <div className="h-48 flex items-center justify-center">
            {positiveData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positiveData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="text" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={18}>
                    {positiveData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${190 + i * 12}, 65%, ${52 + i * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">데이터 없음</p>
            )}
          </div>
        </div>
        {/* Negative */}
        <div>
          <p className="text-xs font-medium text-center mb-2" style={{ color: 'hsl(0, 72%, 55%)' }}>부정 Top 5</p>
          <div className="h-48 flex items-center justify-center">
            {negativeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={negativeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="text" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={18}>
                    {negativeData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${i * 10}, 70%, ${52 + i * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">데이터 없음</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordBarChart;
