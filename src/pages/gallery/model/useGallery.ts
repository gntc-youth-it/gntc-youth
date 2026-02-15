import { useState, useEffect, useMemo } from 'react'
import { fetchGalleryAlbums } from '../api/galleryApi'
import type { GalleryAlbum, GalleryCategory } from './types'

export const useGallery = () => {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('ALL')

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        setIsLoading(true)
        const data = await fetchGalleryAlbums()
        setAlbums(data.albums)
      } catch (err) {
        console.error('갤러리 앨범 로딩 실패:', err)
        setError('갤러리를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAlbums()
  }, [])

  const filteredAlbums = useMemo(() => {
    if (selectedCategory === 'ALL') return albums
    return albums.filter((album) => album.category === selectedCategory)
  }, [albums, selectedCategory])

  return {
    albums: filteredAlbums,
    isLoading,
    error,
    selectedCategory,
    setSelectedCategory,
  }
}
