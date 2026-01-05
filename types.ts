
export interface NewsStory {
  id: string;
  category: string;
  title: string;
  concept: string;
  timestamp: string;
  image: string;
  fullContent?: string;
}

export interface MainNews {
  id: string;
  title: string;
  summary: string;
  content?: string;
  imageUrl: string;
  date: string;
  author: string;
}

export type Category = 
  | 'POLÍTICA' 
  | 'GUERRA' 
  | 'ECONOMÍA' 
  | 'DESCUBRIMIENTOS' 
  | 'BELLEZA' 
  | 'SALUD' 
  | 'GASTRONOMÍA' 
  | 'EVENTOS' 
  | 'NATURALEZA' 
  | 'TECNOLOGÍA';
