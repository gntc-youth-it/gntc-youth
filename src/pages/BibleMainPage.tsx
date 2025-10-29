import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookTransition from '../components/BookTransition';
import Modal from '../components/Modal';
import { isLoggedIn, getUserInfoFromToken, apiRequest, HttpError } from '../utils/api';
import './BibleMainPage.css';

interface CellGoalData {
  cell_id: number;
  cell_name: string;
  title: string;
  progress: number; // 0.0 ~ 1.0 (소수)
}

const BibleMainPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [goalData, setGoalData] = useState<CellGoalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleComingSoon = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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
          // 그 외 404 에러 (목표가 아직 설정되지 않은 경우) - null로 설정
          setGoalData(null);
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
    return (
      <div className="bible-main">
        <div className="bible-main-container">
          <div className="bible-main-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p className="loading-text">로딩 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
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
            {goalData ? (
              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-label">전체 진행률</span>
                  <span className="progress-percentage">{(goalData.progress * 100).toFixed(1)}%</span>
                </div>

                {/* 하트 병 애니메이션 */}
                <div className="heart-container">
                  <svg className="heart-bottle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <clipPath id="heartClip">
                        <path d="M50,85 C50,85 20,60 20,40 C20,30 25,25 32,25 C40,25 45,30 50,35 C55,30 60,25 68,25 C75,25 80,30 80,40 C80,60 50,85 50,85 Z" />
                      </clipPath>
                      <linearGradient id="heartGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#e8b5ce" />
                        <stop offset="50%" stopColor="#ec9bb7" />
                        <stop offset="100%" stopColor="#f082a1" />
                      </linearGradient>
                    </defs>

                    {/* 반투명 하트 테두리 */}
                    <path
                      d="M50,85 C50,85 20,60 20,40 C20,30 25,25 32,25 C40,25 45,30 50,35 C55,30 60,25 68,25 C75,25 80,30 80,40 C80,60 50,85 50,85 Z"
                      fill="none"
                      stroke="#e8dfd0"
                      strokeWidth="2"
                    />

                    {/* 채워지는 배경 */}
                    <rect
                      x="0"
                      y={85 - goalData.progress * 60}
                      width="100"
                      height={goalData.progress * 60}
                      fill="url(#heartGradient)"
                      clipPath="url(#heartClip)"
                      className="heart-fill"
                      opacity="0.3"
                    />

                    {/* 작은 하트들 - 떨어져서 쌓이는 효과 */}
                    <g clipPath="url(#heartClip)">
                      {Array.from({ length: Math.min(Math.floor(goalData.progress * 300), 100) }).map((_, i) => {
                        // 랜덤 시드 (i 기반으로 일관된 랜덤값 생성)
                        const seed1 = (i * 9301 + 49297) % 233280;
                        const seed2 = (i * 4567 + 12345) % 233280;
                        const seed3 = (i * 7919 + 31337) % 233280;

                        const random1 = seed1 / 233280;
                        const random2 = seed2 / 233280;
                        const random3 = seed3 / 233280;

                        // 병 바닥에서부터 쌓이는 높이 계산
                        const layer = Math.floor(i / 12);
                        const posInLayer = i % 12;

                        // x 위치: 하트 병 모양에 맞춰 분포
                        const finalX = 25 + posInLayer * 4.5 + (random1 - 0.5) * 4;

                        // y 위치: 최종 쌓인 위치
                        const baseY = 83;
                        const finalY = baseY - layer * 3.5 - (random2 * 2);

                        // 회전각도
                        const rotation = (random3 - 0.5) * 70;

                        // 크기 변화
                        const scale = 0.7 + random1 * 0.5;

                        // 애니메이션 딜레이 (순차적으로 떨어지기)
                        const delay = i * 0.05;

                        return (
                          <text
                            key={i}
                            x={finalX}
                            y={finalY}
                            fontSize={4.5 * scale}
                            fill="#f082a1"
                            opacity={0.75 + random2 * 0.25}
                            transform={`rotate(${rotation} ${finalX} ${finalY})`}
                            className="falling-heart-svg"
                            style={{
                              animation: `heartDrop 1s ease-out ${delay}s both`,
                            }}
                          >
                            ♥
                          </text>
                        );
                      })}
                    </g>
                  </svg>
                </div>

                <div className="progress-stats">
                  <div className="progress-title">{goalData.title}</div>
                  <div className="progress-cell-info">{goalData.cell_name}</div>
                </div>
              </div>
            ) : (
              <div className="progress-section">
                <div className="progress-empty">
                  <p className="progress-empty-icon">📖</p>
                  <p className="progress-empty-text">아직 필사 목표가 설정되지 않았습니다</p>
                  <p className="progress-empty-subtext">곧 시작할 수 있습니다!</p>
                </div>
              </div>
            )}

            {/* 버튼 영역 */}
            <div className="bible-main-buttons">
              <button className="bible-button secondary" onClick={handleComingSoon}>
                🏆 랭킹 보기
              </button>
              <button className="bible-button primary" onClick={handleComingSoon}>
                필사 시작하기
              </button>
            </div>
          </div>
        </div>
      </BookTransition>

      {/* 준비중 모달 */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="알림">
        <p>준비중입니다</p>
      </Modal>
    </div>
  );
};

export default BibleMainPage;
