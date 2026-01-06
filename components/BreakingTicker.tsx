
import React from 'react';

interface BreakingTickerProps {
  items: string[];
}

const BreakingTicker: React.FC<BreakingTickerProps> = ({ items }) => {
  // Siempre mostrar titulares, aunque sean genéricos si la carga falla
  const displayLabels = items.length > 0 ? items : [
    "Sincronizando con satélites de información...",
    "Conectando con red de noticias global...",
    "CDLT NEWS: Reportaje verificado 24/7",
    "Analizando tendencias mundiales en tiempo real..."
  ];

  const loopItems = [...displayLabels, ...displayLabels, ...displayLabels];

  return (
    <div className="bg-blue-600 overflow-hidden py-2.5 border-y border-blue-500/50 flex items-center w-full relative z-40 shadow-lg">
      <div className="bg-blue-800 px-3 py-1.5 z-50 shadow-[5px_0_15px_rgba(0,0,0,0.5)] relative flex items-center shrink-0">
        <span className="text-[7px] font-black text-white uppercase tracking-[0.25em] whitespace-nowrap">
          ÚLTIMA HORA
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden h-full flex items-center ml-2">
        <div className="flex animate-ticker whitespace-nowrap gap-8 items-center will-change-transform">
          {loopItems.map((item, i) => (
            <span key={i} className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-2">
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
          animation: ticker-scroll 45s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-ticker {
            animation-duration: 30s;
          }
        }
      `}</style>
    </div>
  );
};

export default BreakingTicker;
