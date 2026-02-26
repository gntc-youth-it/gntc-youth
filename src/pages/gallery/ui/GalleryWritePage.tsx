import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../../widgets/header'
import { useAuth } from '../../../features/auth'
import { useGalleryWrite } from '../model/useGalleryWrite'
import type { UploadingImage } from '../model/types'

// ─── Icons ───────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const ImageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ─── Sub-components ──────────────────────────────────────

const COMPRESSION_UI_PROGRESS = 50

const MediaPreviewCard = ({
  image,
  onRemove,
}: {
  image: UploadingImage
  onRemove: (id: string) => void
}) => {
  const isVideo = image.mediaType === 'video'

  const statusLabel = {
    pending: '대기 중...',
    compressing: '압축 중...',
    uploading: '업로드 중...',
    done: '',
    error: image.error || '오류',
  }[image.status]

  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
      {isVideo ? (
        <>
          <video
            src={image.preview}
            title={`업로드된 미디어: ${image.file.name}`}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          {/* Video indicator badge */}
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 rounded text-white text-[10px] font-medium flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            동영상
          </div>
        </>
      ) : (
        <img src={image.preview} alt={`업로드된 미디어: ${image.file.name}`} className="w-full h-full object-cover" />
      )}

      {/* Progress overlay */}
      {(image.status === 'compressing' || image.status === 'uploading') && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
          <p className="text-white text-xs font-medium mb-2">{statusLabel}</p>
          <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-200"
              style={{
                width: `${
                  image.status === 'compressing'
                    ? (isVideo ? image.progress : COMPRESSION_UI_PROGRESS)
                    : image.progress
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {image.status === 'error' && (
        <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
          <p className="text-white text-xs font-medium px-2 text-center">{statusLabel}</p>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(image.id)}
        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <CloseIcon />
      </button>
    </div>
  )
}

const HashtagChip = ({ tag, onRemove }: { tag: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#EDF2FF] text-[#3B5BDB] text-sm rounded-full">
    #{tag}
    <button type="button" onClick={onRemove} className="hover:text-[#1C3FAA] transition-colors">
      <CloseIcon />
    </button>
  </span>
)

// ─── Main Component ──────────────────────────────────────

export const GalleryWritePage = () => {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hashtagInput, setHashtagInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [showChurches, setShowChurches] = useState(false)

  const {
    categories,
    subCategories,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    content,
    setContent,
    hashtags,
    addHashtag,
    removeHashtag,
    selectedChurches,
    toggleChurch,
    isAuthorPublic,
    setIsAuthorPublic,
    mediaItems,
    addMedia,
    removeMedia,
    churches,
    churchesLoading,
    handleSubmit,
    isSubmitting,
    submitError,
  } = useGalleryWrite()

  const canUploadImages = user?.role === 'LEADER' || user?.role === 'MASTER'

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const value = hashtagInput.replace(/,/g, '').trim()
      if (value) {
        addHashtag(value)
        setHashtagInput('')
      }
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = e.dataTransfer.files
      if (files.length > 0) addMedia(files)
    },
    [addMedia]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      addMedia(files)
      e.target.value = ''
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit()
  }

  // Auth guard
  if (!isLoggedIn) {
    return (
      <>
        <Header />
        <main className="pt-16 min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#666666] mb-4">로그인이 필요한 서비스입니다.</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-[#3B5BDB] text-white text-sm font-semibold rounded-lg hover:bg-[#364FC7] transition-colors"
            >
              로그인하기
            </button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-[#F8F9FA]">
        {/* Page Header */}
        <div className="bg-white px-4 sm:px-8 lg:px-[60px] pt-8 pb-6 border-b border-gray-100">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/gallery')}
              className="inline-flex items-center gap-1.5 text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors mb-4"
            >
              <ArrowLeftIcon />
              갤러리로 돌아가기
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">게시글 작성</h1>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 sm:px-8 lg:px-[60px] py-8">
          <form onSubmit={onSubmit} className="max-w-3xl mx-auto space-y-6">
            {/* Category Selection */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-[#1A1A1A]">카테고리 *</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#666666] mb-1.5">카테고리</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] transition-colors"
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#666666] mb-1.5">세부 카테고리</label>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    disabled={!selectedCategory}
                    className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                  >
                    <option value="">세부 카테고리 선택</option>
                    {subCategories.map((sub) => (
                      <option key={sub.name} value={sub.name}>
                        {sub.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-[#1A1A1A]">사진/동영상</h2>
              {canUploadImages ? (
                <>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-[#3B5BDB] bg-[#EDF2FF]'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <ImageIcon />
                    <p className="mt-3 text-sm text-[#666666]">
                      클릭하거나 파일을 드래그하여 업로드
                    </p>
                    <p className="mt-1 text-xs text-[#999999]">이미지(JPG, PNG, GIF, WebP, HEIC) · 동영상(MP4, MOV, WebM)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {mediaItems.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {mediaItems.map((image) => (
                        <MediaPreviewCard key={image.id} image={image} onRemove={removeMedia} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="border border-gray-200 rounded-xl p-6 text-center bg-gray-50">
                  <p className="text-sm text-[#666666]">
                    미디어 업로드는 리더 이상 권한이 필요합니다.
                  </p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-[#1A1A1A]">내용</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력해주세요..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-[#1A1A1A] placeholder-[#BBBBBB] resize-y focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] transition-colors"
              />
            </div>

            {/* Hashtags */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-[#1A1A1A]">해시태그</h2>
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                placeholder="태그 입력 후 Enter"
                className="w-full h-11 px-4 border border-gray-200 rounded-lg text-sm text-[#1A1A1A] placeholder-[#BBBBBB] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB] transition-colors"
              />
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <HashtagChip key={tag} tag={tag} onRemove={() => removeHashtag(tag)} />
                  ))}
                </div>
              )}
            </div>

            {/* Church Tags */}
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1A1A1A]">성전 태그</h2>
                <button
                  type="button"
                  onClick={() => setShowChurches(!showChurches)}
                  className="text-sm text-[#3B5BDB] hover:text-[#364FC7] font-medium transition-colors"
                >
                  {showChurches ? '접기' : '선택하기'}
                </button>
              </div>

              {selectedChurches.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedChurches.map((code) => {
                    const church = churches.find((c) => c.code === code)
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#F0F0F0] text-[#1A1A1A] text-sm rounded-full"
                      >
                        {church?.name || code}
                        <button
                          type="button"
                          onClick={() => toggleChurch(code)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <CloseIcon />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {showChurches && (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-3">
                  {churchesLoading ? (
                    <p className="text-sm text-[#999999] text-center py-4">불러오는 중...</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {churches.map((church) => (
                        <label
                          key={church.code}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChurches.includes(church.code)}
                            onChange={() => toggleChurch(church.code)}
                            className="w-4 h-4 text-[#3B5BDB] border-gray-300 rounded focus:ring-[#3B5BDB]"
                          />
                          <span className="text-sm text-[#1A1A1A]">{church.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Author Public Toggle */}
            <div className="bg-white rounded-2xl p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAuthorPublic}
                  onChange={(e) => setIsAuthorPublic(e.target.checked)}
                  className="w-5 h-5 text-[#3B5BDB] border-gray-300 rounded focus:ring-[#3B5BDB]"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-[#1A1A1A]">작성자 정보 공개</span>
                  <span className="text-xs text-[#999999]">
                    체크하지 않으면 작성자가 'GNTC YOUTH'로 표시됩니다.
                  </span>
                </div>
              </label>
            </div>

            {/* Error message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedSubCategory}
              className="w-full py-3.5 bg-[#3B5BDB] text-white text-base font-semibold rounded-xl hover:bg-[#364FC7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '등록 중...' : '게시글 등록'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
