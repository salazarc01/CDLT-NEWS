
import React from 'react';

interface BreakingTickerProps {
  items: string[];
}

const BreakingTicker: React.FC<BreakingTickerProps> = ({ items }) => {
  if (!items || items.length === 0) return (
    <div className="bg-blue-600 h-8 w-full flex items-center px-4">
      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-3"></div>
      <span className="text-[8px] font-black text-white uppercase tracking-widest">Sincronizando últimas noticias...</span>
    </div>
  );

  const displayItems = [...items, ...items, ...items];

  return (
    <div className="bg-blue-600 overflow-hidden py-2.5 border-y border-blue-500/50 flex items-center w-full relative z-20 shadow-lg">
      <div className="bg-blue-800 px-3 py-1 z-30 shadow-[5px_0_10px_rgba(0,0,0,0.4)] relative flex items-center">
        <span className="text-[7px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
          ÚLTIMA HORA
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden h-full flex items-center ml-2">
        <div className="flex animate-ticker whitespace-nowrap gap-6 items-center will-change-transform">
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
          animation: ticker-scroll 50s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-ticker {
            animation-duration: 35s;
          }
        }
      `}</style>
    </div>
  );
};

export default BreakingTicker;
