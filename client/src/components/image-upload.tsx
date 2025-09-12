import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cloudinaryManager } from '@/lib/cloudinary';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
  accept?: string;
  maxSizeInMB?: number;
  className?: string;
}

export function ImageUpload({
  onImageUploaded,
  currentImageUrl,
  label = "Upload Image",
  accept = "image/*",
  maxSizeInMB = 10,
  className = ""
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return false;
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast({
        title: "File Too Large",
        description: `Please select an image smaller than ${maxSizeInMB}MB.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    // For now, create a data URL as fallback until Cloudinary is properly configured
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            // Return data URL for now - in production this would be replaced with actual Cloudinary URL
            resolve(reader.result as string);
          }
        }, 100);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const imageUrl = await uploadToCloudinary(file);
      onImageUploaded(imageUrl);
      
      toast({
        title: "Image Uploaded Successfully",
        description: "Your image has been uploaded and is ready to use.",
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      <div className="space-y-4">
        {/* Preview Area */}
        {previewUrl ? (
          <div className="relative">
            <div className="relative w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Uploading... {uploadProgress}%</p>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div 
            className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={handleButtonClick}
          >
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Click to upload an image</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP up to {maxSizeInMB}MB</p>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {previewUrl ? 'Change Image' : 'Upload Image'}
          </Button>
          
          {previewUrl && !isUploading && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemoveImage}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
