import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChurchOption, GalleryCategory, GalleryPhotoItem, SubCategory } from './types'
import { fetchChurches, fetchGalleryPhotos, fetchSubCategories } from '../api/galleryApi'

const PAGE_SIZE = 20
const DEFAULT_CHURCH_ID = 'ANYANG'

export const useGallery = (userChurchId?: string, initialCategory?: GalleryCategory, initialChurchId?: string) => {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>(initialCategory ?? 'ALL')
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(true)
  const cursorRef = useRef<number | null>(null)
  // 요청 에포크: 필터 전환 등으로 새 요청이 시작되면 이전 요청의 응답은 무시
  const photoRequestRef = useRef(0)

  // 수련회 서브카테고리 상태
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState(false)

  // 하위 프로그램 상태 (null = 전체 보기)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)

  // 성전별 상태
  const [selectedChurchId, setSelectedChurchId] = useState<string>(initialChurchId ?? userChurchId ?? DEFAULT_CHURCH_ID)
  const churchIdInitialized = useRef(!!initialChurchId)
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
    const requestId = ++photoRequestRef.current
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
      if (requestId !== photoRequestRef.current) return
      setPhotos((prev) => (reset ? response.images : [...prev, ...response.images]))
      setHasNext(response.hasNext)
      cursorRef.current = response.nextCursor
      setError(null)
    } catch (err) {
      if (requestId !== photoRequestRef.current) return
      setError('사진을 불러오는데 실패했습니다.')
    } finally {
      if (requestId === photoRequestRef.current) {
        setIsLoading(false)
        setIsFetchingMore(false)
      }
    }
  }, [])

  // 카테고리 변경 시 처리
  useEffect(() => {
    setSelectedProgram(null)
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

  // 서브카테고리 선택 변경 시 사진 다시 로드 (프로그램 선택은 초기화)
  const selectSubCategory = useCallback(
    (subCategoryName: string) => {
      setSelectedSubCategory(subCategoryName)
      setSelectedProgram(null)
      loadPhotos(true, { subCategory: subCategoryName })
    },
    [loadPhotos],
  )

  // 하위 프로그램 선택 변경 시 사진 다시 로드 (null = 수련회 전체)
  const selectProgram = useCallback(
    (programName: string | null) => {
      setSelectedProgram(programName)
      loadPhotos(true, { subCategory: programName ?? selectedSubCategory ?? undefined })
    },
    [loadPhotos, selectedSubCategory],
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
        loadPhotos(false, { subCategory: selectedProgram ?? selectedSubCategory ?? undefined })
      }
    }
  }, [isFetchingMore, hasNext, loadPhotos, selectedProgram, selectedSubCategory, selectedCategory, selectedChurchId])

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
    // 하위 프로그램
    selectedProgram,
    selectProgram,
    // 성전별
    selectedChurchId,
    selectChurch,
    churchOptions,
    isLoadingChurches,
  }
}
