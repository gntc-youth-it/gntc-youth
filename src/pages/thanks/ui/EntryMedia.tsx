import { useEffect, useRef } from 'react'
import { cn, handleImageError } from '../../../shared/lib'
import { toMediaSrc } from '../lib/mediaSrc'
import type { ThanksMedia } from '../model/types'

interface EntryMediaProps {
  media: Pick<ThanksMedia, 'url' | 'type'>
  // cover: 카드를 꽉 채운다 / contain: 원래 비율 그대로
  fit?: 'cover' | 'contain'
  muted?: boolean
  className?: string
}

// 영상은 화면에 보일 때만 소리 없이 반복 재생한다. 한 화면에 영상이 여러 개여도 데이터를 덜 쓴다
export const EntryMedia = ({ media, fit = 'cover', muted = true, className }: EntryMediaProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          Promise.resolve(video.play()).catch(() => undefined)
        } else {
          video.pause()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [media.url])

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain'

  if (media.type === 'VIDEO') {
    return (
      <video
        ref={videoRef}
        src={toMediaSrc(media.url)}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className={cn('h-full w-full', fitClass, className)}
      />
    )
  }

  return (
    <img
      src={toMediaSrc(media.url)}
      alt=""
      loading="lazy"
      decoding="async"
      onError={handleImageError}
      className={cn('h-full w-full', fitClass, className)}
    />
  )
}
