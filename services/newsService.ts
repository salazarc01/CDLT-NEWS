
import { GoogleGenAI } from "@google/genai";
import { NewsStory, MainNews } from "../types";

const HISTORY_KEY = 'cdlt_news_history_v4';
const STORIES_HISTORY_KEY = 'cdlt_stories_history_v4';
const REFRESH_INTERVAL = 120000; // 2 minutos

// NOTICIAS DE RESPALDO PROFESIONALES (Se muestran si la API falla)
const FALLBACK_NEWS: MainNews[] = [
  {
    id: 'f1',
    title: 'Crisis Climática: El Ártico registra temperaturas récord este mes',
    summary: 'Científicos alertan sobre un deshielo acelerado que podría impactar las corrientes marinas globales de forma irreversible.',
    imageUrl: 'https://images.unsplash.com/photo-1473081556163-2a17281fe7df?q=80&w=800',
    date: 'AHORA',
    author: 'Redacción Global',
    category: 'NATURALEZA'
  },
  {
    id: 'f2',
    title: 'Nueva York: Wall Street cierra con ganancias históricas en el sector tech',
    summary: 'La inteligencia artificial impulsa el valor de las principales empresas tecnológicas a niveles nunca vistos en la década.',
    imageUrl: 'https://images.unsplash.com/photo-1611974714658-75d4f0ad0657?q=80&w=800',
    date: 'HACE 1H',
    author: 'Análisis Económico',
    category: 'ECONOMÍA'
  },
  {
    id: 'f3',
    title: 'Venezuela: Avances en infraestructura digital en el centro del país',
    summary: 'Nuevos proyectos buscan optimizar la conectividad de alta velocidad en las principales zonas industriales.',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e443d1f9?q=80&w=800',
    date: 'RECIENTE',
    author: 'CDLT Venezuela',
    category: 'VENEZUELA'
  }
];

const FALLBACK_STORIES: NewsStory[] = [
  { id: 's1', category: 'GLOBAL', title: 'Planeta Vivo', concept: 'Explorando las últimas fronteras naturales del Amazonas.', timestamp: 'HACE 5M', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=300' },
  { id: 's2', category: 'TECH', title: 'IA Futura', concept: 'Cómo el lenguaje natural está cambiando el código.', timestamp: 'HACE 10M', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=300' },
  { id: 's3', category: 'FINANZAS', title: 'Oro Digital', concept: 'El Bitcoin alcanza nuevos soportes de confianza.', timestamp: 'HACE 20M', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=300' }
];

const getApiKey = (): string => {
  try {
    return (window as any).process?.env?.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const mergeAndUnique = <T extends { title: string }>(oldData: T[], newData: T[], limit = 50): T[] => {
  const seenTitles = new Set();
  const combined = [...newData, ...oldData];
  return combined.filter(item => {
    if (!item || !item.title) return false;
    const titleKey = item.title.trim().toLowerCase();
    if (seenTitles.has(titleKey)) return false;
    seenTitles.add(titleKey);
    return true;
  }).slice(0, limit);
};

export const fetchMainNews = async (forceRefresh = false): Promise<MainNews[]> => {
  const apiKey = getApiKey();
  const cachedHistory = localStorage.getItem(HISTORY_KEY);
  let history: MainNews[] = [];
  let lastUpdate = 0;

  if (cachedHistory) {
    try {
      const parsed = JSON.parse(cachedHistory);
      history = parsed.data || [];
      lastUpdate = parsed.timestamp || 0;
    } catch(e) {}
  }

  // Si no hay nada en cache, cargamos los fallbacks primero para que el usuario vea algo
  if (history.length === 0) history = FALLBACK_NEWS;

  if (!forceRefresh && (Date.now() - lastUpdate < REFRESH_INTERVAL) && history.length > 0) {
    return history;
  }

  if (!apiKey) return history;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `REPORTE GLOBAL URGENTE CDLT NEW: Genera 15 noticias reales e impactantes del mundo. JSON: [{ "id": string, "title": string, "summary": string, "content": string, "imageUrl": string, "date": string, "author": string, "category": string }]`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });

    const text = response.text;
    if (!text) return history;
    
    const newNews = JSON.parse(text) as MainNews[];
    if (newNews && newNews.length > 0) {
      const merged = mergeAndUnique(history, newNews, 100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ data: merged, timestamp: Date.now() }));
      return merged;
    }
    return history;
  } catch (error) {
    return history;
  }
};

export const fetchLatestStories = async (forceRefresh = false): Promise<NewsStory[]> => {
  const apiKey = getApiKey();
  const cachedHistory = localStorage.getItem(STORIES_HISTORY_KEY);
  let history: NewsStory[] = [];
  let lastUpdate = 0;

  if (cachedHistory) {
    try {
      const parsed = JSON.parse(cachedHistory);
      history = parsed.data || [];
      lastUpdate = parsed.timestamp || 0;
    } catch(e) {}
  }

  if (history.length === 0) history = FALLBACK_STORIES;

  if (!forceRefresh && (Date.now() - lastUpdate < REFRESH_INTERVAL) && history.length > 0) {
    return history;
  }

  if (!apiKey) return history;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `MOMENTOS CDLT: 12 micro-noticias visuales sobre tendencias. JSON: [{id, category, title, concept, timestamp, image}]`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });

    const text = response.text;
    if (!text) return history;

    const newStories = JSON.parse(text) as NewsStory[];
    if (newStories && newStories.length > 0) {
      const merged = mergeAndUnique(history, newStories, 40);
      localStorage.setItem(STORIES_HISTORY_KEY, JSON.stringify({ data: merged, timestamp: Date.now() }));
      return merged;
    }
    return history;
  } catch (error) {
    return history;
  }
};

export const getCachedStories = (): NewsStory[] => {
  try {
    const cached = localStorage.getItem(STORIES_HISTORY_KEY);
    if (!cached) return FALLBACK_STORIES;
    const parsed = JSON.parse(cached);
    return parsed.data && parsed.data.length > 0 ? parsed.data : FALLBACK_STORIES;
  } catch(e) { return FALLBACK_STORIES; }
};
