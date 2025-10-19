import React, { useState, useEffect } from 'react';
import './BibleTranscriptionPage.css';

const BibleTranscriptionPage: React.FC = () => {
  const [isBookOpen, setIsBookOpen] = useState(false);

  useEffect(() => {
    // 페이지 로드 후 책 열기 애니메이션 시작
    setTimeout(() => {
      setIsBookOpen(true);
    }, 300);
  }, []);

  const handleStart = () => {
    // TODO: 필사 페이지로 이동
    console.log('필사 시작!');
  };

  return (
    <div className="bible-landing">
      <div className="bible-landing-container">
        {/* 책 표지 애니메이션 */}
        <div className={`book-cover-left ${isBookOpen ? 'open' : ''}`}></div>
        <div className={`book-cover-right ${isBookOpen ? 'open' : ''}`}></div>
        {/* 배경 장식 */}
        <div className="bible-bg-decoration"></div>

        {/* 메인 콘텐츠 */}
        <div className={`bible-content ${isBookOpen ? 'show' : ''}`}>
          <div className="bible-icon">💖</div>
          <h1 className="bible-title">성경 필사 미션</h1>
          <p className="bible-description">
            말씀을 직접 필사하며<br />
            마음에 새겨보아요 :)
          </p>

          <div className="bible-verse-preview">
            <p className="preview-text">
              "태초에 말씀이 계시니라<br />
              이 말씀이 하나님과 함께 계셨으니<br />
              이 말씀은 곧 하나님이시니라"
            </p>
            <span className="preview-reference">요한복음 1:1</span>
          </div>

          <button className="bible-start-button" onClick={handleStart}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default BibleTranscriptionPage;
