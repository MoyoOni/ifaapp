import React, { useState } from 'react';
import { Play, Pause, CheckCircle, Clock, User, Star } from 'lucide-react';

interface VideoGuide {
  id: string;
  title: string;
  description: string;
  duration: string; // in mm:ss format
  thumbnail: string;
  videoUrl: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress?: number; // 0-100
  completed: boolean;
  rating?: number; // 1-5
  instructor: string;
  views: number;
}

interface VideoGuideGalleryProps {
  videos: VideoGuide[];
  categoryFilter?: string;
  onVideoSelect?: (video: VideoGuide) => void;
  className?: string;
}

const VideoGuideGallery: React.FC<VideoGuideGalleryProps> = ({ 
  videos, 
  categoryFilter, 
  onVideoSelect,
  className = ''
}) => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const filteredVideos = categoryFilter 
    ? videos.filter(video => video.category.toLowerCase().includes(categoryFilter.toLowerCase()))
    : videos;

  const togglePlay = (id: string) => {
    if (playingVideoId === id) {
      setPlayingVideoId(null);
    } else {
      setPlayingVideoId(id);
    }
  };

  const handleVideoClick = (video: VideoGuide) => {
    if (onVideoSelect) {
      onVideoSelect(video);
    }
    togglePlay(video.id);
  };

  const formatDuration = (duration: string) => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return `${minutes} min ${seconds} sec`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredVideos.map((video) => (
          <div 
            key={video.id} 
            className={`bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
              video.completed ? 'ring-2 ring-green-500/30' : ''
            }`}
            onClick={() => handleVideoClick(video)}
          >
            <div className="relative aspect-video bg-gray-200">
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay(video.id);
                  }}
                >
                  {playingVideoId === video.id ? (
                    <Pause className="w-6 h-6 text-foreground" />
                  ) : (
                    <Play className="w-6 h-6 text-foreground ml-0.5" />
                  )}
                </button>
              </div>
              
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
              
              {video.completed && (
                <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="p-3 sm:p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-foreground line-clamp-2 flex-1 mr-2 text-sm sm:text-base">{video.title}</h3>
                {video.difficulty === 'beginner' && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex-shrink-0">Beginner</span>
                )}
                {video.difficulty === 'intermediate' && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex-shrink-0">Intermediate</span>
                )}
                {video.difficulty === 'advanced' && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex-shrink-0">Advanced</span>
                )}
              </div>
              
              <p className="text-muted-foreground text-xs sm:text-sm mt-2 line-clamp-2">
                {video.description}
              </p>
              
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span className="truncate">{video.instructor}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatDuration(video.duration)}</span>
                </div>
                
                {video.rating !== undefined && (
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="#fbbf24" className="text-yellow-400" />
                    <span>{video.rating}</span>
                  </div>
                )}
              </div>
              
              {video.progress !== undefined && (
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${video.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {video.progress}% complete
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGuideGallery;