
import { GoogleGenAI, Type } from "@google/genai";
import { NewsStory } from "../types";

const CACHE_KEY = 'cdlt_news_cache_v3';
const CACHE_TIME = 3600000; // 1 hora

// Noticias de respaldo en caso de error de API o demora
const fallbackStories: NewsStory[] = [
  { id: 'f1', category: 'POLÍTICA', title: 'Cumbre Global por la Paz', concept: 'Líderes mundiales se reúnen en Ginebra para discutir nuevos tratados de no proliferación y estabilidad en Europa del Este.', timestamp: 'HACE 10 MIN', image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800' },
  { id: 'f2', category: 'ECONOMÍA', title: 'Bitcoin alcanza nuevo máximo', concept: 'La criptomoneda líder supera los 100k impulsada por la adopción institucional en mercados asiáticos y americanos.', timestamp: 'HACE 25 MIN', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800' },
  { id: 'f3', category: 'SALUD', title: 'Avance en cura del Alzheimer', concept: 'Científicos de Oxford anuncian una terapia génica con 90% de éxito en frenar el deterioro cognitivo en etapas tempranas.', timestamp: 'HACE 1 HORA', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800' },
  { id: 'f4', category: 'BELLEZA', title: 'Tendencias en Milán 2025', concept: 'La moda sustentable y los colores tierra dominan las pasarelas de la semana de la moda en Italia.', timestamp: 'HACE 2 HORAS', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800' }
];

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: "Actúa como una agencia de noticias global. Genera un array JSON de EXACTAMENTE 35 noticias reales y variadas de hoy. Categorías: POLÍTICA, GUERRA, ECONOMÍA, DESCUBRIMIENTOS, BELLEZA, SALUD, GASTRONOMÍA, EVENTOS, NATURALEZA. Formato: {id, category, title, concept, timestamp, image}. Usa timestamps relativos como 'HACE 5 MIN'. Devuelve SOLO el JSON.",
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
    // Limpieza profunda de posibles backticks de markdown
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const cleanedJson = jsonMatch ? jsonMatch[0] : rawText;
    
    const news = JSON.parse(cleanedJson);
    
    const processedNews = news.map((item: any, idx: number) => ({
      ...item,
      id: item.id || `story-${Date.now()}-${idx}`,
      image: (item.image && item.image.startsWith('http')) 
        ? item.image 
        : `https://images.unsplash.com/photo-${1500000000000 + idx}?auto=format&fit=crop&q=80&w=800`
    }));

    if (processedNews.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: processedNews,
        timestamp: Date.now()
      }));
      return processedNews;
    }
    
    return getCachedStories().length > 0 ? getCachedStories() : fallbackStories;
  } catch (error) {
    console.error("Error crítico fetching news:", error);
    const cached = getCachedStories();
    return cached.length > 0 ? cached : fallbackStories;
  }
};
