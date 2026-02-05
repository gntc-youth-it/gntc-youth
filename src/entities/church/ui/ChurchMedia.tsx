import { Church } from '../model'
import { FALLBACK_IMAGE_URL } from '../../../shared/config'

interface ChurchMediaProps {
  church: Church
  className?: string
}

export const ChurchMedia = ({ church, className }: ChurchMediaProps) => {
  if (church.mediaType === 'video') {
    return (
      <video
        src={church.media}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        onError={(e) => {
          const videoElement = e.target as HTMLVideoElement
          const fallbackImg = document.createElement('img')
          fallbackImg.src = FALLBACK_IMAGE_URL
          fallbackImg.alt = `${church.name}성전 청년봉사선교회`
          fallbackImg.className = className || ''
          videoElement.parentNode?.replaceChild(fallbackImg, videoElement)
        }}
      />
    )
  }

  return (
    <img
      src={church.media}
      alt={`${church.name}성전 청년봉사선교회`}
      className={className}
    />
  )
}
