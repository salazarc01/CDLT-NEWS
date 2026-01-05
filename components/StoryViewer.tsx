
import React, { useState, useEffect, useRef } from 'react';
import { NewsStory } from '../types';
import ShareMenu from './ShareMenu';
import { prepareShareContent, shareToPlatform } from '../utils/shareUtils';

interface StoryViewerProps {
  stories: NewsStory[];
  initialIndex: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageErrorCount, setImageErrorCount] = useState(0);
  const STORY_DURATION = 15000;
  const progressInterval = useRef<number | null>(null);

  const story = stories[currentIndex];

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      setImageErrorCount(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      setImageErrorCount(0);
    }
  };

  useEffect(() => {
    if (showShare) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      return;
    }

    if (progressInterval.current) clearInterval(progressInterval.current);
    
    const startTime = Date.now();
    const currentElapsedOffset = (progress / 100) * STORY_DURATION;

    progressInterval.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) + currentElapsedOffset;
      const newProgress = (elapsed / STORY_DURATION) * 100;
      
      if (newProgress >= 100) {
        nextStory();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentIndex, showShare]);

  const handleShare = async (platform: 'whatsapp' | 'facebook' | 'gmail') => {
    setIsGenerating(true);
    try {
      const content = await prepareShareContent({
        title: story.title,
        category: story.category,
        firstParagraph: story.concept.substring(0, 150) + '...',
        time: story.timestamp,
        author: 'Corresponsalía CDLT',
        imageUrl: story.image
      });
      if (content) {
        await shareToPlatform(platform, { blob: content.blob, text: content.text });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setShowShare(false);
    }
  };

  if (!story) return null;

  // Fallback visual si la imagen no carga
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (imageErrorCount === 0) {
      // Intento 1: Unsplash basado en tema
      const query = (story as any).imageQuery || story.category;
      target.src = `https://source.unsplash.com/featured/?${encodeURIComponent(query)},news`;
      setImageErrorCount(1);
    } else if (imageErrorCount === 1) {
      // Intento 2: Imagen genérica de alta calidad
      target.src = 'https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=1080';
      setImageErrorCount(2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-screen overflow-hidden">
      {/* Progress Bars */}
      <div className="absolute top-4 left-2 right-2 flex gap-1 z-20">
        {stories.map((_, idx) => (
          <div key={idx} className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{ 
                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div className="absolute top-8 left-4 right-4 z-20 flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[12px] border border-white/30 text-white shrink-0 shadow-xl">
            C
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="text-white text-[12px] font-black tracking-tight drop-shadow-md">
                CDLT NEWS
              </p>
              <svg className="w-3.5 h-3.5 text-blue-500 fill-current drop-shadow-md" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-600 text-white rounded-sm font-black uppercase tracking-wider inline-block">
                {story.category}
              </span>
              <span className="text-white/70 text-[10px] drop-shadow-md">• {story.timestamp}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowShare(true)} 
            className="text-white p-2.5 bg-black/40 rounded-full backdrop-blur-md active:scale-90 transition-all border border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button onClick={onClose} className="text-white p-2.5 bg-black/40 rounded-full backdrop-blur-md active:scale-90 transition-all border border-white/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Media Container */}
      <div className="absolute inset-0 w-full h-full bg-[#0a0a0c] overflow-hidden">
        <img 
          key={story.id}
          src={story.image} 
          alt={story.title} 
          className="w-full h-full object-cover animate-in fade-in duration-700"
          onError={handleImageError}
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0a0a0c]/90 pointer-events-none" />
      </div>

      {/* Content Area */}
      <div className="absolute bottom-10 left-0 right-0 z-10 animate-fade-in-up flex flex-col pointer-events-none px-6">
        <h2 className="text-[26px] font-black text-white leading-[1.1] mb-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] serif-font italic tracking-tight">
          {story.title}
        </h2>
        
        <div className="max-h-[38vh] overflow-y-auto no-scrollbar">
          <div className="bg-black/75 backdrop-blur-[12px] p-5 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <p className="text-[16px] text-zinc-100 font-bold leading-relaxed tracking-tight">
              {story.concept}
            </p>
          </div>
        </div>
        
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.9)]"></div>
            <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.15em] drop-shadow-md">
              REPORTE GLOBAL CONFIRMADO
            </span>
          </div>
          <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
            {currentIndex + 1} / {stories.length}
          </div>
        </div>
      </div>

      {/* Navigation zones */}
      {!showShare && (
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/2 h-full cursor-pointer" onClick={prevStory} />
          <div className="w-1/2 h-full cursor-pointer" onClick={nextStory} />
        </div>
      )}

      {showShare && (
        <ShareMenu 
          onSelect={handleShare} 
          onClose={() => setShowShare(false)} 
          isGenerating={isGenerating}
        />
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default StoryViewer;
