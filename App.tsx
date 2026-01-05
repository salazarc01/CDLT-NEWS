
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import StoryViewer from './components/StoryViewer';
import ReportViewer from './components/ReportViewer';
import ShareMenu from './components/ShareMenu';
import SearchLoader from './components/SearchLoader';
import { fetchLatestStories, getCachedStories, fetchMainNews, searchNews, getSuggestions } from './services/newsService';
import { prepareShareContent, shareToPlatform } from './utils/shareUtils';
import { NewsStory, MainNews } from './types';

const getCategoryIcon = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.includes('VENEZUELA')) return '🇻🇪';
  if (cat.includes('ECONOMÍA')) return '📈';
  if (cat.includes('CULTURA')) return '🎭';
  if (cat.includes('GLOBAL')) return '🌍';
  return '📰';
};

const App: React.FC = () => {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [mainFeed, setMainFeed] = useState<MainNews[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [activeReport, setActiveReport] = useState<MainNews | null>(null);
  const [sharingNews, setSharingNews] = useState<MainNews | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('TODO');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const initialStories = getCachedStories();
    setStories(initialStories);
    const cachedMain = localStorage.getItem('cdlt_news_history_v4');
    if (cachedMain) setMainFeed(JSON.parse(cachedMain).data);
    syncContent();
    const interval = setInterval(syncContent, 900000);
    return () => clearInterval(interval);
  }, []);

  // Efecto para sugerencias "letra a letra" con respuesta rápida
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = window.setTimeout(async () => {
        const sugs = await getSuggestions(searchQuery);
        // Filtrado local extra para asegurar coherencia extrema antes de mostrar
        const coherentSugs = sugs.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase().split(' ')[0]));
        setSuggestions(coherentSugs.length > 0 ? coherentSugs : sugs.slice(0, 3));
        setShowSuggestions(true);
      }, 250); // Debounce de 250ms para sensación de tiempo real
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const syncContent = async () => {
    setIsUpdating(true);
    try {
      const [latestStories, latestFeed] = await Promise.all([
        fetchLatestStories(true),
        fetchMainNews(true)
      ]);
      setStories(latestStories);
      setMainFeed(latestFeed);
    } catch (e) {
    } finally {
      setIsUpdating(false);
    }
  };

  const executeSearch = async (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    setIsSearching(true);
    const result = await searchNews(query);
    setIsSearching(false);
    if (result) {
      setActiveReport(result);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) executeSearch(searchQuery);
  };

  const filteredMainFeed = activeCategory === 'TODO' 
    ? mainFeed 
    : mainFeed.filter(news => news.category?.toUpperCase().includes(activeCategory));

  const filteredStories = activeCategory === 'TODO'
    ? stories
    : stories.filter(story => story.category?.toUpperCase().includes(activeCategory));

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

      {/* Smart Search Bar with Suggestions */}
      <div className="px-6 pt-6 pb-2 relative z-50">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <input 
            type="text" 
            value={searchQuery}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en la red CDLT..." 
            className="w-full bg-[#16161a] border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold placeholder-zinc-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all shadow-inner"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-[105%] left-0 right-0 bg-[#0d0d0f]/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                 <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Sugerencias actuales</span>
                 <div className="flex gap-1">
                   <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                   <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                   <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                 </div>
              </div>
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => executeSearch(suggestion)}
                  className="w-full px-5 py-4 text-left text-[11px] font-black text-zinc-400 hover:bg-blue-600/20 hover:text-white border-b border-zinc-900 last:border-0 transition-all flex items-center gap-4 group/item"
                >
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center group-hover/item:bg-blue-600/30 transition-colors">
                    <svg className="w-3.5 h-3.5 text-zinc-600 group-hover/item:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
              <div className="p-3 text-center">
                <button 
                  type="submit"
                  className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-blue-400"
                >
                  Ver todos los resultados
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Historias / Stories */}
      <section className="py-6 bg-[#0d0d0f] border-b border-zinc-900 overflow-hidden relative z-10">
        <div className="px-6 flex items-center justify-between mb-5">
           <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-2">
             <span className="w-2 h-[1px] bg-blue-600"></span>
             {activeCategory === 'TODO' ? 'Historias' : `Actualidad: ${activeCategory}`}
           </h2>
           {isUpdating && <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>}
        </div>
        
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-6 pb-2 min-h-[100px]">
          {filteredStories.length === 0 ? (
            <div className="w-full text-center text-[10px] text-zinc-700 py-6 font-bold uppercase tracking-widest italic animate-pulse">
              Sincronizando reportes...
            </div>
          ) : (
            filteredStories.map((story) => (
              <button 
                key={story.id} 
                onClick={() => {
                  const idx = stories.findIndex(s => s.id === story.id);
                  setActiveStoryIdx(idx);
                }}
                className="flex-shrink-0 flex flex-col items-center gap-2 group outline-none"
              >
                <div className={`w-16 h-16 rounded-full p-[2.5px] transition-all active:scale-90 duration-300 ${story.category.toUpperCase().includes('VENEZUELA') ? 'bg-gradient-to-tr from-yellow-500 via-blue-600 to-red-600' : 'bg-gradient-to-tr from-blue-700 to-zinc-800'}`}>
                  <div className="relative w-full h-full rounded-full border-[3.5px] border-[#0d0d0f] overflow-hidden bg-zinc-950 flex items-center justify-center">
                    <img 
                      src={story.image} 
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                      alt=""
                      onError={(e) => {
                         (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=200`;
                      }}
                    />
                    <span className="relative z-10 text-xl drop-shadow-lg">{getCategoryIcon(story.category)}</span>
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-tighter truncate w-16 text-center text-zinc-500 group-hover:text-white transition-colors">
                  {story.category.split(' ')[0]}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Main Chronic Feed / News */}
      <main className="px-6 py-12 relative z-10">
        <div className="flex items-center gap-5 mb-14">
           <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-zinc-800"></div>
           <span className="text-4xl font-black tracking-[0.4em] uppercase serif-font text-white italic">News</span>
           <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-zinc-800"></div>
        </div>

        <div className="space-y-20">
          {filteredMainFeed.length === 0 ? (
            <div className="py-24 text-center">
               <div className="w-10 h-10 border-2 border-zinc-800 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
               <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] italic">Estableciendo conexión...</p>
            </div>
          ) : (
            filteredMainFeed.map((news, idx) => (
              <article key={news.id + idx} className="group animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-7 shadow-2xl bg-zinc-900 border border-white/5">
                  <img 
                    src={news.imageUrl} 
                    alt={news.title} 
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=800`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent"></div>
                  
                  <div className={`absolute top-5 left-5 text-white text-[9px] font-black px-3.5 py-1.5 rounded-sm uppercase tracking-[0.2em] shadow-xl ${news.category?.toUpperCase().includes('VENEZUELA') ? 'bg-blue-700' : 'bg-black/60 backdrop-blur-md border border-white/10'}`}>
                     {news.category?.toUpperCase() || 'GLOBAL'}
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-white/50 tracking-widest uppercase bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded">
                      {news.date}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSharingNews(news); }}
                      className="w-11 h-11 flex items-center justify-center bg-white/10 backdrop-blur-2xl rounded-full text-white border border-white/10 hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-90"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-1">
                  <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-zinc-700 uppercase">
                    <span className="text-blue-500">{news.author}</span>
                    <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                    <span className="italic">CORRESPONSALÍA CDLT</span>
                  </div>
                  
                  <h3 className="text-2xl font-black leading-[1.25] serif-font text-white group-hover:text-blue-500 transition-colors duration-300">
                    {news.title}
                  </h3>
                  
                  <p className="text-zinc-400 text-sm leading-relaxed font-medium line-clamp-3">
                    {news.summary}
                  </p>
                  
                  <button 
                    onClick={() => setActiveReport(news)}
                    className="inline-flex items-center gap-4 text-white font-black text-[10px] uppercase tracking-[0.35em] group/btn pt-3"
                  >
                    Ver Informe Completo
                    <div className="w-8 h-[1.5px] bg-blue-600 group-hover/btn:w-16 transition-all duration-700"></div>
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      <footer className="bg-[#0d0d0f] border-t border-zinc-900 pt-20 pb-16 px-8 text-center relative z-10">
         <div className="serif-font italic text-4xl font-black text-white mb-3">CDLT News</div>
         <p className="text-[11px] font-black text-zinc-500 tracking-[0.5em] uppercase mb-12">Intelligence Journal</p>
         <div className="flex flex-col items-center gap-8 mb-16">
            <div className="flex gap-6">
               <button className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all">𝕏</button>
               <button className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all">IG</button>
               <button className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all">TG</button>
            </div>
            <div className="px-8 py-2.5 bg-blue-600/10 border border-blue-600/20 rounded-full text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">
               Red de Información Verificada
            </div>
         </div>
      </footer>

      {activeStoryIdx !== null && <StoryViewer stories={stories} initialIndex={activeStoryIdx} onClose={() => setActiveStoryIdx(null)} />}
      {activeReport !== null && <ReportViewer report={activeReport} onClose={() => setActiveReport(null)} />}
      {sharingNews !== null && <ShareMenu onSelect={handleShareMain} onClose={() => setSharingNews(null)} isGenerating={isGeneratingShare} />}
      {isSearching && <SearchLoader />}
    </div>
  );
};

export default App;
