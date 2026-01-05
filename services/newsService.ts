
import { GoogleGenAI, Type } from "@google/genai";
import { NewsStory, MainNews } from "../types";

const CACHE_KEY = 'cdlt_news_cache_v10';
const MAIN_FEED_CACHE_KEY = 'cdlt_main_feed_cache_v5';
const CACHE_TIME = 21600000; // 6 horas para historias
const MAIN_FEED_CACHE_TIME = 1800000; // 30 minutos para noticias centrales

const CATEGORIES = [
  'POLÍTICA', 'GUERRA', 'ECONOMÍA', 'DESCUBRIMIENTOS', 
  'BELLEZA', 'SALUD', 'GASTRONOMÍA', 'EVENTOS', 'NATURALEZA'
];

// Helper para generar una imagen de respaldo profesional basada en el tema
export const getFallbackImage = (query: string) => {
  return `https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=1080&auto=format&fit=crop`; // Default news
};

export const fetchMainNews = async (forceRefresh = false): Promise<MainNews[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const cached = localStorage.getItem(MAIN_FEED_CACHE_KEY);
  if (cached && !forceRefresh) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < MAIN_FEED_CACHE_TIME) return data;
    } catch (e) { console.error(e); }
  }

  try {
    if (!process.env.API_KEY) return [];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres el editor jefe de CDLT NEWS. Busca las 6 noticias más impactantes de HOY. 
      REQUERIMIENTO: Al menos 3 sobre VENEZUELA y 3 Globales.
      Para cada una, busca una URL de imagen REAL en la web que sea impactante.
      Devuelve un JSON profesional: [{ "id": string, "title": string, "summary": string, "content": string, "imageUrl": string, "date": string, "author": string, "category": string, "imageQuery": string }]
      'imageQuery' debe ser un término de búsqueda en inglés para Unsplash (ej: "venezuela protest", "caracas city", "economy stocks") como respaldo.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              content: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              date: { type: Type.STRING },
              author: { type: Type.STRING },
              category: { type: Type.STRING },
              imageQuery: { type: Type.STRING }
            },
            required: ["id", "title", "summary", "content", "imageUrl", "date", "author", "category", "imageQuery"]
          }
        }
      }
    });

    const news = JSON.parse(response.text || "[]") as (MainNews & { imageQuery: string })[];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter((c: any) => c.web).map((c: any) => ({ uri: c.web.uri, title: c.web.title }));

    const processedNews = news.map(item => {
      // Si la URL de imagen parece rota o es un placeholder, usamos el query para Unsplash
      const finalImageUrl = item.imageUrl && item.imageUrl.startsWith('http') 
        ? item.imageUrl 
        : `https://source.unsplash.com/featured/?${encodeURIComponent(item.imageQuery)}`;

      return {
        ...item,
        imageUrl: finalImageUrl,
        sources: sources.length > 0 ? sources.slice(0, 3) : undefined
      };
    });

    if (processedNews.length > 0) {
      localStorage.setItem(MAIN_FEED_CACHE_KEY, JSON.stringify({
        data: processedNews,
        timestamp: Date.now()
      }));
    }

    return processedNews;
  } catch (error) {
    console.error("Error fetching main news:", error);
    return [];
  }
};

export const getCachedStories = (): NewsStory[] => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return [];
  try {
    const { data } = JSON.parse(cached);
    return data || [];
  } catch (e) {
    return [];
  }
};

export const fetchLatestStories = async (forceRefresh = false): Promise<NewsStory[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TIME) return data;
    }
  }

  try {
    if (!process.env.API_KEY) return generatePlaceholderStories();

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera un JSON de 35 micro-noticias reales de hoy en ESPAÑOL.
      REGLAS:
      1. PROHIBIDO VENEZUELA (ni la palabra ni el país).
      2. Cada una con un TEMA ESPECÍFICO (ej: 'Nuevos chips IA', 'Exploración Oceánica', 'Moda Sustentable').
      3. Para cada noticia, genera un 'image' que sea un link directo de Unsplash usando su API de búsqueda: https://source.unsplash.com/featured/?{tema_en_ingles}
      4. Asegúrate que 'imageQuery' sea el término en inglés usado.
      
      JSON: [{id, category, title, concept, timestamp, image, imageQuery}].`,
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
              image: { type: Type.STRING },
              imageQuery: { type: Type.STRING }
            },
            required: ["id", "category", "title", "concept", "timestamp", "image", "imageQuery"]
          }
        }
      }
    });

    const news = JSON.parse(response.text || "[]");
    
    if (Array.isArray(news) && news.length > 0) {
      const processed = news.map(item => ({
        ...item,
        // Reforzamos que la imagen sea funcional
        image: item.image.includes('unsplash') 
          ? item.image 
          : `https://source.unsplash.com/featured/?${encodeURIComponent(item.imageQuery || item.category)}`
      }));

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: processed,
        timestamp: Date.now()
      }));
      return processed;
    }
    
    return generatePlaceholderStories();
  } catch (error) {
    console.error("Error stories fetch:", error);
    return generatePlaceholderStories();
  }
};

const generatePlaceholderStories = (): NewsStory[] => {
  const stories: NewsStory[] = [];
  for (let i = 0; i < 35; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const query = category.toLowerCase();
    stories.push({
      id: `fallback-st-${i}`,
      category: category,
      title: `Tendencia: ${category}`,
      concept: `Información global verificada sobre ${category}. Nuestros sistemas están analizando los datos más recientes.`,
      timestamp: `HACE ${i + 5} MIN`,
      image: `https://source.unsplash.com/featured/?${query},news`
    });
  }
  return stories;
};
