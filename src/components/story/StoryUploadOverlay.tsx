import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, FileVideo, Type, Clock, Upload } from 'lucide-react';

interface StoryUploadOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (storyData: StoryUploadData) => void;
}

export interface StoryUploadData {
  file: File;
  caption?: string;
  emoji?: string;
}

const DURATION_OPTIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 6, label: '6 hours' },
  { hours: 12, label: '12 hours' },
  { hours: 24, label: '24 hours' }
];

export function StoryUploadOverlay({ isOpen, onClose, onUpload }: StoryUploadOverlayProps) {
  const [storyType, setStoryType] = useState<'image' | 'video' | 'text'>('image');
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState(24);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when overlay closes
      setStoryType('image');
      setCaption('');
      setDuration(24);
      setSelectedFile(null);
      setPreview(null);
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setPreview('video');
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    const storyData: StoryUploadData = {
      file: selectedFile,
      caption: caption || undefined,
    };
    
    onUpload(storyData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-background rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Create Story</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="space-y-4">
                  {preview === 'video' ? (
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <FileVideo className="w-8 h-8 text-primary" />
                    </div>
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-w-xs mx-auto rounded-lg"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {selectedFile?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Choose photo or video</p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG, MP4 (max 10MB image, 50MB video)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to your story..."
                className="w-full px-3 py-2 border border-border rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {caption.length}/200
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Share Story
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
