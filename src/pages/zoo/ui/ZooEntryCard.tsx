import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface ZooEntryCardProps {
  to: string
  icon: ReactNode
  // 아이콘 뒤 동그라미 색
  iconBackground: string
  title: string
  description: string
}

// 조 목록 화면에서 사진 투표, 미션 답 보기처럼 다른 화면으로 가는 카드
export const ZooEntryCard = ({ to, icon, iconBackground, title, description }: ZooEntryCardProps) => (
  <Link
    to={to}
    className="mt-3 flex items-center gap-3 rounded-2xl border border-[#E5E8EB] px-4 py-3.5 transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: iconBackground }}>
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[16px] font-semibold text-[#191F28]">{title}</span>
      <span className="block break-keep text-[13px] text-[#6B7684]">{description}</span>
    </span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0B8C1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  </Link>
)
