import { useState, useEffect, useCallback, useRef } from 'react'
import { buildCdnUrl, isVideoUrl } from '../../../../../shared/lib'
import { FALLBACK_IMAGE_URL } from '../../../../../shared/config'
import type { FeedPostImage } from '../../../../gallery/model/types'

// ─── Icons ──────────────────────────────────────────────

const MutedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
)

const UnmutedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)

// ─── Feed Video Player ──────────────────────────────────

const FeedVideoPlayer = ({ src, onVideoClick }: { src: string; onVideoClick: (url: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  return (
    <div className="relative w-full h-[360px] sm:h-[400px] cursor-pointer" onClick={() => onVideoClick(src)}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
      />
      <button
        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
        onClick={(e) => {
          e.stopPropagation()
          toggleMute()
        }}
        aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
      >
        {isMuted ? <MutedIcon /> : <UnmutedIcon />}
      </button>
    </div>
  )
}

// ─── Feed Image Carousel ────────────────────────────────

export const FeedImageCarousel = ({ images, onImageClick }: { images: FeedPostImage[]; onImageClick: (url: string) => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < images.length) setCurrentIndex(idx)
  }

  if (images.length === 0) return null

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, idx) => {
            const url = buildCdnUrl(image.filePath)
            const isVideo = isVideoUrl(url)

            return (
              <div key={image.fileId} className="w-full flex-shrink-0">
                {isVideo ? (
                  idx === currentIndex ? (
                    <FeedVideoPlayer src={url} onVideoClick={onImageClick} />
                  ) : (
                    <video
                      src={url}
                      className="w-full h-[360px] sm:h-[400px] object-cover cursor-pointer"
                      muted
                      preload="metadata"
                      onClick={() => onImageClick(url)}
                    />
                  )
                ) : (
                  <img
                    src={url}
                    alt={`사진 ${image.sortOrder}`}
                    className="w-full h-[360px] sm:h-[400px] object-cover cursor-pointer"
                    loading="lazy"
                    onClick={() => onImageClick(url)}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              aria-label="이전 사진"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              aria-label="다음 사진"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </>
      )}

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-[#3B5BDB]' : 'bg-[#D0D0D0]'
              }`}
              aria-label={`사진 ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
