import React, { useMemo } from 'react';

// Import digit images from datefont folder
// Note: Images are served from the sign/datefont folder via the backend
const DIGIT_IMAGES: Record<string, string> = {
  '0': '/sign/datefont/0.png',
  '1': '/sign/datefont/1.PNG',
  '2': '/sign/datefont/2.PNG',
  '3': '/sign/datefont/3.PNG',
  '4': '/sign/datefont/4.PNG',
  '5': '/sign/datefont/5.PNG',
  '6': '/sign/datefont/6.PNG',
  '7': '/sign/datefont/7.PNG',
  '8': '/sign/datefont/8.PNG',
  '9': '/sign/datefont/9.PNG',
  '.': '/sign/datefont/dot.png',
};

interface CustomDateRendererProps {
  date?: Date;
  className?: string;
  rotation?: number; // Slight rotation in degrees for handwritten effect
  height?: number; // Height in pixels for digit images
  dotScale?: number; // Scale factor for dot height relative to digits
}

/**
 * CustomDateRenderer - Renders a date using actual handwritten digit images
 * 
 * Format: M.D.YY (e.g., "1.15.26" for January 15, 2026)
 * Uses PNG images from sign/datefont folder for each digit
 */
export function CustomDateRenderer({ 
  date = new Date(), 
  className = '',
  rotation = -1,
  height = 24,
  dotScale = 0.55
}: CustomDateRendererProps) {
  // Format date as M.D.YY
  const formattedDate = useMemo(() => {
    const month = date.getMonth() + 1; // getMonth returns 0-11
    const day = date.getDate();
    const year = date.getFullYear() % 100; // Get last 2 digits of year
    return `${month}.${day}.${year}`;
  }, [date]);

  // Split date string into individual characters
  const characters = formattedDate.split('');

  // Random slight variations for more natural handwritten feel
  const getRandomOffset = () => (Math.random() - 0.5) * 2;
  const clampedDotScale = Math.max(0.3, Math.min(1, dotScale));

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ 
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {characters.map((char, index) => {
        const imageSrc = DIGIT_IMAGES[char];
        const isDot = char === '.';
        const scaledHeight = isDot ? height * clampedDotScale : height;
        const dotOffset = isDot ? height * 0.45 : 0;
        const jitter = isDot ? 0 : getRandomOffset();
        
        if (!imageSrc) {
          // Skip unknown characters
          return null;
        }

        return (
          <img
            key={`${char}-${index}`}
            src={imageSrc}
            alt={char}
            style={{
              height: `${scaledHeight}px`,
              width: 'auto',
              marginTop: `${jitter + dotOffset}px`,
              marginRight: isDot ? '0px' : '1px',
              // Slight random rotation for each character for authenticity
              transform: `rotate(${jitter * 0.5}deg)`,
            }}
            className="inline-block"
            onError={(e) => {
              // Fallback to text if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const span = document.createElement('span');
              span.textContent = char;
              span.style.fontFamily = 'Caveat, cursive';
              span.style.fontSize = `${scaledHeight * 1.2}px`;
              target.parentNode?.insertBefore(span, target);
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Helper to get date string in M.D.YY format
 */
export function formatDateNumeric(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear() % 100;
  return `${month}.${day}.${year}`;
}

export default CustomDateRenderer;
