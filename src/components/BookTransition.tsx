import React, { useState, useEffect } from 'react';
import './BookTransition.css';

interface BookTransitionProps {
  children: React.ReactNode;
  onTransitionComplete?: () => void;
}

const BookTransition: React.FC<BookTransitionProps> = ({ children, onTransitionComplete }) => {
  const [isBookOpen, setIsBookOpen] = useState(false);

  useEffect(() => {
    // 페이지 로드 후 책 열기 애니메이션 시작
    const openTimer = setTimeout(() => {
      setIsBookOpen(true);
    }, 300);

    // 애니메이션 완료 콜백
    const completeTimer = setTimeout(() => {
      if (onTransitionComplete) {
        onTransitionComplete();
      }
    }, 2000);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [onTransitionComplete]);

  return (
    <>
      {/* 책 표지 애니메이션 */}
      <div className={`book-cover-left ${isBookOpen ? 'open' : ''}`}></div>
      <div className={`book-cover-right ${isBookOpen ? 'open' : ''}`}></div>

      {/* 콘텐츠 */}
      <div className={`book-content-wrapper ${isBookOpen ? 'show' : ''}`}>
        {children}
      </div>
    </>
  );
};

export default BookTransition;
