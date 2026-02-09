import { FALLBACK_IMAGE_URL } from '../../../shared/config'
import { isVideoUrl } from '../../../shared/lib'

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
