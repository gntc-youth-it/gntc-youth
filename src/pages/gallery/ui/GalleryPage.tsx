import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../../widgets/header'
import { useAuth } from '../../../features/auth'
import { useGallery } from '../model/useGallery'
import { buildCdnUrl, useInfiniteScroll } from '../../../shared/lib'
import { FALLBACK_IMAGE_URL } from '../../../shared/config'
import type { GalleryCategory, GalleryAlbum, GalleryPhotoItem, ViewMode, SubCategory } from '../model/types'

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

const GalleryGrid = ({ album }: { album: GalleryAlbum }) => {
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
            <div key={imgIdx} className="overflow-hidden rounded-xl">
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

const AlbumSection = ({ album }: { album: GalleryAlbum }) => (
  <section className="flex flex-col gap-5">
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#3B5BDB]">{album.date}</span>
        <h2 className="text-lg md:text-[22px] font-bold text-[#1A1A1A]">{album.title}</h2>
      </div>
      <span className="text-sm text-[#999999]">{album.photoCount}장의 사진</span>
    </div>
    <GalleryGrid album={album} />
  </section>
)

const AllPhotosGrid = ({
  photos,
  hasNext,
  isFetchingMore,
  loadMore,
}: {
  photos: GalleryPhotoItem[]
  hasNext: boolean
  isFetchingMore: boolean
  loadMore: () => void
}) => {
  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasNext && !isFetchingMore,
  })

  return (
    <>
      <div className="columns-2 md:columns-4 gap-3">
        {photos.map((photo, idx) => (
          <div key={photo.id} className="mb-3 break-inside-avoid overflow-hidden rounded-xl">
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
}: {
  albums: GalleryAlbum[]
  showAllPhotos: boolean
  photos: GalleryPhotoItem[]
  hasNext: boolean
  isFetchingMore: boolean
  loadMore: () => void
}) => (
  <div className="px-4 sm:px-8 lg:px-[60px] py-10">
    <div className="max-w-7xl mx-auto flex flex-col gap-10">
      {showAllPhotos ? (
        <AllPhotosGrid
          photos={photos}
          hasNext={hasNext}
          isFetchingMore={isFetchingMore}
          loadMore={loadMore}
        />
      ) : (
        albums.map((album, idx) => (
          <div key={album.id}>
            <AlbumSection album={album} />
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

// ─── Feed View Components ────────────────────────────────

const FeedImageCarousel = ({ album }: { album: GalleryAlbum }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const photos = album.photos

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < photos.length) setCurrentIndex(idx)
  }

  if (photos.length === 0) return null

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {photos.map((photo) => (
            <img
              key={photo.id}
              src={buildCdnUrl(photo.url)}
              alt={album.title}
              className="w-full h-[360px] sm:h-[400px] object-cover flex-shrink-0"
              loading="lazy"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
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
          {currentIndex < photos.length - 1 && (
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
      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3">
          {photos.map((_, idx) => (
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

const FeedCard = ({ album }: { album: GalleryAlbum }) => (
  <article className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
    {/* Post header */}
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#3B5BDB] flex items-center justify-center">
          <span className="text-white text-xs font-bold">G</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-[#1A1A1A]">GNTC-YOUTH</span>
          <span className="text-xs text-[#999999]">{album.dateFormatted}</span>
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
    <FeedImageCarousel album={album} />

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
      <span className="text-[13px] font-semibold text-[#1A1A1A]">
        ❤️ {album.likeCount}명이 좋아합니다
      </span>
      <p className="text-[13px] text-[#333333] leading-relaxed">{album.caption}</p>
      {album.tags.length > 0 && (
        <span className="text-xs font-medium text-[#3B5BDB]">
          {album.tags.map((t) => `#${t}`).join(' ')}
        </span>
      )}
    </div>
  </article>
)

const FeedContent = ({ albums }: { albums: GalleryAlbum[] }) => (
  <div className="flex justify-center px-4 py-10">
    <div className="w-full max-w-[600px] flex flex-col gap-6">
      {albums.map((album) => (
        <FeedCard key={album.id} album={album} />
      ))}
    </div>
  </div>
)

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showRetreatModal, setShowRetreatModal] = useState(false)
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  // TODO: albums는 카테고리별 뷰에서 사용 - 추후 API 연동
  const albums: GalleryAlbum[] = []

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-[#F8F9FA]">
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
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-[#999999] text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && photos.length === 0 && albums.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#999999] text-sm">아직 등록된 갤러리가 없습니다.</p>
          </div>
        )}

        {!isLoading && !error && (photos.length > 0 || albums.length > 0) && (
          <div className="transition-opacity duration-300">
            {viewMode === 'grid' ? (
              <GridContent
                albums={albums}
                showAllPhotos={selectedCategory === 'ALL' || selectedSubCategory !== null}
                photos={photos}
                hasNext={hasNext}
                isFetchingMore={isFetchingMore}
                loadMore={loadMore}
              />
            ) : (
              <FeedContent albums={albums} />
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
    </>
  )
}
