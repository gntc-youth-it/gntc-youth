import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { compressImage, uploadToS3 } from '../../../shared/lib'
import {
  fetchCategories,
  fetchSubCategories,
  getPresignedUrl,
  createPost,
  fetchChurches,
} from '../api/galleryApi'
import type { Category, SubCategory, Church, UploadingImage } from './types'

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

  // Image state
  const [images, setImages] = useState<UploadingImage[]>([])
  const imagesRef = useRef(images)
  imagesRef.current = images

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
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateImage = useCallback((id: string, updates: Partial<UploadingImage>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)))
  }, [])

  const processImage = useCallback(
    async (uploadImage: UploadingImage) => {
      const { id, file } = uploadImage

      try {
        // Compress
        updateImage(id, { status: 'compressing', progress: 0 })
        const { blob } = await compressImage(file)

        if (!mountedRef.current) return

        // Get presigned URL
        updateImage(id, { status: 'uploading', progress: 0 })
        const { fileId, presignedUrl } = await getPresignedUrl({
          filename: file.name,
          contentType: blob.type,
          fileSize: blob.size,
        })

        if (!mountedRef.current) return

        // Upload to S3
        await uploadToS3(presignedUrl, blob, blob.type, {
          onProgress: (progress) => {
            if (mountedRef.current) {
              updateImage(id, { progress })
            }
          },
        })

        if (!mountedRef.current) return

        updateImage(id, { status: 'done', progress: 100, fileId })
      } catch (err) {
        if (mountedRef.current) {
          updateImage(id, {
            status: 'error',
            error: err instanceof Error ? err.message : '업로드에 실패했습니다.',
          })
        }
      }
    },
    [updateImage]
  )

  const addImages = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const newImages: UploadingImage[] = fileArray.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending' as const,
      }))

      setImages((prev) => [...prev, ...newImages])

      // Start upload pipeline for each new image
      newImages.forEach((img) => processImage(img))
    },
    [processImage]
  )

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
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

    const hasUploading = images.some((img) => img.status === 'compressing' || img.status === 'uploading')
    if (hasUploading) {
      setSubmitError('이미지 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const imageIds = images
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
  }, [selectedSubCategory, images, content, hashtags, selectedChurches, isAuthorPublic, navigate])

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

    // Images
    images,
    addImages,
    removeImage,

    // Churches
    churches,
    churchesLoading,

    // Submit
    handleSubmit,
    isSubmitting,
    submitError,
  }
}
