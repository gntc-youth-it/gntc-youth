import { useState, useCallback, useRef } from 'react'
import type { FeedPost } from './types'
import { fetchFeedPosts } from '../api/galleryApi'

const FEED_PAGE_SIZE = 4

export const useFeed = () => {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(true)
  const cursorRef = useRef<number | null>(null)
  const loadedRef = useRef(false)
  const isFetchingMoreRef = useRef(isFetchingMore)
  isFetchingMoreRef.current = isFetchingMore
  const hasNextRef = useRef(hasNext)
  hasNextRef.current = hasNext

  const loadPosts = useCallback(async (reset: boolean, opts?: { subCategory?: string; churchId?: string }) => {
    if (reset) {
      setIsLoading(true)
      setPosts([])
      cursorRef.current = null
    } else {
      setIsFetchingMore(true)
    }

    try {
      const response = await fetchFeedPosts({
        size: FEED_PAGE_SIZE,
        cursor: reset ? null : cursorRef.current,
        subCategory: opts?.subCategory,
        churchId: opts?.churchId,
      })
      setPosts((prev) => (reset ? response.posts : [...prev, ...response.posts]))
      setHasNext(response.hasNext)
      cursorRef.current = response.nextCursor
      setError(null)
    } catch {
      setError('피드를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [])

  const loadFeed = useCallback(
    (opts?: { subCategory?: string; churchId?: string }) => {
      loadedRef.current = true
      loadPosts(true, opts)
    },
    [loadPosts],
  )

  const loadMore = useCallback(
    (opts?: { subCategory?: string; churchId?: string }) => {
      if (!isFetchingMoreRef.current && hasNextRef.current) {
        loadPosts(false, opts)
      }
    },
    [loadPosts],
  )

  const reset = useCallback(() => {
    setPosts([])
    cursorRef.current = null
    setHasNext(true)
    setError(null)
    loadedRef.current = false
  }, [])

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
    reset,
    removePost,
    loaded: loadedRef.current,
  }
}
