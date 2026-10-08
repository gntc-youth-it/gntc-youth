import { buildCdnUrl } from '../../../shared/lib'

interface MissionPhotoLinkProps {
  photoPath: string
  label: string
  className?: string
}

// 미션 사진 썸네일. 누르면 원본을 새 탭으로 연다
export const MissionPhotoLink = ({ photoPath, label, className = '' }: MissionPhotoLinkProps) => (
  <a
    href={buildCdnUrl(photoPath)}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    className={`block overflow-hidden rounded-xl bg-[#F2F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2 ${className}`}
  >
    <img src={buildCdnUrl(photoPath)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
  </a>
)
