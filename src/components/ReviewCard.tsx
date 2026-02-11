import { useState } from 'react';
import { ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { ReviewResult, Store } from '@/lib/api';
import { getStoreColors } from '@/lib/storeColors';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} className={`text-sm ${i <= rating ? 'star-filled' : 'star-empty'}`}>★</span>
    ))}
  </div>
);

const ReviewCard = ({ review, store = 'apple' }: { review: ReviewResult; store?: Store }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.content.length > 80;
  const colors = getStoreColors(store);

  const getSentimentStyle = (sentiment: 'positive' | 'negative' | 'neutral') => {
    const c = sentiment === 'positive' ? colors.positive : sentiment === 'negative' ? colors.negative : colors.neutral;
    return { backgroundColor: `${c}26`, color: c };
  };

  const sentimentLabels = { positive: '긍정', negative: '부정', neutral: '중립' };

  return (
    <div className="glass-card p-5 animate-fade-in hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-display font-semibold text-foreground">{review.author}</span>
            {review.sentiment && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={getSentimentStyle(review.sentiment)}
              >
                {sentimentLabels[review.sentiment]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <StarRating rating={review.rating} />
            <span className="text-xs text-muted-foreground">{review.date}</span>
          </div>
        </div>
        {review.helpful !== undefined && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{review.helpful}</span>
          </div>
        )}
      </div>

      {review.title && <h4 className="font-display font-medium text-foreground mb-1">{review.title}</h4>}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {isLong && !expanded ? review.content.slice(0, 80) + '...' : review.content}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? <><ChevronUp className="w-3 h-3" /> 접기</> : <><ChevronDown className="w-3 h-3" /> 더 보기</>}
        </button>
      )}
    </div>
  );
};

export default ReviewCard;
