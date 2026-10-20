import React, { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackInitials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  className = '',
  fallbackInitials,
  size = 'md',
}) => {
  const [errorCount, setErrorCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src || '');

  useEffect(() => {
    setCurrentSrc(src || '');
    setErrorCount(0);
  }, [src]);

  const handleError = () => {
    // If currentSrc is a drive thumbnail, try fallback to lh3.googleusercontent.com
    if (currentSrc.includes('drive.google.com/thumbnail?id=') && errorCount === 0) {
      const match = currentSrc.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        setErrorCount(1);
        setCurrentSrc(`https://lh3.googleusercontent.com/d/${match[1]}`);
        return;
      }
    }

    // Otherwise mark as failed
    setErrorCount((prev) => prev + 1);
  };

  const getInitials = () => {
    if (fallbackInitials) return fallbackInitials;
    if (!alt) return 'PR';
    const parts = alt.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return alt.substring(0, 2).toUpperCase();
  };

  const hasFailed = !currentSrc || errorCount >= 2 || (errorCount >= 1 && !currentSrc.includes('googleusercontent.com'));

  if (hasFailed) {
    return (
      <div
        className={`flex items-center justify-center font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 select-none ${className}`}
        title={alt}
      >
        <span>{getInitials()}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
};
