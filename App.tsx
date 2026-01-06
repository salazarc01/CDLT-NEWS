
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
    // 1. CARGA INMEDIATA: Forzamos la aparición de contenido desde el primer milisegundo
    const initApp = async () => {
      // Cargamos lo que haya en memoria (incluye fallbacks si está vacío)
      const cachedS = getCachedStories();
      setStories(cachedS);

      const cachedM = await fetchMainNews(false); // Esta función ya tiene fallbacks internos
      setMainFeed(cachedM);

      // 2. Sincronizamos en segundo plano
      triggerSync();
    };

    const triggerSync = async () => {
      if (isUpdating) return;
      setIsUpdating(true);
      try {
        const [latestStories, latestFeed] = await Promise.all([
          fetchLatestStories(true),
          fetchMainNews(true)
        ]);
        
        if (latestStories?.length > 0) setStories(latestStories);
        if (latestFeed?.length > 0) setMainFeed(latestFeed);
      } catch (e) {
        console.warn("CDLT NEW: Sin conexión remota, operando en modo local.");
      } finally {
        setIsUpdating(false);
      }
    };

    initApp();
    
    const interval = setInterval(triggerSync, 180000); 
    return () => clearInterval(interval);
  }, []);

  const filteredMainFeed = useMemo(() => {
    if (activeCategory === 'TODO') return mainFeed;
    return mainFeed.filter(news => 
      news.category?.toUpperCase().includes(activeCategory.toUpperCase()) ||
      news.title?.toUpperCase().includes(activeCategory.toUpperCase())
    );
  }, [mainFeed, activeCategory]);

  const filteredStories = useMemo(() => {
    if (activeCategory === 'TODO') return stories;
    return stories.filter(story => 
      story.category?.toUpperCase().includes(activeCategory.toUpperCase())
    );
  }, [stories, activeCategory]);

  const newsFlash = useMemo(() => filteredMainFeed.slice(0, 3), [filteredMainFeed]);
  const reportsFeed = useMemo(() => filteredMainFeed.slice(3), [filteredMainFeed]);

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

      {/* Ticker siempre visible */}
      <BreakingTicker items={mainFeed.length > 0 ? mainFeed.slice(0, 10).map(n => n.title) : []} />

      {/* Historias - Estilo Premium */}
      <section className="py-5 bg-[#0d0d0f] border-b border-zinc-900/80 overflow-hidden relative z-10">
        <div className="px-6 flex items-center justify-between mb-4">
           <h2 className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_5px_#2563eb]"></span>
             MOMENTOS CDLT
           </h2>
           {isUpdating && <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>}
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2">
          {filteredStories.map((story, idx) => (
            <button 
              key={story.id + idx} 
              onClick={() => setActiveStoryIdx(stories.findIndex(s => s.id === story.id))}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-full p-[2px] transition-transform active:scale-90 ${story.category?.includes('VENEZUELA') ? 'bg-gradient-to-tr from-yellow-500 via-blue-600 to-red-600' : 'bg-gradient-to-tr from-blue-700 to-zinc-800'}`}>
                <div className="relative w-full h-full rounded-full border-[2.5px] border-[#0d0d0f] overflow-hidden bg-zinc-950">
                  <img src={story.image} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="" />
                </div>
              </div>
              <span className="text-[7px] font-black uppercase tracking-tighter truncate w-14 text-center text-zinc-600 group-hover:text-blue-500 transition-colors">
                {story.category?.split(' ')[0] || 'INFO'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Novedades Rápidas */}
      {newsFlash.length > 0 && (
        <section className="pt-8 pb-4">
          <div className="px-6 mb-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">FLASH INFORMATIVO</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-6">
            {newsFlash.map((news) => (
              <div 
                key={news.id} 
                onClick={() => setActiveReport(news)}
                className="flex-shrink-0 w-64 bg-zinc-900/40 rounded-xl border border-white/5 p-4 active:scale-95 transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{news.category}</span>
                  <span className="text-[7px] font-bold text-zinc-700 uppercase">{news.date}</span>
                </div>
                <h3 className="text-[13px] font-black text-white leading-tight line-clamp-2 uppercase tracking-tight">{news.title}</h3>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feed Principal */}
      <main className="px-6 py-10 relative z-10">
        <div className="space-y-12">
          {reportsFeed.length === 0 && (
             <div className="text-center py-20 animate-pulse">
                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.5em]">Actualizando red de noticias...</p>
             </div>
          )}
          {reportsFeed.map((news, idx) => (
            <article key={news.id + idx} className="group animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-2xl bg-zinc-900 border border-white/5">
                <img 
                  src={news.imageUrl} 
                  alt={news.title} 
                  className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=20&w=800`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <div className={`text-white text-[8px] font-black px-3 py-1.5 rounded-sm uppercase tracking-[0.2em] shadow-xl ${news.category?.toUpperCase().includes('VENEZUELA') ? 'bg-blue-700' : 'bg-black/60 backdrop-blur-md border border-white/10'}`}>
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
                <button onClick={() => setActiveReport(news)} className="inline-flex items-center gap-3 text-white font-black text-[9px] uppercase tracking-[0.4em] pt-2">
                  LEER INFORME
                  <div className="w-6 h-[1.5px] bg-blue-600 transition-all"></div>
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {activeStoryIdx !== null && <StoryViewer stories={stories} initialIndex={activeStoryIdx} onClose={() => setActiveStoryIdx(null)} />}
      {activeReport !== null && <ReportViewer report={activeReport} onClose={() => setActiveReport(null)} />}
      {sharingNews !== null && <ShareMenu onSelect={handleShareMain} onClose={() => setSharingNews(null)} isGenerating={isGeneratingShare} />}
    </div>
  );
};

export default App;
