import { FALLBACK_IMAGE_URL } from '../../../shared/config'

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm']

const isVideoUrl = (url: string): boolean => {
  const pathname = url.split('?')[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))
}

interface ChurchMediaProps {
  mediaUrl: string
  churchName: string
  className?: string
}

export const ChurchMedia = ({ mediaUrl, churchName, className }: ChurchMediaProps) => {
  if (isVideoUrl(mediaUrl)) {
    return (
      <video
        src={mediaUrl}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        onError={(e) => {
          const videoElement = e.target as HTMLVideoElement
          const fallbackImg = document.createElement('img')
          fallbackImg.src = FALLBACK_IMAGE_URL
          fallbackImg.alt = `${churchName}성전 청년봉사선교회`
          fallbackImg.className = className || ''
          videoElement.parentNode?.replaceChild(fallbackImg, videoElement)
        }}
      />
    )
  }

  return (
    <img
      src={mediaUrl}
      alt={`${churchName}성전 청년봉사선교회`}
      className={className}
    />
  )
}
