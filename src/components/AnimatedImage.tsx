import { useEffect, useState, useRef } from "react";

interface AnimatedImageProps {
  images: string[];
  interval?: number;
  delay?: number;
  className?: string;
  alt?: string;
  preload?: boolean;
}

export default function AnimatedImage({
  images,
  interval = 100,
  delay = 0,
  className = "",
  alt = "Animated image",
  preload = true,
}: AnimatedImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDelaying, setIsDelaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const delayRef = useRef<NodeJS.Timeout | null>(null);
  const preloadedImages = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    if (preload) {
      const loadImages = async () => {
        const imagePromises = images.map((imageSrc) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = imageSrc;
          });
        });

        try {
          preloadedImages.current = await Promise.all(imagePromises);
          setIsLoaded(true);
        } catch (error) {
          console.error("Failed to preload images:", error);
          setIsLoaded(true);
        }
      };

      loadImages();
    } else {
      setIsLoaded(true);
    }
  }, [images, preload]);

  useEffect(() => {
    if (!isLoaded || isDelaying) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= images.length) {
          // Reset to first frame after completing the cycle
          const firstFrame = 0;
          // If there's a delay, pause on frame 1
          if (delay > 0) {
            setIsDelaying(true);
            delayRef.current = setTimeout(() => {
              setIsDelaying(false);
            }, delay);
          }
          return firstFrame;
        }
        return nextIndex;
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images.length, interval, delay, isLoaded, isDelaying]);

  // Cleanup delay timeout on unmount
  useEffect(() => {
    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
      }
    };
  }, []);

  const imageSrc = images[currentIndex];

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{ display: isLoaded ? "block" : "none" }}
    />
  );
}
