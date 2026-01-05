
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StoryViewer from './components/StoryViewer';
import ReportViewer from './components/ReportViewer';
import ShareMenu from './components/ShareMenu';
import { fetchLatestStories, getCachedStories } from './services/newsService';
import { prepareShareContent, shareToPlatform } from './utils/shareUtils';
import { NewsStory, MainNews } from './types';

const getCategoryIcon = (category: string) => {
  const cat = category.toUpperCase();
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
  const [stories, setStories] = useState<NewsStory[]>(() => getCachedStories());
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [activeReport, setActiveReport] = useState<MainNews | null>(null);
  const [sharingNews, setSharingNews] = useState<MainNews | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [loading, setLoading] = useState(stories.length === 0);

  const [mainFeed] = useState<MainNews[]>([
    {
      id: 'venezuela-crisis-2024',
      title: 'Maduro ante la Justicia de Nueva York: Delcy Rodríguez asume Presidencia Encargada',
      summary: 'Giro histórico en Venezuela. Este lunes, Nicolás Maduro y Cilia Flores comparecen ante un juez en Nueva York. Paralelamente, el Ministro de la Defensa, Vladimir Padrino López, anunció en cadena nacional el respaldo total del ejército a la vicepresidenta Delcy Rodríguez para su juramentación como presidenta interina del país.',
      content: `La mañana de este lunes marca un hito sin precedentes en la historia republicana de Venezuela. Tras una serie de negociaciones diplomáticas de alto nivel, se confirmó que Nicolás Maduro y su esposa Cilia Flores han ingresado a territorio estadounidense para comparecer ante una corte federal en el Distrito Sur de Nueva York.\n\nMientras este proceso judicial se desarrolla en el extranjero, en Caracas el ambiente es de máxima tensión y transformación institucional. El General en Jefe Vladimir Padrino López, rodeado del alto mando militar, realizó una aparición televisiva crucial. En su discurso, Padrino enfatizó que la Fuerza Armada Nacional Bolivariana (FANB) reconoce y apoya plenamente la sucesión constitucional inmediata.\n\n"Cumpliendo con los protocolos de estabilidad nacional, el ejército respalda la juramentación de la Vicepresidenta Ejecutiva Delcy Rodríguez como Presidenta Encargada de la República", declaró el alto oficial ante las cámaras. Rodríguez, quien ha mantenido un perfil estratégico en el gabinete, asume el mando en un momento de transición crítica bajo la mirada atenta de la comunidad internacional.\n\nAnalistas sugieren que este movimiento podría ser parte de un acuerdo mayor para la estabilización del país, aunque las reacciones en las calles de las principales ciudades venezolanas aún son de cautela y expectativa. El centro de Caracas permanece bajo estricto control de seguridad mientras se preparan los actos protocolares de la juramentación.`,
      imageUrl: 'https://imagenes.elpais.com/resizer/v2/GA6Y6OUHCZFRBGIL3S3RJSBX3U.jpg?auth=c694a203926bd1bdd50e180b7f5b1a7cb014b794386d80009d78c7579c20e7f7&width=414',
      date: 'AHORA',
      author: 'Corresponsalía CDLT'
    },
    {
      id: 'ia-medica-update',
      title: 'Nuevos Horizontes en Medicina: IA Detecta Patologías Raras',
      summary: 'Sistemas de inteligencia artificial avanzada logran identificar diagnósticos complejos en segundos, revolucionando los protocolos de emergencia en hospitales de alta complejidad.',
      content: `La integración de modelos de lenguaje de gran tamaño y visión artificial en el diagnóstico clínico está salvando vidas. Un estudio reciente en centros de trauma de nivel 1 ha demostrado que la IA puede detectar anomalías que pasan desapercibidas para el ojo humano en el 15% de los casos de urgencia.\n\nEstos sistemas no reemplazan al médico, sino que actúan como un copiloto experto que analiza miles de variables biológicas y antecedentes en milisegundos. "Estamos ante el mayor salto cualitativo en la medicina diagnóstica desde el descubrimiento de los Rayos X", afirma el Dr. Julian Arango, jefe de innovación médica.`,
      imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
      date: 'Hace 3 horas',
      author: 'Redacción Ciencia'
    }
  ]);

  const updateNews = async (silent = false) => {
    if (!silent) setLoading(true);
    const latest = await fetchLatestStories();
    if (latest.length > 0) {
      setStories(latest);
    }
    setLoading(false);
  };

  useEffect(() => {
    updateNews(stories.length > 0);
    const interval = setInterval(() => updateNews(true), 3600000);
    return () => clearInterval(interval);
  }, []);

  const handleShareMain = async (platform: 'whatsapp' | 'facebook' | 'gmail') => {
    if (!sharingNews) return;
    setIsGeneratingShare(true);
    try {
      const shareContent = await prepareShareContent({
        title: sharingNews.title,
        category: 'REPORTE CENTRAL',
        firstParagraph: sharingNews.summary,
        time: sharingNews.date,
        author: sharingNews.author,
        imageUrl: sharingNews.imageUrl
      });
      if (shareContent) {
        await shareToPlatform(platform, { blob: shareContent.blob, text: shareContent.text });
      }
    } catch (e) {
      console.error('Error sharing news:', e);
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
          <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Novedades CDLT</h2>
          <span className="flex items-center gap-1.5 text-[8px] font-bold text-blue-500">
            <span className={`w-1.5 h-1.5 bg-blue-500 rounded-full ${!loading ? 'animate-pulse' : ''}`}></span> 
            {loading ? 'SINCRONIZANDO...' : 'VIVO'}
          </span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 min-h-[90px]">
          {loading && stories.length === 0 ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-zinc-800 animate-pulse" />
                <div className="w-8 h-2 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))
          ) : (
            stories.map((story, idx) => (
              <button 
                key={story.id + idx} 
                onClick={() => setActiveStoryIdx(idx)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 group outline-none"
              >
                <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-blue-700 via-zinc-600 to-blue-400 group-active:scale-90 transition-all">
                  <div className="w-14 h-14 rounded-full border-[2.5px] border-[#0a0a0c] overflow-hidden bg-zinc-900 flex items-center justify-center text-2xl shadow-xl">
                    {getCategoryIcon(story.category)}
                  </div>
                </div>
                <span className="text-[8px] font-black text-zinc-500 group-hover:text-blue-400 truncate w-14 text-center tracking-tighter uppercase transition-colors">
                  {story.category.split(' ')[0]}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Main Home News Section */}
      <main className="px-5 py-8 space-y-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-[1px] flex-1 bg-zinc-800"></div>
          <span className="text-[9px] font-black tracking-[0.3em] text-zinc-500 uppercase italic shrink-0">REPORTAJES CENTRALES</span>
          <div className="h-[1px] flex-1 bg-zinc-800"></div>
        </div>

        {mainFeed.map((news) => (
          <article key={news.id} className="group animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative aspect-[16/9] overflow-hidden rounded-sm mb-5 shadow-2xl">
              <img 
                src={news.imageUrl} 
                alt={news.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white text-[8px] font-black px-2.5 py-1 rounded-sm uppercase tracking-widest shadow-xl">
                {news.date === 'AHORA' ? 'EXTRA' : 'ESPECIAL'}
              </div>
              
              {/* Botón de compartir prioritario en imagen */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSharingNews(news);
                }}
                className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-blue-600 transition-all shadow-2xl active:scale-90 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-500 tracking-wider">
                <span className="text-blue-500 uppercase font-black">{news.author}</span>
                <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                <span>{news.date}</span>
              </div>
              <h3 className="text-xl font-bold leading-tight serif-font text-white group-hover:text-blue-400 transition-colors">
                {news.title}
              </h3>
              <p className="text-zinc-400 text-[13px] leading-relaxed font-medium">
                {news.summary}
              </p>
              <div className="flex items-center justify-between pt-1">
                <button 
                  onClick={() => setActiveReport(news)}
                  className="flex items-center gap-3 text-white font-black text-[9px] uppercase tracking-[0.2em] hover:text-blue-500 transition-colors"
                >
                  LEER REPORTE COMPLETO
                  <div className="w-6 h-[1px] bg-blue-600 group-hover:w-10 transition-all duration-500"></div>
                </button>
                <button 
                   onClick={() => setSharingNews(news)}
                   className="text-zinc-500 hover:text-blue-500 transition-colors"
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Professional Editorial Box */}
        <section className="bg-zinc-900/10 p-7 border border-zinc-800/50 relative overflow-hidden group rounded-sm">
          <h4 className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">LÍNEA EDITORIAL</h4>
          <p className="text-base font-bold text-zinc-300 serif-font leading-relaxed italic group-hover:text-white transition-colors">
            "En tiempos de incertidumbre política, la transparencia es el único norte de CDLT NEWS. Informamos con hechos contrastados y fuentes directas."
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/10 flex items-center justify-center font-black text-blue-500 border border-blue-500/20 text-[10px]">CN</div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">DIRECCIÓN CDLT GLOBAL</span>
          </div>
        </section>

        {/* Contact Section */}
        <section className="pt-8 border-t border-zinc-900">
          <div className="bg-[#0d0d0f] rounded-lg p-6 border border-zinc-800">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
              <span className="w-2 h-[2px] bg-blue-600"></span>
              Oficina de Prensa & Contacto
            </h4>
            <p className="text-zinc-400 text-xs leading-relaxed mb-6 font-medium">
              Si desea colaborar con nuestra redacción, enviar una nota de prensa o solicitar la cobertura de un evento específico, por favor contacte a nuestra mesa de asignaciones globales.
            </p>
            <a 
              href="mailto:soportespacetramoyax@gmail.com" 
              className="inline-flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-4 py-3 rounded-md transition-all group w-full justify-center border border-zinc-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Enviar Solicitud</span>
            </a>
            <p className="text-center mt-4 text-[9px] text-zinc-600 font-bold tracking-tighter">
              soportespacetramoyax@gmail.com
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-16 py-14 bg-black border-t border-zinc-900 px-8 text-center">
        <h2 className="text-2xl font-black serif-font text-white mb-2 italic tracking-tighter">CDLT <span className="text-blue-600">NEWS</span></h2>
        <div className="w-12 h-[1px] bg-blue-600 mx-auto mb-8"></div>
        <p className="text-zinc-600 text-[8px] uppercase font-bold tracking-[0.2em] leading-loose max-w-[240px] mx-auto">
          Periodismo de Investigación Global<br/>
          Corresponsalía Central Nueva York / Caracas<br/>
          © 2024 CDLT MEDIA GROUP.
        </p>
      </footer>

      {activeStoryIdx !== null && (
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
