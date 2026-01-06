
import { GoogleGenAI } from "@google/genai";
import { NewsStory, MainNews } from "../types";

const HISTORY_KEY = 'cdlt_news_history_v4';
const STORIES_HISTORY_KEY = 'cdlt_stories_history_v4';
const REFRESH_INTERVAL = 180000; // 3 minutos para máxima frescura

// Función segura para obtener la API Key sin romper el flujo si process no está totalmente disponible
const getApiKey = (): string => {
  try {
    return process.env.API_KEY || '';
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
  if (!apiKey) {
    console.error("CDLT NEW: API_KEY no configurada. Las noticias remotas no cargarán.");
    return [];
  }

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

  // Devolver cache si es reciente y no se requiere refresco forzado
  if (!forceRefresh && (Date.now() - lastUpdate < REFRESH_INTERVAL) && history.length > 0) {
    return history;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `REPORTE GLOBAL URGENTE CDLT NEW: Genera las 15 noticias más importantes e impactantes de los últimos minutos a nivel mundial. Incluye política, economía y tecnología. Sé muy descriptivo en el sumario. JSON: [{ "id": string, "title": string, "summary": string, "content": string, "imageUrl": string, "date": string, "author": string, "category": string }]`,
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
    console.warn("CDLT NEW: Error de conexión con el satélite de IA. Usando historial local.");
    return history;
  }
};

export const fetchLatestStories = async (forceRefresh = false): Promise<NewsStory[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];
  
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

  if (!forceRefresh && (Date.now() - lastUpdate < REFRESH_INTERVAL) && history.length > 0) {
    return history;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `MOMENTOS CDLT: Genera 12 micro-noticias visuales sobre tendencias mundiales de este segundo. JSON: [{id, category, title, concept, timestamp, image}]`,
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
    if (!cached) return [];
    return JSON.parse(cached).data || [];
  } catch(e) { return []; }
};
