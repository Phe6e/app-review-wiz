import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { AppInfo, Store, mockApps } from '@/data/mockData';

interface AppSearchBarProps {
  store: Store;
  onSelectApp: (app: AppInfo) => void;
}

const AppSearchBar = ({ store, onSelectApp }: AppSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return mockApps
      .filter(app => app.store === store && app.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, store]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 glass-card ${isFocused ? 'border-primary/50 glow' : ''}`}>
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={`${store === 'google' ? 'Google Play' : 'App Store'}에서 앱 검색...`}
          className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-body"
        />
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden glass-card animate-fade-in">
          {suggestions.map(app => (
            <button
              key={app.id}
              onMouseDown={() => {
                onSelectApp(app);
                setQuery(app.name);
                setIsFocused(false);
              }}
              className="flex items-center gap-4 w-full px-5 py-3 hover:bg-secondary/60 transition-colors text-left"
            >
              <span className="text-2xl">{app.icon}</span>
              <div>
                <p className="font-display font-medium text-foreground">{app.name}</p>
                <p className="text-sm text-muted-foreground">{app.developer} · ⭐ {app.rating}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppSearchBar;
