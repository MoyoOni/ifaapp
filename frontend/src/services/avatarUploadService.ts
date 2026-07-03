/**
 * Avatar Upload Service
 * Handles file validation, compression, and upload to backend
 */

export interface AvatarUploadOptions {
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export interface AvatarUploadResult {
  success: boolean;
  message: string;
  avatarUrl?: string;
  error?: string;
}

class AvatarUploadService {
  private static instance: AvatarUploadService;
  private readonly MAX_SIZE_MB = 5;
  private readonly ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly CROP_SIZE = 512; // Square crop for avatar

  private constructor() {}

  static getInstance(): AvatarUploadService {
    if (!AvatarUploadService.instance) {
      AvatarUploadService.instance = new AvatarUploadService();
    }
    return AvatarUploadService.instance;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: AvatarUploadOptions): { valid: boolean; error?: string } {
    const maxSize = (options?.maxSizeMB || this.MAX_SIZE_MB) * 1024 * 1024;
    const acceptedTypes = options?.acceptedTypes || this.ACCEPTED_TYPES;

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${options?.maxSizeMB || this.MAX_SIZE_MB}MB limit`,
      };
    }

    return { valid: true };
  }

  /**
   * Create a preview URL from file
   */
  createPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Crop image to square (1:1 ratio)
   * Returns canvas as blob for upload
   */
  cropImage(
    imageSrc: string,
    cropX: number,
    cropY: number,
    cropSize: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = this.CROP_SIZE;
        canvas.height = this.CROP_SIZE;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate scale to ensure we're cropping at native resolution
        const scale = img.naturalWidth / img.width;

        ctx.drawImage(
          img,
          cropX * scale,
          cropY * scale,
          cropSize * scale,
          cropSize * scale,
          0,
          0,
          this.CROP_SIZE,
          this.CROP_SIZE
        );

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to crop image'));
          },
          'image/webp',
          0.85 // quality 85% for good balance
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageSrc;
    });
  }

  /**
   * Upload avatar to backend
   * Assumes PATCH /users/:id endpoint with avatar field
   */
  async uploadAvatar(
    userId: string,
    file: File,
    options?: AvatarUploadOptions
  ): Promise<AvatarUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, options);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Validation failed',
          error: validation.error,
        };
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('avatar', file);

      // Track progress if callback provided
      const xhr = new XMLHttpRequest();

      return new Promise((resolve) => {
        if (options?.onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              options.onProgress?.(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                success: true,
                message: 'Avatar uploaded successfully',
                avatarUrl: response.avatar || response.avatarUrl,
              });
            } catch {
              resolve({
                success: true,
                message: 'Avatar uploaded successfully',
                avatarUrl: file.name,
              });
            }
          } else {
            resolve({
              success: false,
              message: 'Upload failed',
              error: `Server error: ${xhr.status}`,
            });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            message: 'Upload failed',
            error: 'Network error',
          });
        });

        xhr.open('PATCH', `/api/users/${userId}`, true);

        // Get auth token from localStorage (assuming it's stored there)
        const token = localStorage.getItem('auth_token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    } catch (error) {
      return {
        success: false,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user has already uploaded avatar
   */
  hasSkippedAvatar(userId: string): boolean {
    const key = `avatar-skip:${userId}`;
    const skipTime = localStorage.getItem(key);
    if (!skipTime) return false;

    const skipDate = new Date(skipTime);
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // Show reminder for 7 days
    return now.getTime() - skipDate.getTime() < sevenDaysMs;
  }

  /**
   * Mark avatar as skipped by user
   */
  markAvatarSkipped(userId: string): void {
    const key = `avatar-skip:${userId}`;
    localStorage.setItem(key, new Date().toISOString());
  }

  /**
   * Clear avatar skip flag
   */
  clearAvatarSkip(userId: string): void {
    const key = `avatar-skip:${userId}`;
    localStorage.removeItem(key);
  }
}

export const avatarUploadService = AvatarUploadService.getInstance();
