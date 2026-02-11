import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import type { ReviewResult } from '@/lib/api';

interface ReviewLengthCardProps {
  reviews: ReviewResult[];
}

const ReviewLengthCard = ({ reviews }: ReviewLengthCardProps) => {
  const avgLength = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((s, r) => s + (r.content?.length || 0), 0);
    return Math.round(total / reviews.length);
  }, [reviews]);

  const label = avgLength > 80 ? '상세' : avgLength > 40 ? '보통' : '간략';

  return (
    <div className="glass-card p-5 flex items-center gap-4 animate-fade-in">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        <FileText className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">리뷰 진정성 (평균 길이)</p>
        <p className="text-xl font-display font-bold text-foreground">
          <AnimatedNumber value={avgLength} />
          <span className="text-sm font-normal text-muted-foreground ml-1">자</span>
        </p>
        <p className="text-xs text-muted-foreground">{label}한 피드백</p>
      </div>
    </div>
  );
};

export default ReviewLengthCard;
