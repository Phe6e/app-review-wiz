interface RatingDistributionProps {
  data?: { rating: number; count: number }[];
}

const defaultData = [
  { rating: 5, count: 4523 },
  { rating: 4, count: 3210 },
  { rating: 3, count: 1876 },
  { rating: 2, count: 1432 },
  { rating: 1, count: 1412 },
];

const RatingDistribution = ({ data = defaultData }: RatingDistributionProps) => {
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">평점 분포</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">선택한 기간에 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-semibold text-base text-foreground mb-4 text-center">평점 분포</h3>
      <div className="flex-1 flex flex-col justify-center gap-3">
        {data.map(d => {
          const barColor = d.rating >= 4
            ? 'linear-gradient(90deg, rgba(0,122,255,0.6), rgba(0,122,255,0.85))'
            : d.rating === 3
              ? 'linear-gradient(90deg, rgba(142,142,147,0.5), rgba(142,142,147,0.8))'
              : 'linear-gradient(90deg, rgba(255,59,48,0.6), rgba(255,59,48,0.85))';
          return (
            <div key={d.rating} className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground w-8">{d.rating}★</span>
              <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(d.count / max) * 100}%`, background: barColor }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-14 text-right">{d.count.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingDistribution;
