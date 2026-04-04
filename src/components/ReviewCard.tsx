import { useState } from 'react';
import { ThumbsUp, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
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

  const sentimentLabels = { positive: 'ポジティブ', negative: 'ネガティブ', neutral: 'ニュートラル' };

  const isChurn = review.isChurnWarning;

  return (
    <div
      id={`review-${review.id}`}
      className={`glass-card p-5 animate-fade-in transition-all duration-300 ${
        isChurn
          ? 'border-destructive/30 shadow-[0_0_20px_hsl(var(--destructive)/0.12)]'
          : 'hover:border-primary/20'
      }`}
    >
      {/* Churn warning banner */}
      {isChurn && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
          style={{ backgroundColor: `${colors.negative}14` }}>
          <AlertTriangle className="w-4 h-4" style={{ color: colors.negative }} />
          <span className="text-xs font-semibold" style={{ color: colors.negative }}>
            ⚠️ 離脱注意ユーザー
          </span>
        </div>
      )}

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
            {review.version && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                v{review.version}
              </span>
            )}
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

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* AI Summary badge */}
        {review.aiSummary && (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-medium backdrop-blur-sm border border-white/30"
            style={{
              backgroundColor: review.sentiment === 'negative' ? `${colors.negative}18` :
                review.sentiment === 'positive' ? `${colors.positive}18` : `${colors.neutral}18`,
              color: review.sentiment === 'negative' ? colors.negative :
                review.sentiment === 'positive' ? colors.positive : colors.neutral,
            }}
          >
            {review.aiSummary}
          </span>
        )}

        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> 閉じる</> : <><ChevronDown className="w-3 h-3" /> もっと見る</>}
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
