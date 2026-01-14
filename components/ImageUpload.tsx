'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({
  images,
  onChange,
  maxImages = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxImages) {
        toast({
          title: 'خطأ',
          description: `لا يمكن رفع أكثر من ${maxImages} صورة`,
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);
      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || 'فشل رفع الصورة');
          }

          return result.data.url;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        onChange([...images, ...uploadedUrls]);

        toast({
          title: 'نجح',
          description: 'تم رفع الصور بنجاح',
        });
      } catch (error: any) {
        toast({
          title: 'خطأ',
          description: error.message || 'حدث خطأ أثناء رفع الصور',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    },
    [images, onChange, maxImages, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: true,
    disabled: uploading || images.length >= maxImages,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-gray-300 hover:border-primary/50'
        } ${uploading || images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">أسقط الصور هنا...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                اسحب وأسقط الصور هنا، أو انقر للاختيار
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG, GIF, WEBP (حد أقصى {maxImages} صورة)
              </p>
            </>
          )}
          {uploading && (
            <p className="text-sm text-primary">جاري الرفع...</p>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden border">
                <Image
                  src={image}
                  alt={`Uploaded ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 left-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

