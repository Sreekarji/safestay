import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import ImageWithFallback from './ImageWithFallback';

interface Image {
  url: string;
  publicId?: string;
}

interface ImageGalleryProps {
  images?: Image[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images = [] }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Evidence Photos (0)</h3>
        <ImageWithFallback 
          src={null} 
          alt="No evidence provided" 
          fallbackMessage="No evidence photos attached"
          className="w-full h-48 object-cover rounded-lg border-2 border-dashed border-gray-200"
        />
      </div>
    );
  }

  return (
    <div className="image-gallery-container">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Evidence Photos ({images.length})</h3>
        <div className="gallery-grid">
          {images.map((image, index) => (
            <div
              key={index}
              className="gallery-item cursor-pointer"
              onClick={() => setSelectedImageIndex(index)}
            >
              <ImageWithFallback
                src={image.url}
                alt={`Evidence ${index + 1}`}
                className="gallery-image w-full h-24 object-cover rounded-md"
              />
              <div className="gallery-overlay">
                <span className="view-text">View</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && (
        <div className="lightbox-modal fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={() => setSelectedImageIndex(null)}>
          <div className="lightbox-content relative max-w-4xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close absolute top-0 right-0 m-4 text-white text-2xl"
              onClick={() => setSelectedImageIndex(null)}
            >
              <FiX />
            </button>
            
            <ImageWithFallback
              src={images[selectedImageIndex].url}
              alt={`Evidence ${selectedImageIndex + 1}`}
              className="lightbox-image max-h-[80vh] w-auto mx-auto object-contain"
            />
            
            <div className="lightbox-nav mt-4 flex items-center justify-center gap-6 text-white">
              <button
                className="lightbox-prev p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
                onClick={() => setSelectedImageIndex(prev => 
                  prev === 0 ? images.length - 1 : (prev ?? 0) - 1
                )}
              >
                ←
              </button>
              <span className="lightbox-counter font-medium">
                {selectedImageIndex + 1} / {images.length}
              </span>
              <button
                className="lightbox-next p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
                onClick={() => setSelectedImageIndex(prev => 
                  prev === images.length - 1 ? 0 : (prev ?? -1) + 1
                )}
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
