
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import StoryViewer from './components/StoryViewer';
import ReportViewer from './components/ReportViewer';
import ShareMenu from './components/ShareMenu';
import BreakingTicker from './components/BreakingTicker';
import { fetchLatestStories, getCachedStories, fetchMainNews } from './services/newsService';
import { prepareShareContent, shareToPlatform } from './utils/shareUtils';
import { NewsStory, MainNews } from './types';

const App: React.FC = () => {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [mainFeed, setMainFeed] = useState<MainNews[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [activeReport, setActiveReport] = useState<MainNews | null>(null);
  const [sharingNews, setSharingNews] = useState<MainNews | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('TODO');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 1. CARGA INSTANTÁNEA: Recuperar todo lo que esté en memoria local inmediatamente
    const loadCache = () => {
      try {
        const cachedStories = getCachedStories();
        if (cachedStories && cachedStories.length > 0) setStories(cachedStories);

        const cachedMainStr = localStorage.getItem('cdlt_news_history_v4');
        if (cachedMainStr) {
          const parsed = JSON.parse(cachedMainStr);
          if (parsed.data && Array.isArray(parsed.data)) {
            setMainFeed(parsed.data);
          }
        }
      } catch(e) {
        console.error("Error al leer cache local", e);
      }
    };

    loadCache();
    
    // 2. SINCRONIZACIÓN SILENCIOSA: Actualizar con la IA en segundo plano
    const triggerSync = async () => {
      if (isUpdating) return;
      setIsUpdating(true);
      try {
        // Obtenemos datos nuevos
        const [latestStories, latestFeed] = await Promise.all([
          fetchLatestStories(true),
          fetchMainNews(true)
        ]);
        
        // Solo actualizamos si realmente recibimos algo válido
        if (Array.isArray(latestStories) && latestStories.length > 0) setStories(latestStories);
        if (Array.isArray(latestFeed) && latestFeed.length > 0) setMainFeed(latestFeed);
      } catch (e) {
        console.warn("Fallo de red o API en Vercel, manteniendo datos locales.");
      } finally {
        setIsUpdating(false);
      }
    };

    // Retraso mínimo para no interferir con el render inicial
    const timeout = setTimeout(triggerSync, 500);
    
    const interval = setInterval(triggerSync, 300000); // Sincronizar cada 5 min
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const filteredMainFeed = useMemo(() => {
    const feed = activeCategory === 'TODO' 
      ? mainFeed 
      : mainFeed.filter(news => news.category?.toUpperCase()?.includes(activeCategory.toUpperCase()));
    return feed;
  }, [mainFeed, activeCategory]);

  const filteredStories = useMemo(() => 
    activeCategory === 'TODO'
      ? stories
      : stories.filter(story => story.category?.toUpperCase()?.includes(activeCategory.toUpperCase())),
    [stories, activeCategory]
  );

  // Lógica inteligente de distribución de noticias
  const newsFlash = useMemo(() => {
    return filteredMainFeed.length >= 3 ? filteredMainFeed.slice(0, 3) : [];
  }, [filteredMainFeed]);

  const reportsFeed = useMemo(() => {
    return filteredMainFeed.length >= 3 ? filteredMainFeed.slice(3) : filteredMainFeed;
  }, [filteredMainFeed]);

  const handleShareMain = async (platform: 'whatsapp' | 'facebook' | 'gmail') => {
    if (!sharingNews) return;
    setIsGeneratingShare(true);
    try {
      const content = await prepareShareContent({
        title: sharingNews.title,
        category: sharingNews.category || 'NOTICIA',
        firstParagraph: sharingNews.summary,
        time: sharingNews.date,
        author: sharingNews.author,
        imageUrl: sharingNews.imageUrl
      });
      if (content) await shareToPlatform(platform, { blob: content.blob, text: content.text });
    } catch (e) {} finally {
      setIsGeneratingShare(false);
      setSharingNews(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 max-w-md mx-auto relative border-x border-zinc-800/50 shadow-[0_0_100px_rgba(0,0,0,0.5)] pb-10 overflow-x-hidden">
      <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {/* Ticker de Última Hora */}
      <BreakingTicker items={mainFeed.length > 0 ? mainFeed.slice(0, 8).map(n => n.title) : []} />

      {/* Historias - Visualmente atractivas e instantáneas */}
      <section className="py-5 bg-[#0d0d0f] border-b border-zinc-900 overflow-hidden relative z-10">
        <div className="px-6 flex items-center justify-between mb-4">
           <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
             Momentos CDLT
           </h2>
           {isUpdating && <div className="text-[8px] font-bold text-blue-500 animate-pulse uppercase tracking-widest">SINC...</div>}
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2 min-h-[70px]">
          {filteredStories.length === 0 && !isUpdating ? (
             <p className="text-[9px] text-zinc-600 uppercase font-black py-4">Sin historias recientes</p>
          ) : filteredStories.length === 0 ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-14 h-14 rounded-full bg-zinc-900 animate-pulse border border-zinc-800/50"></div>
            ))
          ) : (
            filteredStories.map((story) => (
              <button 
                key={story.id} 
                onClick={() => setActiveStoryIdx(stories.findIndex(s => s.id === story.id))}
                className="flex-shrink-0 flex flex-col items-center gap-2 group outline-none"
              >
                <div className={`w-14 h-14 rounded-full p-[2px] transition-transform active:scale-90 duration-300 ${story.category?.toUpperCase()?.includes('VENEZUELA') ? 'bg-gradient-to-tr from-yellow-500 via-blue-600 to-red-600' : 'bg-gradient-to-tr from-blue-700 to-zinc-800'}`}>
                  <div className="relative w-full h-full rounded-full border-[2.5px] border-[#0d0d0f] overflow-hidden bg-zinc-950">
                    <img 
                      src={story.image} 
                      className="absolute inset-0 w-full h-full object-cover opacity-80" 
                      alt=""
                    />
                  </div>
                </div>
                <span className="text-[7px] font-black uppercase tracking-tighter truncate w-14 text-center text-zinc-500 group-hover:text-blue-400 transition-colors">
                  {story.category?.split(' ')[0] || 'INFO'}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Novedades Flash - Acceso rápido */}
      {newsFlash.length > 0 && (
        <section className="pt-8 pb-4">
          <div className="px-6 mb-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">FLASH INFORMATIVO</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 min-h-[90px]">
            {newsFlash.map((news) => (
              <div 
                key={news.id} 
                onClick={() => setActiveReport(news)}
                className="flex-shrink-0 w-64 bg-zinc-900/40 rounded-xl border border-white/5 p-4 active:scale-95 transition-transform cursor-pointer hover:border-blue-900/30"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{news.category}</span>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full animate-ping"></span>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase">AHORA</span>
                  </div>
                </div>
                <h3 className="text-[13px] font-black text-white leading-tight line-clamp-2 uppercase tracking-tight">{news.title}</h3>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feed Principal - Listado de Reportes */}
      <main className="px-6 py-10 relative z-10 min-h-screen">
        <div className="space-y-12">
          {reportsFeed.length === 0 && mainFeed.length === 0 && (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-[16/10] bg-zinc-900/50 rounded-2xl border border-white/5"></div>
                <div className="h-6 bg-zinc-900 rounded w-3/4"></div>
                <div className="h-3 bg-zinc-900 rounded w-full"></div>
              </div>
            ))
          )}
          
          {reportsFeed.length === 0 && mainFeed.length > 0 && (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">No hay más reportes en esta categoría</p>
            </div>
          )}

          {reportsFeed.map((news, idx) => (
            <article key={news.id + idx} className="group animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-2xl bg-zinc-900 border border-white/5">
                <img 
                  src={news.imageUrl} 
                  alt={news.title} 
                  className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=20&w=800`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <div className={`text-white text-[8px] font-black px-3 py-1.5 rounded-sm uppercase tracking-[0.2em] shadow-xl ${news.category?.toUpperCase()?.includes('VENEZUELA') ? 'bg-blue-700' : 'bg-black/60 backdrop-blur-md border border-white/10'}`}>
                    {news.category?.toUpperCase() || 'GLOBAL'}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <span className="text-[9px] font-black text-white/40 tracking-widest uppercase bg-black/60 backdrop-blur-md px-3 py-1 rounded">
                    {news.date}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setSharingNews(news); }} className="w-10 h-10 flex items-center justify-center bg-blue-600/20 backdrop-blur-2xl rounded-full border border-blue-600/30 active:scale-90 transition-all text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-1">
                <h3 className="text-xl font-black leading-[1.1] serif-font text-white group-hover:text-blue-500 transition-colors duration-300 uppercase tracking-tight">
                  {news.title}
                </h3>
                <p className="text-zinc-500 text-[13px] leading-relaxed font-medium line-clamp-3">
                  {news.summary}
                </p>
                <button onClick={() => setActiveReport(news)} className="inline-flex items-center gap-3 text-white font-black text-[9px] uppercase tracking-[0.4em] pt-2 active:opacity-50 transition-all">
                  LEER INFORME
                  <div className="w-6 h-[1.5px] bg-blue-600 group-hover:w-12 transition-all"></div>
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Modales y Menús */}
      {activeStoryIdx !== null && <StoryViewer stories={stories} initialIndex={activeStoryIdx} onClose={() => setActiveStoryIdx(null)} />}
      {activeReport !== null && <ReportViewer report={activeReport} onClose={() => setActiveReport(null)} />}
      {sharingNews !== null && <ShareMenu onSelect={handleShareMain} onClose={() => setSharingNews(null)} isGenerating={isGeneratingShare} />}
    </div>
  );
};

export default App;
