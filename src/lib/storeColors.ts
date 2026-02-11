import { Store } from '@/lib/api';

export interface StoreColorSet {
  positive: string;
  negative: string;
  neutral: string;
  positiveHsl: string;
  negativeHsl: string;
  neutralHsl: string;
  gradPos: [string, string]; // [start, end] for gradient
  gradNeg: [string, string];
  gradNeu: [string, string];
}

const appleColors: StoreColorSet = {
  positive: '#007AFF',
  negative: '#FF3B30',
  neutral: '#8E8E93',
  positiveHsl: 'hsl(211, 100%, 50%)',
  negativeHsl: 'hsl(4, 90%, 60%)',
  neutralHsl: 'hsl(240, 4%, 56%)',
  gradPos: ['#007AFF', '#5AC8FA'],
  gradNeg: ['#FF3B30', '#FF6B6B'],
  gradNeu: ['#8E8E93', '#AEAEB2'],
};

const googleColors: StoreColorSet = {
  positive: '#34A853',
  negative: '#EA4335',
  neutral: '#FBBC05',
  positiveHsl: 'hsl(145, 53%, 43%)',
  negativeHsl: 'hsl(5, 81%, 56%)',
  neutralHsl: 'hsl(43, 96%, 50%)',
  gradPos: ['#34A853', '#57C97A'],
  gradNeg: ['#EA4335', '#F28B82'],
  gradNeu: ['#FBBC05', '#FDD663'],
};

export function getStoreColors(store: Store): StoreColorSet {
  return store === 'google' ? googleColors : appleColors;
}

export function getSentimentColors(store: Store) {
  const c = getStoreColors(store);
  return [
    { name: '긍정', color: c.positive },
    { name: '부정', color: c.negative },
    { name: '중립', color: c.neutral },
  ];
}
