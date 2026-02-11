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

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-base text-foreground mb-4">평점 분포</h3>
      <div className="flex flex-col gap-3">
        {data.map(d => (
          <div key={d.rating} className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground w-8">{d.rating}★</span>
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(d.count / max) * 100}%`,
                  background: d.rating >= 4 ? 'hsl(152, 55%, 45%)' : d.rating === 3 ? 'hsl(38, 80%, 50%)' : 'hsl(0, 65%, 55%)',
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground w-14 text-right tabular-nums">{d.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingDistribution;
