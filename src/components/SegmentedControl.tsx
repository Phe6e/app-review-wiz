import { useState, useRef, useEffect } from 'react';

interface SegmentedControlProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

const SegmentedControl = ({ tabs, activeIndex, onChange }: SegmentedControlProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>('button');
    const active = buttons[activeIndex];
    if (active) {
      setIndicatorStyle({
        left: active.offsetLeft,
        width: active.offsetWidth,
      });
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center p-1 rounded-xl"
      style={{
        background: 'rgba(142, 142, 147, 0.12)',
      }}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        }}
      />
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onChange(i)}
          className={`relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
            i === activeIndex
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground/70'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
