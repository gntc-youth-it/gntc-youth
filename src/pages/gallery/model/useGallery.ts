import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChurchOption, GalleryCategory, GalleryPhotoItem, SubCategory } from './types'
import { fetchChurches, fetchGalleryPhotos, fetchSubCategories } from '../api/galleryApi'

const PAGE_SIZE = 20
const DEFAULT_CHURCH_ID = 'ANYANG'

export const useGallery = (userChurchId?: string) => {
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

  // 성전별 상태
  const [selectedChurchId, setSelectedChurchId] = useState<string>(userChurchId ?? DEFAULT_CHURCH_ID)
  const churchIdInitialized = useRef(false)
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([])
  const [isLoadingChurches, setIsLoadingChurches] = useState(false)

  // 유저 정보가 비동기로 로드된 경우 성전 기본값 동기화
  useEffect(() => {
    if (userChurchId && !churchIdInitialized.current) {
      churchIdInitialized.current = true
      setSelectedChurchId(userChurchId)
    }
  }, [userChurchId])

  const loadPhotos = useCallback(async (reset: boolean, opts?: { subCategory?: string; churchId?: string }) => {
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
        subCategory: opts?.subCategory,
        churchId: opts?.churchId,
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
            loadPhotos(true, { subCategory: first })
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
    } else if (selectedCategory === 'CHURCH') {
      setSubCategories([])
      setSelectedSubCategory(null)
      loadPhotos(true, { churchId: selectedChurchId })
      // 성전 목록이 아직 로드되지 않은 경우 API에서 가져옴
      if (churchOptions.length === 0) {
        setIsLoadingChurches(true)
        fetchChurches()
          .then((churches) => {
            setChurchOptions(churches.map((c) => ({ id: c.code, name: c.name })))
          })
          .catch(() => {
            // 실패 시 무시 (사진 로딩에는 영향 없음)
          })
          .finally(() => {
            setIsLoadingChurches(false)
          })
      }
    }
  }, [selectedCategory, loadPhotos, selectedChurchId])

  // 서브카테고리 선택 변경 시 사진 다시 로드
  const selectSubCategory = useCallback(
    (subCategoryName: string) => {
      setSelectedSubCategory(subCategoryName)
      loadPhotos(true, { subCategory: subCategoryName })
    },
    [loadPhotos],
  )

  // 성전 선택 변경
  const selectChurch = useCallback(
    (churchId: string) => {
      churchIdInitialized.current = true
      setSelectedChurchId(churchId)
    },
    [],
  )

  const loadMore = useCallback(() => {
    if (!isFetchingMore && hasNext) {
      if (selectedCategory === 'CHURCH') {
        loadPhotos(false, { churchId: selectedChurchId })
      } else {
        loadPhotos(false, { subCategory: selectedSubCategory ?? undefined })
      }
    }
  }, [isFetchingMore, hasNext, loadPhotos, selectedSubCategory, selectedCategory, selectedChurchId])

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
    // 성전별
    selectedChurchId,
    selectChurch,
    churchOptions,
    isLoadingChurches,
  }
}
