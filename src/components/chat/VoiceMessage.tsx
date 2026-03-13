import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Mic } from 'lucide-react';
import { MessageData } from '@/hooks/useChats';

interface VoiceMessageProps {
  message: MessageData;
  isOwnMessage: boolean;
}

/**
 * Voice message playback component with waveform visualization
 */
export function VoiceMessage({ message, isOwnMessage }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get audio URL from message metadata or file_url
  const audioUrl = message.file_url || (message.file_metadata as any)?.url;

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    });

    // Generate waveform from metadata if available
    if (message.file_metadata && (message.file_metadata as any).waveform) {
      setWaveform((message.file_metadata as any).waveform);
    } else {
      // Generate placeholder waveform
      setWaveform(Array.from({ length: 50 }, () => Math.random() * 0.5 + 0.2));
    }

    return () => {
      audio.pause();
      audio.src = '';
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [audioUrl, message.file_metadata]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!audioUrl) {
    return (
      <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
        <Mic className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Voice message unavailable</span>
      </div>
    );
  }

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg
      ${isOwnMessage ? 'bg-white/10' : 'bg-secondary/50'}
      min-w-[200px] max-w-[300px]
    `}>
      {/* Play/Pause button */}
      <button
        onClick={togglePlayback}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${isOwnMessage ? 'bg-white/20 hover:bg-white/30' : 'bg-primary/20 hover:bg-primary/30'}
          transition-colors
        `}
      >
        {isPlaying ? (
          <Pause className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-primary'}`} />
        ) : (
          <Play className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-primary'}`} />
        )}
      </button>

      {/* Waveform and progress */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform visualization */}
        <div className="flex items-center gap-0.5 h-8">
          {waveform.map((height, i) => {
            const isActive = (i / waveform.length) * 100 < progress;
            return (
              <motion.div
                key={i}
                className={`w-1 rounded-full ${
                  isOwnMessage 
                    ? isActive ? 'bg-white' : 'bg-white/40'
                    : isActive ? 'bg-primary' : 'bg-primary/40'
                }`}
                animate={{
                  height: isActive 
                    ? `${height * 30 + 4}px`
                    : `${height * 20 + 4}px`,
                }}
                transition={{ duration: 0.1 }}
              />
            );
          })}
        </div>

        {/* Time display */}
        <div className={`flex items-center justify-between text-xs ${
          isOwnMessage ? 'text-white/70' : 'text-muted-foreground'
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
