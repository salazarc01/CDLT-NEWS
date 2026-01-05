
import { GoogleGenAI, Type } from "@google/genai";
import { NewsStory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const CACHE_KEY = 'cdlt_news_cache_v2';
const CACHE_TIME = 3600000; // 1 hora

export const getCachedStories = (): NewsStory[] => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return [];
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TIME) return [];
    return data;
  } catch (e) {
    return [];
  }
};

export const fetchLatestStories = async (): Promise<NewsStory[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca y genera 35 noticias REALES y CONFIRMADAS de HOY. Fuentes internacionales confiables. Temas: política, guerra, economía, ciencia, belleza, salud, gastronomía, eventos, desastres. Formato JSON: array de {id, category, title, concept, timestamp, image (URL Unsplash realista)}. Máxima brevedad y veracidad absoluta.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              concept: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              image: { type: Type.STRING }
            },
            required: ["id", "category", "title", "concept", "timestamp", "image"]
          }
        }
      }
    });

    const news = JSON.parse(response.text || "[]");
    const processedNews = news.map((item: any) => ({
      ...item,
      image: item.image?.startsWith('http') ? item.image : `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=800`
    }));

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: processedNews,
      timestamp: Date.now()
    }));

    return processedNews;
  } catch (error) {
    console.error("Error fetching news:", error);
    return getCachedStories();
  }
};
