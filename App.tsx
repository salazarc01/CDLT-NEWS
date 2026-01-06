
import React, { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const initialStories = getCachedStories();
      if (initialStories.length > 0) setStories(initialStories);
      
      const cachedMainStr = localStorage.getItem('cdlt_news_history_v4');
      if (cachedMainStr) {
        try {
          const parsed = JSON.parse(cachedMainStr);
          setMainFeed(parsed.data);
          setIsLoading(false);
        } catch(e) {
          setIsLoading(true);
        }
      } else {
        setIsLoading(true);
      }
      
      await syncContent();
      setIsLoading(false);
    };
    init();
    const interval = setInterval(syncContent, 300000);
    return () => clearInterval(interval);
  }, []);

  const syncContent = async () => {
    setIsUpdating(true);
    try {
      const [latestStories, latestFeed] = await Promise.all([
        fetchLatestStories(true),
        fetchMainNews(true)
      ]);
      if (latestStories.length > 0) setStories(latestStories);
      if (latestFeed.length > 0) setMainFeed(latestFeed);
    } catch (e) {
      console.error("Error de sincronización.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredMainFeed = activeCategory === 'TODO' 
    ? mainFeed 
    : mainFeed.filter(news => news.category?.toUpperCase()?.includes(activeCategory));

  const filteredStories = activeCategory === 'TODO'
    ? stories
    : stories.filter(story => story.category?.toUpperCase()?.includes(activeCategory));

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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 max-w-md mx-auto relative border-x border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] pb-10">
      <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {/* Breaking News Ticker */}
      {!isLoading && <BreakingTicker items={mainFeed.slice(0, 5).map(n => n.title)} />}

      {/* Sección de Historias */}
      <section className="py-6 bg-[#0d0d0f] border-b border-zinc-900 overflow-hidden relative z-10">
        <div className="px-6 flex items-center justify-between mb-5">
           <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
             <span className="w-2 h-[1px] bg-blue-600"></span>
             Historias del Día
           </h2>
           {isUpdating && <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>}
        </div>
        
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-6 pb-2 min-h-[100px]">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse"></div>
                <div className="w-10 h-2 bg-zinc-800 rounded animate-pulse"></div>
              </div>
            ))
          ) : (
            filteredStories.map((story) => (
              <button 
                key={story.id} 
                onClick={() => setActiveStoryIdx(stories.findIndex(s => s.id === story.id))}
                className="flex-shrink-0 flex flex-col items-center gap-2 group outline-none"
              >
                <div className={`w-16 h-16 rounded-full p-[2.5px] transition-all active:scale-90 duration-300 ${story.category?.toUpperCase()?.includes('VENEZUELA') ? 'bg-gradient-to-tr from-yellow-500 via-blue-600 to-red-600' : 'bg-gradient-to-tr from-blue-700 to-zinc-800'}`}>
                  <div className="relative w-full h-full rounded-full border-[3.5px] border-[#0d0d0f] overflow-hidden bg-zinc-950 flex items-center justify-center">
                    <img 
                      src={story.image} 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                      alt=""
                      onError={(e) => (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=200`}
                    />
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-tighter truncate w-16 text-center text-zinc-500 group-hover:text-white transition-colors">
                  {story.category?.split(' ')[0] || 'INFO'}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Feed Principal de Noticias */}
      <main className="px-6 py-12 relative z-10">
        <div className="space-y-16">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-[16/10] bg-zinc-900 rounded-2xl"></div>
                <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
                <div className="h-4 bg-zinc-800 rounded w-full"></div>
              </div>
            ))
          ) : (
            filteredMainFeed.map((news, idx) => (
              <article key={news.id + idx} className="group animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-7 shadow-2xl bg-zinc-900 border border-white/5">
                  <img 
                    src={news.imageUrl} 
                    alt={news.title} 
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                    onError={(e) => (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=800`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent"></div>
                  <div className="absolute top-5 left-5 flex gap-2">
                    <div className={`text-white text-[9px] font-black px-3.5 py-1.5 rounded-sm uppercase tracking-[0.2em] shadow-xl ${news.category?.toUpperCase()?.includes('VENEZUELA') ? 'bg-blue-700' : 'bg-black/60 backdrop-blur-md border border-white/10'}`}>
                      {news.category?.toUpperCase() || 'GLOBAL'}
                    </div>
                    {idx < 3 && (
                      <div className="bg-red-600 text-white text-[9px] font-black px-3.5 py-1.5 rounded-sm uppercase tracking-[0.2em] animate-pulse">
                        NOVEDAD
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/50 tracking-widest uppercase bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded">
                      {news.date}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); setSharingNews(news); }} className="w-11 h-11 flex items-center justify-center bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 hover:bg-blue-600 transition-all active:scale-90">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-1">
                  <h3 className="text-2xl font-black leading-[1.25] serif-font text-white group-hover:text-blue-500 transition-colors duration-300">
                    {news.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium line-clamp-3">
                    {news.summary}
                  </p>
                  <button onClick={() => setActiveReport(news)} className="inline-flex items-center gap-4 text-white font-black text-[10px] uppercase tracking-[0.35em] group/btn pt-3">
                    Analizar Informe
                    <div className="w-8 h-[1.5px] bg-blue-600 group-hover/btn:w-16 transition-all duration-700"></div>
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {activeStoryIdx !== null && <StoryViewer stories={stories} initialIndex={activeStoryIdx} onClose={() => setActiveStoryIdx(null)} />}
      {activeReport !== null && <ReportViewer report={activeReport} onClose={() => setActiveReport(null)} />}
      {sharingNews !== null && <ShareMenu onSelect={handleShareMain} onClose={() => setSharingNews(null)} isGenerating={isGeneratingShare} />}
    </div>
  );
};

export default App;
