import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Store, AppResult, searchApps } from '@/lib/api';

interface AppSearchBarProps {
  store: Store;
  country?: string;
  onSelectApp: (app: AppResult) => void;
}

const AppSearchBar = ({ store, country = 'kr', onSelectApp }: AppSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AppResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchApps(query, store, country);
        if (data.success) {
          setSuggestions(data.apps || []);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, store, country]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 glass-card ${isFocused ? 'border-primary/50 glow' : ''}`}>
        {loading ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <Search className="w-5 h-5 text-muted-foreground" />}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={`${store === 'google' ? 'Google Play' : 'App Store'}でアプリを検索... (例: Instagram, YouTube)`}
          className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-body"
        />
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden glass-card animate-fade-in max-h-80 overflow-y-auto">
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
              {app.icon ? (
                <img src={app.icon} alt={app.name} className="w-10 h-10 rounded-xl" />
              ) : (
                <span className="text-2xl w-10 h-10 flex items-center justify-center">📱</span>
              )}
              <div>
                <p className="font-display font-medium text-foreground">{app.name}</p>
                <p className="text-sm text-muted-foreground">{app.developer} · ⭐ {app.rating}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {store === 'google' && isFocused && query.length >= 2 && (
        <div className="absolute z-40 w-full mt-2 rounded-xl glass-card p-4 text-sm text-muted-foreground">
          ⚠️ Google Play検索はまだ対応していません。App Storeをご利用ください。
        </div>
      )}
    </div>
  );
};

export default AppSearchBar;
