import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useChatWallpaper } from '@/hooks/useChatWallpaper';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ChatWallpaperSettings() {
  const {
    wallpaperUrl,
    isUploading,
    isLoading,
    error,
    uploadWallpaper,
    setLocalWallpaper,
    removeWallpaper,
  } = useChatWallpaper();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Use local wallpaper setting instead of upload
      await setLocalWallpaper(file);
      toast.success('Wallpaper updated locally!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set wallpaper');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveWallpaper = async () => {
    try {
      await removeWallpaper();
      toast.success('Wallpaper removed successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove wallpaper');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-2">Chat Wallpaper</h3>
        <p className="text-sm text-muted-foreground">
          Customize your chat background with a personal image.
          <br />
          <span className="text-xs opacity-70">Images are stored locally on your device.</span>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
        >
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Current Wallpaper Preview */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Current Wallpaper</label>
        <div className="relative">
          {isLoading ? (
            <div className="w-full h-48 bg-muted rounded-lg animate-pulse flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : wallpaperUrl ? (
            <div className="relative group overflow-hidden rounded-lg">
              <img
                src={wallpaperUrl}
                alt="Chat wallpaper"
                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  console.error('Wallpaper failed to load:', e);
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemoveWallpaper}
                disabled={isUploading}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No wallpaper set</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Controls */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Select Image</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose from Gallery
                </>
              )}
            </Button>

            {wallpaperUrl && (
              <Button
                variant="outline"
                onClick={handleRemoveWallpaper}
                disabled={isUploading}
              >
                Remove Wallpaper
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG or PNG. Images are compressed and stored locally.
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </motion.div>
  );
}
