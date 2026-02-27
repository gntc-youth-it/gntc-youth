import { useState, useEffect } from 'react'

interface ProfileImageProps {
  src: string | null | undefined
  alt?: string
  size?: number
  className?: string
  fallbackTestId?: string
}

export const ProfileImage = ({
  src,
  alt = '프로필',
  size = 32,
  className = '',
  fallbackTestId,
}: ProfileImageProps) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  const sizeStyle = { width: size, height: size }
  const iconSize = Math.round(size * 0.5)

  if (!src || hasError) {
    return (
      <div
        className={`rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ${className}`}
        style={sizeStyle}
        data-testid={fallbackTestId}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <line x1="5" y1="8" x2="19" y2="8" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={sizeStyle}
      onError={() => setHasError(true)}
    />
  )
}
