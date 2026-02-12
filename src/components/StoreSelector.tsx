import { Store } from '@/data/mockData';

interface StoreSelectorProps {
  selected: Store;
  onSelect: (store: Store) => void;
}

const StoreSelector = ({ selected, onSelect }: StoreSelectorProps) => {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center w-full sm:w-auto">
      <button
        onClick={() => onSelect('google')}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-3 px-2 py-2 sm:px-6 sm:py-3 rounded-xl font-display font-medium text-[11px] sm:text-base transition-all duration-300 ${
          selected === 'google'
            ? 'bg-primary text-primary-foreground glow'
            : 'glass-card text-muted-foreground hover:text-foreground hover:border-primary/30'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor">
          <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
        </svg>
        Google Play
      </button>
      <button
        onClick={() => onSelect('apple')}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-3 px-2 py-2 sm:px-6 sm:py-3 rounded-xl font-display font-medium text-[11px] sm:text-base transition-all duration-300 ${
          selected === 'apple'
            ? 'bg-primary text-primary-foreground glow'
            : 'glass-card text-muted-foreground hover:text-foreground hover:border-primary/30'
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor">
          <path d="M18.71,19.5C17.88,20.5 17,21.4 15.66,21.41C14.32,21.42 13.89,20.6 12.37,20.6C10.84,20.6 10.37,21.38 9.1,21.41C7.79,21.45 6.8,20.39 5.96,19.39C4.25,17.35 2.94,13.73 4.7,11.23C5.57,9.99 6.93,9.21 8.4,9.19C9.68,9.17 10.89,10.08 11.66,10.08C12.43,10.08 13.89,8.98 15.43,9.15C16.09,9.18 17.65,9.43 18.64,10.87C18.56,10.92 16.58,12.08 16.6,14.5C16.63,17.38 19.12,18.35 19.15,18.36C19.12,18.44 18.78,19.58 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
        </svg>
        App Store
      </button>
    </div>
  );
};

export default StoreSelector;
