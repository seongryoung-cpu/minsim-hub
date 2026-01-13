import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CandidateImageUploadProps {
  candidateId: string;
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
}

export function CandidateImageUpload({ candidateId, currentImageUrl, onImageUploaded }: CandidateImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    setIsUploading(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${candidateId}-${Date.now()}.${fileExt}`;
      const filePath = `candidates/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('candidate-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('candidate-images')
        .getPublicUrl(filePath);

      // Update candidate record
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ image_url: publicUrl })
        .eq('id', candidateId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      toast.success('이미지가 업로드되었습니다');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('이미지 업로드 실패');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('이미지를 삭제하시겠습니까?')) return;

    setIsUploading(true);

    try {
      // Update candidate record to remove image URL
      const { error } = await supabase
        .from('candidates')
        .update({ image_url: null })
        .eq('id', candidateId);

      if (error) throw error;

      setPreviewUrl(null);
      onImageUploaded('');
      toast.success('이미지가 삭제되었습니다');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('이미지 삭제 실패');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">후보자 이미지</label>
      
      {previewUrl ? (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border">
          <img
            src={previewUrl}
            alt="후보자 이미지"
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:opacity-90 disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-32 h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImageIcon size={24} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">이미지 업로드</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-1"
        >
          <Upload size={14} />
          이미지 변경
        </Button>
      )}
    </div>
  );
}
