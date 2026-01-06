
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
      minute: '2-digit'
    });
  };

  const navItems = [
    { id: 'TODO', label: 'Inicio' },
    { id: 'GLOBAL', label: 'Global' },
    { id: 'VENEZUELA', label: 'Venezuela' },
    { id: 'ECONOMÍA', label: 'Economía' },
    { id: 'TECNOLOGÍA', label: 'Tech' }
  ];

  return (
    <header className="bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/50 pt-6 pb-2 px-6 sticky top-0 z-50">
      <div className="flex flex-col items-center max-w-screen-md mx-auto">
        <div className="w-full flex justify-between items-center mb-4 border-b border-zinc-900/50 pb-2">
          <div className="text-[9px] font-black text-zinc-500 tracking-wider">
            {formatDate(dateTime)}
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
             <div className="text-[9px] font-black text-zinc-400 tracking-widest uppercase">
                VIVO {formatTime(dateTime)}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 py-2">
          <h1 
            className="text-4xl font-black tracking-tighter text-white serif-font italic cursor-pointer select-none active:opacity-70 transition-opacity" 
            onClick={() => onCategoryChange('TODO')}
          >
            CDLT <span className="text-blue-600 not-italic">NEW</span>
          </h1>
          <div className="h-8 w-[1px] bg-zinc-800 rotate-12"></div>
          <div className="flex flex-col items-start justify-center">
            <span className="text-[8px] font-black text-zinc-500 tracking-[0.4em] leading-none uppercase">Premium</span>
            <span className="text-[8px] font-black text-blue-500 tracking-[0.4em] leading-none uppercase">Report</span>
          </div>
        </div>
        
        <nav className="flex justify-between w-full mt-4 text-[9px] font-black tracking-[0.2em] uppercase overflow-x-auto no-scrollbar gap-6">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onCategoryChange(item.id)}
              className={`py-3 transition-all whitespace-nowrap border-b-2 ${
                activeCategory === item.id 
                  ? 'text-blue-500 border-blue-600' 
                  : 'text-zinc-600 border-transparent hover:text-zinc-300'
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
