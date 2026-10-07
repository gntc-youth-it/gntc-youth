import { useRef } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../../../shared/ui'
import { buildCdnUrl } from '../../../shared/lib'
import { ZOO_STOPS } from '../model/course'
import { getStopMission } from '../model/missions'
import type { ZooPhoto } from '../model/photo'
import { HeartIcon } from './HeartIcon'

// 이만큼 옆으로 밀면 다음(이전) 사진으로 넘긴다
const SWIPE_THRESHOLD_PX = 50

interface PhotoViewerProps {
  // 지금 화면에 보이는 순서 그대로. 좌우로 넘기며 본다
  photos: ZooPhoto[]
  openPhotoId: number | null
  onNavigate: (photoId: number) => void
  onClose: () => void
  onToggleVote: (photo: ZooPhoto) => void
}

const ArrowButton = ({ direction, disabled, onClick }: { direction: 'prev' | 'next'; disabled: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === 'prev' ? '이전 사진' : '다음 사진'}
    className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-opacity disabled:opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
      direction === 'prev' ? 'left-2' : 'right-2'
    }`}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={direction === 'prev' ? '15 6 9 12 15 18' : '9 6 15 12 9 18'} />
    </svg>
  </button>
)

// 사진을 화면 가득 크게 보고 그 자리에서 투표한다. 좌우로 밀거나 화살표로 넘긴다
export const PhotoViewer = ({ photos, openPhotoId, onNavigate, onClose, onToggleVote }: PhotoViewerProps) => {
  const touchStartX = useRef<number | null>(null)
  const index = openPhotoId === null ? -1 : photos.findIndex((photo) => photo.id === openPhotoId)
  const photo = index >= 0 ? photos[index] : null

  const goTo = (offset: number) => {
    const target = photos[index + offset]
    if (target) onNavigate(target.id)
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const deltaX = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) goTo(deltaX > 0 ? -1 : 1)
  }

  return (
    <Dialog open={photo !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') goTo(-1)
          if (event.key === 'ArrowRight') goTo(1)
        }}
        className="left-0 top-0 flex h-[100dvh] max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none bg-[#111] p-0 text-white shadow-none"
      >
        {photo && (
          <>
            <div className="flex items-center justify-between px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
              <span className="text-[14px] text-white/70">
                {index + 1} / {photos.length}
              </span>
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="닫기"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              </DialogClose>
            </div>

            <div
              className="relative flex min-h-0 flex-1 items-center justify-center"
              onTouchStart={(event) => {
                // 두 손가락으로 확대할 때는 넘기지 않는다
                touchStartX.current = event.touches.length === 1 ? event.touches[0].clientX : null
              }}
              onTouchEnd={handleTouchEnd}
            >
              <img
                key={photo.id}
                src={buildCdnUrl(photo.photoPath)}
                alt={`${photo.teamName} ${ZOO_STOPS[photo.stopId].name} 미션 사진`}
                className="max-h-full max-w-full object-contain"
              />
              <ArrowButton direction="prev" disabled={index === 0} onClick={() => goTo(-1)} />
              <ArrowButton direction="next" disabled={index === photos.length - 1} onClick={() => goTo(1)} />
            </div>

            <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
              <DialogTitle className="truncate font-sign text-[26px] font-normal leading-tight text-white">{photo.teamName}</DialogTitle>
              <DialogDescription className="mt-1 break-keep text-[13px] leading-snug text-white/70">
                {ZOO_STOPS[photo.stopId].name} · {getStopMission(photo.stopId).photoMission}
              </DialogDescription>
              {photo.isMyTeam ? (
                <p className="mt-3 rounded-xl bg-white/10 py-3.5 text-center text-[15px] font-semibold text-white/80">
                  우리 조 사진에는 투표할 수 없어요
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleVote(photo)}
                  aria-pressed={photo.isVoted}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[16px] font-semibold transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    photo.isVoted ? 'bg-white text-[#191F28]' : 'bg-white/15 text-white'
                  }`}
                >
                  <HeartIcon filled={photo.isVoted} />
                  {photo.isVoted ? '투표했어요' : '투표하기'}
                </button>
              )}
              {!photo.isMyTeam && (
                // 투표 전에도 자리를 잡아 둬서, 안내가 나타날 때 사진이 위로 밀리지 않게 한다
                <p aria-hidden={!photo.isVoted} className={`mt-2 text-center text-[12px] text-white/55 ${photo.isVoted ? '' : 'invisible'}`}>
                  한 번 더 누르면 취소돼요.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
