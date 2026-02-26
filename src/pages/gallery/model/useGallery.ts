import { useState, useCallback, useEffect, useRef } from 'react'
import type { GalleryCategory, GalleryPhotoItem, SubCategory } from './types'
import { fetchGalleryPhotos, fetchSubCategories } from '../api/galleryApi'

const PAGE_SIZE = 20

export const useGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('ALL')
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(true)
  const cursorRef = useRef<number | null>(null)

  // 수련회 서브카테고리 상태
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState(false)

  const loadPhotos = useCallback(async (reset: boolean, subCategory?: string) => {
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
        subCategory,
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

  // 카테고리 변경 시 처리
  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setSubCategories([])
      setSelectedSubCategory(null)
      loadPhotos(true)
    } else if (selectedCategory === 'RETREAT') {
      ;(async () => {
        setIsLoadingSubCategories(true)
        setIsLoading(true)
        try {
          const subs = await fetchSubCategories('RETREAT')
          setSubCategories(subs)
          if (subs.length > 0) {
            const first = subs[0].name
            setSelectedSubCategory(first)
            loadPhotos(true, first)
          } else {
            setPhotos([])
            setIsLoading(false)
          }
        } catch {
          setError('카테고리를 불러오는데 실패했습니다.')
          setIsLoading(false)
        } finally {
          setIsLoadingSubCategories(false)
        }
      })()
    }
  }, [selectedCategory, loadPhotos])

  // 서브카테고리 선택 변경 시 사진 다시 로드
  const selectSubCategory = useCallback(
    (subCategoryName: string) => {
      setSelectedSubCategory(subCategoryName)
      loadPhotos(true, subCategoryName)
    },
    [loadPhotos],
  )

  const loadMore = useCallback(() => {
    if (!isFetchingMore && hasNext) {
      loadPhotos(false, selectedSubCategory ?? undefined)
    }
  }, [isFetchingMore, hasNext, loadPhotos, selectedSubCategory])

  return {
    photos,
    isLoading,
    isFetchingMore,
    error,
    hasNext,
    loadMore,
    selectedCategory,
    setSelectedCategory,
    // 수련회 서브카테고리
    subCategories,
    selectedSubCategory,
    selectSubCategory,
    isLoadingSubCategories,
  }
}
