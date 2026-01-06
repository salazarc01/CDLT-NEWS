
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

  // Carga inicial inmediata desde Cache (Sincrónico)
  useEffect(() => {
    const cachedStories = getCachedStories();
    const cachedMainStr = localStorage.getItem('cdlt_news_history_v4');
    
    if (cachedStories.length > 0) setStories(cachedStories);
    if (cachedMainStr) {
      try {
        const parsed = JSON.parse(cachedMainStr);
        if (parsed.data) setMainFeed(parsed.data);
      } catch(e) {}
    }

    // Disparar actualización en segundo plano sin bloquear
    syncContent();
    
    const interval = setInterval(syncContent, 300000);
    return () => clearInterval(interval);
  }, []);

  const syncContent = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      // Pedimos datos frescos de la IA
      const [latestStories, latestFeed] = await Promise.all([
        fetchLatestStories(true),
        fetchMainNews(true)
      ]);
      
      if (latestStories && latestStories.length > 0) setStories(latestStories);
      if (latestFeed && latestFeed.length > 0) setMainFeed(latestFeed);
    } catch (e) {
      console.warn("Fallo de red, manteniendo datos locales.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredMainFeed = useMemo(() => 
    activeCategory === 'TODO' 
      ? mainFeed 
      : mainFeed.filter(news => news.category?.toUpperCase()?.includes(activeCategory.toUpperCase())),
    [mainFeed, activeCategory]
  );

  const filteredStories = useMemo(() => 
    activeCategory === 'TODO'
      ? stories
      : stories.filter(story => story.category?.toUpperCase()?.includes(activeCategory.toUpperCase())),
    [stories, activeCategory]
  );

  // Separamos las "Novedades" (las 5 más recientes) del feed principal
  const newsFlash = filteredMainFeed.slice(0, 5);
  const reportsFeed = filteredMainFeed.slice(5);

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
    } catch (e) {
    } finally {
      setIsGeneratingShare(false);
      setSharingNews(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 max-w-md mx-auto relative border-x border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] pb-10 overflow-x-hidden">
      <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {/* Breaking News Ticker */}
      <BreakingTicker items={mainFeed.slice(0, 10).map(n => n.title)} />

      {/* Sección: Historias del Día */}
      <section className="py-6 bg-[#0d0d0f] border-b border-zinc-900 overflow-hidden relative z-10">
        <div className="px-6 flex items-center justify-between mb-4">
           <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
             <span className="w-2 h-[1px] bg-blue-600"></span>
             Historias
           </h2>
           {isUpdating && <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>}
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2">
          {filteredStories.length === 0 && Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-16 h-16 rounded-full bg-zinc-900 animate-pulse border border-zinc-800"></div>
          ))}
          {filteredStories.map((story) => (
            <button 
              key={story.id} 
              onClick={() => setActiveStoryIdx(stories.findIndex(s => s.id === story.id))}
              className="flex-shrink-0 flex flex-col items-center gap-2 group outline-none"
            >
              <div className={`w-16 h-16 rounded-full p-[2px] transition-all active:scale-90 duration-300 ${story.category?.toUpperCase()?.includes('VENEZUELA') ? 'bg-gradient-to-tr from-yellow-500 via-blue-600 to-red-600' : 'bg-gradient-to-tr from-blue-700 to-zinc-800'}`}>
                <div className="relative w-full h-full rounded-full border-[3px] border-[#0d0d0f] overflow-hidden bg-zinc-950">
                  <img 
                    src={story.image} 
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" 
                    alt=""
                    onError={(e) => (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=20&w=200`}
                  />
                </div>
              </div>
              <span className="text-[7px] font-black uppercase tracking-tighter truncate w-16 text-center text-zinc-500 group-hover:text-white">
                {story.category?.split(' ')[0] || 'INFO'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Sección: Novedades Flash */}
      {newsFlash.length > 0 && (
        <section className="pt-8 pb-4">
          <div className="px-6 mb-5">
             <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500">Novedades Rápidas</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-6">
            {newsFlash.map((news) => (
              <div 
                key={news.id} 
                onClick={() => setActiveReport(news)}
                className="flex-shrink-0 w-64 bg-zinc-900/50 rounded-xl border border-white/5 p-4 active:scale-95 transition-transform"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{news.category}</span>
                  <span className="text-[8px] font-bold text-zinc-600">AHORA</span>
                </div>
                <h3 className="text-sm font-black text-white leading-tight line-clamp-2 mb-2">{news.title}</h3>
                <p className="text-[10px] text-zinc-500 line-clamp-2">{news.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feed de Noticias Principales */}
      <main className="px-6 py-10 relative z-10">
        <div className="space-y-16">
          {reportsFeed.length === 0 && !isUpdating && (
            <div className="text-center py-20">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sincronizando con Satélites...</p>
            </div>
          )}
          {reportsFeed.map((news, idx) => (
            <article key={news.id + idx} className="group animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-2xl bg-zinc-900 border border-white/5">
                <img 
                  src={news.imageUrl} 
                  alt={news.title} 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                  onError={(e) => (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=800`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className={`text-white text-[8px] font-black px-3 py-1 rounded-sm uppercase tracking-[0.2em] shadow-xl ${news.category?.toUpperCase()?.includes('VENEZUELA') ? 'bg-blue-700' : 'bg-black/60 backdrop-blur-md border border-white/10'}`}>
                    {news.category?.toUpperCase() || 'GLOBAL'}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <span className="text-[9px] font-black text-white/50 tracking-widest uppercase bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                    {news.date}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setSharingNews(news); }} className="w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 hover:bg-blue-600 transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-1">
                <h3 className="text-xl font-black leading-[1.2] serif-font text-white group-hover:text-blue-500 transition-colors duration-300">
                  {news.title}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-medium line-clamp-3">
                  {news.summary}
                </p>
                <button onClick={() => setActiveReport(news)} className="inline-flex items-center gap-3 text-white font-black text-[9px] uppercase tracking-[0.35em] group/btn pt-2">
                  EXPLORAR INFORME
                  <div className="w-5 h-[1.5px] bg-blue-600 group-hover/btn:w-10 transition-all"></div>
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
