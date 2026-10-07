import { Link } from 'react-router-dom'
import { HeartIcon } from './HeartIcon'

const PHOTO_VOTE_PATH = '/zoo/photos'

// 조 목록 화면에 두는 사진 투표 입구
export const PhotoVoteEntryCard = () => (
  <Link
    to={PHOTO_VOTE_PATH}
    className="mt-3 flex items-center gap-3 rounded-2xl border border-[#E5E8EB] px-4 py-3.5 transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F1]">
      <HeartIcon filled size={20} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[16px] font-semibold text-[#191F28]">사진 투표</span>
      <span className="block break-keep text-[13px] text-[#6B7684]">조별 미션 사진을 보고 마음에 드는 사진에 투표해요.</span>
    </span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0B8C1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  </Link>
)

// 조 화면 맨 위에 작게 두는 입구. 조원은 조 목록 대신 조 화면으로 바로 들어오므로 여기에도 둔다
export const PhotoVoteEntryPill = () => (
  <Link
    to={PHOTO_VOTE_PATH}
    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#D1D6DB] px-3 py-1.5 text-[13px] font-semibold text-[#333D4B] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
  >
    <HeartIcon filled size={14} />
    사진 투표
  </Link>
)
