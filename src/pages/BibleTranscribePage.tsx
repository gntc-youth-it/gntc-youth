import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { BookName, BOOK_INFO, ChapterResponse, VerseItem } from '../types/bible';
import BibleNavigator from '../components/BibleNavigator';
import Modal from '../components/Modal';
import './BibleTranscribePage.css';

interface Verse {
  id: number;
  number: number;
  text: string;
  isMission: boolean;
  isCompleted: boolean;
}

const BibleTranscribePage: React.FC = () => {
  const navigate = useNavigate();
  const { bookName, chapter } = useParams<{ bookName: string; chapter: string }>();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [heartSmokes, setHeartSmokes] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [isInputPanelOpen, setIsInputPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [debouncedMatchStatus, setDebouncedMatchStatus] = useState<'typing' | 'correct' | 'wrong'>('typing');
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = verses.filter(v => v.isCompleted).length;
  const progress = verses.length > 0 ? (completedCount / verses.length) * 100 : 0;

  // 책 이름 표시용
  const displayBookName = bookName && bookName in BookName
    ? BOOK_INFO[bookName as BookName].displayName
    : bookName;

  // API에서 장 데이터 가져오기
  useEffect(() => {
    const fetchChapter = async () => {
      if (!bookName || !chapter) {
        navigate('/bible/main');
        return;
      }

      setIsLoading(true);
      try {
        const data = await apiRequest<ChapterResponse>(`/book/${bookName}/${chapter}`);

        console.log('API Response:', data);
        console.log('First verse raw:', data.verses[0]);

        // API 응답을 Verse 형식으로 변환
        const versesData: Verse[] = data.verses.map((v: VerseItem) => ({
          id: v.verse_id,
          number: v.verse_number,
          text: v.content,
          isMission: v.is_mission,
          isCompleted: v.is_copied,
        }));

        console.log('Mapped verses:', versesData);
        setVerses(versesData);
      } catch (error) {
        console.error('Failed to fetch chapter:', error);
        setModalMessage('성경 데이터를 불러오는데 실패했습니다.');
        setIsModalOpen(true);
        // 에러 발생 시 메인 페이지로 이동
        setTimeout(() => navigate('/bible/main'), 100);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [bookName, chapter, navigate]);

  // selectedVerse가 변경될 때마다 input에 자동 포커스 (모바일 키보드 유지)
  useEffect(() => {
    if (isInputPanelOpen && selectedVerse !== null && inputRef.current) {
      // drawer가 열릴 때만 포커스
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isInputPanelOpen, selectedVerse]);

  // selectedVerse가 변경될 때마다 해당 구절로 스크롤 (모바일 UX 개선)
  useEffect(() => {
    if (selectedVerse !== null) {
      const verseElement = document.querySelector(`[data-verse-number="${selectedVerse}"]`);
      if (verseElement) {
        verseElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  }, [selectedVerse]);

  // 페이지 전체에서 복사 방지 (성경 필사 서비스 본질 유지)
  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setModalMessage('성경 필사 서비스는 직접 타이핑하여 말씀을 새기는 것을 목적으로 합니다.');
      setIsModalOpen(true);
    };

    document.addEventListener('copy', preventCopy);

    return () => {
      document.removeEventListener('copy', preventCopy);
    };
  }, []);

  // 입력 검증 디바운싱 (0.3초 후 검사)
  useEffect(() => {
    // 입력이 없거나 선택된 구절이 없으면 'typing' 상태로 초기화
    if (!inputText || !selectedVerse) {
      setDebouncedMatchStatus('typing');
      return;
    }

    // 0.3초 후 검증 실행
    const debounceTimer = setTimeout(() => {
      const verse = verses.find(v => v.number === selectedVerse);
      if (!verse) {
        setDebouncedMatchStatus('typing');
        return;
      }

      const normalizedInput = inputText.trim().replace(/\s+/g, '');
      const normalizedOriginal = verse.text.replace(/\s+/g, '');

      if (normalizedOriginal.startsWith(normalizedInput)) {
        setDebouncedMatchStatus('correct');
      } else {
        setDebouncedMatchStatus('wrong');
      }
    }, 300); // 0.3초 디바운스

    // 클린업: 타이머 취소
    return () => clearTimeout(debounceTimer);
  }, [inputText, selectedVerse, verses]);

  const handleVerseClick = (verseNumber: number) => {
    const verse = verses.find(v => v.number === verseNumber);
    console.log('Clicked verse:', verseNumber, 'verse data:', verse);
    if (verse && !verse.isCompleted) {
      setIsInputPanelOpen(true);
      setSelectedVerse(verseNumber);
      setInputText('');
      setDebouncedMatchStatus('typing'); // 새 구절 선택 시 상태 초기화
      // input 포커스는 useEffect에서 자동 처리
    } else {
      console.log('Cannot select verse - isCompleted:', verse?.isCompleted);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleComplete = async () => {
    if (selectedVerse === null) return;

    const verse = verses.find(v => v.number === selectedVerse);
    if (!verse) return;

    // 입력한 텍스트가 원본과 일치하는지 확인
    const normalizedInput = inputText.trim().replace(/\s+/g, '');
    const normalizedOriginal = verse.text.replace(/\s+/g, '');

    if (normalizedInput === normalizedOriginal) {
      // 정답! 구절 완료 처리
      try {
        // 서버에 필사 완료 POST 요청
        await apiRequest(`/book/copy/${verse.id}`, { method: 'POST' });

        // 미션 구절이면 하트 연기 효과 발동!
        if (verse.isMission) {
          triggerHeartSmoke();
        }

        setVerses(verses.map(v =>
          v.number === selectedVerse ? { ...v, isCompleted: true } : v
        ));

        // 다음 미완료 구절 자동 선택
        const nextVerse = verses.find(v => v.number > selectedVerse && !v.isCompleted);
        if (nextVerse) {
          // drawer는 유지하고 내용만 변경 (키보드 유지)
          setSelectedVerse(nextVerse.number);
          setInputText('');
          setDebouncedMatchStatus('typing'); // 다음 구절로 이동 시 상태 초기화
        } else {
          // 모든 구절 완료 시에만 drawer 닫기
          setIsInputPanelOpen(false);
          setSelectedVerse(null);
          setInputText('');
          setDebouncedMatchStatus('typing'); // 완료 시 상태 초기화
        }
      } catch (error) {
        console.error('Failed to save progress:', error);
        setModalMessage('저장에 실패했습니다. 다시 시도해주세요.');
        setIsModalOpen(true);
      }
    } else {
      setModalMessage('정확하게 입력해주세요!');
      setIsModalOpen(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isModalOpen) {
      handleComplete();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setModalMessage('붙여넣기는 사용할 수 없습니다. 직접 입력해주세요.');
    setIsModalOpen(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    setModalMessage('드래그 앤 드롭은 사용할 수 없습니다. 직접 입력해주세요.');
    setIsModalOpen(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const triggerHeartSmoke = () => {
    // 여러 개의 하트를 랜덤 위치에서 생성
    const newHearts = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * window.innerWidth,
      y: window.innerHeight * 0.4 + Math.random() * 200, // 화면 중앙 근처에서 시작
    }));

    setHeartSmokes(prev => [...prev, ...newHearts]);

    // 2초 후 제거 (애니메이션 끝나는 시간)
    setTimeout(() => {
      setHeartSmokes(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 2000);
  };

  // getMatchStatus 함수는 디바운싱 로직으로 대체되어 더 이상 필요하지 않음

  // 이전/다음 장 존재 여부 확인
  const hasPrevChapter = () => {
    if (!bookName || !chapter) return false;
    const chapterNum = parseInt(chapter);
    return chapterNum > 1;
  };

  const hasNextChapter = () => {
    if (!bookName || !chapter) return false;
    const chapterNum = parseInt(chapter);
    const bookInfo = BOOK_INFO[bookName as BookName];
    return bookInfo && chapterNum < bookInfo.chapters;
  };

  // 장 이동 핸들러
  const handlePrevChapter = () => {
    if (!hasPrevChapter()) return;
    const prevChapter = parseInt(chapter!) - 1;
    navigate(`/bible/transcribe/${bookName}/${prevChapter}`);
  };

  const handleNextChapter = () => {
    if (!hasNextChapter()) return;
    const nextChapter = parseInt(chapter!) + 1;
    navigate(`/bible/transcribe/${bookName}/${nextChapter}`);
  };

  if (isLoading) {
    return (
      <div className="transcribe-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">성경 말씀을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcribe-page">
      {/* 하트 연기 효과 */}
      {heartSmokes.length > 0 && (
        <div className="heart-smoke-container">
          {heartSmokes.map((heart) => (
            <div
              key={heart.id}
              className="heart-smoke"
              style={{ left: `${heart.x}px`, top: `${heart.y}px` }}
            >
              💗
            </div>
          ))}
        </div>
      )}

      {/* 헤더 */}
      <div className="transcribe-header">
        <button className="transcribe-menu-button" onClick={() => setIsNavigatorOpen(true)} title="성경 선택">
          ☰
        </button>
        <div className="transcribe-title">
          <h1 className="transcribe-title-text">
            {displayBookName} {chapter}장 📖
          </h1>
          <div className="transcribe-progress">
            <div className="progress-bar-small">
              <div className="progress-fill-small" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-text">{completedCount} / {verses.length}</span>
          </div>
        </div>
        <button className="transcribe-back-button" onClick={() => navigate('/bible/main')}>
          ← 뒤로
        </button>
      </div>

      {/* 책/장 선택 네비게이터 */}
      <BibleNavigator
        isOpen={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        currentBook={bookName}
        currentChapter={chapter ? parseInt(chapter) : undefined}
      />

      {/* 구절 리스트 */}
      <div className="verse-list">
        {verses.map((verse) => (
          <div
            key={verse.id}
            data-verse-number={verse.number}
            className={`verse-item ${verse.isCompleted ? 'completed' : ''} ${verse.isMission ? 'mission' : ''} ${selectedVerse === verse.number ? 'selected' : ''}`}
            onClick={(e) => {
              console.log('onClick triggered for verse:', verse.number, 'isMission:', verse.isMission, 'isCompleted:', verse.isCompleted);
              handleVerseClick(verse.number);
            }}
          >
            <div className="verse-number">
              {verse.number}
              {verse.isMission && <span className="mission-badge">★</span>}
            </div>
            <div className="verse-text">
              {verse.text}
              {verse.isCompleted && <span className="completed-badge">✓</span>}
            </div>
          </div>
        ))}

        {/* 장 네비게이션 버튼 */}
        {(hasPrevChapter() || hasNextChapter()) && (
          <div className="chapter-navigation">
            <button
              className="chapter-nav-button prev"
              onClick={handlePrevChapter}
              disabled={!hasPrevChapter()}
            >
              ← 이전 장
            </button>
            <button
              className="chapter-nav-button next"
              onClick={handleNextChapter}
              disabled={!hasNextChapter()}
            >
              다음 장 →
            </button>
          </div>
        )}

        {/* 저작권 표시 */}
        <div className="bible-copyright">
          『성경전서 개역한글판』, 대한성서공회
        </div>
      </div>

      {/* 하단 입력 영역 - drawer는 한번 열리면 유지 */}
      {isInputPanelOpen && selectedVerse !== null && (
        <div className="input-panel">
          <div className="input-header">
            <span className="input-verse-number">{selectedVerse}절</span>
            <button className="input-cancel" onClick={() => {
              setIsInputPanelOpen(false);
              setSelectedVerse(null);
              setInputText('');
              setDebouncedMatchStatus('typing'); // 취소 시 상태 초기화
            }}>
              ✕
            </button>
          </div>
          <div className="input-original">
            {verses.find(v => v.number === selectedVerse)?.text}
          </div>
          <div className="input-area">
            <input
              ref={inputRef}
              type="text"
              className={`transcribe-input ${debouncedMatchStatus}`}
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder="구절을 정확하게 따라 적어주세요..."
            />
            <button className="input-submit" onClick={handleComplete}>
              완료
            </button>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="알림">
        <p>{modalMessage}</p>
      </Modal>
    </div>
  );
};

export default BibleTranscribePage;
