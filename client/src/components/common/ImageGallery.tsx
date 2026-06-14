import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, goNext, goPrev]);

  if (!images || images.length === 0) {
    return (
      <div className={cn('flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8', className)}>
        <div className="text-center">
          <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3', className)}>
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-4xl p-0 bg-black/95 border-0"
          onClose={() => setLightboxOpen(false)}
        >
          <div className="relative flex items-center justify-center min-h-[300px] max-h-[80vh]">
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev */}
            {images.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <img
              src={images[activeIndex]}
              alt={`Photo ${activeIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain p-4"
            />

            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              {activeIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
