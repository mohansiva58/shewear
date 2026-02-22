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

  // Debug: Log all images received
  console.log(`ProductGallery loaded with ${images.length} images for "${productName}"`);
  images.forEach((img, idx) => {
    console.log(`  Image ${idx + 1}: ${img}`);
  });

  const handleImageError = (index: number) => {
    console.error('Image failed to load at index:', index, 'URL:', images[index]);
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
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary group">
          <AnimatePresence mode="wait">
            {imageErrors.has(selectedIndex) ? (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Image not available</p>
                </div>
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
                transition={{ duration: 0.3 }}
                onClick={() => setIsZoomed(true)}
                onError={() => handleImageError(selectedIndex)}
              />
            )}
          </AnimatePresence>

          {/* Zoom Icon */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-4 right-4 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn size={20} />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedIndex === index
                    ? 'border-primary'
                    : 'border-transparent hover:border-primary/50'
                }`}
              >
                {imageErrors.has(index) ? (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-xs">
                    <span>N/A</span>
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

      {/* Lightbox */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={images[selectedIndex]}
              alt={productName}
              className="max-w-full max-h-full object-contain cursor-zoom-out"
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 text-foreground text-lg font-medium"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
