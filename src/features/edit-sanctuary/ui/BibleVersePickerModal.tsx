import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../../shared/ui'
import {
  fetchBibleBooks,
  fetchChapterCount,
  fetchVerses,
} from '../api/bibleApi'
import type { BibleBook, BibleVerse } from '../api/bibleApi'

interface BibleVersePickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (verse: SelectedVerse) => void
}

export interface SelectedVerse {
  verseId: number
  bookCode?: string
  bookName: string
  chapter: number
  verseNumber: number
  content: string
}

type Step = 'book' | 'chapter' | 'verse'

export const BibleVersePickerModal = ({
  open,
  onOpenChange,
  onSelect,
}: BibleVersePickerModalProps) => {
  const [step, setStep] = useState<Step>('book')
  const [books, setBooks] = useState<BibleBook[]>([])
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null)
  const [chapterCount, setChapterCount] = useState(0)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep('book')
    setSelectedBook(null)
    setChapterCount(0)
    setSelectedChapter(null)
    setVerses([])
    setError(null)
  }, [])

  // 모달 열릴 때 책 목록 로드
  useEffect(() => {
    if (!open) return
    reset()
    setLoading(true)
    fetchBibleBooks()
      .then(setBooks)
      .catch((err) => {
        console.error('성경 목록을 불러오지 못했습니다:', err)
        setError('성경 목록을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [open, reset])

  const handleSelectBook = async (book: BibleBook) => {
    setSelectedBook(book)
    setError(null)
    setLoading(true)
    try {
      const count = await fetchChapterCount(book.bookCode)
      setChapterCount(count)
      setStep('chapter')
    } catch (err) {
      console.error('장 정보를 불러오지 못했습니다:', err)
      setError('장 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChapter = async (chapter: number) => {
    if (!selectedBook) return
    setSelectedChapter(chapter)
    setError(null)
    setLoading(true)
    try {
      const v = await fetchVerses(selectedBook.bookCode, chapter)
      setVerses(v)
      setStep('verse')
    } catch (err) {
      console.error('말씀을 불러오지 못했습니다:', err)
      setError('말씀을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectVerse = (verse: BibleVerse) => {
    if (!selectedBook || selectedChapter === null) return
    onSelect({
      verseId: verse.verseId,
      bookCode: selectedBook.bookCode,
      bookName: selectedBook.bookName,
      chapter: selectedChapter,
      verseNumber: verse.verseNumber,
      content: verse.content,
    })
    onOpenChange(false)
  }

  const handleBack = () => {
    setError(null)
    if (step === 'verse') {
      setStep('chapter')
      setVerses([])
      setSelectedChapter(null)
    } else if (step === 'chapter') {
      setStep('book')
      setSelectedBook(null)
      setChapterCount(0)
    }
  }

  const stepTitle = () => {
    if (step === 'book') return '성경 선택'
    if (step === 'chapter') return `${selectedBook?.bookName} — 장 선택`
    return `${selectedBook?.bookName} ${selectedChapter}장 — 절 선택`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] p-0 gap-0 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex flex-col gap-1 px-8 pt-8 pb-6">
          <div className="flex items-center gap-3">
            {step !== 'book' && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 -ml-1.5 text-[#666666] hover:text-[#333333] hover:bg-gray-100 rounded-md transition-colors"
                aria-label="뒤로가기"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <DialogTitle className="text-xl font-bold text-[#1A1A1A]">
              {stepTitle()}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[#666666]">
            주제 말씀으로 사용할 구절을 선택하세요
          </DialogDescription>
        </div>

        {/* Error */}
        {error && (
          <div className="px-8 pb-4">
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg">
              {error}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#3B5BDB] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[#666666]">불러오는 중...</span>
              </div>
            </div>
          ) : step === 'book' ? (
            <div className="grid grid-cols-4 gap-2">
              {books.map((book) => (
                <button
                  key={book.bookCode}
                  type="button"
                  onClick={() => handleSelectBook(book)}
                  className="px-3 py-2.5 text-sm text-[#333333] bg-[#F8F9FA] rounded-lg hover:bg-[#E8EAED] hover:text-[#3B5BDB] transition-colors text-center truncate"
                >
                  {book.bookName}
                </button>
              ))}
            </div>
          ) : step === 'chapter' ? (
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: chapterCount }, (_, i) => i + 1).map(
                (ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleSelectChapter(ch)}
                    className="h-11 text-sm font-medium text-[#333333] bg-[#F8F9FA] rounded-lg hover:bg-[#3B5BDB] hover:text-white transition-colors"
                  >
                    {ch}장
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {verses.map((verse) => (
                <button
                  key={verse.verseId}
                  type="button"
                  onClick={() => handleSelectVerse(verse)}
                  className="flex gap-3 px-4 py-3 text-left bg-[#F8F9FA] rounded-lg hover:bg-[#EDF2FF] hover:ring-1 hover:ring-[#3B5BDB] transition-all group"
                >
                  <span className="text-sm font-semibold text-[#3B5BDB] flex-shrink-0 mt-0.5">
                    {verse.verseNumber}
                  </span>
                  <span className="text-sm text-[#333333] leading-relaxed group-hover:text-[#1A1A1A]">
                    {verse.content}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
