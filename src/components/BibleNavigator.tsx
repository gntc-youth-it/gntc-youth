import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { BookListResponse, ChapterListResponse } from '../types/bible';
import './BibleNavigator.css';

interface BibleNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook?: string;
  currentChapter?: number;
}

const BibleNavigator: React.FC<BibleNavigatorProps> = ({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
}) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookListResponse['books']>([]);
  const [selectedBookCode, setSelectedBookCode] = useState<string | null>(null);
  const [chapterData, setChapterData] = useState<ChapterListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 책 목록 로드
  useEffect(() => {
    if (isOpen) {
      fetchBooks();
    }
  }, [isOpen]);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<BookListResponse>('/book');
      console.log('Books data:', data);
      console.log('First book:', data.books[0]);
      setBooks(data.books);
    } catch (error) {
      console.error('Failed to fetch books:', error);
      alert('책 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSelect = async (bookCode: string) => {
    setSelectedBookCode(bookCode);
    setIsLoading(true);
    try {
      const data = await apiRequest<ChapterListResponse>(`/book/${bookCode}`);
      console.log('Chapter data:', data);
      setChapterData(data);
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
      alert('장 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChapterSelect = (chapter: number) => {
    if (selectedBookCode) {
      navigate(`/bible/transcribe/${selectedBookCode}/${chapter}`);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedBookCode(null);
    setChapterData(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedBookCode(null);
    setChapterData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="bible-navigator-overlay" onClick={handleClose}>
      <div className="bible-navigator-content" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="bible-navigator-header">
          {selectedBookCode && (
            <button className="bible-nav-back" onClick={handleBack}>
              ← 뒤로
            </button>
          )}
          <h2 className="bible-navigator-title">
            성경 선택
          </h2>
          <button className="bible-nav-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* 내용 */}
        <div className="bible-navigator-body">
          {isLoading ? (
            <div className="bible-nav-loading">
              <div className="spinner"></div>
              <p>불러오는 중...</p>
            </div>
          ) : selectedBookCode && chapterData ? (
            // 장 목록
            <div className="chapter-grid">
              {Array.from({ length: chapterData.chapters }, (_, i) => i + 1).map((chapter) => {
                const isMission = chapterData.mission_chapters.includes(chapter);
                const isCurrent = selectedBookCode === currentBook && chapter === currentChapter;
                return (
                  <button
                    key={chapter}
                    className={`chapter-button ${isMission ? 'mission' : ''} ${isCurrent ? 'current' : ''}`}
                    onClick={() => handleChapterSelect(chapter)}
                  >
                    {isMission && <span className="chapter-heart">💗</span>}
                    {chapter}장
                  </button>
                );
              })}
            </div>
          ) : (
            // 책 목록
            <div className="book-list">
              {books.map((book) => {
                const isCurrent = book.book_code === currentBook;
                return (
                  <button
                    key={book.book_code}
                    className={`book-button ${book.is_mission ? 'mission' : ''} ${isCurrent ? 'current' : ''}`}
                    onClick={() => handleBookSelect(book.book_code)}
                  >
                    {book.is_mission && <span className="book-heart">💗</span>}
                    <span className="book-name">{book.book_name}</span>
                    <span className="book-arrow">→</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BibleNavigator;
