import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookTransition from '../components/BookTransition';
import { isLoggedIn, getUserInfoFromToken, apiRequest, HttpError } from '../utils/api';
import './BibleMainPage.css';

interface CellGoalData {
  totalVerses: number;
  completedVerses: number;
  progressPercentage: number;
}

const BibleMainPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [goalData, setGoalData] = useState<CellGoalData | null>(null);

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

    // 달성률 데이터 가져오기
    const fetchGoalData = async () => {
      try {
        const data = await apiRequest<CellGoalData>('/bible/cell-goal');
        setGoalData(data);
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) {
          // 에러 코드 1202 (CELL_MEMBER_NOT_FOUND): 구역원이 존재하지 않는 경우 -> 구역 선택 페이지로
          if (error.code === 1202 || error.code === '1202') {
            navigate('/bible/select-cell');
            return;
          }
          // 그 외 404 에러 (목표가 아직 설정되지 않은 경우) - 기본값 설정
          setGoalData({
            totalVerses: 0,
            completedVerses: 0,
            progressPercentage: 0,
          });
        } else {
          console.error('Failed to fetch goal data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoalData();
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
            <h1 className="bible-main-title">{userName}님</h1>
            <p className="bible-main-description">
              성경 필사를 시작해볼까요?
            </p>

            {/* 달성률 표시 */}
            {goalData && (
              <div className="progress-section">
                {goalData.totalVerses > 0 ? (
                  <>
                    <div className="progress-header">
                      <span className="progress-label">전체 진행률</span>
                      <span className="progress-percentage">{goalData.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${goalData.progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="progress-stats">
                      <span>{goalData.completedVerses} / {goalData.totalVerses} 구절</span>
                    </div>
                  </>
                ) : (
                  <div className="progress-empty">
                    <p className="progress-empty-icon">📖</p>
                    <p className="progress-empty-text">아직 필사 목표가 설정되지 않았습니다</p>
                    <p className="progress-empty-subtext">곧 시작할 수 있습니다!</p>
                  </div>
                )}
              </div>
            )}

            {/* 버튼 영역 */}
            <div className="bible-main-buttons">
              <button className="bible-button secondary">
                달성률 보기
              </button>
              <button className="bible-button primary">
                필사 시작하기
              </button>
            </div>
          </div>
        </div>
      </BookTransition>
    </div>
  );
};

export default BibleMainPage;
