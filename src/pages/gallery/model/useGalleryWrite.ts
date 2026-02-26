import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { compressImage, compressVideo, isVideoCompressionSupported, uploadToS3 } from '../../../shared/lib'
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  VIDEO_COMPRESSION_OPTIONS,
} from '../../../shared/config/constants'
import {
  fetchCategories,
  fetchSubCategories,
  getPresignedUrl,
  createPost,
  fetchChurches,
} from '../api/galleryApi'
import type { Category, SubCategory, Church, UploadingImage } from './types'

const ACCEPTED_IMAGE_HEIC = 'image/heic'

function validateFile(file: File): string | null {
  const { type, size } = file
  const isImage = type.startsWith('image/')
  const isVideo = type.startsWith('video/')

  if (isImage) {
    if (![...ACCEPTED_IMAGE_TYPES, ACCEPTED_IMAGE_HEIC].includes(type)) {
      return '지원하지 않는 이미지 형식입니다.'
    }
    if (size > MAX_IMAGE_SIZE) {
      return `이미지 파일 크기는 ${MAX_IMAGE_SIZE / 1024 / 1024}MB를 초과할 수 없습니다.`
    }
  } else if (isVideo) {
    if (!ACCEPTED_VIDEO_TYPES.includes(type)) {
      return '지원하지 않는 동영상 형식입니다.'
    }
    if (size > MAX_VIDEO_SIZE) {
      return `동영상 파일 크기는 ${MAX_VIDEO_SIZE / 1024 / 1024}MB를 초과할 수 없습니다.`
    }
  } else {
    return '지원하지 않는 파일 형식입니다.'
  }

  return null
}

export const useGalleryWrite = () => {
  const navigate = useNavigate()

  // Category state
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubCategory, setSelectedSubCategory] = useState('')

  // Form state
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [selectedChurches, setSelectedChurches] = useState<string[]>([])
  const [isAuthorPublic, setIsAuthorPublic] = useState(false)

  // Media state
  const [mediaItems, setMediaItems] = useState<UploadingImage[]>([])
  const mediaItemsRef = useRef(mediaItems)
  mediaItemsRef.current = mediaItems

  // Churches
  const [churches, setChurches] = useState<Church[]>([])
  const [churchesLoading, setChurchesLoading] = useState(false)

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Track mounted state for async operations
  const mountedRef = useRef(true)

  // Fetch categories and churches on mount
  useEffect(() => {
    mountedRef.current = true

    const loadInitialData = async () => {
      try {
        const [categoriesData, churchesData] = await Promise.all([
          fetchCategories(),
          fetchChurches(),
        ])
        if (!mountedRef.current) return
        setCategories(categoriesData)
        setChurches(churchesData)
      } catch {
        // Silently handle - categories/churches will be empty
      } finally {
        if (mountedRef.current) setChurchesLoading(false)
      }
    }

    setChurchesLoading(true)
    loadInitialData()

    return () => {
      mountedRef.current = false
    }
  }, [])

  // Fetch sub-categories when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubCategories([])
      setSelectedSubCategory('')
      return
    }

    let cancelled = false

    const loadSubCategories = async () => {
      try {
        const data = await fetchSubCategories(selectedCategory)
        if (cancelled) return
        setSubCategories(data)
        setSelectedSubCategory('')
      } catch {
        if (!cancelled) setSubCategories([])
      }
    }

    loadSubCategories()

    return () => {
      cancelled = true
    }
  }, [selectedCategory])

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      mediaItemsRef.current.forEach((img) => URL.revokeObjectURL(img.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateMediaItem = useCallback((id: string, updates: Partial<UploadingImage>) => {
    setMediaItems((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)))
  }, [])

  const processFile = useCallback(
    async (uploadItem: UploadingImage) => {
      const { id, file, mediaType } = uploadItem

      try {
        // Compress
        updateMediaItem(id, { status: 'compressing', progress: 0 })

        let uploadBlob: Blob
        let uploadContentType: string

        if (mediaType === 'video') {
          if (isVideoCompressionSupported()) {
            const result = await compressVideo(file, {
              ...VIDEO_COMPRESSION_OPTIONS,
              onProgress: (progress) => {
                if (mountedRef.current) {
                  updateMediaItem(id, { progress })
                }
              },
            })
            uploadBlob = result.blob
            uploadContentType = 'video/mp4'
          } else {
            // WASM 미지원 시 원본 그대로 업로드
            uploadBlob = file
            uploadContentType = file.type
          }
        } else {
          const { blob } = await compressImage(file)
          uploadBlob = blob
          uploadContentType = blob.type
        }

        if (!mountedRef.current) return

        // Get presigned URL
        updateMediaItem(id, { status: 'uploading', progress: 0 })
        const ext = mediaType === 'video' ? 'mp4' : (uploadContentType.split('/')[1] || 'webp')
        const filename = file.name.replace(/\.[^/.]+$/, '') + `.${ext}`

        const { fileId, presignedUrl } = await getPresignedUrl({
          filename,
          contentType: uploadContentType,
          fileSize: uploadBlob.size,
        })

        if (!mountedRef.current) return

        // Upload to S3
        await uploadToS3(presignedUrl, uploadBlob, uploadContentType, {
          onProgress: (progress) => {
            if (mountedRef.current) {
              updateMediaItem(id, { progress })
            }
          },
        })

        if (!mountedRef.current) return

        updateMediaItem(id, { status: 'done', progress: 100, fileId })
      } catch (err) {
        if (mountedRef.current) {
          updateMediaItem(id, {
            status: 'error',
            error: err instanceof Error ? err.message : '업로드에 실패했습니다.',
          })
        }
      }
    },
    [updateMediaItem]
  )

  const addMedia = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const newItems: UploadingImage[] = fileArray.map((file) => {
        const validationError = validateFile(file)
        const isVideo = file.type.startsWith('video/')

        return {
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: validationError ? ('error' as const) : ('pending' as const),
          error: validationError ?? undefined,
          mediaType: isVideo ? ('video' as const) : ('image' as const),
        }
      })

      setMediaItems((prev) => [...prev, ...newItems])

      // Start upload pipeline only for valid files
      newItems
        .filter((item) => item.status !== 'error')
        .forEach((item) => processFile(item))
    },
    [processFile]
  )

  const removeMedia = useCallback((id: string) => {
    setMediaItems((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((img) => img.id !== id)
    })
  }, [])

  const addHashtag = useCallback((tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    setHashtags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
  }, [])

  const removeHashtag = useCallback((tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const toggleChurch = useCallback((churchCode: string) => {
    setSelectedChurches((prev) =>
      prev.includes(churchCode) ? prev.filter((c) => c !== churchCode) : [...prev, churchCode]
    )
  }, [])

  const handleSubmit = useCallback(async () => {
    setSubmitError(null)

    if (!selectedSubCategory) {
      setSubmitError('카테고리를 선택해주세요.')
      return
    }

    const hasUploading = mediaItems.some((img) => img.status === 'compressing' || img.status === 'uploading')
    if (hasUploading) {
      setSubmitError('미디어 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const imageIds = mediaItems
        .filter((img) => img.status === 'done' && img.fileId != null)
        .map((img) => img.fileId!)

      await createPost({
        subCategory: selectedSubCategory,
        content: content || undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        churches: selectedChurches.length > 0 ? selectedChurches : undefined,
        imageIds: imageIds.length > 0 ? imageIds : undefined,
        isAuthorPublic: isAuthorPublic || undefined,
      })

      navigate('/gallery')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '게시글 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedSubCategory, mediaItems, content, hashtags, selectedChurches, isAuthorPublic, navigate])

  return {
    // Categories
    categories,
    subCategories,
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,

    // Form
    content,
    setContent,
    hashtags,
    addHashtag,
    removeHashtag,
    selectedChurches,
    toggleChurch,
    isAuthorPublic,
    setIsAuthorPublic,

    // Media
    mediaItems,
    addMedia,
    removeMedia,

    // Churches
    churches,
    churchesLoading,

    // Submit
    handleSubmit,
    isSubmitting,
    submitError,
  }
}
