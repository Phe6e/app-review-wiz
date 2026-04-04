import { AlertTriangle, ChevronRight } from 'lucide-react';
import { ChurnWarningUser } from '@/lib/churnDetection';
import { Store } from '@/lib/api';
import { getStoreColors } from '@/lib/storeColors';

interface Props {
  users: ChurnWarningUser[];
  store: Store;
  onClickUser: (reviewId: string) => void;
}

const ChurnWarningWidget = ({ users, store, onClickUser }: Props) => {
  const colors = getStoreColors(store);

  if (users.length === 0) return null;

  return (
    <div className="glass-card p-5 animate-fade-in border-destructive/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${colors.negative}1A` }}>
          <AlertTriangle className="w-4.5 h-4.5" style={{ color: colors.negative }} />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm">離脱リスク常連顧客</h3>
          <p className="text-xs text-muted-foreground">最近の評価急落ユーザー Top {users.length}</p>
        </div>
      </div>
      <div className="space-y-2">
        {users.map((u, i) => (
          <button
            key={u.author + i}
            onClick={() => onClickUser(u.recentReviewId)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-destructive/5 group text-left"
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: `${colors.negative}1A`, color: colors.negative }}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground truncate">{u.author}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${colors.negative}1A`, color: colors.negative }}>
                  ⭐ {u.avgRating} → {u.recentRating}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{u.recentContent}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChurnWarningWidget;
