import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Video, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaUploadProps {
  onMediaSelect: (file: File, preview: string, type: 'image' | 'video' | 'file') => void;
  onMediaRemove: () => void;
  selectedMedia?: { file: File; preview: string; type: 'image' | 'video' | 'file' } | null;
  maxSize?: number; // in bytes
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function MediaUpload({
  onMediaSelect,
  onMediaRemove,
  selectedMedia,
  maxSize
}: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'file'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedTypes = (type: 'image' | 'video' | 'file'): string[] => {
    switch (type) {
      case 'image':
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      case 'video':
        return ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      case 'file':
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'];
      default:
        return [];
    }
  };

  const getMaxSize = (type: 'image' | 'video' | 'file'): number => {
    if (maxSize) return maxSize;
    switch (type) {
      case 'image':
        return MAX_IMAGE_SIZE;
      case 'video':
        return MAX_VIDEO_SIZE;
      case 'file':
        return MAX_FILE_SIZE;
      default:
        return MAX_IMAGE_SIZE;
    }
  };

  const validateFile = (file: File, type: 'image' | 'video' | 'file'): boolean => {
    const acceptedTypes = getAcceptedTypes(type);
    const maxFileSize = getMaxSize(type);

    if (!acceptedTypes.includes(file.type)) {
      const typeNames = {
        image: 'JPEG, PNG, GIF, or WebP images',
        video: 'MP4, WebM, OGG, or QuickTime videos',
        file: 'PDF, DOC, DOCX, TXT, or ZIP files'
      };
      toast.error(`Invalid file type. Please upload ${typeNames[type]}.`);
      return false;
    }

    if (file.size > maxFileSize) {
      toast.error(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return false;
    }

    return true;
  };

  const handleFile = (file: File, type: 'image' | 'video' | 'file') => {
    if (!validateFile(file, type)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onMediaSelect(file, preview, type);
    };
    
    if (type === 'image') {
      reader.readAsDataURL(file);
    } else if (type === 'video') {
      reader.readAsDataURL(file);
    } else {
      // For files, we don't need a preview, just use a placeholder
      onMediaSelect(file, '', type);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file, activeTab);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Try to detect file type
      let detectedType: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        detectedType = 'image';
      } else if (file.type.startsWith('video/')) {
        detectedType = 'video';
      }
      handleFile(file, detectedType);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onMediaRemove();
  };

  if (selectedMedia) {
    return (
      <div className="relative inline-block">
        <div className="relative group">
          {selectedMedia.type === 'image' ? (
            <img
              src={selectedMedia.preview}
              alt="Selected image"
              className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border"
            />
          ) : selectedMedia.type === 'video' ? (
            <video
              src={selectedMedia.preview}
              className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border"
              controls={false}
            />
          ) : (
            <div className="max-w-[200px] p-4 rounded-lg border border-border bg-secondary flex flex-col items-center gap-2">
              <FileIcon className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate w-full text-center">
                {selectedMedia.file.name}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {selectedMedia.file.name} ({(selectedMedia.file.size / 1024).toFixed(1)}KB)
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'image' | 'video' | 'file')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image">
            <ImageIcon className="w-4 h-4 mr-2" />
            Image
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="w-4 h-4 mr-2" />
            Video
          </TabsTrigger>
          <TabsTrigger value="file">
            <FileIcon className="w-4 h-4 mr-2" />
            File
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptedTypes(activeTab).join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
          
          <div
            className={`
              border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
              ${dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  {activeTab === 'image' && <ImageIcon className="w-8 h-8 text-muted-foreground" />}
                  {activeTab === 'video' && <Video className="w-8 h-8 text-muted-foreground" />}
                  {activeTab === 'file' && <FileIcon className="w-8 h-8 text-muted-foreground" />}
                </>
              )}
              <div className="text-sm">
                {uploading ? (
                  <span className="text-muted-foreground">Uploading...</span>
                ) : (
                  <>
                    <span className="text-foreground font-medium">Click to upload</span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {activeTab === 'image' && `PNG, JPG, GIF up to ${Math.round(getMaxSize('image') / 1024 / 1024)}MB`}
                {activeTab === 'video' && `MP4, WebM up to ${Math.round(getMaxSize('video') / 1024 / 1024)}MB`}
                {activeTab === 'file' && `PDF, DOC, TXT, ZIP up to ${Math.round(getMaxSize('file') / 1024 / 1024)}MB`}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
