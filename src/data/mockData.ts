export type Store = 'google' | 'apple';
export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface AppInfo {
  id: string;
  name: string;
  icon: string;
  developer: string;
  rating: number;
  reviewCount: number;
  store: Store;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  sentiment: Sentiment;
  helpful: number;
}

export const mockApps: AppInfo[] = [
  { id: '1', name: 'Instagram', icon: '📸', developer: 'Meta Platforms', rating: 4.0, reviewCount: 12453, store: 'google' },
  { id: '2', name: 'YouTube', icon: '▶️', developer: 'Google LLC', rating: 4.2, reviewCount: 34521, store: 'google' },
  { id: '3', name: 'TikTok', icon: '🎵', developer: 'ByteDance', rating: 4.5, reviewCount: 8932, store: 'google' },
  { id: '4', name: 'KakaoTalk', icon: '💬', developer: 'Kakao Corp', rating: 3.8, reviewCount: 15234, store: 'google' },
  { id: '5', name: 'Naver', icon: '🟢', developer: 'NAVER Corp', rating: 4.1, reviewCount: 9821, store: 'google' },
  { id: '6', name: 'Instagram', icon: '📸', developer: 'Meta Platforms', rating: 3.9, reviewCount: 9876, store: 'apple' },
  { id: '7', name: 'YouTube', icon: '▶️', developer: 'Google LLC', rating: 4.3, reviewCount: 21345, store: 'apple' },
  { id: '8', name: 'TikTok', icon: '🎵', developer: 'ByteDance', rating: 4.6, reviewCount: 7654, store: 'apple' },
  { id: '9', name: 'KakaoTalk', icon: '💬', developer: 'Kakao Corp', rating: 4.0, reviewCount: 11234, store: 'apple' },
  { id: '10', name: 'Naver', icon: '🟢', developer: 'NAVER Corp', rating: 4.2, reviewCount: 8765, store: 'apple' },
];

export const mockReviews: Review[] = [
  { id: 'r1', author: '김민수', rating: 5, title: '최고의 앱!', content: '매일 사용하고 있어요. UI가 정말 깔끔하고 사용하기 편합니다. 업데이트도 자주 해주셔서 좋아요.', date: '2026-02-10', sentiment: 'positive', helpful: 42 },
  { id: 'r2', author: '이지은', rating: 4, title: '좋은 앱이지만 개선 필요', content: '전반적으로 만족하지만, 알림 기능이 가끔 늦게 오는 문제가 있어요. 그 외에는 완벽합니다.', date: '2026-02-09', sentiment: 'positive', helpful: 18 },
  { id: 'r3', author: '박서준', rating: 2, title: '배터리 소모가 심해요', content: '앱을 사용하면 배터리가 너무 빨리 닳습니다. 백그라운드에서도 계속 실행되는 것 같아요. 개선 부탁드립니다.', date: '2026-02-08', sentiment: 'negative', helpful: 87 },
  { id: 'r4', author: '최유나', rating: 3, title: '보통입니다', content: '특별히 좋은 점도 나쁜 점도 없어요. 기본적인 기능은 잘 작동합니다.', date: '2026-02-07', sentiment: 'neutral', helpful: 5 },
  { id: 'r5', author: '정현우', rating: 1, title: '자꾸 크래시 발생', content: '최근 업데이트 이후로 앱이 계속 강제 종료됩니다. 정말 불편합니다. 빨리 수정해주세요!', date: '2026-02-06', sentiment: 'negative', helpful: 156 },
  { id: 'r6', author: '한소희', rating: 5, title: '디자인이 예뻐요', content: '새로운 디자인이 정말 마음에 들어요! 사용하기도 편하고, 기능도 다양해서 매일 쓰고 있습니다.', date: '2026-02-05', sentiment: 'positive', helpful: 33 },
  { id: 'r7', author: '오세훈', rating: 4, title: '업데이트 후 좋아졌어요', content: '이전 버전보다 훨씬 나아졌습니다. 로딩 속도도 빨라지고, 새로운 기능도 유용합니다.', date: '2026-02-04', sentiment: 'positive', helpful: 21 },
  { id: 'r8', author: '김하늘', rating: 2, title: '광고가 너무 많아요', content: '콘텐츠보다 광고가 더 많은 것 같아요. 프리미엄 가입하라는 팝업도 너무 자주 떠요.', date: '2026-02-03', sentiment: 'negative', helpful: 94 },
  { id: 'r9', author: '이준호', rating: 3, title: '그냥 그래요', content: '다른 앱들과 크게 다르지 않아요. 기능은 있는데 특별한 매력은 모르겠습니다.', date: '2026-02-02', sentiment: 'neutral', helpful: 12 },
  { id: 'r10', author: '신예은', rating: 5, title: '강력 추천합니다!', content: '친구 추천으로 설치했는데 정말 좋아요. 인터페이스도 직관적이고 필요한 기능이 다 있어요!', date: '2026-02-01', sentiment: 'positive', helpful: 67 },
  { id: 'r11', author: '윤도현', rating: 1, title: '개인정보 우려', content: '권한 요청이 너무 많습니다. 꼭 필요한 권한만 요청해주세요. 불안합니다.', date: '2026-01-31', sentiment: 'negative', helpful: 201 },
  { id: 'r12', author: '장미래', rating: 4, title: '꾸준히 좋아지고 있어요', content: '매 업데이트마다 조금씩 나아지는 게 느껴집니다. 개발팀 화이팅!', date: '2026-01-30', sentiment: 'positive', helpful: 28 },
];

export const mockKeywords = [
  { text: '디자인', weight: 85 },
  { text: 'UI', weight: 72 },
  { text: '업데이트', weight: 90 },
  { text: '배터리', weight: 65 },
  { text: '크래시', weight: 55 },
  { text: '광고', weight: 78 },
  { text: '기능', weight: 95 },
  { text: '속도', weight: 60 },
  { text: '알림', weight: 50 },
  { text: '편리함', weight: 82 },
  { text: '보안', weight: 45 },
  { text: '로딩', weight: 58 },
  { text: '인터페이스', weight: 70 },
  { text: '콘텐츠', weight: 67 },
  { text: '추천', weight: 75 },
  { text: '개선', weight: 62 },
  { text: '사용성', weight: 80 },
  { text: '안정성', weight: 48 },
];

export const ratingDistribution = [
  { rating: 5, count: 4523 },
  { rating: 4, count: 3210 },
  { rating: 3, count: 1876 },
  { rating: 2, count: 1432 },
  { rating: 1, count: 1412 },
];

export const sentimentData = [
  { name: '긍정', value: 52, color: 'hsl(152, 60%, 48%)' },
  { name: '부정', value: 32, color: 'hsl(0, 72%, 55%)' },
  { name: '중립', value: 16, color: 'hsl(38, 92%, 55%)' },
];

export const trendData = [
  { date: '1월', positive: 48, negative: 35, neutral: 17 },
  { date: '2월', positive: 52, negative: 30, neutral: 18 },
  { date: '3월', positive: 55, negative: 28, neutral: 17 },
  { date: '4월', positive: 50, negative: 33, neutral: 17 },
  { date: '5월', positive: 58, negative: 25, neutral: 17 },
  { date: '6월', positive: 54, negative: 30, neutral: 16 },
  { date: '7월', positive: 60, negative: 24, neutral: 16 },
  { date: '8월', positive: 52, negative: 32, neutral: 16 },
  { date: '9월', positive: 56, negative: 28, neutral: 16 },
  { date: '10월', positive: 50, negative: 34, neutral: 16 },
  { date: '11월', positive: 53, negative: 31, neutral: 16 },
  { date: '12월', positive: 55, negative: 29, neutral: 16 },
];
