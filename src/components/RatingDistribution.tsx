import { ratingDistribution } from '@/data/mockData';

const RatingDistribution = () => {
  const max = Math.max(...ratingDistribution.map(d => d.count));

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">평점 분포</h3>
      <div className="flex flex-col gap-3">
        {ratingDistribution.map(d => (
          <div key={d.rating} className="flex items-center gap-3">
            <span className="text-sm font-display font-medium text-foreground w-8">{d.rating}★</span>
            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(d.count / max) * 100}%`,
                  background: d.rating >= 4
                    ? 'hsl(152, 60%, 48%)'
                    : d.rating === 3
                    ? 'hsl(38, 92%, 55%)'
                    : 'hsl(0, 72%, 55%)',
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground w-14 text-right">{d.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingDistribution;
