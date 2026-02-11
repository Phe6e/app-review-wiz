import { useState, useMemo } from 'react';
import { Star, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';
import StoreSelector from '@/components/StoreSelector';
import AppSearchBar from '@/components/AppSearchBar';
import ReviewCard from '@/components/ReviewCard';
import ReviewFilters from '@/components/ReviewFilters';
import SentimentChart from '@/components/SentimentChart';
import RatingDistribution from '@/components/RatingDistribution';
import SentimentTrend from '@/components/SentimentTrend';
import KeywordCloud from '@/components/KeywordCloud';
import StatCard from '@/components/StatCard';
import { Store, Sentiment, AppInfo, mockReviews } from '@/data/mockData';

const Index = () => {
  const [store, setStore] = useState<Store>('google');
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | null>(null);

  const filteredReviews = useMemo(() => {
    return mockReviews.filter(r => {
      if (ratingFilter && r.rating !== ratingFilter) return false;
      if (sentimentFilter && r.sentiment !== sentimentFilter) return false;
      return true;
    });
  }, [ratingFilter, sentimentFilter]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">
              <span className="gradient-text">App Review</span>{' '}
              <span className="text-foreground">Analytics</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">앱 리뷰를 검색하고 분석하세요</p>
          </div>
          <StoreSelector selected={store} onSelect={s => { setStore(s); setSelectedApp(null); }} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Search */}
        <section className="flex justify-center">
          <AppSearchBar store={store} onSelectApp={setSelectedApp} />
        </section>

        {/* Selected App Header */}
        {selectedApp && (
          <section className="glass-card p-6 flex items-center gap-5 animate-fade-in">
            <span className="text-5xl">{selectedApp.icon}</span>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">{selectedApp.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedApp.developer}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-neutral font-display font-semibold">⭐ {selectedApp.rating}</span>
                <span className="text-muted-foreground text-sm">· {selectedApp.reviewCount.toLocaleString()} 리뷰</span>
              </div>
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="총 리뷰 수" value="12,453" subtext="최근 30일 +1,234" />
          <StatCard icon={<Star className="w-5 h-5" />} label="평균 평점" value="4.0" subtext="지난달 대비 +0.2" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="긍정 비율" value="52%" subtext="지난달 48%" />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="주요 이슈" value="배터리" subtext="언급 287회" />
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SentimentChart />
          <RatingDistribution />
          <SentimentTrend />
          <KeywordCloud />
        </section>

        {/* Reviews Section */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <h3 className="text-xl font-display font-bold text-foreground">최신 리뷰</h3>
            <ReviewFilters
              selectedRating={ratingFilter}
              selectedSentiment={sentimentFilter}
              onRatingChange={setRatingFilter}
              onSentimentChange={setSentimentFilter}
            />
          </div>
          <div className="grid gap-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map(review => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="glass-card p-12 text-center">
                <p className="text-muted-foreground">해당 조건의 리뷰가 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
