
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).toUpperCase();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 pt-6 pb-3 px-4 sticky top-0 z-40">
      <div className="flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="text-[9px] font-bold text-zinc-500 tracking-tight">
            {formatDate(dateTime)}
          </div>
          <div className="text-[9px] font-bold text-blue-500 tracking-widest">
            LIVE • {formatTime(dateTime)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-black tracking-tighter text-white serif-font italic">
            CDLT <span className="text-blue-600 not-italic">NEWS</span>
          </h1>
          <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        
        <div className="w-full h-[1px] bg-zinc-800 mt-3 mb-1"></div>
        
        <div className="flex justify-between w-full py-2 text-[9px] font-extrabold text-zinc-400 tracking-widest uppercase">
          <span className="text-blue-500 shrink-0">ÚLTIMA HORA</span>
          <span className="shrink-0 px-2">NOVEDADES</span>
          <span className="shrink-0">REPORTAJES CENTRALES</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
