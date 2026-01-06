
import { GoogleGenAI, Type } from "@google/genai";
import { NewsStory, MainNews } from "../types";

const HISTORY_KEY = 'cdlt_news_history_v4';
const STORIES_HISTORY_KEY = 'cdlt_stories_history_v4';
const REFRESH_INTERVAL = 300000; // 5 min

const mergeAndUnique = <T extends { title: string }>(oldData: T[], newData: T[], limit = 150): T[] => {
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

  if (!forceRefresh && (Date.now() - lastUpdate < REFRESH_INTERVAL) && history.length > 0) {
    return history;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ACTUALIDAD URGENTE: Reporta las 15 noticias y novedades más importantes de este instante. Prioriza impacto global. Devuelve JSON estrictamente: [{ "id": string, "title": string, "summary": string, "content": string, "imageUrl": string, "date": string, "author": string, "category": string }]`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía");
    
    const newNews = JSON.parse(text) as MainNews[];
    if (newNews && newNews.length > 0) {
      history = mergeAndUnique(history, newNews, 150);
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ data: history, timestamp: Date.now() }));
    }
    return history;
  } catch (error) {
    console.error("API Error - Usando cache");
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
      contents: `Historias del momento (Stories): Genera 12 micro-noticias visuales sobre tendencias mundiales de hoy. JSON: [{id, category, title, concept, timestamp, image}]`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía");

    const newStories = JSON.parse(text) as NewsStory[];
    if (newStories && newStories.length > 0) {
      history = mergeAndUnique(history, newStories, 60);
      localStorage.setItem(STORIES_HISTORY_KEY, JSON.stringify({ data: history, timestamp: Date.now() }));
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
