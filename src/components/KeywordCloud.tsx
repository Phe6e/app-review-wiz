import { useMemo, useRef, useEffect, useState, useCallback } from 'react';

interface KeywordCloudProps {
  keywords?: { text: string; weight: number }[];
}

const defaultKeywords = [
  { text: '디자인', weight: 85 }, { text: 'UI', weight: 72 }, { text: '업데이트', weight: 90 },
  { text: '배터리', weight: 65 }, { text: '기능', weight: 95 }, { text: '속도', weight: 60 },
  { text: '편리함', weight: 82 }, { text: '콘텐츠', weight: 67 }, { text: '추천', weight: 75 },
];

const COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 70%, 60%)',
  'hsl(280, 60%, 65%)',
  'hsl(152, 60%, 48%)',
  'hsl(38, 80%, 55%)',
  'hsl(340, 65%, 55%)',
  'hsl(200, 75%, 55%)',
  'hsl(120, 50%, 55%)',
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

function rectsOverlap(a: Rect, b: Rect, padding = 4): boolean {
  return !(a.x + a.w + padding < b.x || b.x + b.w + padding < a.x ||
           a.y + a.h + padding < b.y || b.y + b.h + padding < a.y);
}

function getWordRect(x: number, y: number, fontSize: number, textLen: number, rotated: boolean): Rect {
  const charW = fontSize * 0.65;
  const w = rotated ? fontSize * 1.2 : charW * textLen;
  const h = rotated ? charW * textLen : fontSize * 1.3;
  return { x: x - w / 2, y: y - h / 2, w, h };
}

function layoutWords(
  keywords: { text: string; weight: number }[],
  containerW: number,
  containerH: number,
): PlacedWord[] {
  if (containerW < 50 || containerH < 50) return [];

  const sorted = [...keywords].sort((a, b) => b.weight - a.weight);
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

    // Top 3 get huge sizes
    let fontSize: number;
    if (i < 3) {
      fontSize = 28 + ratio * 28; // 28-56px (≈1.75rem - 3.5rem)
    } else {
      fontSize = 13 + ratio * 22; // 13-35px (≈0.8rem - 2.2rem)
    }

    const bold = i < 3;
    const color = COLORS[hashStr(kw.text) % COLORS.length];

    // ~35% chance of vertical rotation
    const seed = hashStr(kw.text + 'rot');
    const rotated = seed % 100 < 35;
    const rotation = rotated ? 90 : 0;

    // Spiral placement
    let placed_ = false;
    const spiralStep = 3;
    const maxRadius = Math.max(containerW, containerH) * 0.6;

    for (let r = 0; r < maxRadius; r += spiralStep) {
      const angleStep = r < 1 ? 1 : Math.max(4, Math.floor(360 / (r * 0.5)));
      for (let angle = 0; angle < 360; angle += angleStep) {
        const rad = (angle * Math.PI) / 180;
        // Elliptical spiral to fit container shape
        const px = cx + r * Math.cos(rad) * (containerW / containerH);
        const py = cy + r * Math.sin(rad);

        const rect = getWordRect(px, py, fontSize, kw.text.length, rotated);

        // Bounds check
        if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > containerW || rect.y + rect.h > containerH) {
          continue;
        }

        // Collision check
        let collides = false;
        for (const existing of rects) {
          if (rectsOverlap(rect, existing, 3)) {
            collides = true;
            break;
          }
        }

        if (!collides) {
          placed.push({
            text: kw.text,
            weight: kw.weight,
            x: px,
            y: py,
            fontSize,
            rotation,
            color,
            bold,
          });
          rects.push(rect);
          placed_ = true;
          break;
        }
      }
      if (placed_) break;
    }

    // Fallback: place at edge if spiral failed
    if (!placed_) {
      const fallbackX = cx + (hashStr(kw.text + 'fx') % 60 - 30);
      const fallbackY = cy + (hashStr(kw.text + 'fy') % 60 - 30);
      placed.push({
        text: kw.text,
        weight: kw.weight,
        x: fallbackX,
        y: fallbackY,
        fontSize: Math.max(fontSize * 0.7, 12),
        rotation,
        color,
        bold,
      });
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
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">주요 키워드</h3>
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: '280px' }}
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
