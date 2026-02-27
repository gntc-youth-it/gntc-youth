import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../../widgets/header'
import { useAuth } from '../../../features/auth'
import { useGallery } from '../model/useGallery'
import { useFeed } from '../model/useFeed'
import { buildCdnUrl, isVideoUrl, useInfiniteScroll } from '../../../shared/lib'
import { FALLBACK_IMAGE_URL } from '../../../shared/config'
import type { GalleryCategory, GalleryAlbum, GalleryPhotoItem, ViewMode, SubCategory, FeedPost, FeedPostImage } from '../model/types'

const CATEGORIES: { key: GalleryCategory; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'RETREAT', label: '수련회' },
]

// ─── Icons ───────────────────────────────────────────────

const GridIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#666666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
)

const FeedIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#666666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E74C6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const CommentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const BookmarkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

// ─── View Toggle ─────────────────────────────────────────

const ViewToggle = ({ viewMode, onChange }: { viewMode: ViewMode; onChange: (mode: ViewMode) => void }) => (
  <div className="flex items-center bg-[#F0F0F0] rounded-lg p-1 gap-1">
    <button
      onClick={() => onChange('grid')}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
        viewMode === 'grid' ? 'bg-[#3B5BDB] text-white font-semibold' : 'text-[#666666] hover:bg-gray-200'
      }`}
    >
      <GridIcon active={viewMode === 'grid'} />
      갤러리
    </button>
    <button
      onClick={() => onChange('feed')}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
        viewMode === 'feed' ? 'bg-[#3B5BDB] text-white font-semibold' : 'text-[#666666] hover:bg-gray-200'
      }`}
    >
      <FeedIcon active={viewMode === 'feed'} />
      피드
    </button>
  </div>
)

// ─── Grid View Components ────────────────────────────────

const GalleryGrid = ({ album, onImageClick }: { album: GalleryAlbum; onImageClick: (url: string) => void }) => {
  const columnCount = 4
  const columns: string[][] = Array.from({ length: columnCount }, () => [])
  const heights = new Array(columnCount).fill(0)

  album.photos.forEach((photo) => {
    const shortest = heights.indexOf(Math.min(...heights))
    columns[shortest].push(buildCdnUrl(photo.url))
    heights[shortest] += 1
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-3">
          {col.map((url, imgIdx) => (
            <div key={imgIdx} className="overflow-hidden rounded-xl cursor-pointer" onClick={() => onImageClick(url)}>
              <img
                src={url}
                alt={`${album.title} 사진 ${colIdx * col.length + imgIdx + 1}`}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const AlbumSection = ({ album, onImageClick }: { album: GalleryAlbum; onImageClick: (url: string) => void }) => (
  <section className="flex flex-col gap-5">
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#3B5BDB]">{album.date}</span>
        <h2 className="text-lg md:text-[22px] font-bold text-[#1A1A1A]">{album.title}</h2>
      </div>
      <span className="text-sm text-[#999999]">{album.photoCount}장의 사진</span>
    </div>
    <GalleryGrid album={album} onImageClick={onImageClick} />
  </section>
)

const AllPhotosGrid = ({
  photos,
  hasNext,
  isFetchingMore,
  loadMore,
  onImageClick,
}: {
  photos: GalleryPhotoItem[]
  hasNext: boolean
  isFetchingMore: boolean
  loadMore: () => void
  onImageClick: (url: string) => void
}) => {
  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasNext && !isFetchingMore,
  })

  return (
    <>
      <p className="text-sm text-[#999999] mb-4">
        총 {photos.length}장{hasNext ? '+' : ''}의 사진
      </p>
      <div className="columns-2 md:columns-4 gap-3">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            className="mb-3 break-inside-avoid overflow-hidden rounded-xl cursor-pointer"
            onClick={() => onImageClick(buildCdnUrl(photo.url))}
          >
            <img
              src={buildCdnUrl(photo.url)}
              alt={`갤러리 사진 ${idx + 1}`}
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
              }}
            />
          </div>
        ))}
      </div>
      {isFetchingMore && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!hasNext && photos.length > 0 && (
        <p className="text-center text-sm text-[#999999] py-8">
          모든 사진을 불러왔습니다.
        </p>
      )}
      <div ref={sentinelRef} className="h-1" />
    </>
  )
}

const GridContent = ({
  albums,
  showAllPhotos,
  photos,
  hasNext,
  isFetchingMore,
  loadMore,
  onImageClick,
}: {
  albums: GalleryAlbum[]
  showAllPhotos: boolean
  photos: GalleryPhotoItem[]
  hasNext: boolean
  isFetchingMore: boolean
  loadMore: () => void
  onImageClick: (url: string) => void
}) => (
  <div className="px-4 sm:px-8 lg:px-[60px] py-10">
    <div className="max-w-7xl mx-auto flex flex-col gap-10">
      {showAllPhotos ? (
        <AllPhotosGrid
          photos={photos}
          hasNext={hasNext}
          isFetchingMore={isFetchingMore}
          loadMore={loadMore}
          onImageClick={onImageClick}
        />
      ) : (
        albums.map((album, idx) => (
          <div key={album.id}>
            <AlbumSection album={album} onImageClick={onImageClick} />
            {idx < albums.length - 1 && <div className="h-px bg-[#E0E0E0] mt-10" />}
          </div>
        ))
      )}
    </div>
  </div>
)

// ─── Retreat Sub-Category Section ────────────────────────

const formatRetreatDate = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  return `${fmt(s)} - ${fmt(e)}`
}

const RetreatHeroBanner = ({
  sub,
  showBrowse,
  onBrowse,
}: {
  sub: SubCategory
  showBrowse: boolean
  onBrowse: () => void
}) => (
  <div className="relative h-[320px] sm:h-[400px] overflow-hidden">
    <img
      src={buildCdnUrl(sub.imageUrl)}
      alt={sub.displayName}
      className="w-full h-full object-cover"
      onError={(e) => {
        ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 lg:px-[60px] pb-8">
      <div className="max-w-7xl mx-auto flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-white/70 tracking-[2px] uppercase">RETREAT</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {sub.displayName}
          </h2>
          <p className="text-sm text-white/80">{formatRetreatDate(sub.startDate, sub.endDate)}</p>
        </div>
        {showBrowse && (
          <button
            onClick={onBrowse}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-[13px] font-medium hover:bg-white/30 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            다른 행사 보기
          </button>
        )}
      </div>
    </div>
  </div>
)

const RetreatSelectorModal = ({
  subCategories,
  selectedSubCategory,
  onSelect,
  onClose,
}: {
  subCategories: SubCategory[]
  selectedSubCategory: string | null
  onSelect: (name: string) => void
  onClose: () => void
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-lg mx-4 mb-0 sm:mb-0 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
        <h3 className="text-lg font-bold text-[#1A1A1A]">수련회 행사 목록</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F0F0] transition-colors"
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto p-4 flex flex-col gap-3">
        {subCategories.map((sub) => {
          const isSelected = selectedSubCategory === sub.name
          return (
            <button
              key={sub.name}
              onClick={() => {
                onSelect(sub.name)
                onClose()
              }}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left ${
                isSelected
                  ? 'bg-[#EDF2FF] ring-1 ring-[#3B5BDB]'
                  : 'bg-[#FAFAFA] hover:bg-[#F0F0F0]'
              }`}
            >
              <img
                src={buildCdnUrl(sub.imageUrl)}
                alt={sub.displayName}
                className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
                }}
              />
              <div className="flex flex-col gap-1 min-w-0">
                <span className={`text-[15px] font-bold leading-tight ${isSelected ? 'text-[#3B5BDB]' : 'text-[#1A1A1A]'}`}>
                  {sub.displayName}
                </span>
                <span className="text-[12px] text-[#999999]">
                  {formatRetreatDate(sub.startDate, sub.endDate)}
                </span>
                {isSelected && (
                  <span className="text-[11px] font-semibold text-[#3B5BDB]">현재 보고 있는 행사</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  </div>
)

// ─── Feed Video Player ──────────────────────────────────

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
            video.play().catch(() => {/* autoplay blocked */})
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

// ─── Feed View Components ────────────────────────────────

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

      {/* Navigation arrows */}
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

      {/* Dots indicator */}
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

const GNTC_LOGO_URL = 'https://cdn.gntc-youth.com/assets/gntc-youth-logo-black.webp'
const GNTC_AUTHOR_NAME = 'GNTC YOUTH'

const FeedCard = ({ post, onImageClick }: { post: FeedPost; onImageClick: (url: string) => void }) => {
  const displayName = post.isAuthorPublic ? post.authorName : GNTC_AUTHOR_NAME

  return (
  <article className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
    {/* Post header */}
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        {post.isAuthorPublic ? (
          <div className="w-10 h-10 rounded-full bg-[#3B5BDB] flex items-center justify-center">
            <span className="text-white text-xs font-bold">{post.authorName.charAt(0)}</span>
          </div>
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
      <button className="p-1 text-[#CCCCCC] hover:text-[#999999] transition-colors" aria-label="더보기">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
    </div>

    {/* Image carousel */}
    <FeedImageCarousel images={post.images} onImageClick={onImageClick} />

    {/* Action bar */}
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-4">
        <button className="hover:opacity-70 transition-opacity" aria-label="좋아요"><HeartIcon /></button>
        <button className="hover:opacity-70 transition-opacity" aria-label="댓글"><CommentIcon /></button>
        <button className="hover:opacity-70 transition-opacity" aria-label="공유"><ShareIcon /></button>
      </div>
      <button className="hover:opacity-70 transition-opacity" aria-label="저장"><BookmarkIcon /></button>
    </div>

    {/* Post footer */}
    <div className="flex flex-col gap-2 px-4 pb-4">
      {post.content && (
        <p className="text-[13px] text-[#333333] leading-relaxed">{post.content}</p>
      )}
      {post.hashtags.length > 0 && (
        <span className="text-xs font-medium text-[#3B5BDB]">
          {post.hashtags.map((t) => t.startsWith('#') ? t : `#${t}`).join(' ')}
        </span>
      )}
      {post.commentCount > 0 && (
        <span className="text-xs text-[#999999]">
          댓글 {post.commentCount}개
        </span>
      )}
    </div>
  </article>
  )
}

const FeedContent = ({
  posts,
  hasNext,
  isFetchingMore,
  loadMore,
  onImageClick,
}: {
  posts: FeedPost[]
  hasNext: boolean
  isFetchingMore: boolean
  loadMore: () => void
  onImageClick: (url: string) => void
}) => {
  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasNext && !isFetchingMore,
  })

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-[600px] flex flex-col gap-6">
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} onImageClick={onImageClick} />
        ))}
        {isFetchingMore && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!hasNext && posts.length > 0 && (
          <p className="text-center text-sm text-[#999999] py-8">
            모든 피드를 불러왔습니다.
          </p>
        )}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  )
}

// ─── Media Lightbox ─────────────────────────────────────

const MediaLightbox = ({
  imageUrl,
  onClose,
}: {
  imageUrl: string
  onClose: () => void
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const lightboxVideoRef = useRef<HTMLVideoElement>(null)
  const isVideo = isVideoUrl(imageUrl)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        e.preventDefault()
        closeButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    // 라이트박스 열릴 때 갤러리 내 배경 영상 일시정지 (소리 겹침 방지)
    const pausedVideos: HTMLVideoElement[] = []
    const container = document.getElementById('gallery-content')
    container?.querySelectorAll('video').forEach((v) => {
      if (v !== lightboxVideoRef.current && !v.paused) {
        v.pause()
        pausedVideos.push(v)
      }
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''

      // 라이트박스 닫힐 때 화면에 보이는 영상 재개
      pausedVideos.forEach((v) => {
        if (!v.isConnected) return
        const rect = v.getBoundingClientRect()
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
        if (rect.height > 0 && visibleHeight / rect.height >= 0.5) {
          v.play().catch(() => {})
        }
      })
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      data-testid="lightbox-overlay"
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
          ref={lightboxVideoRef}
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

// ─── Main Page ───────────────────────────────────────────

export const GalleryPage = () => {
  const {
    photos,
    isLoading,
    isFetchingMore,
    error,
    hasNext,
    loadMore,
    selectedCategory,
    setSelectedCategory,
    subCategories,
    selectedSubCategory,
    selectSubCategory,
  } = useGallery()
  const feed = useFeed()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showRetreatModal, setShowRetreatModal] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const handleCloseLightbox = useCallback(() => setLightboxUrl(null), [])
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  // TODO: albums는 카테고리별 뷰에서 사용 - 추후 API 연동
  const albums: GalleryAlbum[] = []

  // 피드 뷰로 전환 시 피드 데이터 로드
  useEffect(() => {
    if (viewMode === 'feed') {
      const subCat = selectedSubCategory ?? undefined
      feed.loadFeed(subCat)
    } else {
      feed.reset()
    }
  }, [viewMode, selectedSubCategory, feed.loadFeed, feed.reset])

  const feedLoadMore = useCallback(() => {
    feed.loadMore(selectedSubCategory ?? undefined)
  }, [feed, selectedSubCategory])

  const currentIsLoading = viewMode === 'feed' ? feed.isLoading : isLoading
  const currentError = viewMode === 'feed' ? feed.error : error
  const hasContent = viewMode === 'feed'
    ? feed.posts.length > 0
    : photos.length > 0 || albums.length > 0

  return (
    <>
      <Header />
      <main id="gallery-content" className="pt-16 min-h-screen bg-[#F8F9FA]">
        {/* Header Section */}
        <div className="bg-white px-4 sm:px-8 lg:px-[60px] pt-12 pb-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-[42px] font-extrabold tracking-[4px] text-[#1A1A1A]">
                  GALLERY
                </h1>
                <p className="text-sm text-[#666666]">
                  은혜와진리교회 청년봉사선교회 · 사진 갤러리</p>
              </div>
              {isLoggedIn && (
                <button
                  onClick={() => navigate('/gallery/write')}
                  className="px-5 py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold rounded-lg hover:bg-[#364FC7] transition-colors shrink-0"
                >
                  글쓰기
                </button>
              )}
            </div>

            {/* Nav bar: categories + view toggle */}
            <div className="flex items-center justify-between mt-6 gap-4">
              <div className="flex items-center gap-2">
                {CATEGORIES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-5 py-2 rounded-full text-[13px] font-medium transition-colors ${
                      selectedCategory === key
                        ? 'bg-[#3B5BDB] text-white font-semibold'
                        : 'bg-[#F0F0F0] text-[#666666] hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            </div>
          </div>
        </div>

        {/* Retreat Hero Banner */}
        {selectedCategory === 'RETREAT' && subCategories.length > 0 && (() => {
          const selected = subCategories.find((s) => s.name === selectedSubCategory)
          return selected ? (
            <RetreatHeroBanner
              sub={selected}
              showBrowse={subCategories.length > 1}
              onBrowse={() => setShowRetreatModal(true)}
            />
          ) : null
        })()}

        {/* Retreat Selector Modal */}
        {showRetreatModal && (
          <RetreatSelectorModal
            subCategories={subCategories}
            selectedSubCategory={selectedSubCategory}
            onSelect={selectSubCategory}
            onClose={() => setShowRetreatModal(false)}
          />
        )}

        {/* Content */}
        {currentIsLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {currentError && (
          <div className="text-center py-20">
            <p className="text-[#999999] text-sm">{currentError}</p>
          </div>
        )}

        {!currentIsLoading && !currentError && !hasContent && (
          <div className="text-center py-20">
            <p className="text-[#999999] text-sm">
              {viewMode === 'feed' ? '아직 등록된 피드가 없습니다.' : '아직 등록된 갤러리가 없습니다.'}
            </p>
          </div>
        )}

        {!currentIsLoading && !currentError && hasContent && (
          <div className="transition-opacity duration-300">
            {viewMode === 'grid' ? (
              <GridContent
                albums={albums}
                showAllPhotos={selectedCategory === 'ALL' || selectedSubCategory !== null}
                photos={photos}
                hasNext={hasNext}
                isFetchingMore={isFetchingMore}
                loadMore={loadMore}
                onImageClick={setLightboxUrl}
              />
            ) : (
              <FeedContent
                posts={feed.posts}
                hasNext={feed.hasNext}
                isFetchingMore={feed.isFetchingMore}
                loadMore={feedLoadMore}
                onImageClick={setLightboxUrl}
              />
            )}
          </div>
        )}

        {/* Gallery Footer */}
        <div className="bg-white px-4 sm:px-8 lg:px-[60px] py-10">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <p className="text-base font-medium text-[#1A1A1A] text-center">
              오직 여호와를 경외하는 자는 새 힘을 얻으리니
            </p>
            <span className="text-xs font-semibold text-[#666666] tracking-[2px]">이사야 40:31</span>
            <div className="w-[60px] h-px bg-[#E0E0E0]" />
            <span className="text-[11px] text-[#999999] tracking-[1px]">
              은혜와진리교회 · 청년봉사선교회
            </span>
          </div>
        </div>
      </main>

      {/* Image Lightbox */}
      {lightboxUrl && (
        <MediaLightbox imageUrl={lightboxUrl} onClose={handleCloseLightbox} />
      )}
    </>
  )
}
