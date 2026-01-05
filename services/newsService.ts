
import { GoogleGenAI, Type } from "@google/genai";
import { NewsStory, MainNews } from "../types";

const HISTORY_KEY = 'cdlt_news_history_v4';
const STORIES_HISTORY_KEY = 'cdlt_stories_history_v4';
const REFRESH_INTERVAL = 900000;

const mergeAndUnique = <T extends { title: string }>(oldData: T[], newData: T[], limit = 150): T[] => {
  const seenTitles = new Set();
  const combined = [...newData, ...oldData];
  return combined.filter(item => {
    const titleKey = item.title.trim().toLowerCase();
    if (seenTitles.has(titleKey)) return false;
    seenTitles.add(titleKey);
    return true;
  }).slice(0, limit);
};

export const fetchMainNews = async (forceRefresh = false): Promise<MainNews[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cachedHistory = localStorage.getItem(HISTORY_KEY);
  let history: MainNews[] = cachedHistory ? JSON.parse(cachedHistory).data : [];
  const lastUpdate = cachedHistory ? JSON.parse(cachedHistory).timestamp : 0;

  if (!forceRefresh && (Date.now() - lastUpdate < REFRESH_INTERVAL) && history.length > 0) {
    return history;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Reporta las 15 noticias más importantes y REALES de este instante. Categorías: VENEZUELA, GLOBAL, ECONOMÍA, CULTURA. Usa búsqueda para imágenes reales. JSON: [{ "id": string, "title": string, "summary": string, "content": string, "imageUrl": string, "date": string, "author": string, "category": string }]`,
      config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const newNews = JSON.parse(response.text || "[]") as MainNews[];
    if (newNews.length > 0) {
      history = mergeAndUnique(history, newNews, 150);
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ data: history, timestamp: Date.now() }));
    }
    return history;
  } catch (error) { return history; }
};

export const getSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.length < 2) return [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Usamos gemini-3-flash-preview para máxima velocidad de respuesta "letra a letra"
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres un radar de noticias de CDLT. El usuario está escribiendo: "${query}". 
      Proporciona exactamente 5 temas o titulares de noticias REALES Y ACTUALES que comiencen o tengan relación DIRECTA y COHERENTE con "${query}". 
      No inventes temas que no tengan que ver con la palabra. Si busca "Manzana", sugiere noticias sobre Apple o la fruta en la actualidad.
      Devuelve solo un array JSON de strings.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 } // Deshabilitar pensamiento para velocidad instantánea
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) { return []; }
};

export const searchNews = async (query: string): Promise<MainNews | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ACTUALIDAD URGENTE: Genera un reporte periodístico completo sobre: "${query}". 
      Debe basarse en hechos reales de las últimas horas. 
      Busca una imagen REAL de alta calidad. 
      JSON: { "id": string, "title": string, "summary": string, "content": string, "imageUrl": string, "date": string, "author": string, "category": string }`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json" 
      }
    });
    return JSON.parse(response.text || "null");
  } catch (error) { return null; }
};

export const fetchLatestStories = async (forceRefresh = false): Promise<NewsStory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cachedHistory = localStorage.getItem(STORIES_HISTORY_KEY);
  let history: NewsStory[] = cachedHistory ? JSON.parse(cachedHistory).data : [];
  const lastUpdate = cachedHistory ? JSON.parse(cachedHistory).timestamp : 0;

  if (!forceRefresh && (Date.now() - lastUpdate < REFRESH_INTERVAL) && history.length > 0) {
    return history;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera 12 micro-noticias actuales con imágenes reales de hoy. JSON: [{id, category, title, concept, timestamp, image}].`,
      config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    const newStories = JSON.parse(response.text || "[]") as NewsStory[];
    if (newStories.length > 0) {
      history = mergeAndUnique(history, newStories, 60);
      localStorage.setItem(STORIES_HISTORY_KEY, JSON.stringify({ data: history, timestamp: Date.now() }));
    }
    return history;
  } catch (error) { return history; }
};

export const getCachedStories = (): NewsStory[] => {
  const cached = localStorage.getItem(STORIES_HISTORY_KEY);
  return cached ? JSON.parse(cached).data : [];
};
