import { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StatusImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate: (imageUrl: string | null) => void;
  userId: string;
}

export default function StatusImageUpload({ 
  currentImageUrl, 
  onImageUpdate, 
  userId 
}: StatusImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return false;
    }

    // Check file size (max 5MB for status images)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadImage = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      // For now, just use the preview URL as a placeholder
      // In a real implementation, this would upload to Supabase storage
      onImageUpdate(preview);
      toast.success('Status image updated successfully');
      setPreview(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading status image:', error);
      toast.error('Failed to upload status image');
    } finally {
      setUploading(false);
    }
  };

  const removeStatusImage = async () => {
    setUploading(true);
    try {
      onImageUpdate(null);
      setPreview(null);
      toast.success('Status image removed');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing status image:', error);
      toast.error('Failed to remove status image');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Current/Preview Image */}
        <div className="relative">
          {(preview || currentImageUrl) ? (
            <img
              src={preview || currentImageUrl}
              alt="Status preview"
              className="h-16 w-auto max-w-32 object-cover rounded-lg border"
            />
          ) : (
            <div className="h-16 w-32 bg-secondary rounded-lg border flex items-center justify-center">
              <Camera className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
          
          <Button
            onClick={handleClick}
            disabled={uploading}
            variant="outline"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            {currentImageUrl ? 'Change' : 'Upload'} Status Image
          </Button>

          {(preview || currentImageUrl) && (
            <Button
              onClick={removeStatusImage}
              disabled={uploading}
              variant="destructive"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}

          {preview && (
            <Button
              onClick={uploadImage}
              disabled={uploading}
              size="sm"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
              ) : null}
              Save Status Image
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Upload an image to replace your status text. Max size: 5MB. Recommended aspect ratio: 3:1
      </p>
    </div>
  );
}
