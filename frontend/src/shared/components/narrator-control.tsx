import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { logger } from '@/shared/utils/logger';

interface NarratorControlProps {
    src?: string; // Audio source URL (optional)
    autoPlay?: boolean;
    onEnded?: () => void;
    className?: string;
}

const NarratorControl: React.FC<NarratorControlProps> = ({
    src,
    autoPlay = false,
    onEnded,
    className = ''
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (audioRef.current) {
            // Reset state when src changes
            setHasError(false);
            setIsPlaying(false);

            if (src && autoPlay) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setIsPlaying(true))
                        .catch((error) => {
                            logger.log("Audio autoplay prevented:", error);
                            setIsPlaying(false);
                        });
                }
            }
        }
    }, [src, autoPlay]);

    const togglePlay = () => {
        if (!audioRef.current || !src) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(err => logger.error("Play error:", err));
            setIsPlaying(true);
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    if (!src || hasError) return null; // content-visibility: hidden if no audio

    return (
        <div className={`flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20 transition-all ${className}`}>
            <audio
                ref={audioRef}
                src={src}
                onEnded={() => {
                    setIsPlaying(false);
                    onEnded?.();
                }}
                onError={() => setHasError(true)}
            />

            <button
                onClick={togglePlay}
                className="text-highlight hover:text-white transition-colors"
                aria-label={isPlaying ? "Pause narration" : "Play narration"}
            >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>

            <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden mx-1">
                {/* Visualizer placeholder - simple animation when playing */}
                {isPlaying && (
                    <div className="h-full bg-highlight animate-pulse w-full origin-left" />
                )}
            </div>

            <button
                onClick={toggleMute}
                className="text-white/60 hover:text-white transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
        </div>
    );
};

export default NarratorControl;
