
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeCategory, onCategoryChange }) => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long'
    }).toUpperCase();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const navItems = [
    { id: 'TODO', label: 'Inicio' },
    { id: 'GLOBAL', label: 'Global' },
    { id: 'VENEZUELA', label: 'Venezuela' },
    { id: 'ECONOMÍA', label: 'Economía' },
    { id: 'CULTURA', label: 'Cultura' }
  ];

  return (
    <header className="bg-[#09090b] border-b border-zinc-800/50 pt-8 pb-4 px-6 sticky top-0 z-40">
      <div className="flex flex-col items-center max-w-screen-md mx-auto">
        <div className="w-full flex justify-between items-center mb-6 border-b border-zinc-900 pb-2">
          <div className="text-[10px] font-black text-zinc-500 tracking-tighter">
            {formatDate(dateTime)}
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
             <div className="text-[10px] font-black text-zinc-300 tracking-widest">
                SINC {formatTime(dateTime)}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-black tracking-tighter text-white serif-font italic cursor-pointer" onClick={() => onCategoryChange('TODO')}>
            CDLT <span className="text-blue-600 not-italic">NEWS</span>
          </h1>
          <div className="h-8 w-[1px] bg-zinc-800 rotate-12 mx-1"></div>
          <div className="flex flex-col items-start">
            <span className="text-[8px] font-black text-zinc-500 tracking-[0.3em] leading-none uppercase">International</span>
            <span className="text-[8px] font-black text-blue-500 tracking-[0.3em] leading-none uppercase">Verified</span>
          </div>
        </div>
        
        <nav className="flex justify-between w-full mt-6 text-[9px] font-black tracking-[0.2em] uppercase border-y border-zinc-900/50 py-1 overflow-x-auto no-scrollbar gap-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onCategoryChange(item.id)}
              className={`py-3 px-1 transition-all whitespace-nowrap ${
                activeCategory === item.id 
                  ? 'text-blue-500 border-b-2 border-blue-600' 
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
