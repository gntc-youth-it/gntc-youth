import { ProfileImage } from '../../../../../shared/ui'
import { buildCdnUrl } from '../../../../../shared/lib'
import { FeedImageCarousel } from './FeedImageCarousel'
import type { FeedPost } from '../../../../gallery/model/types'

const GNTC_LOGO_URL = 'https://cdn.gntc-youth.com/assets/gntc-youth-logo-black.webp'

const formatFeedDate = (dateStr: string) => {
  const utcStr = /(Z|[+-]\d{2}(?::\d{2})?)$/.test(dateStr) ? dateStr : dateStr + 'Z'
  const date = new Date(utcStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export const PendingFeedCard = ({
  post,
  onImageClick,
  onApprove,
  onDelete,
  isProcessing,
}: {
  post: FeedPost
  onImageClick: (url: string) => void
  onApprove: (postId: number) => void
  onDelete: (postId: number) => void
  isProcessing: boolean
}) => {
  const displayName = post.isAuthorPublic ? post.authorName : 'GNTC YOUTH'

  return (
    <article className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Post header */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          {post.isAuthorPublic ? (
            <ProfileImage
              src={post.authorProfileImageUrl ? buildCdnUrl(post.authorProfileImageUrl) : null}
              alt={post.authorName}
              size={40}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden p-1">
              <img src={GNTC_LOGO_URL} alt="GNTC Youth" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-[#1A1A1A]">{displayName}</span>
            <span className="text-xs text-[#999999]">{formatFeedDate(post.createdAt)}</span>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
          검수대기
        </span>
      </div>

      {/* Image carousel */}
      <FeedImageCarousel images={post.images} onImageClick={onImageClick} />

      {/* Post footer */}
      <div className="flex flex-col gap-2 px-4 py-3">
        {post.content && (
          <p className="text-sm text-[#333333] leading-relaxed">{post.content}</p>
        )}
        {post.hashtags.length > 0 && (
          <span className="text-xs font-medium text-[#3B5BDB]">
            {post.hashtags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 pb-4">
        <button
          onClick={() => onDelete(post.id)}
          disabled={isProcessing}
          className="flex-1 py-2.5 rounded-lg border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          삭제
        </button>
        <button
          onClick={() => onApprove(post.id)}
          disabled={isProcessing}
          className="flex-1 py-2.5 rounded-lg bg-[#3B5BDB] text-sm font-medium text-white hover:bg-[#2B4BC8] transition-colors disabled:opacity-50"
        >
          승인
        </button>
      </div>
    </article>
  )
}
