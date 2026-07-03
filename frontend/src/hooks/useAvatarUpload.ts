import { useState, useCallback, useRef } from 'react';
import { avatarUploadService, AvatarUploadOptions, AvatarUploadResult } from '@/services/avatarUploadService';

interface UseAvatarUploadOptions extends AvatarUploadOptions {
  userId: string;
}

export const useAvatarUpload = (options: UseAvatarUploadOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<AvatarUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropData, setCropData] = useState<{
    x: number;
    y: number;
    size: number;
  } | null>(null);

  /**
   * Handle file selection from input
   */
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setUploadResult(null);

    // Validate file
    const validation = avatarUploadService.validateFile(file, options);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      // Create preview
      const previewUrl = await avatarUploadService.createPreview(file);
      setPreview(previewUrl);
    } catch (err) {
      setError('Failed to load image preview');
    }
  }, [options]);

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  /**
   * Trigger file picker
   */
  const triggerFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Set crop coordinates from crop modal
   */
  const setCrop = useCallback((x: number, y: number, size: number) => {
    setCropData({ x, y, size });
  }, []);

  /**
   * Upload avatar after crop confirmation
   */
  const uploadAvatar = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      let fileToUpload = file;

      // If crop data exists, crop the image
      if (preview && cropData) {
        const croppedBlob = await avatarUploadService.cropImage(
          preview,
          cropData.x,
          cropData.y,
          cropData.size
        );
        fileToUpload = new File([croppedBlob], file.name, {
          type: 'image/webp',
        });
      }

      // Upload to backend
      const result = await avatarUploadService.uploadAvatar(
        options.userId,
        fileToUpload,
        {
          ...options,
          onProgress: setProgress,
        }
      );

      setUploadResult(result);

      if (result.success) {
        // Clear skip flag on successful upload
        avatarUploadService.clearAvatarSkip(options.userId);
        setPreview(null);
        setCropData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.error || 'Upload failed');
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      setUploadResult({
        success: false,
        message: 'Upload failed',
        error: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [preview, cropData, options]);

  /**
   * Skip avatar upload for now
   */
  const skipUpload = useCallback(() => {
    avatarUploadService.markAvatarSkipped(options.userId);
    setPreview(null);
    setCropData(null);
    setError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [options.userId]);

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    setPreview(null);
    setCropData(null);
    setError(null);
    setProgress(0);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    isLoading,
    error,
    preview,
    progress,
    uploadResult,
    fileInputRef,
    cropData,
    handleFileSelect,
    handleInputChange,
    triggerFilePicker,
    setCrop,
    uploadAvatar,
    skipUpload,
    reset,
  };
};
