import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, X, Loader2, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditSheet({ isOpen, onClose }: ProfileEditSheetProps) {
  const { user, profile, refreshProfile } = useAuthContext();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('파일 크기는 2MB 이하여야 합니다');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      // Path format: {user_id}/{filename} to match RLS policy
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('이미지가 업로드되었습니다');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('이미지 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate display name
    const trimmedName = displayName.trim();
    if (trimmedName.length > 20) {
      toast.error('닉네임은 20자 이하여야 합니다');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: trimmedName || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('프로필이 저장되었습니다');
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('프로필 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Reset state when sheet opens
  const handleSheetOpen = () => {
    setDisplayName(profile?.display_name || '');
    setAvatarUrl(profile?.avatar_url || '');
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl" onOpenAutoFocus={handleSheetOpen}>
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">프로필 편집</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="프로필" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={40} className="text-primary" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                  ) : (
                    <Camera size={24} className="text-white" />
                  )}
                </div>
              </motion.button>

              {/* Camera Badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Camera size={14} className="text-primary-foreground" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <p className="text-xs text-muted-foreground mt-3">
              탭하여 이미지 변경 (최대 2MB)
            </p>
          </div>

          {/* Display Name Input */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium">
              닉네임
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground text-right">
              {displayName.length}/20
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              이메일
            </Label>
            <div className="h-12 px-3 flex items-center bg-secondary/50 rounded-md">
              <span className="text-sm text-muted-foreground">
                {user?.email || '이메일 없음'}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="w-full h-12 text-base font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                저장 중...
              </>
            ) : (
              <>
                <Check size={18} className="mr-2" />
                저장하기
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
