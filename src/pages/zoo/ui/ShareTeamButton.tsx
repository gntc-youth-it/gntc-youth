import { useEffect, useState } from 'react'

interface ShareTeamButtonProps {
  teamId: number
  teamName: string
}

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
)

// 휴대폰에서는 공유 시트(카톡 등)를 띄우고, 지원하지 않으면 링크를 복사한다
export const ShareTeamButton = ({ teamId, teamName }: ShareTeamButtonProps) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleShare = async () => {
    const url = `${window.location.origin}/zoo/teams/${teamId}`

    if (navigator.share) {
      try {
        await navigator.share({ title: `${teamName}에 들어와 주세요`, text: '동물원 나들이 조 초대 링크예요.', url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      window.prompt('이 링크를 복사해서 보내주세요.', url)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#D1D6DB] px-4 py-2 text-[14px] font-semibold text-[#333D4B] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
      >
        <ShareIcon />
        초대 링크 보내기
      </button>
      <span role="status" className="text-[13px] text-[#1F4D36]">
        {copied ? '링크를 복사했어요' : ''}
      </span>
    </div>
  )
}
