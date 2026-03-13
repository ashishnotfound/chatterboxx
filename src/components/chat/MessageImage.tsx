import { useState } from 'react';
import { X, Download, ZoomIn, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageData } from '@/hooks/useChats';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MessageImageProps {
  message: MessageData;
  isOwnMessage: boolean;
}

export default function MessageImage({ message, isOwnMessage }: MessageImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!message.image_url || imageError) {
    return null;
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(message.image_url!);
      if (!response.ok) {
        throw new Error('Failed to download image');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.image_metadata?.name || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      // You could show a toast error here if needed
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <>
      <div className="relative group">
        <div 
          className={`
            relative rounded-lg overflow-hidden cursor-pointer
            ${isOwnMessage ? 'max-w-[300px]' : 'max-w-[250px]'}
            ${isLoading ? 'bg-secondary animate-pulse' : ''}
          `}
          onClick={() => !isLoading && setIsFullscreen(true)}
        >
          {isLoading && (
            <div className="aspect-square flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          
          <img
            src={message.image_url}
            alt={message.image_metadata?.name || 'Shared image'}
            className={`w-full h-auto object-cover transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            style={{ display: isLoading ? 'none' : 'block' }}
          />
          
          {/* Error state */}
          {imageError && (
            <div className="aspect-square flex flex-col items-center justify-center text-muted-foreground bg-secondary/50">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <span className="text-xs text-center">Failed to load image</span>
            </div>
          )}
          
          {/* Overlay with actions */}
          {!isLoading && !imageError && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(true);
                }}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* File info */}
        {message.image_metadata && !isLoading && (
          <div className="mt-1 text-xs opacity-70">
            {message.image_metadata.name}
            {message.image_metadata.size && ` • ${(message.image_metadata.size / 1024).toFixed(1)}KB`}
          </div>
        )}
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm">
              {message.image_metadata?.name || 'Shared image'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center p-4">
            {imageError ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <AlertTriangle className="w-16 h-16 mb-4" />
                <span>Failed to load image</span>
              </div>
            ) : (
              <img
                src={message.image_url}
                alt={message.image_metadata?.name || 'Shared image'}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
          {!imageError && (
            <div className="p-4 pt-0 flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {message.image_metadata?.name}
                {message.image_metadata?.size && ` • ${(message.image_metadata.size / 1024).toFixed(1)}KB`}
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
