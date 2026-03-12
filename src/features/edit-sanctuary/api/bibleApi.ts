import { apiRequest } from '../../../shared/api'

export interface BibleBook {
  bookCode: string
  bookName: string
  order: number
}

interface BooksResponse {
  books: BibleBook[]
}

interface ChaptersResponse {
  chapters: number
}

export interface BibleVerse {
  verseId: number
  verseNumber: number
  content: string
}

interface VersesResponse {
  verses: BibleVerse[]
}

export async function fetchBibleBooks(): Promise<BibleBook[]> {
  const data = await apiRequest<BooksResponse>('/book')
  return data.books
}

export async function fetchChapterCount(bookCode: string): Promise<number> {
  const data = await apiRequest<ChaptersResponse>(`/book/${bookCode}`)
  return data.chapters
}

export async function fetchVerses(bookCode: string, chapter: number): Promise<BibleVerse[]> {
  const data = await apiRequest<VersesResponse>(`/book/${bookCode}/${chapter}`)
  return data.verses
}
