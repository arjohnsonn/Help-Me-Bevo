import { useEffect, useState, useRef } from "react";

interface MovingAnimatedImageProps {
  images: string[];
  idleImages?: string[];
  interval?: number;
  idleInterval?: number;
  className?: string;
  alt?: string;
  preload?: boolean;
  containerWidth?: number;
  speed?: number;
  stopChance?: number;
  idleTimeMin?: number;
  idleTimeMax?: number;
  directionChangeChance?: number;
  movementTickRate?: number;
}

export default function MovingAnimatedImage({
  images,
  idleImages,
  interval = 200,
  idleInterval = 500,
  className = "",
  alt = "Moving animated image",
  preload = true,
  containerWidth = 384, // Default popup width (96 * 4px = 384px)
  speed = 2, // pixels per movement tick
  stopChance = 0.02, // 2% chance per movement tick to stop
  idleTimeMin = 1000, // minimum idle time in ms
  idleTimeMax = 3000, // maximum idle time in ms
  directionChangeChance = 0.3, // 30% chance to change direction when resuming
  movementTickRate = 50, // movement tick interval in ms
}: MovingAnimatedImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isMoving, setIsMoving] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [manualControl, setManualControl] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const movementRef = useRef<NodeJS.Timeout | null>(null);
  const idleRef = useRef<NodeJS.Timeout | null>(null);
  const manualMovementRef = useRef<NodeJS.Timeout | null>(null);
  const manualTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const preloadedImages = useRef<HTMLImageElement[]>([]);

  const imageWidth = 84;

  useEffect(() => {
    if (preload) {
      const loadImages = async () => {
        const allImages = [...images, ...(idleImages || [])];
        const imagePromises = allImages.map((imageSrc) => {
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
  }, [images, idleImages, preload]);

  // Reset animation index when switching between idle and moving states
  useEffect(() => {
    setCurrentIndex(0);
  }, [isIdle]);

  // Animation cycling effect
  useEffect(() => {
    if (!isLoaded) return;

    const currentInterval = isIdle ? idleInterval : interval;
    const currentImages = isIdle && idleImages ? idleImages : images;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % currentImages.length);
    }, currentInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images, idleImages, interval, idleInterval, isLoaded, isMoving, isIdle, manualControl]);

  // Movement logic effect
  useEffect(() => {
    if (!isLoaded || manualControl) return;

    const moveAnimal = () => {
      if (isIdle) return;

      setPosition((prevPosition) => {
        let newPosition = prevPosition;

        if (direction === "right") {
          newPosition += speed;
          if (newPosition >= containerWidth - imageWidth) {
            newPosition = containerWidth - imageWidth;
            setDirection("left");
          }
        } else {
          newPosition -= speed;
          if (newPosition <= 0) {
            newPosition = 0;
            setDirection("right");
          }
        }

        return newPosition;
      });

      // Random chance to stop moving
      if (Math.random() < stopChance) {
        setIsMoving(false);
        setIsIdle(true);

        // Resume movement after random idle time
        const idleTime = Math.random() * (idleTimeMax - idleTimeMin) + idleTimeMin;
        idleRef.current = setTimeout(() => {
          setIsIdle(false);
          setIsMoving(true);

          // Random chance to change direction when resuming
          if (Math.random() < directionChangeChance) {
            setDirection((prev) => (prev === "left" ? "right" : "left"));
          }
        }, idleTime);
      }
    };

    if (isMoving && !isIdle) {
      movementRef.current = setInterval(moveAnimal, movementTickRate);
    }

    return () => {
      if (movementRef.current) {
        clearInterval(movementRef.current);
      }
    };
  }, [isLoaded, isMoving, isIdle, direction, containerWidth, imageWidth, speed, stopChance, idleTimeMin, idleTimeMax, directionChangeChance, movementTickRate, manualControl]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (!keysPressed.current.has('ArrowLeft')) {
            keysPressed.current.add('ArrowLeft');
            startManualMovement('left');
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (!keysPressed.current.has('ArrowRight')) {
            keysPressed.current.add('ArrowRight');
            startManualMovement('right');
          }
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        keysPressed.current.delete(event.key);
        stopManualMovement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startManualMovement = (newDirection: 'left' | 'right') => {
    // Clear existing timeouts
    if (manualTimeoutRef.current) {
      clearTimeout(manualTimeoutRef.current);
    }
    if (manualMovementRef.current) {
      clearInterval(manualMovementRef.current);
    }

    setManualControl(true);
    setDirection(newDirection);
    setIsMoving(true);
    setIsIdle(false);

    // Start continuous movement
    manualMovementRef.current = setInterval(() => {
      setPosition(prevPos => {
        const moveDistance = 4; // 4px per tick
        let newPos = newDirection === 'right' ? prevPos + moveDistance : prevPos - moveDistance;
        newPos = Math.max(0, Math.min(containerWidth - imageWidth, newPos));
        return newPos;
      });
    }, 30); // 30ms intervals for smooth movement
  };

  const stopManualMovement = () => {
    if (manualMovementRef.current) {
      clearInterval(manualMovementRef.current);
      manualMovementRef.current = null;
    }

    // Go to idle immediately when stopping manual movement
    setIsMoving(false);
    setIsIdle(true);
    setCurrentIndex(0); // Reset to first frame of idle animation

    // Wait 2 seconds before returning to auto movement
    manualTimeoutRef.current = setTimeout(() => {
      setManualControl(false);
      setIsMoving(true);
      setIsIdle(false);
    }, 2000);
  };


  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (idleRef.current) {
        clearTimeout(idleRef.current);
      }
      if (manualTimeoutRef.current) {
        clearTimeout(manualTimeoutRef.current);
      }
      if (manualMovementRef.current) {
        clearInterval(manualMovementRef.current);
      }
    };
  }, []);

  if (!isLoaded) return null;

  const currentImages = isIdle && idleImages ? idleImages : images;
  const safeIndex = Math.min(currentIndex, currentImages.length - 1);
  const imageSrc = currentImages[safeIndex];

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        position: "absolute",
        bottom: "8px",
        left: `${position}px`,
        transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)",
        transition: manualControl ? "none" : "left 0.05s linear",
        zIndex: 10,
      }}
    />
  );
}
