import { useEffect, useRef } from 'react'
import { isVideoUrl } from '../../../../../shared/lib'
import { FALLBACK_IMAGE_URL } from '../../../../../shared/config'

export const MediaLightbox = ({
  imageUrl,
  onClose,
}: {
  imageUrl: string
  onClose: () => void
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const isVideo = isVideoUrl(imageUrl)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isVideo ? '동영상 확대 보기' : '이미지 확대 보기'}
    >
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        aria-label="닫기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {isVideo ? (
        <video
          src={imageUrl}
          className="max-w-[95vw] max-h-[95vh] object-contain"
          controls
          autoPlay
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={imageUrl}
          alt="확대 사진"
          className="max-w-[95vw] max-h-[95vh] object-contain"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
          }}
        />
      )}
    </div>
  )
}
