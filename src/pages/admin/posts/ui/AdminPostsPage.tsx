import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../features/auth'
import { Header } from '../../../../widgets/header'
import { Footer } from '../../../../widgets/footer'
import { ProfileImage } from '../../../../shared/ui'
import { buildCdnUrl, isVideoUrl, useInfiniteScroll } from '../../../../shared/lib'
import { FALLBACK_IMAGE_URL } from '../../../../shared/config'
import { usePendingPosts } from '../model/usePendingPosts'
import { approvePost } from '../api/adminPostApi'
import { deletePost } from '../../../gallery/api/galleryApi'
import type { FeedPost, FeedPostImage } from '../../../gallery/model/types'

// ─── Date Formatter ─────────────────────────────────────

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

// ─── Icons ──────────────────────────────────────────────

const MutedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
)

const UnmutedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)

// ─── Feed Video Player ──────────────────────────────────

const FeedVideoPlayer = ({ src, onVideoClick }: { src: string; onVideoClick: (url: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  return (
    <div className="relative w-full h-[360px] sm:h-[400px] cursor-pointer" onClick={() => onVideoClick(src)}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
      />
      <button
        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
        onClick={(e) => {
          e.stopPropagation()
          toggleMute()
        }}
        aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
      >
        {isMuted ? <MutedIcon /> : <UnmutedIcon />}
      </button>
    </div>
  )
}

// ─── Feed Image Carousel ────────────────────────────────

const FeedImageCarousel = ({ images, onImageClick }: { images: FeedPostImage[]; onImageClick: (url: string) => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < images.length) setCurrentIndex(idx)
  }

  if (images.length === 0) return null

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, idx) => {
            const url = buildCdnUrl(image.filePath)
            const isVideo = isVideoUrl(url)

            return (
              <div key={image.fileId} className="w-full flex-shrink-0">
                {isVideo ? (
                  idx === currentIndex ? (
                    <FeedVideoPlayer src={url} onVideoClick={onImageClick} />
                  ) : (
                    <video
                      src={url}
                      className="w-full h-[360px] sm:h-[400px] object-cover cursor-pointer"
                      muted
                      preload="metadata"
                      onClick={() => onImageClick(url)}
                    />
                  )
                ) : (
                  <img
                    src={url}
                    alt={`사진 ${image.sortOrder}`}
                    className="w-full h-[360px] sm:h-[400px] object-cover cursor-pointer"
                    loading="lazy"
                    onClick={() => onImageClick(url)}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              aria-label="이전 사진"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              aria-label="다음 사진"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </>
      )}

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-[#3B5BDB]' : 'bg-[#D0D0D0]'
              }`}
              aria-label={`사진 ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pending Feed Card ──────────────────────────────────

const GNTC_LOGO_URL = 'https://cdn.gntc-youth.com/assets/gntc-youth-logo-black.webp'

const PendingFeedCard = ({
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

// ─── Confirm Modal ──────────────────────────────────────

const ConfirmModal = ({
  title,
  message,
  confirmLabel,
  confirmClassName,
  isProcessing,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClassName: string
  isProcessing: boolean
  onConfirm: () => void
  onCancel: () => void
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
    <div
      role="dialog"
      aria-modal="true"
      className="relative bg-white rounded-2xl shadow-2xl w-[320px] mx-4 p-6 flex flex-col items-center gap-4"
    >
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-lg font-bold text-[#1A1A1A]">{title}</h3>
        <p className="text-sm text-[#666666] text-center">{message}</p>
      </div>
      <div className="flex gap-3 w-full mt-2">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-2.5 rounded-lg bg-[#F0F0F0] text-sm font-medium text-[#666666] hover:bg-[#E0E0E0] transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${confirmClassName}`}
        >
          {isProcessing ? '처리 중...' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
)

// ─── Media Lightbox ─────────────────────────────────────

const MediaLightbox = ({
  imageUrl,
  onClose,
}: {
  imageUrl: string
  onClose: () => void
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const isVideo = isVideoUrl(imageUrl)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isVideo ? '동영상 확대 보기' : '이미지 확대 보기'}
    >
      <button
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        aria-label="닫기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {isVideo ? (
        <video
          src={imageUrl}
          className="max-w-[95vw] max-h-[95vh] object-contain"
          controls
          autoPlay
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={imageUrl}
          alt="확대 사진"
          className="max-w-[95vw] max-h-[95vh] object-contain"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
          }}
        />
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────

export const AdminPostsPage = () => {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const { posts, isLoading, isFetchingMore, error, hasNext, loadFeed, loadMore, removePost } = usePendingPosts()
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const handleCloseLightbox = useCallback(() => setLightboxUrl(null), [])
  const [modalState, setModalState] = useState<{ type: 'approve' | 'delete'; postId: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasNext && !isFetchingMore,
  })

  // 권한 체크
  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'MASTER') {
      navigate('/', { replace: true })
    }
  }, [isLoggedIn, user, navigate])

  // 초기 로드
  useEffect(() => {
    if (user?.role === 'MASTER') {
      loadFeed()
    }
  }, [user, loadFeed])

  const handleApproveClick = useCallback((postId: number) => {
    setModalState({ type: 'approve', postId })
  }, [])

  const handleDeleteClick = useCallback((postId: number) => {
    setModalState({ type: 'delete', postId })
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!modalState) return
    setIsProcessing(true)
    try {
      if (modalState.type === 'approve') {
        await approvePost(modalState.postId)
      } else {
        await deletePost(modalState.postId)
      }
      removePost(modalState.postId)
      setModalState(null)
    } catch (err) {
      console.error(`게시글 ${modalState.type === 'approve' ? '승인' : '삭제'} 실패:`, err)
      alert(`게시글 ${modalState.type === 'approve' ? '승인' : '삭제'}에 실패했습니다.`)
    } finally {
      setIsProcessing(false)
    }
  }, [modalState, removePost])

  if (!isLoggedIn || user?.role !== 'MASTER') return null

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-[#F8F9FA]">
        {/* Header Section */}
        <div className="bg-white px-4 sm:px-8 lg:px-[60px] pt-12 pb-10 border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-[42px] font-extrabold tracking-[4px] text-[#1A1A1A]">
                게시물 관리
              </h1>
              <p className="text-sm text-[#666666]">
                검수대기 중인 게시글을 확인하고 승인 또는 삭제할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex justify-center px-4 py-10">
          <div className="w-full max-w-[600px] flex flex-col gap-6">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={loadFeed}
                  className="mt-4 px-4 py-2 text-sm font-medium text-[#3B5BDB] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
                <p className="text-sm text-[#999999]">검수대기 중인 게시글이 없습니다.</p>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PendingFeedCard
                    key={post.id}
                    post={post}
                    onImageClick={setLightboxUrl}
                    onApprove={handleApproveClick}
                    onDelete={handleDeleteClick}
                    isProcessing={isProcessing}
                  />
                ))}
                {isFetchingMore && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!hasNext && posts.length > 0 && (
                  <p className="text-center text-sm text-[#999999] py-8">
                    모든 검수대기 게시글을 불러왔습니다.
                  </p>
                )}
                <div ref={sentinelRef} className="h-1" />
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Lightbox */}
      {lightboxUrl && <MediaLightbox imageUrl={lightboxUrl} onClose={handleCloseLightbox} />}

      {/* Confirm Modal */}
      {modalState && (
        <ConfirmModal
          title={modalState.type === 'approve' ? '게시글 승인' : '게시글 삭제'}
          message={
            modalState.type === 'approve'
              ? '이 게시글을 승인하시겠습니까?\n승인된 게시글은 갤러리에 공개됩니다.'
              : '삭제하면 되돌릴 수 없습니다.\n정말 삭제하시겠습니까?'
          }
          confirmLabel={modalState.type === 'approve' ? '승인' : '삭제'}
          confirmClassName={
            modalState.type === 'approve'
              ? 'bg-[#3B5BDB] hover:bg-[#2B4BC8]'
              : 'bg-red-500 hover:bg-red-600'
          }
          isProcessing={isProcessing}
          onConfirm={handleConfirm}
          onCancel={() => setModalState(null)}
        />
      )}
    </>
  )
}
