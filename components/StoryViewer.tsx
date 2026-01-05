
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
  const STORY_DURATION = 15000;
  const progressInterval = useRef<number | null>(null);

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
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

  const story = stories[currentIndex];
  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-screen overflow-hidden">
      {/* Progress Bars */}
      <div className="absolute top-4 left-2 right-2 flex gap-1 z-10">
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
      <div className="absolute top-8 left-4 right-4 z-10 flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[12px] border border-white/30 text-white shrink-0 shadow-lg">
            C
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="text-white text-[12px] font-black tracking-tight">
                CDLT NEWS
              </p>
              <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-600 text-white rounded-sm font-black uppercase tracking-wider inline-block">
                {story.category}
              </span>
              <span className="text-white/50 text-[10px]">• {story.timestamp}</span>
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

      {/* Animated Background GIF */}
      <div className="absolute inset-0 w-full h-full bg-zinc-900">
        <img 
          src={story.image} 
          alt="background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Enhanced Gradients for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/95 pointer-events-none" />

      {/* News Text Area with specialized overlay */}
      <div className="absolute bottom-12 left-5 right-5 z-10 animate-fade-in-up flex flex-col pointer-events-none">
        <h2 className="text-2xl font-bold text-white leading-tight mb-4 drop-shadow-[0_4px_4px_rgba(0,0,0,1)] serif-font italic">
          {story.title}
        </h2>
        <div className="max-h-[35vh] overflow-y-auto no-scrollbar">
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border-l-4 border-blue-600 shadow-2xl">
            <p className="text-[15px] text-zinc-100 font-semibold leading-relaxed">
              {story.concept}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest drop-shadow-md">Noticia Verificada • Hoy</span>
        </div>
      </div>

      {/* Navigation Touch Zones */}
      {!showShare && (
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full" onClick={prevStory} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={nextStory} />
        </div>
      )}

      {showShare && (
        <ShareMenu 
          onSelect={handleShare} 
          onClose={() => setShowShare(false)} 
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
};

export default StoryViewer;
