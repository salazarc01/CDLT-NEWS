
import { GoogleGenAI, Type } from "@google/genai";
import { NewsStory } from "../types";

const CACHE_KEY = 'cdlt_news_cache_v4';
const CACHE_TIME = 3600000; // 1 hora

const CATEGORIES = [
  'POLÍTICA', 'GUERRA', 'ECONOMÍA', 'DESCUBRIMIENTOS', 
  'BELLEZA', 'SALUD', 'GASTRONOMÍA', 'EVENTOS', 'NATURALEZA'
];

// Generador de noticias de respaldo para asegurar +30 elementos siempre
const generatePlaceholderStories = (): NewsStory[] => {
  const stories: NewsStory[] = [];
  const now = new Date();
  
  for (let i = 0; i < 35; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    stories.push({
      id: `fallback-${i}-${Date.now()}`,
      category: category,
      title: `Actualización Crítica: ${category} en Desarrollo`,
      concept: `Reporte de última hora sobre los avances más recientes en el sector de ${category.toLowerCase()}. Los corresponsales de CDLT NEWS monitorean la situación en tiempo real desde las principales capitales del mundo.`,
      timestamp: `HACE ${i + 2} MIN`,
      image: `https://images.unsplash.com/photo-${1500000000000 + (i * 123456)}?auto=format&fit=crop&q=80&w=800`
    });
  }
  return stories;
};

export const getCachedStories = (): NewsStory[] => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return [];
  try {
    const { data, timestamp } = JSON.parse(cached);
    // Si el caché tiene menos de 30 noticias, lo ignoramos para forzar recarga
    if (data.length < 30) return [];
    if (Date.now() - timestamp > CACHE_TIME) return [];
    return data;
  } catch (e) {
    return [];
  }
};

export const fetchLatestStories = async (): Promise<NewsStory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    // Si no hay API KEY, devolvemos los placeholders de inmediato
    if (!process.env.API_KEY) {
      return generatePlaceholderStories();
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: "Genera un array JSON de EXACTAMENTE 35 noticias reales y variadas de hoy. Categorías: POLÍTICA, GUERRA, ECONOMÍA, DESCUBRIMIENTOS, BELLEZA, SALUD, GASTRONOMÍA, EVENTOS, NATURALEZA. El tono debe ser profesional y urgente. Formato: {id, category, title, concept, timestamp, image}. Devuelve SOLO el JSON sin markdown.",
      config: {
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

    let rawText = response.text || "[]";
    // Limpieza de posibles caracteres extraños
    const jsonStart = rawText.indexOf('[');
    const jsonEnd = rawText.lastIndexOf(']') + 1;
    const cleanedJson = (jsonStart !== -1 && jsonEnd !== -1) ? rawText.substring(jsonStart, jsonEnd) : rawText;
    
    const news = JSON.parse(cleanedJson);
    
    if (Array.isArray(news) && news.length > 0) {
      const processedNews = news.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `story-${Date.now()}-${idx}`,
        image: (item.image && item.image.startsWith('http')) 
          ? item.image 
          : `https://images.unsplash.com/photo-${1500000000000 + (idx * 1000)}?auto=format&fit=crop&q=80&w=800`
      }));

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: processedNews,
        timestamp: Date.now()
      }));
      return processedNews;
    }
    
    throw new Error("Formato de respuesta inválido");
  } catch (error) {
    console.error("Error en servicio de noticias:", error);
    const cached = getCachedStories();
    return cached.length >= 30 ? cached : generatePlaceholderStories();
  }
};
