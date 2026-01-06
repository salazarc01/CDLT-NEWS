
import { GoogleGenAI, Type } from "@google/genai";
import { NewsStory, MainNews } from "../types";

const HISTORY_KEY = 'cdlt_news_history_v4';
const STORIES_HISTORY_KEY = 'cdlt_stories_history_v4';
const REFRESH_INTERVAL = 180000; // 3 minutos para mayor frescura

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

  // Si no forzamos y los datos son recientes, devolvemos cache inmediatamente
  if (!forceRefresh && (Date.now() - lastUpdate < REFRESH_INTERVAL) && history.length > 0) {
    return history;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `REPORTE URGENTE: Genera las 15 noticias y novedades más impactantes y reales de los últimos minutos. Enfócate en primicias. JSON: [{ "id": string, "title": string, "summary": string, "content": string, "imageUrl": string, "date": string, "author": string, "category": string }]`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });

    const newNews = JSON.parse(response.text || "[]") as MainNews[];
    if (newNews.length > 0) {
      const merged = mergeAndUnique(history, newNews, 100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ data: merged, timestamp: Date.now() }));
      return merged;
    }
    return history;
  } catch (error) {
    console.error("Error API:", error);
    return history;
  }
};

export const fetchLatestStories = async (forceRefresh = false): Promise<NewsStory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Visual Stories: Genera 12 micro-noticias visuales sobre tendencias mundiales de este segundo. JSON: [{id, category, title, concept, timestamp, image}]`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });

    const newStories = JSON.parse(response.text || "[]") as NewsStory[];
    if (newStories.length > 0) {
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
  const cached = localStorage.getItem(STORIES_HISTORY_KEY);
  if (!cached) return [];
  try {
    return JSON.parse(cached).data || [];
  } catch(e) { return []; }
};
