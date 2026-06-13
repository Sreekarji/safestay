import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILES = 5;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({ value = [], onChange, maxFiles = MAX_FILES, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const fileIdCounter = useRef(0);

  const remaining = maxFiles - value.length;

  const uploadFile = async (file: File): Promise<string> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.error || 'Upload failed');
    }

    const data = await res.json();
    return data.url || data.data?.url || data.secure_url || data.data?.secure_url;
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      const filesToUpload = acceptedFiles.slice(0, remaining);
      if (filesToUpload.length === 0) return;

      const oversized = filesToUpload.filter((f) => f.size > MAX_SIZE_BYTES);
      if (oversized.length > 0) {
        setError(`${oversized.length} file(s) exceed ${MAX_SIZE_MB}MB limit`);
        return;
      }

      const newUploading: Record<number, boolean> = {};
      const startIndex = value.length;
      filesToUpload.forEach((_, i) => {
        newUploading[startIndex + i] = true;
      });
      setUploading((prev) => ({ ...prev, ...newUploading }));

      const newUrls = [...value];

      for (let i = 0; i < filesToUpload.length; i++) {
        const idx = startIndex + i;
        try {
          const url = await uploadFile(filesToUpload[i]);
          newUrls.push(url);
          onChange(newUrls);
        } catch (err: any) {
          setError(err.message || 'Upload failed');
        } finally {
          setUploading((prev) => {
            const next = { ...prev };
            delete next[idx];
            return next;
          });
        }
      }
    },
    [value, onChange, remaining]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: remaining,
    disabled: remaining <= 0,
  });

  const removeImage = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {value.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img src={url} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Uploading placeholders */}
          {Object.keys(uploading).map((key) => (
            <div key={`uploading-${key}`} className="aspect-square rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {remaining > 0 && (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn('h-8 w-8 mb-2', isDragActive ? 'text-primary-500' : 'text-slate-400')} />
          <p className="text-sm font-medium text-slate-600">
            {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to browse'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {remaining} image{remaining !== 1 ? 's' : ''} remaining &middot; Max {MAX_SIZE_MB}MB each
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
