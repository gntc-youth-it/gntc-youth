import { buildCdnUrl } from '../../../shared/lib'
import type { ZooPhoto } from '../model/photo'
import { HeartIcon } from './HeartIcon'

interface PhotoVoteCardProps {
  photo: ZooPhoto
  stopName: string
  onOpen: () => void
  onToggleVote: () => void
}

// 사진을 누르면 크게 보고, 오른쪽 아래 하트로 바로 투표한다. 우리 조 사진에는 하트가 없다
export const PhotoVoteCard = ({ photo, stopName, onOpen, onToggleVote }: PhotoVoteCardProps) => (
  <li>
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${photo.teamName} ${stopName} 사진 크게 보기`}
        className="block aspect-square w-full overflow-hidden rounded-2xl bg-[#F2F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
      >
        <img src={buildCdnUrl(photo.photoPath)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </button>
      {photo.isMyTeam ? (
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-semibold text-white">
          우리 조
        </span>
      ) : (
        <button
          type="button"
          onClick={onToggleVote}
          aria-pressed={photo.isVoted}
          aria-label={`${photo.teamName} ${stopName} 사진에 투표`}
          className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#8B95A1] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36]"
        >
          <HeartIcon filled={photo.isVoted} />
        </button>
      )}
    </div>
    <p className="mt-1.5 truncate text-[14px] font-semibold text-[#333D4B]">{photo.teamName}</p>
  </li>
)
