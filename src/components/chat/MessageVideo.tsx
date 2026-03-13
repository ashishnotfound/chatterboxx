import { useState } from 'react';
import { Download, Play, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageData } from '@/hooks/useChats';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MessageVideoProps {
  message: MessageData;
  isOwnMessage: boolean;
}

export default function MessageVideo({ message, isOwnMessage }: MessageVideoProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!message.video_url || videoError) {
    return null;
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(message.video_url!);
      if (!response.ok) {
        throw new Error('Failed to download video');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.video_metadata?.name || 'video.mp4';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="relative group">
        <div 
          className={`
            relative rounded-lg overflow-hidden cursor-pointer bg-secondary
            ${isOwnMessage ? 'max-w-[300px]' : 'max-w-[250px]'}
            ${isLoading ? 'animate-pulse' : ''}
          `}
          onClick={() => !isLoading && setIsFullscreen(true)}
        >
          {isLoading && (
            <div className="aspect-video flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          
          <video
            src={message.video_url}
            className={`w-full h-auto object-cover transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
            preload="metadata"
            style={{ display: isLoading ? 'none' : 'block' }}
          />
          
          {/* Error state */}
          {videoError && (
            <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground bg-secondary/50">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <span className="text-xs text-center">Failed to load video</span>
            </div>
          )}
          
          {/* Play overlay */}
          {!isLoading && !videoError && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(true);
                }}
                className="h-10 w-10 p-0 rounded-full"
              >
                <Play className="h-5 w-5 ml-0.5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Duration badge */}
          {message.video_metadata?.duration && !isLoading && !videoError && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {formatDuration(message.video_metadata.duration)}
            </div>
          )}
        </div>
        
        {/* File info */}
        {message.video_metadata && !isLoading && (
          <div className="mt-1 text-xs opacity-70">
            {message.video_metadata.name} • {(message.video_metadata.size / 1024 / 1024).toFixed(2)}MB
          </div>
        )}
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm">
              {message.video_metadata?.name || 'Shared video'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center p-4">
            {videoError ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <AlertTriangle className="w-16 h-16 mb-4" />
                <span>Failed to load video</span>
              </div>
            ) : (
              <video
                src={message.video_url}
                controls
                className="max-w-full max-h-full rounded-lg"
                autoPlay
              />
            )}
          </div>
          {!videoError && (
            <div className="p-4 pt-0 flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {message.video_metadata?.name} • {(message.video_metadata?.size / 1024 / 1024).toFixed(2)}MB
                {message.video_metadata?.duration && ` • ${formatDuration(message.video_metadata.duration)}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
