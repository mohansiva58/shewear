import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* 🔥 Width Reduced Here */}
      <div className="max-w-md w-full space-y-2">
        
        {/* Main Image */}
        <div className="relative aspect-[3/3.5] rounded-lg overflow-hidden bg-secondary group">
          <AnimatePresence mode="wait">
            {imageErrors.has(selectedIndex) ? (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Image not available</p>
              </div>
            ) : (
              <motion.img
                key={selectedIndex}
                src={images[selectedIndex]}
                alt={`${productName} - View ${selectedIndex + 1}`}
                className="w-full h-full object-cover cursor-zoom-in"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsZoomed(true)}
                onError={() => handleImageError(selectedIndex)}
              />
            )}
          </AnimatePresence>

          {/* Smaller Zoom Button */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn size={16} />
          </button>

          {/* Smaller Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* Smaller Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-14 h-16 rounded-md overflow-hidden border ${
                  selectedIndex === index
                    ? 'border-primary'
                    : 'border-transparent hover:border-primary/50'
                }`}
              >
                {imageErrors.has(index) ? (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-[9px]">
                    N/A
                  </div>
                ) : (
                  <img
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox (unchanged size intentionally) */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-3"
            onClick={() => setIsZoomed(false)}
          >
            <motion.img
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              src={images[selectedIndex]}
              alt={productName}
              className="max-w-full max-h-full object-contain cursor-zoom-out"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}