import { useMemo, useRef, useEffect, useState, useCallback } from 'react';

interface KeywordItem {
  text: string;
  weight: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface KeywordCloudProps {
  keywords?: KeywordItem[];
}

const defaultKeywords: KeywordItem[] = [
  { text: 'デザイン', weight: 85, sentiment: 'positive' },
  { text: 'UI', weight: 72, sentiment: 'positive' },
  { text: 'アップデート', weight: 90, sentiment: 'positive' },
  { text: 'バッテリー', weight: 65, sentiment: 'negative' },
  { text: '機能', weight: 95, sentiment: 'positive' },
  { text: '速度', weight: 60, sentiment: 'negative' },
  { text: '使いやすさ', weight: 82, sentiment: 'positive' },
  { text: 'コンテンツ', weight: 67, sentiment: 'neutral' },
  { text: 'おすすめ', weight: 75, sentiment: 'positive' },
  { text: 'クラッシュ', weight: 55, sentiment: 'negative' },
  { text: '広告', weight: 78, sentiment: 'negative' },
  { text: 'セキュリティ', weight: 45, sentiment: 'negative' },
];

const POSITIVE_COLORS = [
  'hsl(172, 66%, 50%)', 'hsl(199, 70%, 55%)', 'hsl(152, 60%, 48%)',
  'hsl(142, 55%, 52%)', 'hsl(185, 62%, 48%)', 'hsl(210, 65%, 58%)',
];
const NEGATIVE_COLORS = [
  'hsl(0, 72%, 55%)', 'hsl(15, 75%, 52%)', 'hsl(340, 65%, 55%)',
  'hsl(355, 70%, 50%)', 'hsl(25, 80%, 50%)', 'hsl(330, 60%, 52%)',
];
const NEUTRAL_COLORS = [
  'hsl(38, 80%, 55%)', 'hsl(45, 70%, 50%)', 'hsl(50, 65%, 55%)',
];

const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

interface PlacedWord {
  text: string;
  weight: number;
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
  color: string;
  bold: boolean;
}

interface Rect {
  x: number; y: number; w: number; h: number;
}

function rectsOverlap(a: Rect, b: Rect, padding = 6): boolean {
  return !(a.x + a.w + padding < b.x || b.x + b.w + padding < a.x ||
           a.y + a.h + padding < b.y || b.y + b.h + padding < a.y);
}

function getWordRect(x: number, y: number, fontSize: number, textLen: number, rotated: boolean): Rect {
  const charW = fontSize * 0.6;
  const w = rotated ? fontSize * 1.2 : charW * textLen;
  const h = rotated ? charW * textLen : fontSize * 1.3;
  return { x: x - w / 2, y: y - h / 2, w, h };
}

function pickColor(kw: KeywordItem): string {
  const h = hashStr(kw.text);
  if (kw.sentiment === 'negative') return NEGATIVE_COLORS[h % NEGATIVE_COLORS.length];
  if (kw.sentiment === 'neutral') return NEUTRAL_COLORS[h % NEUTRAL_COLORS.length];
  return POSITIVE_COLORS[h % POSITIVE_COLORS.length];
}

function layoutWords(
  keywords: KeywordItem[],
  containerW: number,
  containerH: number,
): PlacedWord[] {
  if (containerW < 50 || containerH < 50) return [];

  const sorted = [...keywords].sort((a, b) => b.weight - a.weight).slice(0, 50);
  const maxW = sorted[0]?.weight || 1;
  const minW = sorted[sorted.length - 1]?.weight || 0;
  const range = maxW - minW || 1;

  const placed: PlacedWord[] = [];
  const rects: Rect[] = [];
  const cx = containerW / 2;
  const cy = containerH / 2;

  for (let i = 0; i < sorted.length; i++) {
    const kw = sorted[i];
    const ratio = (kw.weight - minW) / range;

    let fontSize: number;
    if (i === 0) fontSize = 48 + ratio * 12;
    else if (i < 3) fontSize = 32 + ratio * 16;
    else fontSize = 13 + ratio * 20;

    const bold = i < 3;
    const color = pickColor(kw);

    const seed = hashStr(kw.text + 'rot');
    const rotated = seed % 100 < 35;
    const rotation = rotated ? 90 : 0;

    let didPlace = false;
    const spiralStep = 2;
    const maxRadius = Math.max(containerW, containerH) * 0.55;

    for (let r = 0; r < maxRadius; r += spiralStep) {
      const angleStep = r < 1 ? 1 : Math.max(6, Math.floor(360 / (r * 0.4)));
      for (let angle = 0; angle < 360; angle += angleStep) {
        const rad = (angle * Math.PI) / 180;
        const px = cx + r * Math.cos(rad) * (containerW / containerH) * 0.85;
        const py = cy + r * Math.sin(rad);

        const rect = getWordRect(px, py, fontSize, kw.text.length, rotated);

        if (rect.x < 2 || rect.y < 2 || rect.x + rect.w > containerW - 2 || rect.y + rect.h > containerH - 2) {
          continue;
        }

        let collides = false;
        for (const existing of rects) {
          if (rectsOverlap(rect, existing, 6)) {
            collides = true;
            break;
          }
        }

        if (!collides) {
          placed.push({ text: kw.text, weight: kw.weight, x: px, y: py, fontSize, rotation, color, bold });
          rects.push(rect);
          didPlace = true;
          break;
        }
      }
      if (didPlace) break;
    }

    if (!didPlace) {
      // try smaller font as last resort
      const smallFontSize = Math.max(fontSize * 0.6, 11);
      for (let r = 0; r < maxRadius; r += 4) {
        const angleStep = Math.max(8, Math.floor(360 / (r * 0.3 + 1)));
        for (let angle = 0; angle < 360; angle += angleStep) {
          const rad = (angle * Math.PI) / 180;
          const px = cx + r * Math.cos(rad) * (containerW / containerH) * 0.85;
          const py = cy + r * Math.sin(rad);
          const rect = getWordRect(px, py, smallFontSize, kw.text.length, rotated);
          if (rect.x < 2 || rect.y < 2 || rect.x + rect.w > containerW - 2 || rect.y + rect.h > containerH - 2) continue;
          let collides = false;
          for (const existing of rects) { if (rectsOverlap(rect, existing, 5)) { collides = true; break; } }
          if (!collides) {
            placed.push({ text: kw.text, weight: kw.weight, x: px, y: py, fontSize: smallFontSize, rotation, color, bold: false });
            rects.push(rect);
            didPlace = true;
            break;
          }
        }
        if (didPlace) break;
      }
    }
  }

  return placed;
}

const KeywordCloud = ({ keywords = defaultKeywords }: KeywordCloudProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const updateDims = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDims(prev => (prev.w === Math.floor(width) && prev.h === Math.floor(height)) ? prev : { w: Math.floor(width), h: Math.floor(height) });
    }
  }, []);

  useEffect(() => {
    updateDims();
    const ro = new ResizeObserver(updateDims);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateDims]);

  const placedWords = useMemo(() => {
    if (dims.w === 0 || dims.h === 0) return [];
    return layoutWords(keywords, dims.w, dims.h);
  }, [keywords, dims.w, dims.h]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">主要キーワード</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(172, 66%, 50%)' }} />ポジティブ</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(0, 72%, 55%)' }} />ネガティブ</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(38, 80%, 55%)' }} />ニュートラル</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: '300px' }}
      >
        {placedWords.map((word, idx) => (
          <span
            key={word.text}
            className="absolute cursor-default select-none transition-all duration-500 ease-out hover:scale-125 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
            style={{
              left: `${word.x}px`,
              top: `${word.y}px`,
              fontSize: `${word.fontSize}px`,
              fontWeight: word.bold ? 800 : 500,
              color: word.color,
              transform: `translate(-50%, -50%) rotate(${word.rotation}deg)`,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              opacity: 0,
              animation: `fade-in 0.4s ease-out ${idx * 0.04}s forwards`,
              zIndex: word.bold ? 2 : 1,
            }}
            title={`${word.text}: ${word.weight}`}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default KeywordCloud;
