import { Sentiment } from '@/data/mockData';
import { Store } from '@/lib/api';
import { getStoreColors } from '@/lib/storeColors';

interface ReviewFiltersProps {
  selectedRating: number | null;
  selectedSentiment: Sentiment | null;
  onRatingChange: (r: number | null) => void;
  onSentimentChange: (s: Sentiment | null) => void;
  store?: Store;
}

const ReviewFilters = ({ selectedRating, selectedSentiment, onRatingChange, onSentimentChange, store = 'apple' }: ReviewFiltersProps) => {
  const colors = getStoreColors(store);
  const ratings = [5, 4, 3, 2, 1];
  const sentiments: { value: Sentiment; label: string }[] = [
    { value: 'positive', label: '긍정' },
    { value: 'negative', label: '부정' },
    { value: 'neutral', label: '중립' },
  ];

  const getColor = (s: Sentiment) => {
    if (s === 'positive') return colors.positive;
    if (s === 'negative') return colors.negative;
    return colors.neutral;
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">평점:</span>
        <div className="flex gap-1.5">
          {ratings.map(r => (
            <button
              key={r}
              onClick={() => onRatingChange(selectedRating === r ? null : r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedRating === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {r}★
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">감성:</span>
        <div className="flex gap-1.5">
          {sentiments.map(s => {
            const c = getColor(s.value);
            const isActive = selectedSentiment === s.value;
            return (
              <button
                key={s.value}
                onClick={() => onSentimentChange(isActive ? null : s.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                style={isActive ? {
                  backgroundColor: `${c}26`,
                  color: c,
                  borderColor: `${c}4D`,
                } : {}}
                {...(!isActive && { className: 'px-3 py-1.5 rounded-lg text-sm font-medium border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all' })}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;
