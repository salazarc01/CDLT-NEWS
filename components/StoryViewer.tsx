
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
  const STORY_DURATION = 10000;
  const progressInterval = useRef<number | null>(null);

  const story = stories[currentIndex];

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
        author: 'Redacción CDLT NEW',
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

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col h-screen overflow-hidden">
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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-[14px] border border-white/20 text-white shrink-0 shadow-xl">
            C
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="text-white text-[13px] font-black tracking-tighter drop-shadow-md uppercase">
                CDLT <span className="text-blue-500">NEW</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] px-1.5 py-0.5 bg-blue-600/30 backdrop-blur-sm text-blue-400 rounded-sm font-black uppercase tracking-wider">
                {story.category}
              </span>
              <span className="text-white/50 text-[9px] drop-shadow-md">• {story.timestamp}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
      <div className="absolute inset-0 w-full h-full bg-zinc-950 overflow-hidden">
        <img 
          key={story.id}
          src={story.image} 
          alt={story.title} 
          className="w-full h-full object-cover animate-in fade-in duration-500"
          onError={(e) => (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711432869-efd5971ee142?q=80&w=1080'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* Content Area */}
      <div className="absolute bottom-12 left-0 right-0 z-10 flex flex-col pointer-events-none px-6">
        <h2 className="text-[28px] font-black text-white leading-[1] mb-6 drop-shadow-2xl serif-font italic tracking-tight">
          {story.title}
        </h2>
        
        <div className="bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
          <p className="text-[15px] text-zinc-100 font-bold leading-snug tracking-tight">
            {story.concept}
          </p>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em]">
              CDLT NEW • REPORTAJE ESPECIAL
            </span>
          </div>
          <div className="text-[8px] font-bold text-white/30 tracking-widest">
            {currentIndex + 1} / {stories.length}
          </div>
        </div>
      </div>

      {/* Navigation zones */}
      {!showShare && (
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
          <div className="w-2/3 h-full cursor-pointer" onClick={nextStory} />
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
