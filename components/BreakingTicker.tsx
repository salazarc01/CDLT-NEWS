
import React from 'react';

interface BreakingTickerProps {
  items: string[];
}

const BreakingTicker: React.FC<BreakingTickerProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="bg-blue-600 overflow-hidden py-2 border-y border-blue-500/50 flex items-center">
      <div className="bg-blue-800 px-4 py-1 z-10 shadow-xl relative">
        <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
          ÚLTIMA HORA
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden h-full flex items-center">
        <div className="flex animate-ticker whitespace-nowrap gap-12 items-center">
          {items.map((item, i) => (
            <span key={i} className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              {item}
            </span>
          ))}
          {/* Duplicamos para el loop infinito */}
          {items.map((item, i) => (
            <span key={`dup-${i}`} className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              {item}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BreakingTicker;
