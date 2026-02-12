import { ReviewResult } from '@/lib/api';

export interface ChurnWarningUser {
  author: string;
  avgRating: number;
  recentRating: number;
  recentReviewId: string;
  recentDate: string;
  recentContent: string;
}

/**
 * Detect churn warnings: loyal users (avg 4+ over older reviews) who recently gave 1-2 stars.
 * Mutates reviews to set isChurnWarning flag and returns top churn risk users.
 */
export function detectChurnWarnings(reviews: ReviewResult[]): {
  flaggedReviews: ReviewResult[];
  churnUsers: ChurnWarningUser[];
} {
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  // Group reviews by author
  const authorMap = new Map<string, ReviewResult[]>();
  for (const r of reviews) {
    const list = authorMap.get(r.author) || [];
    list.push(r);
    authorMap.set(r.author, list);
  }

  const churnUsers: ChurnWarningUser[] = [];

  // Check each author with multiple reviews
  for (const [author, authorReviews] of authorMap) {
    if (authorReviews.length < 2) continue;

    const sorted = [...authorReviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Recent reviews (within 1 month)
    const recentLow = sorted.filter(r => {
      const d = new Date(r.date);
      return d >= oneMonthAgo && r.rating <= 2;
    });

    if (recentLow.length === 0) continue;

    // Older reviews (within 1 year but before 1 month ago)
    const olderReviews = sorted.filter(r => {
      const d = new Date(r.date);
      return d >= oneYearAgo && d < oneMonthAgo;
    });

    if (olderReviews.length === 0) continue;

    const avgOlder = olderReviews.reduce((s, r) => s + r.rating, 0) / olderReviews.length;

    if (avgOlder >= 4) {
      const latestLow = recentLow[0];
      churnUsers.push({
        author,
        avgRating: Math.round(avgOlder * 10) / 10,
        recentRating: latestLow.rating,
        recentReviewId: latestLow.id,
        recentDate: latestLow.date,
        recentContent: latestLow.content,
      });

      // Flag all recent low reviews from this author
      for (const r of recentLow) {
        r.isChurnWarning = true;
      }
    }
  }

  // Sort by severity (biggest rating drop first)
  churnUsers.sort((a, b) => (b.avgRating - b.recentRating) - (a.avgRating - a.recentRating));

  return {
    flaggedReviews: reviews,
    churnUsers: churnUsers.slice(0, 5),
  };
}
