import { useState, useMemo, useCallback, useRef } from 'react';
import { Star, MessageSquare, TrendingUp, BarChart3, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import StoreSelector from '@/components/StoreSelector';
import AppSearchBar from '@/components/AppSearchBar';
import ReviewCard from '@/components/ReviewCard';
import ReviewFilters, { SortOption } from '@/components/ReviewFilters';
import SentimentChart from '@/components/SentimentChart';
import RatingDistribution from '@/components/RatingDistribution';
import SentimentTrend from '@/components/SentimentTrend';
import KeywordCloud from '@/components/KeywordCloud';
import StatCard from '@/components/StatCard';
import { Store, AppResult, ReviewResult, fetchReviews, analyzeReviews } from '@/lib/api';
import { Sentiment, mockReviews, mockKeywords, sentimentData, ratingDistribution, trendData } from '@/data/mockData';

const PAGE1_SIZE = 20;
const PAGE_SIZE = 50;

function getPageSlice(total: number, page: number): [number, number] {
  if (page === 1) return [0, PAGE1_SIZE];
  const start = PAGE1_SIZE + (page - 2) * PAGE_SIZE;
  return [start, start + PAGE_SIZE];
}

function getTotalPages(total: number): number {
  if (total <= PAGE1_SIZE) return 1;
  return 1 + Math.ceil((total - PAGE1_SIZE) / PAGE_SIZE);
}

const Index = () => {
  const [store, setStore] = useState<Store>('apple');
  const [selectedApp, setSelectedApp] = useState<AppResult | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | null>(null);
  const [reviews, setReviews] = useState<ReviewResult[]>([]);
  const [keywords, setKeywords] = useState(mockKeywords);
  const [sentimentDist, setSentimentDist] = useState(sentimentData);
  const [ratingDist, setRatingDist] = useState(ratingDistribution);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(true);

  // New filter/sort/pagination state
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [currentPage, setCurrentPage] = useState(1);

  const reviewSectionRef = useRef<HTMLDivElement>(null);

  const analyzeAndUpdate = useCallback(async (allReviews: ReviewResult[]) => {
    setAnalyzing(true);
    try {
      const analysis = await analyzeReviews(allReviews);
      if (analysis.success) {
        setReviews(analysis.reviews);
        if (analysis.keywords?.length > 0) {
          setKeywords(analysis.keywords);
        }
        if (analysis.sentimentDistribution) {
          const sd = analysis.sentimentDistribution;
          setSentimentDist([
            { name: '긍정', value: sd.positive || 0, color: 'hsl(152, 60%, 48%)' },
            { name: '부정', value: sd.negative || 0, color: 'hsl(0, 72%, 55%)' },
            { name: '중립', value: sd.neutral || 0, color: 'hsl(38, 92%, 55%)' },
          ]);
        }
      }
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleSelectApp = useCallback(async (app: AppResult) => {
    setSelectedApp(app);
    setLoading(true);
    setIsUsingMockData(false);
    setCurrentPage(1);
    setReviews([]);
    setSortOption('newest');
    setDateRange({ from: undefined, to: undefined });
    setRatingFilter(null);
    setSentimentFilter(null);

    // Fetch multiple pages to get a larger dataset for client-side pagination
    try {
      let allReviews: ReviewResult[] = [];
      for (let page = 1; page <= 10; page++) {
        const result = await fetchReviews(app.id, store, 'kr', page);
        if (result.success && result.reviews && result.reviews.length > 0) {
          allReviews = [...allReviews, ...result.reviews];
          if (!result.hasNextPage) break;
        } else {
          break;
        }
      }

      if (allReviews.length > 0) {
        setReviews(allReviews);
        const dist = [5, 4, 3, 2, 1].map(r => ({
          rating: r,
          count: allReviews.filter((rev: ReviewResult) => rev.rating === r).length,
        }));
        setRatingDist(dist);
        await analyzeAndUpdate(allReviews);
      } else {
        setIsUsingMockData(true);
        setReviews(mockReviews as unknown as ReviewResult[]);
        setRatingDist(ratingDistribution);
        setSentimentDist(sentimentData);
        setKeywords(mockKeywords);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setIsUsingMockData(true);
      setReviews(mockReviews as unknown as ReviewResult[]);
    } finally {
      setLoading(false);
    }
  }, [store, analyzeAndUpdate]);

  // Filtered + sorted reviews
  const processedReviews = useMemo(() => {
    let result = [...reviews];

    // Rating filter
    if (ratingFilter) {
      result = result.filter(r => r.rating === ratingFilter);
    }
    // Sentiment filter
    if (sentimentFilter) {
      result = result.filter(r => r.sentiment === sentimentFilter);
    }
    // Date range filter
    if (dateRange.from) {
      result = result.filter(r => new Date(r.date) >= dateRange.from!);
    }
    if (dateRange.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.date) <= endOfDay);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'rating_high': return b.rating - a.rating;
        case 'rating_low': return a.rating - b.rating;
        default: return 0;
      }
    });

    return result;
  }, [reviews, ratingFilter, sentimentFilter, sortOption, dateRange]);

  const totalPages = useMemo(() => getTotalPages(processedReviews.length), [processedReviews.length]);

  const pagedReviews = useMemo(() => {
    const [start, end] = getPageSlice(processedReviews.length, currentPage);
    return processedReviews.slice(start, end);
  }, [processedReviews, currentPage]);

  // Reset page when filters change
  const handleSortChange = useCallback((s: SortOption) => { setSortOption(s); setCurrentPage(1); }, []);
  const handleDateRangeChange = useCallback((r: { from: Date | undefined; to: Date | undefined }) => { setDateRange(r); setCurrentPage(1); }, []);
  const handleRatingChange = useCallback((r: number | null) => { setRatingFilter(r); setCurrentPage(1); }, []);
  const handleSentimentChange = useCallback((s: Sentiment | null) => { setSentimentFilter(s); setCurrentPage(1); }, []);

  const handleReset = useCallback(() => {
    setSortOption('newest');
    setDateRange({ from: undefined, to: undefined });
    setRatingFilter(null);
    setSentimentFilter(null);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return selectedApp?.rating || 0;
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  }, [reviews, selectedApp]);

  const positiveRate = useMemo(() => {
    const pos = reviews.filter(r => r.sentiment === 'positive').length;
    return reviews.length > 0 ? Math.round((pos / reviews.length) * 100) : 0;
  }, [reviews]);

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('ellipsis' as any);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis' as any);
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">
              <span className="gradient-text">App Review</span>{' '}
              <span className="text-foreground">Analytics</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">앱 리뷰를 검색하고 분석하세요</p>
          </div>
          <StoreSelector selected={store} onSelect={s => { setStore(s); setSelectedApp(null); setReviews([]); setIsUsingMockData(true); }} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="flex justify-center">
          <AppSearchBar store={store} onSelectApp={handleSelectApp} />
        </section>

        {selectedApp && (
          <section className="glass-card p-6 flex items-center gap-5 animate-fade-in">
            {selectedApp.icon ? (
              <img src={selectedApp.icon} alt={selectedApp.name} className="w-16 h-16 rounded-2xl" />
            ) : (
              <span className="text-5xl">📱</span>
            )}
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">{selectedApp.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedApp.developer}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-neutral font-display font-semibold">⭐ {selectedApp.rating}</span>
                <span className="text-muted-foreground text-sm">· {selectedApp.reviewCount?.toLocaleString()} 리뷰</span>
                {isUsingMockData && <span className="text-xs px-2 py-0.5 rounded-full bg-neutral/15 text-neutral">데모 데이터</span>}
              </div>
            </div>
            {(loading || analyzing) && (
              <div className="ml-auto flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{analyzing ? '감성 분석 중...' : '리뷰 로딩 중...'}</span>
              </div>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="총 리뷰 수" value={reviews.length > 0 ? reviews.length.toLocaleString() : selectedApp?.reviewCount?.toLocaleString() || '0'} />
          <StatCard icon={<Star className="w-5 h-5" />} label="평균 평점" value={String(avgRating)} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="긍정 비율" value={`${positiveRate}%`} />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="분석 리뷰" value={String(reviews.filter(r => r.sentiment).length)} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SentimentChart data={sentimentDist} />
          <RatingDistribution data={ratingDist} />
          <SentimentTrend />
          <KeywordCloud keywords={keywords} />
        </section>

        <section ref={reviewSectionRef}>
          <div className="flex flex-col gap-4 mb-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-foreground">
                최신 리뷰
                {processedReviews.length > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">({processedReviews.length}건)</span>}
              </h3>
            </div>
            <ReviewFilters
              selectedRating={ratingFilter}
              selectedSentiment={sentimentFilter}
              onRatingChange={handleRatingChange}
              onSentimentChange={handleSentimentChange}
              sortOption={sortOption}
              onSortChange={handleSortChange}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              onReset={handleReset}
            />
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="glass-card p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">리뷰를 가져오는 중...</p>
              </div>
            ) : pagedReviews.length > 0 ? (
              pagedReviews.map(review => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="glass-card p-12 text-center">
                <p className="text-muted-foreground">
                  {reviews.length === 0 ? '앱을 검색하여 리뷰를 확인하세요.' : '조건에 맞는 리뷰가 없습니다.'}
                </p>
              </div>
            )}
          </div>

          {/* Numbered Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-2 text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p as number)}
                    className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all ${
                      currentPage === p
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
