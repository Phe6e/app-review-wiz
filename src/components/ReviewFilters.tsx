import { Sentiment } from '@/data/mockData';

interface ReviewFiltersProps {
  selectedRating: number | null;
  selectedSentiment: Sentiment | null;
  onRatingChange: (r: number | null) => void;
  onSentimentChange: (s: Sentiment | null) => void;
}

const ReviewFilters = ({ selectedRating, selectedSentiment, onRatingChange, onSentimentChange }: ReviewFiltersProps) => {
  const ratings = [5, 4, 3, 2, 1];
  const sentiments: { value: Sentiment; label: string; activeClass: string }[] = [
    { value: 'positive', label: '긍정', activeClass: 'bg-positive/10 text-positive ring-1 ring-positive/30' },
    { value: 'negative', label: '부정', activeClass: 'bg-negative/10 text-negative ring-1 ring-negative/30' },
    { value: 'neutral', label: '중립', activeClass: 'bg-neutral/10 text-neutral ring-1 ring-neutral/30' },
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
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedSentiment === s.value ? s.activeClass : 'bg-muted text-muted-foreground hover:bg-accent'
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
