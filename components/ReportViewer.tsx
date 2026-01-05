
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
      const firstParagraph = (report.content || report.summary).split('\n')[0];
      const content = await prepareShareContent({
        title: report.title,
        category: report.category || 'REPORTE CENTRAL',
        firstParagraph: firstParagraph.substring(0, 200) + '...',
        time: report.date,
        author: report.author,
        imageUrl: report.imageUrl
      });
      if (content) {
        await shareToPlatform(platform, { blob: content.blob, text: content.text });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setShowShare(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0c] overflow-y-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-black text-xs italic tracking-tighter">CDLT</span>
          <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Reportaje Central</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowShare(true)} 
            className="w-8 h-8 flex items-center justify-center bg-zinc-900 rounded-full text-white hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center bg-zinc-900 rounded-full text-white hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="relative aspect-[16/10] w-full">
          <img 
            src={report.imageUrl} 
            alt={report.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711432869-efd5971ee142?auto=format&fit=crop&q=80&w=800';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent" />
        </div>

        <article className="px-6 pb-20 -mt-12 relative z-10">
          <div className="flex items-center gap-3 text-[10px] font-bold text-blue-500 tracking-widest mb-4">
            <span className="uppercase">{report.author}</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
            <span className="text-zinc-500 uppercase">{report.date}</span>
          </div>

          <h1 className="text-3xl font-bold serif-font leading-tight text-white mb-6">
            {report.title}
          </h1>

          <div className="w-12 h-[2px] bg-blue-600 mb-8" />

          <div className="space-y-6 text-zinc-300 text-base leading-relaxed font-medium">
            <p className="text-white font-bold text-lg leading-snug italic">
              {report.summary}
            </p>
            
            {(report.content || "Contenido en desarrollo...").split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}

            {report.sources && report.sources.length > 0 && (
              <div className="pt-8 mt-8 border-t border-zinc-900">
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mb-4">Verificación y Fuentes Externas</p>
                <div className="space-y-3">
                  {report.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-blue-600 transition-colors group"
                    >
                      <p className="text-[11px] text-zinc-100 font-bold mb-1 group-hover:text-blue-400">{source.title}</p>
                      <p className="text-[9px] text-zinc-500 truncate">{source.uri}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-10 border-t border-zinc-900 mt-10">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-2">Protocolo CDLT</p>
              <p className="text-[9px] text-zinc-500 italic leading-relaxed">
                Este reporte ha sido procesado por nuestra unidad de IA mediante búsqueda en tiempo real. CDLT NEWS mantiene el compromiso de objetividad y rapidez ante los eventos globales.
              </p>
            </div>
          </div>
        </article>
      </div>

      {showShare && (
        <ShareMenu 
          onSelect={handleShare} 
          onClose={() => setShowShare(false)} 
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
};

export default ReportViewer;
