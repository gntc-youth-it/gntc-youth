import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../features/auth'
import { Header } from '../../../../widgets/header'
import { Footer } from '../../../../widgets/footer'
import { useInfiniteScroll } from '../../../../shared/lib'
import { usePendingPosts } from '../model/usePendingPosts'
import { approvePost } from '../api/adminPostApi'
import { deletePost } from '../../../gallery/api/galleryApi'
import { PendingFeedCard } from './components/PendingFeedCard'
import { ConfirmModal } from './components/ConfirmModal'
import { MediaLightbox } from './components/MediaLightbox'

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
