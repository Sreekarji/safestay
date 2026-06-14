import React, { useState, useRef, useEffect } from 'react';
import { FiUploadCloud, FiX, FiLoader } from 'react-icons/fi';

interface Image {
  url: string;
  publicId: string;
}

interface ImageUploadProps {
  onImagesChange: (images: Image[]) => void;
  uploadedImages?: Image[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesChange, uploadedImages = [] }) => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [images, setImages] = useState<Image[]>(uploadedImages);

  // Sync internal state with prop changes (important for edit modal)
  useEffect(() => {
    setImages(uploadedImages);
  }, [uploadedImages]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    // Validate file types and size
    const validFiles: File[] = [];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowedMimes.includes(file.type)) {
        setUploadError('Only JPEG, PNG, GIF, and WebP images are allowed');
        continue;
      }
      if (file.size > maxSize) {
        setUploadError('File size must be less than 5MB');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Check if adding these files would exceed 5 image limit
    if (images.length + validFiles.length > 5) {
      setUploadError('Maximum 5 images allowed per report');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('images', file);
      });

      const token = localStorage.getItem('token');
     
      const response = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();

      // Server returns: { success: true, data: { images: string[], publicIds: string[] } }
      const imageUrls = data.data?.images || (Array.isArray(data.data) ? data.data : null);
      const publicIds = data.data?.publicIds || [];

      if (!imageUrls || !Array.isArray(imageUrls)) {
        throw new Error('Invalid response format from server');
      }

      const newImages = imageUrls.map((url: string, i: number) => ({
        url,
        publicId: publicIds[i] || `upload-${Date.now()}-${i}`,
      }));
     
      
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error('[ImageUpload] Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (publicId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/upload/${publicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      const updatedImages = images.filter(img => img.publicId !== publicId);
      setImages(updatedImages);
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Delete error:', error);
      setUploadError('Failed to delete image');
    }
  };

  return (
    <div className="image-upload-container">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Evidence Photos <span className="text-gray-500 text-xs">(Max 5 images)</span>
        </label>
        
        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            {isUploading ? (
              <div className="upload-spinner">
                <FiLoader className="spinner-icon" />
                <p>Uploading {Math.max(0, 5 - images.length)} image(s)...</p>
              </div>
            ) : (
              <>
                <FiUploadCloud className="upload-icon" />
                <p className="upload-text">Drag and drop images here</p>
                <p className="upload-subtext">or</p>
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Images
                </button>
                <p className="upload-hint">
                  Supported formats: JPEG, PNG, GIF, WebP (Max 5MB each)
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </div>

        {uploadError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {uploadError}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Uploaded Images ({images.length}/5)
            </p>
            <div className="image-preview-grid">
              {images.map((image, index) => (
                <div key={index} className="image-preview-item">
                  <img
                    src={image.url}
                    alt={`Preview ${index + 1}`}
                    className="preview-image"
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(image.publicId)}
                    title="Remove image"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
