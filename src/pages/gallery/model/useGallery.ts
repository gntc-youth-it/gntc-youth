import { useState, useCallback, useEffect, useRef } from 'react'
import type { GalleryCategory, GalleryPhotoItem } from './types'
import { fetchGalleryPhotos } from '../api/galleryApi'

const PAGE_SIZE = 20

export const useGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('ALL')
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(true)
  const cursorRef = useRef<number | null>(null)

  const loadPhotos = useCallback(async (reset: boolean) => {
    if (reset) {
      setIsLoading(true)
      setPhotos([])
      cursorRef.current = null
    } else {
      setIsFetchingMore(true)
    }

    try {
      const response = await fetchGalleryPhotos({
        size: PAGE_SIZE,
        cursor: reset ? null : cursorRef.current,
      })
      setPhotos((prev) => (reset ? response.images : [...prev, ...response.images]))
      setHasNext(response.hasNext)
      cursorRef.current = response.nextCursor
      setError(null)
    } catch (err) {
      setError('사진을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [])

  useEffect(() => {
    loadPhotos(true)
  }, [loadPhotos])

  const loadMore = useCallback(() => {
    if (!isFetchingMore && hasNext) {
      loadPhotos(false)
    }
  }, [isFetchingMore, hasNext, loadPhotos])

  return {
    photos,
    isLoading,
    isFetchingMore,
    error,
    hasNext,
    loadMore,
    selectedCategory,
    setSelectedCategory,
  }
}
