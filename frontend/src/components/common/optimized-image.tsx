import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholder?: 'blur' | 'solid' | 'transparent';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string; // For responsive images
  srcSet?: string; // For responsive images
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  placeholder = 'transparent',
  priority = false,
  onLoad,
  onError,
  sizes,
  srcSet
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(priority);

  useEffect(() => {
    // Set up intersection observer for lazy loading if not priority
    if (!priority && imgRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.unobserve(imgRef.current!);
          }
        },
        { threshold: 0.1, rootMargin: '50px' }
      );

      observer.observe(imgRef.current);

      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    } else if (priority) {
      setIsIntersecting(true);
    }
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError();
  };

  // Determine the placeholder style based on the type
  const getPlaceholderStyle = () => {
    switch (placeholder) {
      case 'blur':
        return 'bg-muted animate-pulse';
      case 'solid':
        return 'bg-muted';
      case 'transparent':
      default:
        return 'bg-transparent';
    }
  };

  // Generate srcSet if not provided and we have dimensions
  const computedSrcSet = srcSet || (width && typeof width === 'number' ? 
    `${src} ${width}w, ${src.replace(/\?.*/, '')}?w=${width * 2} 2x` : 
    undefined);

  // Generate sizes if not provided and we have dimensions
  const computedSizes = sizes || (width ? 
    `(max-width: ${typeof width === 'number' ? width : '768'}px) 100vw, ${width}px` : 
    undefined);

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      style={{ width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto', height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto' }}
    >
      {isLoading && !hasError && (
        <div 
          className={cn("absolute inset-0 flex items-center justify-center", getPlaceholderStyle())}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-animated-gradient"></div>
        </div>
      )}
      
      {isIntersecting && !hasError && (
        <img
          ref={imgRef}
          src={src}
          srcSet={computedSrcSet}
          sizes={computedSizes}
          alt={alt}
          width={width as number | undefined}
          height={height as number | undefined}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
        />
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Image failed to load</span>
        </div>
      )}
    </div>
  );
};

export { OptimizedImage };