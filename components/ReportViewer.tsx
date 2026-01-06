
import React, { useState } from 'react';
import { MainNews } from '../types';
import ShareMenu from './ShareMenu';
import { prepareShareContent, shareToPlatform } from '../utils/shareUtils';

interface ReportViewerProps {
  report: MainNews;
  onClose: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  const [showShare, setShowShare] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async (platform: 'whatsapp' | 'facebook' | 'gmail') => {
    setIsGenerating(true);
    try {
      const content = await prepareShareContent({
        title: report.title,
        category: report.category || 'CENTRAL',
        firstParagraph: report.summary,
        time: report.date,
        author: report.author,
        imageUrl: report.imageUrl
      });
      if (content) await shareToPlatform(platform, { blob: content.blob, text: content.text });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setShowShare(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#09090b] overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="sticky top-0 z-[160] flex justify-between items-center px-6 py-4 bg-[#09090b]/90 backdrop-blur-2xl border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
          <span className="text-zinc-400 font-black text-[9px] uppercase tracking-[0.3em]">Informe Final CDLT</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowShare(true)} 
            className="w-10 h-10 flex items-center justify-center bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-500 active:scale-90 transition-all"
            title="Compartir Noticia"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-full text-white active:scale-90 transition-all"
            title="Cerrar Reporte"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="relative aspect-[16/11] w-full bg-zinc-900 overflow-hidden">
          <img 
            src={report.imageUrl} 
            alt={report.title} 
            className="w-full h-full object-cover shadow-2xl animate-in zoom-in-105 duration-[2000ms]"
            onError={(e) => (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=800'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent"></div>
        </div>

        <article className="px-8 pb-32 -mt-16 relative z-10">
          <div className="flex flex-col gap-6">
             <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 tracking-[0.2em]">
                <span className="px-2 py-1 bg-blue-600/20 border border-blue-600/40 rounded text-[8px]">VERIFICADO</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">{report.date?.toUpperCase() || 'RECIENTE'}</span>
             </div>

             <h1 className="text-4xl font-black serif-font leading-[1.1] text-white drop-shadow-lg">
                {report.title}
             </h1>
             
             <div className="flex items-center gap-3 py-5 border-y border-zinc-800/50">
                <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center font-black text-xs text-blue-500 border border-zinc-800 shadow-inner">
                  {report.author?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white tracking-widest uppercase">{report.author || 'Redactor'}</p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase">Redacción CDLT NEWS</p>
                </div>
             </div>

             <div className="space-y-8 text-zinc-300 text-lg leading-relaxed font-medium">
                <p className="text-white font-black text-xl italic leading-snug border-l-4 border-blue-600 pl-5 serif-font bg-blue-600/5 py-4 rounded-r-lg">
                  {report.summary}
                </p>
                
                {(report.content || "").split('\n').map((para, i) => (
                  <p key={i} className="first-letter:text-5xl first-letter:font-black first-letter:serif-font first-letter:mr-3 first-letter:float-left first-letter:text-blue-600">
                    {para}
                  </p>
                ))}

                <div className="pt-12 mt-12 border-t border-zinc-900">
                   <button 
                     onClick={() => setShowShare(true)}
                     className="w-full py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.4em] rounded-xl shadow-2xl shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                     </svg>
                     Compartir Reporte Completo
                   </button>
                </div>
             </div>
          </div>
        </article>
      </div>

      {showShare && <ShareMenu onSelect={handleShare} onClose={() => setShowShare(false)} isGenerating={isGenerating} />}
    </div>
  );
};

export default ReportViewer;
