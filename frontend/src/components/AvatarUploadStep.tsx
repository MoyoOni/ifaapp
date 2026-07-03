import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import './AvatarUploadStep.css';

interface AvatarUploadStepProps {
  userId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const AvatarUploadStep: React.FC<AvatarUploadStepProps> = ({
  userId,
  onComplete,
  onSkip,
  showSkip = true,
}) => {
  const { isLoading, error, preview, progress, handleInputChange, triggerFilePicker, uploadAvatar, skipUpload, reset } = useAvatarUpload({
    userId,
  });

  const [mode, setMode] = useState<'select' | 'crop' | 'uploading'>('select');
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle image selection and move to crop mode
  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleInputChange(e);
      setMode('crop');
    }
  };

  // Update crop area based on mouse drag
  const handleCropDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !imageRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - cropArea.width / 2;
    const y = e.clientY - rect.top - cropArea.height / 2;

    // Constrain crop area within image bounds
    const maxX = rect.width - cropArea.width;
    const maxY = rect.height - cropArea.height;

    setCropArea({
      ...cropArea,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  // Handle crop confirmation
  const handleCropConfirm = async () => {
    if (selectedFile) {
      setMode('uploading');
      const result = await uploadAvatar(selectedFile);
      if (result && result.success) {
        onComplete?.();
      }
    }
  };

  // Handle skip
  const handleSkip = () => {
    skipUpload();
    onSkip?.();
  };

  // Handle reset/back
  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setMode('select');
  };

  return (
    <div className="avatar-upload-step">
      {mode === 'select' && (
        <div className="avatar-select">
          <div className="select-header">
            <h3 className="select-title">Add Your Photo</h3>
            <p className="select-subtitle">
              Let the community see your face (optional)
            </p>
          </div>

          <div className="upload-zone" onClick={triggerFilePicker}>
            <div className="upload-icon">
              <Camera size={48} />
            </div>
            <p className="upload-text">
              Tap to upload or take a photo
            </p>
            <p className="upload-hint">
              JPG, PNG or WebP • Max 5MB
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelected}
              className="hidden-input"
              capture="user"
            />
          </div>

          {error && (
            <div className="upload-error">
              <X size={16} />
              <span>{error}</span>
            </div>
          )}

          {showSkip && (
            <button
              type="button"
              onClick={handleSkip}
              className="skip-button"
            >
              Continue without photo
            </button>
          )}
        </div>
      )}

      {mode === 'crop' && preview && (
        <div className="avatar-crop">
          <div className="crop-header">
            <h3 className="crop-title">Crop Your Photo</h3>
            <p className="crop-subtitle">
              Position your photo just right
            </p>
          </div>

          <div
            className="crop-container"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleCropDrag}
          >
            <img
              ref={imageRef}
              src={preview}
              alt="Avatar preview"
              className="crop-image"
            />
            <div
              className="crop-area"
              style={{
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`,
              }}
            >
              <div className="crop-border" />
            </div>
          </div>

          <div className="crop-actions">
            <button
              type="button"
              onClick={handleReset}
              className="crop-button secondary"
            >
              <RotateCcw size={18} />
              Start Over
            </button>
            <button
              type="button"
              onClick={handleCropConfirm}
              className="crop-button primary"
            >
              <Check size={18} />
              Use This Photo
            </button>
          </div>
        </div>
      )}

      {mode === 'uploading' && (
        <div className="avatar-uploading">
          <div className="upload-header">
            <h3 className="upload-title">Uploading Your Photo</h3>
          </div>

          <div className="progress-container">
            <div className="progress-ring">
              <svg viewBox="0 0 80 80" className="progress-svg">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" 
                        strokeWidth="4" className="ring-bg" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor"
                        strokeWidth="4" strokeDasharray={`${(progress / 100) * 226.2} 226.2`}
                        strokeLinecap="round" className="ring-progress" />
              </svg>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
          </div>

          <p className="upload-status">
            {progress < 100 ? 'Uploading...' : 'Processing...'}
          </p>
        </div>
      )}
    </div>
  );
};
