import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Loader2, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageCropModal } from '@/components/ImageCropModal';
import StatusImageUpload from '@/components/StatusImageUpload';
import { sanitizeUsername, sanitizeText } from '@/utils/sanitize';
import { getUserFriendlyError } from '@/utils/errors';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [statusImageUrl, setStatusImageUrl] = useState(profile?.status_image_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create object URL and open crop modal
    const objectUrl = URL.createObjectURL(file);
    setSelectedImageSrc(objectUrl);
    setCropModalOpen(true);
    
    // Reset file input so the same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    // Show preview immediately
    const objectUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(objectUrl);

    setUploading(true);
    try {
      // Create unique filename
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      // Upload cropped image to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Add cache busting query parameter
      const avatarUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      setAvatarUrl(avatarUrlWithCacheBust);
      
      // Immediately update profile to reflect new avatar
      const { error: updateError } = await updateProfile({
        avatar_url: avatarUrlWithCacheBust
      });
      
      if (updateError) {
        console.error('Error updating profile with new avatar:', updateError);
        toast.error('Avatar uploaded but failed to update profile');
      } else {
        toast.success('Avatar uploaded!');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Clean up the selected image src
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc('');
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    // Sanitize inputs
    const sanitizedUsername = sanitizeUsername(username.trim());
    const sanitizedBio = bio.trim() ? sanitizeText(bio.trim()) : null;

    if (sanitizedUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({
      username: sanitizedUsername,
      bio: sanitizedBio,
      avatar_url: avatarUrl,
      status_image_url: statusImageUrl,
    });

    setSaving(false);

    if (error) {
      const friendlyError = getUserFriendlyError(error);
      toast.error(friendlyError);
    } else {
      toast.success('Profile updated!');
      navigate('/profile');
    }
  };

  const displayAvatar = previewUrl || avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;

  return (
    <ResponsiveLayout>
      <AppLayout>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile Header */}
          <motion.header 
            className="px-4 py-4 flex items-center gap-3 lg:hidden"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
          </motion.header>

          {/* Desktop Header */}
          <div className="hidden lg:block px-6 py-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-muted-foreground mt-1">Update your profile information</p>
          </div>

          <div className="px-4 lg:px-6 pb-8 py-6 max-w-2xl mx-auto w-full space-y-8">
            {/* Avatar Section */}
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative">
                <button
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="relative group"
                >
                  <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-primary/50">
                    {displayAvatar ? (
                      <img 
                        src={displayAvatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Tap to change avatar
              </p>
            </motion.div>

            {/* Image Crop Modal */}
            <ImageCropModal
              open={cropModalOpen}
              onOpenChange={setCropModalOpen}
              imageSrc={selectedImageSrc}
              onCropComplete={handleCropComplete}
              aspectRatio={1}
            />

            {/* Form Fields */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-secondary/50"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-secondary/30 opacity-60"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  className="bg-secondary/50 min-h-[100px] resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/200
                </p>
              </div>

              {/* Status Image */}
              <StatusImageUpload
                currentImageUrl={statusImageUrl}
                onImageUpdate={setStatusImageUrl}
                userId={user?.id || ''}
              />
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleSave}
                disabled={saving || uploading}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Profile
              </Button>
            </motion.div>
          </div>
        </div>
      </AppLayout>
    </ResponsiveLayout>
  );
}
