import { Store } from '@/lib/api';
import { getStoreColors } from '@/lib/storeColors';

interface RatingDistributionProps {
  data?: { rating: number; count: number }[];
  store?: Store;
}

const defaultData = [
  { rating: 5, count: 4523 },
  { rating: 4, count: 3210 },
  { rating: 3, count: 1876 },
  { rating: 2, count: 1432 },
  { rating: 1, count: 1412 },
];

const RatingDistribution = ({ data = defaultData, store = 'apple' }: RatingDistributionProps) => {
  const colors = getStoreColors(store);
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">評価分布</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">選択した期間にデータがありません</p>
        </div>
      </div>
    );
  }

  const getBarColor = (rating: number) => {
    const pos = colors.positive;
    const neg = colors.negative;
    const neu = colors.neutral;
    if (rating >= 4) return `linear-gradient(90deg, ${pos}99, ${pos}D9)`;
    if (rating === 3) return `linear-gradient(90deg, ${neu}80, ${neu}CC)`;
    return `linear-gradient(90deg, ${neg}99, ${neg}D9)`;
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-semibold text-base text-foreground mb-4 text-center">評価分布</h3>
      <div className="flex-1 flex flex-col justify-center gap-3">
        {data.map(d => (
          <div key={d.rating} className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground w-8">{d.rating}★</span>
            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(d.count / max) * 100}%`, background: getBarColor(d.rating) }}
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
