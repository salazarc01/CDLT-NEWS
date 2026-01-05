
import React from 'react';

interface ShareMenuProps {
  onSelect: (platform: 'whatsapp' | 'facebook' | 'gmail') => void;
  onClose: () => void;
  isGenerating: boolean;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ onSelect, onClose, isGenerating }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-[#0d0d0f] border-t border-zinc-800 rounded-t-[2.5rem] p-8 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1">Exportar Noticia</h3>
            <p className="text-white font-bold text-lg">Compartir Reporte</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isGenerating ? (
          <div className="flex flex-col items-center py-12">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-2">Generando Tarjeta CDLT</p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase">Procesando marca de agua y reportes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 pb-10">
            <button 
              onClick={() => onSelect('whatsapp')}
              className="flex flex-col items-center gap-3 group outline-none"
            >
              <div className="w-16 h-16 bg-green-600/10 rounded-3xl flex items-center justify-center text-green-500 group-active:scale-90 transition-all border border-green-600/5 shadow-lg shadow-green-900/10">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">WhatsApp</span>
            </button>
            <button 
              onClick={() => onSelect('facebook')}
              className="flex flex-col items-center gap-3 group outline-none"
            >
              <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 group-active:scale-90 transition-all border border-blue-600/5 shadow-lg shadow-blue-900/10">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Facebook</span>
            </button>
            <button 
              onClick={() => onSelect('gmail')}
              className="flex flex-col items-center gap-3 group outline-none"
            >
              <div className="w-16 h-16 bg-red-600/10 rounded-3xl flex items-center justify-center text-red-500 group-active:scale-90 transition-all border border-red-600/5 shadow-lg shadow-red-900/10">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.573l8.073-6.08c1.618-1.214 3.927-.059 3.927 1.964z"/>
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Gmail</span>
            </button>
          </div>
        )}

        <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 mb-4">
          <p className="text-[9px] text-zinc-500 font-bold uppercase leading-relaxed text-center italic">
            El reporte incluye una tarjeta PNG de alta resolución con sello de verificación CDLT NEWS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareMenu;
