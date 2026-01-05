
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StoryViewer from './components/StoryViewer';
import ReportViewer from './components/ReportViewer';
import ShareMenu from './components/ShareMenu';
import { fetchLatestStories, getCachedStories, fetchMainNews } from './services/newsService';
import { prepareShareContent, shareToPlatform } from './utils/shareUtils';
import { NewsStory, MainNews } from './types';

const getCategoryIcon = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.includes('VENEZUELA')) return '🇻🇪';
  if (cat.includes('POLÍTICA')) return '🏛️';
  if (cat.includes('GUERRA')) return '⚔️';
  if (cat.includes('ECONOMÍA')) return '📈';
  if (cat.includes('DESCUBRIMIENTOS') || cat.includes('CIENCIA')) return '🔬';
  if (cat.includes('BELLEZA') || cat.includes('MODA')) return '✨';
  if (cat.includes('SALUD')) return '🏥';
  if (cat.includes('GASTRONOMÍA') || cat.includes('COMIDA')) return '🍳';
  if (cat.includes('EVENTOS') || cat.includes('FESTIVALES')) return '🎉';
  if (cat.includes('DESASTRES') || cat.includes('NATURALEZA')) return '🌪️';
  return '📰';
};

const App: React.FC = () => {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [mainFeed, setMainFeed] = useState<MainNews[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [activeReport, setActiveReport] = useState<MainNews | null>(null);
  const [sharingNews, setSharingNews] = useState<MainNews | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 1. Cargar lo que tengamos en caché inmediatamente
    const cachedStories = getCachedStories();
    if (cachedStories.length > 0) setStories(cachedStories);

    const cachedMain = localStorage.getItem('cdlt_main_feed_cache_v5');
    if (cachedMain) {
      try {
        const { data } = JSON.parse(cachedMain);
        if (data) setMainFeed(data);
      } catch (e) {}
    }

    // 2. Actualizar desde la red en segundo plano
    updateContent();

    const interval = setInterval(updateContent, 1800000); // Cada 30 min para estar al día
    return () => clearInterval(interval);
  }, []);

  const updateContent = async () => {
    setIsUpdating(true);
    try {
      const [latestStories, latestFeed] = await Promise.all([
        fetchLatestStories(true),
        fetchMainNews(true)
      ]);

      if (latestStories && latestStories.length > 0) setStories(latestStories);
      if (latestFeed && latestFeed.length > 0) setMainFeed(latestFeed);
    } catch (e) {
      console.error("Background update failed", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShareMain = async (platform: 'whatsapp' | 'facebook' | 'gmail') => {
    if (!sharingNews) return;
    setIsGeneratingShare(true);
    try {
      const shareContent = await prepareShareContent({
        title: sharingNews.title,
        category: sharingNews.category || 'REPORTE CENTRAL',
        firstParagraph: sharingNews.summary,
        time: sharingNews.date,
        author: sharingNews.author,
        imageUrl: sharingNews.imageUrl
      });
      
      if (shareContent) {
        const success = await shareToPlatform(platform, { blob: shareContent.blob, text: shareContent.text });
        if (!success) {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareContent.text)}`, '_blank');
        }
      }
    } catch (e) {
      alert("Error al preparar reporte.");
    } finally {
      setIsGeneratingShare(false);
      setSharingNews(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 max-w-md mx-auto relative shadow-2xl overflow-x-hidden border-x border-zinc-900">
      <Header />

      {/* Novedades Section (Instagram Style) */}
      <section className="py-4 px-3 border-b border-zinc-800 bg-[#0d0d0f]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Novedades CDLT Verificadas</h2>
            <svg className="w-3 h-3 text-blue-500 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <span className="flex items-center gap-1.5 text-[8px] font-bold text-blue-500">
            <span className={`w-1.5 h-1.5 bg-blue-500 rounded-full ${isUpdating ? 'animate-ping' : ''}`}></span> 
            {isUpdating ? 'ACTUALIZANDO...' : 'EN VIVO'}
          </span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 min-h-[90px]">
          {stories.length === 0 ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 animate-pulse" />
                <div className="w-8 h-1.5 bg-zinc-900 rounded animate-pulse" />
              </div>
            ))
          ) : (
            stories.map((story, idx) => (
              <button 
                key={story.id + idx} 
                onClick={() => setActiveStoryIdx(idx)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 group outline-none transition-all duration-300"
              >
                <div className={`p-[2px] rounded-full active:scale-95 ${story.category.includes('VENEZUELA') ? 'bg-gradient-to-tr from-yellow-500 via-blue-600 to-red-600' : 'bg-gradient-to-tr from-blue-600 via-zinc-800 to-blue-400'}`}>
                  <div className="relative w-14 h-14 rounded-full border-[2.5px] border-[#0a0a0c] overflow-hidden bg-zinc-900 flex items-center justify-center text-xl shadow-lg">
                    {/* Pre-cargar imagen miniatura o icono */}
                    <img 
                      src={story.image} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                      alt=""
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white/90 drop-shadow-md">
                      {getCategoryIcon(story.category)}
                    </div>
                  </div>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter truncate w-14 text-center ${story.category.includes('VENEZUELA') ? 'text-blue-400' : 'text-zinc-500'}`}>
                  {story.category.split(' ')[0]}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Main Feed */}
      <main className="px-5 py-8 space-y-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-[1px] flex-1 bg-zinc-900"></div>
          <span className="text-[9px] font-black tracking-[0.3em] text-zinc-600 uppercase italic">REPORTAJES CENTRALES</span>
          <div className="h-[1px] flex-1 bg-zinc-900"></div>
        </div>

        {mainFeed.length === 0 ? (
           Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[16/9] bg-zinc-950 border border-zinc-900 rounded-sm animate-pulse"></div>
              <div className="h-4 bg-zinc-950 rounded w-3/4 animate-pulse"></div>
            </div>
           ))
        ) : (
          mainFeed.map((news, idx) => (
            <article key={news.id + idx} className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative aspect-[16/9] overflow-hidden rounded-sm mb-5 shadow-2xl bg-zinc-950">
                <img 
                  src={news.imageUrl} 
                  alt={news.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const query = (news as any).imageQuery || news.category || 'news';
                    target.src = `https://source.unsplash.com/featured/?${encodeURIComponent(query)}`;
                  }}
                />
                <div className={`absolute top-3 left-3 text-white text-[8px] font-black px-2 py-1 rounded-sm uppercase tracking-widest ${news.category?.includes('VENEZUELA') ? 'bg-blue-700' : 'bg-zinc-800'}`}>
                  {news.category?.includes('VENEZUELA') ? 'VENEZUELA • ' : ''}{idx === 0 ? 'ÚLTIMA HORA' : 'CONFIRMADO'}
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSharingNews(news);
                  }}
                  className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-blue-600 transition-all active:scale-90 z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-500">
                  <span className="text-blue-500 uppercase font-black">{news.author}</span>
                  <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                  <span>{news.date}</span>
                </div>
                <h3 className={`text-xl font-bold leading-tight serif-font text-white group-hover:text-blue-500 transition-colors ${news.category?.includes('VENEZUELA') ? 'border-l-4 border-blue-600 pl-3' : ''}`}>
                  {news.title}
                </h3>
                <p className="text-zinc-400 text-[13px] leading-relaxed">
                  {news.summary}
                </p>
                <button 
                  onClick={() => setActiveReport(news)}
                  className="flex items-center gap-3 text-white font-black text-[9px] uppercase tracking-[0.2em] hover:text-blue-500 transition-colors"
                >
                  LEER REPORTE COMPLETO
                  <div className="w-6 h-[1px] bg-blue-600"></div>
                </button>
              </div>
            </article>
          ))
        )}
      </main>

      {activeStoryIdx !== null && stories.length > 0 && (
        <StoryViewer 
          stories={stories} 
          initialIndex={activeStoryIdx} 
          onClose={() => setActiveStoryIdx(null)} 
        />
      )}

      {activeReport !== null && (
        <ReportViewer 
          report={activeReport} 
          onClose={() => setActiveReport(null)} 
        />
      )}

      {sharingNews !== null && (
        <ShareMenu 
          onSelect={handleShareMain} 
          onClose={() => setSharingNews(null)} 
          isGenerating={isGeneratingShare}
        />
      )}
    </div>
  );
};

export default App;
