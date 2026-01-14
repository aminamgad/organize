'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openImage = (index: number) => {
    setSelectedIndex(index);
  };

  const closeImage = () => {
    setSelectedIndex(null);
  };

  const nextImage = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const previousImage = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') previousImage();
      if (e.key === 'Escape') closeImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative w-24 h-24 border rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openImage(index)}
          >
            <Image
              src={image}
              alt={title ? `${title} - ${index + 1}` : `Image ${index + 1}`}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={closeImage}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] p-0"
        >
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              {title ? `${title} - صورة ${(selectedIndex ?? 0) + 1} من ${images.length}` : `صورة ${(selectedIndex ?? 0) + 1} من ${images.length}`}
            </DialogTitle>
          </DialogHeader>
          {selectedIndex !== null && (
            <div className="relative">
              <div className="relative w-full h-[70vh] bg-black">
                <Image
                  src={images[selectedIndex]}
                  alt={title ? `${title} - ${selectedIndex + 1}` : `Image ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                />
              </div>
              {images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none"
                    onClick={previousImage}
                    disabled={selectedIndex === 0}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-none"
                    onClick={nextImage}
                    disabled={selectedIndex === images.length - 1}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

