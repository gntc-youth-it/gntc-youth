import { useMemo, useState } from 'react'
import type { UserInfo } from '../../../features/auth'
import { ZOO_STOPS } from '../model/course'
import type { StopId } from '../model/course'
import { getStopMission } from '../model/missions'
import { PHOTO_VOTE_OPENS_LABEL, groupByStop, orderForViewer } from '../model/photo'
import { useCurrentUser } from '../model/useCurrentUser'
import { usePhotoVoteOpen } from '../model/usePhotoVoteOpen'
import { useZooPhotos } from '../model/useZooPhotos'
import type { ZooActionError } from '../model/useZooTeam'
import { BackToZoo } from './BackToZoo'
import { HeartIcon } from './HeartIcon'
import { PhotoViewer } from './PhotoViewer'
import { PhotoVoteCard } from './PhotoVoteCard'
import { PhotoVoteResults } from './PhotoVoteResults'
import { SegmentedControl } from './SegmentedControl'
import { StopFilter } from './StopFilter'
import type { StopFilterValue } from './StopFilter'
import { ZooLayout } from './ZooLayout'
import { ZooLoginRequired } from './ZooLoginRequired'
import { PARK_GREEN } from './courseTheme'

type PhotoVoteTab = 'vote' | 'results'

// 운영자에게만 보이는 투표하기 / 결과 보기 전환
const TAB_OPTIONS = [
  { value: 'vote', label: '투표하기' },
  { value: 'results', label: '결과 보기' },
] as const

// 화면 아래에 떠서 내가 몇 장 골랐는지 보여주고, 투표가 실패하면 그 위에 알려준다.
// 바깥 여백은 터치가 아래 사진으로 지나가고, 알약 위를 누르면 가려진 하트가 눌리지 않게 막는다
const MyVoteBar = ({ votedCount, error, onDismissError }: { votedCount: number; error: ZooActionError | null; onDismissError: () => void }) => (
  <aside aria-label="내 투표" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
    <div className="mx-auto max-w-xl">
      {error && (
        <div role="alert" className="pointer-events-auto mb-2 flex items-start gap-2 rounded-xl bg-[#FFF5F5] px-3 py-2.5 text-[13px] text-[#C92A2A] shadow-[0_4px_16px_rgba(25,31,40,0.12)]">
          <span className="flex-1 break-keep">{error.message}</span>
          <button type="button" onClick={onDismissError} aria-label="안내 닫기" className="shrink-0 px-1 leading-none">
            ×
          </button>
        </div>
      )}
      <p
        aria-live="polite"
        className="pointer-events-auto mx-auto flex w-fit items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(31,77,54,0.35)]"
        style={{ backgroundColor: PARK_GREEN }}
      >
        <HeartIcon filled={votedCount > 0} size={16} color="#FFFFFF" />
        {votedCount > 0 ? `내가 고른 사진 ${votedCount}장` : '마음에 드는 사진에 하트를 눌러 주세요'}
      </p>
    </div>
  </aside>
)

const PhotoVoteBoard = ({ viewerId }: { viewerId: number }) => {
  const { photos, loadState, reload, toggleVote, voteError, dismissVoteError } = useZooPhotos()
  const [stopFilter, setStopFilter] = useState<StopFilterValue>('ALL')
  const [openPhotoId, setOpenPhotoId] = useState<number | null>(null)

  const groups = useMemo(() => groupByStop(orderForViewer(photos, viewerId)), [photos, viewerId])
  const visibleGroups = stopFilter === 'ALL' ? groups : groups.filter((group) => group.stopId === stopFilter)
  const visiblePhotos = visibleGroups.flatMap((group) => group.items)
  const counts = Object.fromEntries(groups.map((group) => [group.stopId, group.items.length])) as Partial<Record<StopId, number>>
  const votedCount = photos.filter((photo) => photo.isVoted).length

  if (loadState === 'loading') return <p className="mt-8 text-[14px] text-[#8B95A1]">사진을 불러오는 중이에요.</p>

  if (loadState === 'error') {
    return (
      <div className="mt-8">
        <p className="break-keep text-[14px] text-[#4E5968]">사진을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-3 rounded-full border border-[#D1D6DB] px-4 py-2 text-[14px] font-semibold text-[#333D4B]"
        >
          다시 불러오기
        </button>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <p className="mt-8 break-keep rounded-2xl bg-[#F5F8F2] px-4 py-6 text-center text-[14px] leading-relaxed text-[#4E5968]">
        아직 올라온 사진이 없어요.
        <br />
        조장이 장소별 미션을 내면 여기에 사진이 모여요.
      </p>
    )
  }

  return (
    <>
      <StopFilter value={stopFilter} counts={counts} total={photos.length} onChange={setStopFilter} />

      {visibleGroups.map((group) => (
        <section key={group.stopId} aria-labelledby={`zoo-photos-${group.stopId}`} className="mt-6">
          <h2 id={`zoo-photos-${group.stopId}`} className="font-sign text-[25px] leading-tight" style={{ color: PARK_GREEN }}>
            {ZOO_STOPS[group.stopId].name}
          </h2>
          <p className="mt-1 break-keep text-[14px] leading-snug text-[#4E5968]">{getStopMission(group.stopId).photoMission}</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-2.5 gap-y-4">
            {group.items.map((photo) => (
              <PhotoVoteCard
                key={photo.id}
                photo={photo}
                stopName={ZOO_STOPS[photo.stopId].name}
                onOpen={() => setOpenPhotoId(photo.id)}
                onToggleVote={() => void toggleVote(photo)}
              />
            ))}
          </ul>
        </section>
      ))}

      <PhotoViewer
        photos={visiblePhotos}
        openPhotoId={openPhotoId}
        onNavigate={setOpenPhotoId}
        onClose={() => setOpenPhotoId(null)}
        onToggleVote={(photo) => void toggleVote(photo)}
      />
      <MyVoteBar votedCount={votedCount} error={voteError} onDismissError={dismissVoteError} />
    </>
  )
}

const PhotoVoteTitle = () => (
  <h1 className="mt-5 font-sign text-[34px] leading-tight sm:text-[40px]" style={{ color: PARK_GREEN }}>
    사진 투표
  </h1>
)

// 열리기 전에 링크로 들어온 참가자에게는 언제 열리는지만 알려준다. 열리는 순간 새로고침 없이 투표 화면으로 바뀐다
const PhotoVoteClosed = () => (
  <ZooLayout>
    <BackToZoo />
    <PhotoVoteTitle />
    <div className="mt-6 rounded-2xl bg-[#F5F8F2] px-5 py-7 text-center">
      <p className="font-sign text-[25px] leading-tight" style={{ color: PARK_GREEN }}>
        {PHOTO_VOTE_OPENS_LABEL}에 열려요
      </p>
      <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#4E5968]">
        모든 조가 미션을 마치고 정문에 모이면 그때부터 조별 미션 사진을 보고 투표할 수 있어요.
      </p>
    </div>
  </ZooLayout>
)

const PhotoVoteContent = ({ currentUser }: { currentUser: UserInfo }) => {
  const isMaster = currentUser.role === 'MASTER'
  const isOpen = usePhotoVoteOpen()
  const [tab, setTab] = useState<PhotoVoteTab>('vote')
  const isResultsTab = isMaster && tab === 'results'

  // 운영자는 열리기 전에도 미리 들어와 확인할 수 있다
  if (!isOpen && !isMaster) return <PhotoVoteClosed />

  return (
    // 투표 화면에는 아래에 '내 투표' 바가 떠 있어서 마지막 줄 사진이 가려지지 않게 여백을 둔다
    <ZooLayout hasBottomBar={!isResultsTab}>
      <BackToZoo />
      <PhotoVoteTitle />
      <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">
        마음에 드는 사진에 하트를 눌러 투표해요. 여러 장에 투표할 수 있고, 몇 표를 받았는지는 운영진만 봐요. 우리 조 사진에는 투표할 수 없어요.
      </p>
      {!isOpen && (
        <p className="mt-4 break-keep rounded-xl bg-[#FFF4E5] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#8A4B00]">
          운영자만 미리 보고 있어요. 참가자에게는 {PHOTO_VOTE_OPENS_LABEL}에 열려요. 미리 눌러 본 투표도 결과에 그대로 남으니, 확인한 뒤에는 다시 눌러 취소해 주세요.
        </p>
      )}

      {isMaster && <SegmentedControl value={tab} options={TAB_OPTIONS} onChange={setTab} />}
      {isResultsTab ? <PhotoVoteResults /> : <PhotoVoteBoard viewerId={currentUser.id} />}
    </ZooLayout>
  )
}

export const ZooPhotoVotePage = () => {
  const currentUser = useCurrentUser()

  if (!currentUser) {
    return (
      <ZooLayout>
        <ZooLoginRequired
          title="사진 투표"
          description="조별 미션 사진을 보고 투표하려면 로그인이 필요해요. 로그인하면 이 화면으로 바로 돌아와요."
        />
      </ZooLayout>
    )
  }

  return <PhotoVoteContent currentUser={currentUser} />
}
