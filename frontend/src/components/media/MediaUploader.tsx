'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api';

export interface MediaUploadResult {
  url: string;
  public_id: string;
  assetId?: string;
  user?: any;
}

export interface MediaUploaderProps {
  type?: 'image' | 'document';
  purpose?: string;
  value?: string | null;
  onUpload?: (result: MediaUploadResult) => void;
  onRemove?: () => void;
  disabled?: boolean;
  maxSizeMB?: number;
  aspectRatio?: 'square' | 'cover' | 'video' | 'any';
  label?: string;
  helperText?: string;
  uploadEndpoint?: string;
  className?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function MediaUploader({
  type = 'image',
  purpose = 'profile',
  value = null,
  onUpload,
  onRemove,
  disabled = false,
  maxSizeMB = 5,
  aspectRatio = 'square',
  label = 'Profile Photo',
  helperText = 'JPG, PNG or WebP up to 5MB. Square photo recommended.',
  uploadEndpoint,
  className = '',
}: MediaUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal preview if external value changes
  React.useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  const validateFile = (file: File): string | null => {
    if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Invalid format (${file.type || 'unknown'}). Please choose a JPG, PNG, or WebP image.`;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of ${maxSizeMB}MB.`;
    }

    if (file.size === 0) {
      return 'The selected file is empty. Please choose a valid image.';
    }

    return null;
  };

  const handleProcessFile = async (file: File) => {
    setError(null);
    setSuccessMessage(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Local instant preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Dedicated avatar endpoint if purpose is 'profile' and no custom endpoint given
      const endpoint = uploadEndpoint || (purpose === 'profile' ? '/media/profile/avatar' : '/media/upload');
      if (!uploadEndpoint && purpose !== 'profile') {
        formData.append('purpose', purpose);
      }

      const res = await ApiClient.upload<any>(endpoint, formData);

      // Depending on whether it's the avatar endpoint (returns User) or /media/upload (returns MediaUploadResponse)
      let uploadedUrl = '';
      let publicId = '';
      let assetId: string | undefined = undefined;

      if (res.avatar_url) {
        uploadedUrl = res.avatar_url;
        publicId = res.avatar_public_id || '';
      } else if (res.url) {
        uploadedUrl = res.url;
        publicId = res.public_id;
        assetId = res.asset?.id;
      }

      setPreviewUrl(uploadedUrl || localUrl);
      setSuccessMessage('Image uploaded and synced successfully.');

      if (onUpload) {
        onUpload({
          url: uploadedUrl,
          public_id: publicId,
          assetId,
          user: res.avatar_url ? res : undefined,
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      // Revert preview to previous value if upload failed
      setPreviewUrl(value);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleTriggerSelect = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleRemove = async () => {
    if (disabled || uploading) return;
    setError(null);
    setSuccessMessage(null);

    if (onRemove) {
      onRemove();
    }
  };

  // Preview container style based on aspect ratio
  const previewAspectClasses =
    aspectRatio === 'square'
      ? 'h-24 w-24 sm:h-28 sm:w-28 rounded-full'
      : aspectRatio === 'cover'
      ? 'h-36 w-full max-w-sm rounded-xl'
      : 'h-28 w-28 rounded-xl';

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-800 tracking-tight">
            {label}
          </label>
          <span className="text-[11px] text-slate-400 font-medium">Max {maxSizeMB}MB</span>
        </div>
      )}

      {/* Upload Zone / Preview Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 sm:p-5 transition-all duration-200 ${
          isDragging
            ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
            : 'border-slate-200 bg-white hover:border-slate-300'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
          aria-label={label}
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar / Image Preview Display */}
          <div className="relative shrink-0 group">
            <div
              className={`${previewAspectClasses} bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs transition-transform duration-200`}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-slate-400 flex flex-col items-center justify-center p-2">
                  <ImageIcon className="h-8 w-8 text-slate-300 mb-1" />
                  <span className="text-[10px] font-medium text-slate-400">No Image</span>
                </div>
              )}
            </div>

            {/* Uploading Spinner Overlay */}
            {uploading && (
              <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white ${
                  aspectRatio === 'square' ? 'rounded-full' : 'rounded-xl'
                }`}
              >
                <Loader2 className="h-6 w-6 animate-spin text-teal-400 mb-1" />
                <span className="text-[10px] font-medium tracking-tight">Uploading</span>
              </div>
            )}
          </div>

          {/* Controls & Actions */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {previewUrl ? 'Change or update photo' : 'Upload an image'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTriggerSelect}
                disabled={disabled || uploading}
                className="text-xs h-8 px-3 border-slate-200 hover:border-teal-600 hover:text-teal-700 bg-white"
              >
                {previewUrl ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    Replace Image
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
                    Select Image
                  </>
                )}
              </Button>

              {previewUrl && onRemove && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  className="text-xs h-8 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Remove
                </Button>
              )}
            </div>

            <p className="text-[10px] text-slate-400">
              Drag and drop an image file here or click the button above.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5"
            aria-label="Dismiss success message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 p-0.5"
            aria-label="Dismiss error message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
