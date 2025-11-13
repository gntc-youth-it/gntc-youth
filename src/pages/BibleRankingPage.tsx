import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookTransition from '../components/BookTransition';
import { apiRequest } from '../utils/api';
import './BibleRankingPage.css';

type MainTab = 'cell' | 'personal';
type PersonalSubTab = 'daily' | 'weekly' | 'total';

// API 응답 타입
interface CellGoalStatsResponse {
  cell_id: number;
  cell_name: string;
  title: string;
  progress: number;
}

interface CellGoalStatListResponse {
  user_cell_id: number;
  cell_goal_stats: CellGoalStatsResponse[];
}

const dummyPersonalRanks = {
  daily: [
    { rank: 1, name: '김철수', count: 24 },
    { rank: 2, name: '이영희', count: 18 },
    { rank: 3, name: '박민수', count: 15 },
    { rank: 4, name: '정수진', count: 12 },
    { rank: 5, name: '최동훈', count: 10 },
    { rank: 6, name: '강민지', count: 9 },
    { rank: 7, name: '홍길동', count: 8 },
    { rank: 8, name: '윤서연', count: 7 },
  ],
  weekly: [
    { rank: 1, name: '이영희', count: 142 },
    { rank: 2, name: '김철수', count: 128 },
    { rank: 3, name: '박민수', count: 95 },
    { rank: 4, name: '정수진', count: 87 },
    { rank: 5, name: '최동훈', count: 76 },
    { rank: 6, name: '강민지', count: 65 },
    { rank: 7, name: '홍길동', count: 58 },
    { rank: 8, name: '윤서연', count: 52 },
  ],
  total: [
    { rank: 1, name: '김철수', count: 1580 },
    { rank: 2, name: '이영희', count: 1425 },
    { rank: 3, name: '박민수', count: 1280 },
    { rank: 4, name: '정수진', count: 950 },
    { rank: 5, name: '최동훈', count: 870 },
    { rank: 6, name: '강민지', count: 765 },
    { rank: 7, name: '홍길동', count: 645 },
    { rank: 8, name: '윤서연', count: 580 },
  ],
};

const BibleRankingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<MainTab>('cell');
  const [personalSubTab, setPersonalSubTab] = useState<PersonalSubTab>('daily');
  const [cellData, setCellData] = useState<CellGoalStatsResponse[]>([]);
  const [userCellId, setUserCellId] = useState<number | null>(null);
  const [isLoadingCell, setIsLoadingCell] = useState(true);

  // 임시로 내 이름을 홍길동으로 설정
  const myName = '홍길동';

  const handleBack = () => {
    navigate('/bible/main');
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  // 구역 현황 API 호출
  useEffect(() => {
    const fetchCellData = async () => {
      try {
        setIsLoadingCell(true);
        const data = await apiRequest<CellGoalStatListResponse>('/bible/cell-goal/list');
        setCellData(data.cell_goal_stats);
        setUserCellId(data.user_cell_id);
      } catch (error) {
        console.error('구역 현황 조회 실패:', error);
      } finally {
        setIsLoadingCell(false);
      }
    };

    fetchCellData();
  }, []);

  const currentPersonalRanks = dummyPersonalRanks[personalSubTab];
  const myRank = currentPersonalRanks.find((r) => r.name === myName);

  // IT부 제외하고 구역 데이터를 진행률 순서대로 정렬
  const sortedCellData = cellData
    .filter((cell) => cell.cell_name !== 'IT부')
    .sort((a, b) => b.progress - a.progress);

  return (
    <div className="bible-ranking">
      <BookTransition>
        <div className="bible-ranking-container">
          {/* 배경 장식 */}
          <div className="bible-bg-decoration"></div>

          {/* 헤더 */}
          <div className="bible-ranking-header">
            <button className="ranking-back-button" onClick={handleBack}>
              ←
            </button>
            <h1 className="ranking-header-title">랭킹</h1>
            <div className="ranking-header-spacer"></div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="bible-ranking-content">
            {/* 메인 탭 */}
            <div className="ranking-main-tabs">
              <button
                className={`ranking-main-tab ${mainTab === 'cell' ? 'active' : ''}`}
                onClick={() => setMainTab('cell')}
              >
                구역 현황
              </button>
              <button
                className={`ranking-main-tab ${mainTab === 'personal' ? 'active' : ''}`}
                onClick={() => setMainTab('personal')}
              >
                개인 순위
              </button>
            </div>

            {/* 구역 현황 탭 */}
            {mainTab === 'cell' && (
              <div className="ranking-tab-content">
                {isLoadingCell ? (
                  <div className="loading-message">구역 현황을 불러오는 중...</div>
                ) : sortedCellData.length === 0 ? (
                  <div className="empty-message">구역 현황이 없습니다.</div>
                ) : (
                  <div className="cell-list">
                    {sortedCellData.map((cell, index) => {
                      const rank = index + 1;
                      const rankIcon = getRankIcon(rank);
                      const isMyCell = cell.cell_id === userCellId;
                      return (
                        <div key={cell.cell_id} className={`cell-card ${isMyCell ? 'is-my-cell' : ''}`}>
                          <div className="cell-card-header">
                            <div className="cell-name-with-rank">
                              {rankIcon ? (
                                <span className="cell-rank-medal">{rankIcon}</span>
                              ) : (
                                <span className="cell-rank-number">{rank}위</span>
                              )}
                              <h3 className="cell-name">{cell.cell_name}</h3>
                            </div>
                            <span className="cell-trophy">🏆</span>
                          </div>
                          <p className="cell-title">{cell.title}</p>
                          <div className="cell-progress-bar">
                            <div
                              className="cell-progress-fill"
                              style={{ width: `${cell.progress * 100}%` }}
                            ></div>
                          </div>
                          <div className="cell-stats">
                            <span className="cell-percentage">{(cell.progress * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 개인 순위 탭 */}
            {mainTab === 'personal' && (
              <div className="ranking-tab-content">
                {/* 서브탭 */}
                <div className="ranking-sub-tabs">
                  <button
                    className={`ranking-sub-tab ${personalSubTab === 'daily' ? 'active' : ''}`}
                    onClick={() => setPersonalSubTab('daily')}
                  >
                    일별
                  </button>
                  <button
                    className={`ranking-sub-tab ${personalSubTab === 'weekly' ? 'active' : ''}`}
                    onClick={() => setPersonalSubTab('weekly')}
                  >
                    주별
                  </button>
                  <button
                    className={`ranking-sub-tab ${personalSubTab === 'total' ? 'active' : ''}`}
                    onClick={() => setPersonalSubTab('total')}
                  >
                    전체
                  </button>
                </div>

                {/* 내 순위 하이라이트 */}
                {myRank && (
                  <div className="my-rank-card">
                    <span className="my-rank-label">✨ 내 순위</span>
                    <div className="my-rank-info">
                      <span className="my-rank-badge">
                        {getRankIcon(myRank.rank) || `${myRank.rank}위`}
                      </span>
                      <span className="my-rank-name">{myRank.name}</span>
                      <span className="my-rank-count">{myRank.count}절</span>
                    </div>
                  </div>
                )}

                {/* 전체 순위 리스트 */}
                <div className="rank-list">
                  {currentPersonalRanks.map((item) => {
                    const isMe = item.name === myName;
                    return (
                      <div key={item.rank} className={`rank-item ${isMe ? 'is-me' : ''}`}>
                        <div className="rank-position">
                          {getRankIcon(item.rank) ? (
                            <span className="rank-medal">{getRankIcon(item.rank)}</span>
                          ) : (
                            <span className="rank-number">{item.rank}위</span>
                          )}
                        </div>
                        <span className="rank-name">{item.name}</span>
                        <span className="rank-count">{item.count}절</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </BookTransition>
    </div>
  );
};

export default BibleRankingPage;
