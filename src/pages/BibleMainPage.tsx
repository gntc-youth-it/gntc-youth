import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookTransition from '../components/BookTransition';
import { isLoggedIn, getUserInfoFromToken } from '../utils/api';
import './BibleMainPage.css';

const BibleMainPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로그인 상태 확인
    if (!isLoggedIn()) {
      // 로그인 안 되어있으면 현재 경로 저장 후 로그인 페이지로
      sessionStorage.setItem('redirectAfterLogin', '/bible/main');
      navigate('/login');
      return;
    }

    // 사용자 정보 가져오기
    const userInfo = getUserInfoFromToken();
    if (userInfo) {
      setUserName(userInfo.name);
    }

    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return null; // 로딩 중에는 아무것도 표시하지 않음
  }

  return (
    <div className="bible-main">
      <BookTransition>
        <div className="bible-main-container">
          {/* 배경 장식 */}
          <div className="bible-bg-decoration"></div>

          {/* 메인 콘텐츠 */}
          <div className="bible-main-content">
            <div className="bible-welcome-icon">👋</div>
            <h1 className="bible-main-title">{userName}님</h1>
            <p className="bible-main-description">
              성경 필사를 시작해볼까요?
            </p>

            {/* 여기에 필사 UI가 들어갈 예정 */}
            <div className="placeholder">
              <p>필사 UI가 여기에 추가됩니다</p>
            </div>
          </div>
        </div>
      </BookTransition>
    </div>
  );
};

export default BibleMainPage;
