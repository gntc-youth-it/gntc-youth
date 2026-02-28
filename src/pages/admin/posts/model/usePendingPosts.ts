import { useState, useCallback, useRef } from 'react'
import type { FeedPost } from '../../../gallery/model/types'
import { fetchPendingPosts } from '../api/adminPostApi'

const PAGE_SIZE = 4

export const usePendingPosts = () => {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(true)
  const cursorRef = useRef<number | null>(null)
  const isFetchingMoreRef = useRef(isFetchingMore)
  isFetchingMoreRef.current = isFetchingMore
  const hasNextRef = useRef(hasNext)
  hasNextRef.current = hasNext

  const loadPosts = useCallback(async (reset: boolean) => {
    if (reset) {
      setIsLoading(true)
      setPosts([])
      cursorRef.current = null
    } else {
      setIsFetchingMore(true)
    }

    try {
      const response = await fetchPendingPosts({
        size: PAGE_SIZE,
        cursor: reset ? null : cursorRef.current,
      })
      setPosts((prev) => (reset ? response.posts : [...prev, ...response.posts]))
      setHasNext(response.hasNext)
      cursorRef.current = response.nextCursor
      setError(null)
    } catch {
      setError('검수대기 게시글을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [])

  const loadFeed = useCallback(() => {
    loadPosts(true)
  }, [loadPosts])

  const loadMore = useCallback(() => {
    if (!isFetchingMoreRef.current && hasNextRef.current) {
      loadPosts(false)
    }
  }, [loadPosts])

  const removePost = useCallback((postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  return {
    posts,
    isLoading,
    isFetchingMore,
    error,
    hasNext,
    loadFeed,
    loadMore,
    removePost,
  }
}
