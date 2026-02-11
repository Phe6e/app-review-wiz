import { Sentiment } from '@/data/mockData';

interface ReviewFiltersProps {
  selectedRating: number | null;
  selectedSentiment: Sentiment | null;
  onRatingChange: (r: number | null) => void;
  onSentimentChange: (s: Sentiment | null) => void;
}

const ReviewFilters = ({ selectedRating, selectedSentiment, onRatingChange, onSentimentChange }: ReviewFiltersProps) => {
  const ratings = [5, 4, 3, 2, 1];
  const sentiments: { value: Sentiment; label: string; className: string }[] = [
    { value: 'positive', label: '긍정', className: 'bg-positive/15 text-positive border-positive/30' },
    { value: 'negative', label: '부정', className: 'bg-negative/15 text-negative border-negative/30' },
    { value: 'neutral', label: '중립', className: 'bg-neutral/15 text-neutral border-neutral/30' },
  ];

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
          {sentiments.map(s => (
            <button
              key={s.value}
              onClick={() => onSentimentChange(selectedSentiment === s.value ? null : s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selectedSentiment === s.value ? s.className : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;
