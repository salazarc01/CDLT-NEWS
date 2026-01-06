
import React, { useState, useEffect } from 'react';

interface SearchLoaderProps {
  isDataReady: boolean;
  onFinished: () => void;
}

const SearchLoader: React.FC<SearchLoaderProps> = ({ isDataReady, onFinished }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) {
          // Si llegamos a 99 pero los datos no están listos, nos quedamos ahí
          if (!isDataReady) return 99;
          
          // Si los datos están listos, saltamos al 100 y terminamos
          clearInterval(interval);
          setTimeout(onFinished, 400);
          return 100;
        }
        
        // Progreso acelerado al inicio
        const jump = prev < 80 ? Math.random() * 15 : Math.random() * 2;
        return Math.min(prev + jump, 99);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isDataReady, onFinished]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 overflow-hidden animate-in fade-in duration-300">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-[1px] bg-blue-500/30 absolute top-0 animate-[scan_3s_linear_infinite]"></div>
      </div>

      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
        <div className="w-28 h-28 mb-14 relative">
          <div className="absolute inset-0 border-[4px] border-blue-600/10 rounded-full"></div>
          <div className="absolute inset-0 border-[4px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-6 border-2 border-blue-400/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
          </div>
        </div>

        <h2 className="text-white font-black text-[14px] uppercase tracking-[0.6em] mb-8 text-center drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
          {progress >= 99 && !isDataReady ? "FINALIZANDO REPORTE" : "ANALIZANDO RED"}
        </h2>

        <div className="w-full relative px-4">
          <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div 
              className="h-full bg-blue-600 shadow-[0_0_30px_rgba(37,99,236,1)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex justify-center items-center gap-2">
            <span className="text-blue-500 font-black text-[28px] tracking-tighter serif-font italic">
              {Math.round(progress)}%
            </span>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
              {progress >= 99 && !isDataReady ? "Descargando Datos..." : "Sincronizado"}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <style>{`
        @keyframes scan {
          from { top: -10%; }
          to { top: 110%; }
        }
      `}</style>
    </div>
  );
};

export default SearchLoader;
