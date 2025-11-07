import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookTransition from '../components/BookTransition';
import './BibleRankingPage.css';

type MainTab = 'cell' | 'personal';
type PersonalSubTab = 'daily' | 'weekly' | 'total';

// 임시 더미 데이터 (나중에 API 연동)
const dummyCellData = [
  { id: 1, name: '1구역', title: '이사야 40-55장', progress: 0.675, completed: 135, total: 200 },
  { id: 2, name: '2구역', title: '요한복음 1-10장', progress: 0.82, completed: 164, total: 200 },
  { id: 3, name: '3구역', title: '창세기 1-20장', progress: 0.45, completed: 90, total: 200 },
  { id: 4, name: '4구역', title: '마태복음 5-15장', progress: 0.58, completed: 116, total: 200 },
];

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

  const currentPersonalRanks = dummyPersonalRanks[personalSubTab];
  const myRank = currentPersonalRanks.find((r) => r.name === myName);

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
                <div className="cell-list">
                  {dummyCellData.map((cell) => (
                    <div key={cell.id} className="cell-card">
                      <div className="cell-card-header">
                        <h3 className="cell-name">{cell.name}</h3>
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
                        <span className="cell-count">
                          {cell.completed} / {cell.total}절
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
