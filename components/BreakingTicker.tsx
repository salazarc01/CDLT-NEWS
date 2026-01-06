
import React from 'react';

interface BreakingTickerProps {
  items: string[];
}

const BreakingTicker: React.FC<BreakingTickerProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  // Duplicamos el contenido para un scroll infinito suave
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="bg-blue-600 overflow-hidden py-2.5 border-y border-blue-500/50 flex items-center w-full relative z-20 shadow-lg">
      <div className="bg-blue-800 px-3 py-1 z-30 shadow-[10px_0_15px_rgba(0,0,0,0.3)] relative flex items-center">
        <span className="text-[8px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
          ÚLTIMA HORA
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden h-full flex items-center ml-2">
        <div className="flex animate-ticker whitespace-nowrap gap-8 items-center will-change-transform">
          {displayItems.map((item, i) => (
            <span key={i} className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-1 bg-white/80 rounded-full shrink-0"></span>
              {item}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-ticker {
          animation: ticker-scroll 60s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-ticker {
            animation-duration: 40s;
          }
        }
      `}</style>
    </div>
  );
};

export default BreakingTicker;
