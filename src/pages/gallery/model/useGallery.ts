import { useState, useMemo } from 'react'
import type { GalleryCategory } from './types'
import { MOCK_ALBUMS } from './mockData'

export const useGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('ALL')

  const filteredAlbums = useMemo(() => {
    if (selectedCategory === 'ALL') return MOCK_ALBUMS
    return MOCK_ALBUMS.filter((album) => album.category === selectedCategory)
  }, [selectedCategory])

  return {
    albums: filteredAlbums,
    isLoading: false,
    error: null,
    selectedCategory,
    setSelectedCategory,
  }
}
