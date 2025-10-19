import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookTransition from '../components/BookTransition';
import './BibleTranscriptionPage.css';

const BibleTranscriptionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/bible/main');
  };

  return (
    <div className="bible-landing">
      <BookTransition>
        <div className="bible-landing-container">
          {/* 배경 장식 */}
          <div className="bible-bg-decoration"></div>

          {/* 메인 콘텐츠 */}
          <div className="bible-content">
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
      </BookTransition>
    </div>
  );
};

export default BibleTranscriptionPage;
