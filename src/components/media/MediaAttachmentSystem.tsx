import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Play, Pause, Volume2, VolumeX, Maximize2, RotateCw, Trash2, Image as ImageIcon, File, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  name?: string;
  size?: number;
  thumbnail?: string;
  duration?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

interface MediaAttachmentSystemProps {
  files: MediaFile[];
  onUpload: (files: File[]) => Promise<MediaFile[]>;
  onRemove: (fileId: string) => void;
  onPreview: (file: MediaFile) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

export function MediaAttachmentSystem({
  files,
  onUpload,
  onRemove,
  onPreview,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'video/*', 'application/pdf'],
  className
}: MediaAttachmentSystemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileSelect = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    // Validate files
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`);
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFiles = await onUpload(validFiles);
      // Files are added to the parent component state
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-secondary/30",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(Array.from(e.target.files))}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-muted-foreground">
              Images, videos, and documents up to {formatFileSize(maxSize)}
            </p>
          </div>
          
          {isUploading && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-primary">Uploading...</span>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <MediaItem
            key={file.id}
            file={file}
            onPreview={() => onPreview(file)}
            onRemove={() => onRemove(file.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Media Item
function MediaItem({ 
  file, 
  onPreview, 
  onRemove 
}: { 
  file: MediaFile;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group cursor-pointer"
    >
      <div className="aspect-square rounded-xl overflow-hidden bg-secondary/50 border border-border/30">
        {file.type === 'image' ? (
          <img
            src={file.thumbnail || file.url}
            alt={file.name || 'Image'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            onClick={onPreview}
          />
        ) : file.type === 'video' ? (
          <div className="relative w-full h-full" onClick={onPreview}>
            <img
              src={file.thumbnail || ''}
              alt={file.name || 'Video'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
            {file.duration && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {formatDuration(file.duration)}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center" onClick={onPreview}>
            <File className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground text-center px-2 line-clamp-2">
              {file.name || 'Document'}
            </span>
            {file.size && (
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {file.isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin mb-2" />
              <div className="text-white text-sm">
                {file.uploadProgress || 0}%
              </div>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {file.error && (
          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
            <div className="text-center text-white">
              <X className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">Upload failed</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* File Info */}
      {file.type !== 'image' && file.type !== 'video' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
          <p className="text-xs truncate">{file.name}</p>
          {file.size && (
            <p className="text-xs opacity-80">{formatFileSize(file.size)}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Full Screen Media Viewer
export function MediaViewer({
  files,
  initialIndex = 0,
  onClose
}: {
  files: MediaFile[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  const currentFile = files[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetVideoState();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetVideoState();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const rotateImage = () => {
    setRotation(prev => prev + 90);
  };

  const resetVideoState = () => {
    setIsPlaying(false);
    setIsMuted(false);
    setRotation(0);
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = currentFile.url;
    link.download = currentFile.name || `media.${currentFile.type === 'image' ? 'jpg' : 'mp4'}`;
    link.click();
  };

  const shareFile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentFile.name,
          url: currentFile.url
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(currentFile.url);
    }
  };

  if (!currentFile) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <p className="font-medium">{currentFile.name || `File ${currentIndex + 1}`}</p>
            <p className="text-sm opacity-80">
              {currentIndex + 1} / {files.length}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={downloadFile}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={shareFile}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Content */}
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        {currentFile.type === 'image' ? (
          <img
            src={currentFile.url}
            alt={currentFile.name}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
            draggable={false}
          />
        ) : currentFile.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentFile.url}
            className="max-w-full max-h-full object-contain"
            controls={false}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="text-center text-white p-8">
            <File className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">{currentFile.name}</p>
            {currentFile.size && (
              <p className="text-sm opacity-80">{formatFileSize(currentFile.size)}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {files.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RotateCw className="w-6 h-6 text-white rotate-180" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === files.length - 1}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RotateCw className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Media Controls */}
      {currentFile.type === 'image' && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          <button
            onClick={rotateImage}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RotateCw className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {currentFile.type === 'video' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

// Utility functions
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
