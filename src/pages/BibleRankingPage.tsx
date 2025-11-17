import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookTransition from '../components/BookTransition';
import { apiRequest, getUserInfoFromToken } from '../utils/api';
import './BibleRankingPage.css';

type MainTab = 'cell' | 'personal' | 'credits';
type PersonalSubTab = 'daily' | 'weekly' | 'total';

// API 응답 타입 - 구역 현황
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

// API 응답 타입 - 개인 순위
interface DailyRankItem {
  user_name: string;
  copy_count: number;
}

interface DailyRankResponse {
  date: string;
  ranks: DailyRankItem[];
}

interface WeeklyRankItem {
  user_name: string;
  copy_count: number;
}

interface WeeklyRankResponse {
  start_date: string;
  end_date: string;
  ranks: WeeklyRankItem[];
}

interface TotalRankItem {
  user_name: string;
  copy_count: number;
}

interface TotalRankResponse {
  ranks: TotalRankItem[];
}

// API 응답 타입 - 내 순위
interface MyRankResponse {
  user_id: number;
  count: number;
  rank: number | null;
  total_contributors: number;
  period_start_kst: string;
  period_end_kst: string;
  start_utc: string;
  end_utc: string;
  timezone: string;
}

// 내부 사용 타입
interface RankItem {
  rank: number;
  name: string;
  count: number;
}

interface MyRankData {
  rank: number;
  count: number;
}

// 제작진 타입
interface Creator {
  name: string;
  role: string;
}

interface Contributor {
  name: string;
  contribution: string;
}

// 제작자 및 기여자 데이터 (하드코딩)
const CREATORS: Creator[] = [
    { name: '박석희', role: '백엔드 개발' },
    { name: '김은선', role: '프론트엔드 개발' },
    { name: '양원석', role: 'UI/UX 디자인' },
    { name: '박주은', role: 'UI/UX 디자인' },
    { name: '박주애', role: 'UI/UX 디자인' },
    { name: '김승진', role: 'UI/UX 디자인' },
    { name: '남상형', role: 'UI/UX 디자인' },
    { name: '윤지성', role: 'UI/UX 디자인' },
];

const CONTRIBUTORS: Contributor[] = [
    { name: '이인호', contribution: '성경 필사 사용성 개선' },
    { name: '김예원', contribution: '성경 필사 오류 제보' },
    { name: '박건우', contribution: '성경 필사 사용성 개선' },
    { name: '이가현', contribution: '성경 오탈자 제보' },
];

const BibleRankingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<MainTab>('cell');
  const [personalSubTab, setPersonalSubTab] = useState<PersonalSubTab>('daily');

  // 구역 현황
  const [cellData, setCellData] = useState<CellGoalStatsResponse[]>([]);
  const [userCellId, setUserCellId] = useState<number | null>(null);
  const [isLoadingCell, setIsLoadingCell] = useState(true);

  // 개인 순위 - 일별
  const [dailyRanks, setDailyRanks] = useState<RankItem[]>([]);
  const [myDailyRank, setMyDailyRank] = useState<MyRankData | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [isLoadingMyDaily, setIsLoadingMyDaily] = useState(false);

  // 개인 순위 - 주별
  const [weeklyRanks, setWeeklyRanks] = useState<RankItem[]>([]);
  const [myWeeklyRank, setMyWeeklyRank] = useState<MyRankData | null>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);
  const [isLoadingMyWeekly, setIsLoadingMyWeekly] = useState(false);

  // 개인 순위 - 전체
  const [totalRanks, setTotalRanks] = useState<RankItem[]>([]);
  const [myTotalRank, setMyTotalRank] = useState<MyRankData | null>(null);
  const [isLoadingTotal, setIsLoadingTotal] = useState(false);
  const [isLoadingMyTotal, setIsLoadingMyTotal] = useState(false);

  // 사용자 정보
  const userInfo = getUserInfoFromToken();
  const myName = userInfo?.name || '';

  // 기여자 툴팁 표시 상태 (클릭한 기여자의 이름을 저장)
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);

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

  // 일별 순위 API 호출
  useEffect(() => {
    if (personalSubTab !== 'daily') return;

    const fetchDailyRanks = async () => {
      try {
        setIsLoadingDaily(true);
        const data = await apiRequest<DailyRankResponse>('/bible/rank/daily');

        // API 응답을 RankItem 형태로 변환
        const ranksWithRank: RankItem[] = data.ranks.map((item, index) => ({
          rank: index + 1,
          name: item.user_name,
          count: item.copy_count,
        }));

        setDailyRanks(ranksWithRank);
      } catch (error) {
        console.error('일별 순위 조회 실패:', error);
      } finally {
        setIsLoadingDaily(false);
      }
    };

    fetchDailyRanks();
  }, [personalSubTab]);

  // 내 일별 순위 API 호출
  useEffect(() => {
    if (personalSubTab !== 'daily') return;

    const fetchMyDailyRank = async () => {
      try {
        setIsLoadingMyDaily(true);
        const data = await apiRequest<MyRankResponse>('/bible/rank/daily/my');

        // rank가 null이 아닌 경우에만 저장
        if (data.rank !== null) {
          setMyDailyRank({
            rank: data.rank,
            count: data.count,
          });
        } else {
          setMyDailyRank(null);
        }
      } catch (error) {
        console.error('내 일별 순위 조회 실패:', error);
        setMyDailyRank(null);
      } finally {
        setIsLoadingMyDaily(false);
      }
    };

    fetchMyDailyRank();
  }, [personalSubTab]);

  // 주별 순위 API 호출
  useEffect(() => {
    if (personalSubTab !== 'weekly') return;

    const fetchWeeklyRanks = async () => {
      try {
        setIsLoadingWeekly(true);
        const data = await apiRequest<WeeklyRankResponse>('/bible/rank/weekly');

        // API 응답을 RankItem 형태로 변환
        const ranksWithRank: RankItem[] = data.ranks.map((item, index) => ({
          rank: index + 1,
          name: item.user_name,
          count: item.copy_count,
        }));

        setWeeklyRanks(ranksWithRank);
      } catch (error) {
        console.error('주별 순위 조회 실패:', error);
      } finally {
        setIsLoadingWeekly(false);
      }
    };

    fetchWeeklyRanks();
  }, [personalSubTab]);

  // 내 주별 순위 API 호출
  useEffect(() => {
    if (personalSubTab !== 'weekly') return;

    const fetchMyWeeklyRank = async () => {
      try {
        setIsLoadingMyWeekly(true);
        const data = await apiRequest<MyRankResponse>('/bible/rank/weekly/my');

        // rank가 null이 아닌 경우에만 저장
        if (data.rank !== null) {
          setMyWeeklyRank({
            rank: data.rank,
            count: data.count,
          });
        } else {
          setMyWeeklyRank(null);
        }
      } catch (error) {
        console.error('내 주별 순위 조회 실패:', error);
        setMyWeeklyRank(null);
      } finally {
        setIsLoadingMyWeekly(false);
      }
    };

    fetchMyWeeklyRank();
  }, [personalSubTab]);

  // 전체 순위 API 호출
  useEffect(() => {
    if (personalSubTab !== 'total') return;

    const fetchTotalRanks = async () => {
      try {
        setIsLoadingTotal(true);
        const data = await apiRequest<TotalRankResponse>('/bible/rank');

        // API 응답을 RankItem 형태로 변환
        const ranksWithRank: RankItem[] = data.ranks.map((item, index) => ({
          rank: index + 1,
          name: item.user_name,
          count: item.copy_count,
        }));

        setTotalRanks(ranksWithRank);
      } catch (error) {
        console.error('전체 순위 조회 실패:', error);
      } finally {
        setIsLoadingTotal(false);
      }
    };

    fetchTotalRanks();
  }, [personalSubTab]);

  // 내 전체 순위 API 호출
  useEffect(() => {
    if (personalSubTab !== 'total') return;

    const fetchMyTotalRank = async () => {
      try {
        setIsLoadingMyTotal(true);
        const data = await apiRequest<MyRankResponse>('/bible/rank/my');

        // rank가 null이 아닌 경우에만 저장
        if (data.rank !== null) {
          setMyTotalRank({
            rank: data.rank,
            count: data.count,
          });
        } else {
          setMyTotalRank(null);
        }
      } catch (error) {
        console.error('내 전체 순위 조회 실패:', error);
        setMyTotalRank(null);
      } finally {
        setIsLoadingMyTotal(false);
      }
    };

    fetchMyTotalRank();
  }, [personalSubTab]);

  // 현재 선택된 탭의 순위 데이터
  const currentPersonalRanks =
    personalSubTab === 'daily'
      ? dailyRanks
      : personalSubTab === 'weekly'
      ? weeklyRanks
      : personalSubTab === 'total'
      ? totalRanks
      : [];
  const currentMyRank =
    personalSubTab === 'daily'
      ? myDailyRank
      : personalSubTab === 'weekly'
      ? myWeeklyRank
      : personalSubTab === 'total'
      ? myTotalRank
      : null;
  const isLoadingRanks =
    personalSubTab === 'daily'
      ? isLoadingDaily || isLoadingMyDaily
      : personalSubTab === 'weekly'
      ? isLoadingWeekly || isLoadingMyWeekly
      : personalSubTab === 'total'
      ? isLoadingTotal || isLoadingMyTotal
      : false;

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
              <button
                className={`ranking-main-tab ${mainTab === 'credits' ? 'active' : ''}`}
                onClick={() => setMainTab('credits')}
              >
                함께한 분들
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

                {/* 순위 표시 */}
                {isLoadingRanks ? (
                  <div className="loading-message">순위를 불러오는 중...</div>
                ) : currentPersonalRanks.length === 0 ? (
                  <div className="empty-message">지금 필사를 해서 순위에 내 이름을 남겨보세요! 📝</div>
                ) : (
                  <>
                    {/* 내 순위 하이라이트 */}
                    {currentMyRank && (
                      <div className="my-rank-card">
                        <span className="my-rank-label">✨ 내 순위</span>
                        <div className="my-rank-info">
                          <span className="my-rank-badge">
                            {getRankIcon(currentMyRank.rank) || `${currentMyRank.rank}위`}
                          </span>
                          <span className="my-rank-name">{myName}</span>
                          <span className="my-rank-count">{currentMyRank.count}절</span>
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
                  </>
                )}
              </div>
            )}

            {/* 제작진 탭 */}
            {mainTab === 'credits' && (
              <div className="ranking-tab-content">
                {/* 프로젝트 제작자 */}
                <div className="credits-section">
                  <h3 className="credits-section-title">프로젝트 제작자</h3>
                  <div className="creators-list">
                    {CREATORS.map((creator) => (
                      <span key={creator.name} className="creator-badge">
                        {creator.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 프로젝트 기여자 */}
                <div className="credits-section">
                  <h3 className="credits-section-title">기여하신 분</h3>
                  <p className="credits-section-description">이름을 클릭하면 기여 내역을 확인할 수 있습니다</p>
                  <div className="credits-list">
                    {CONTRIBUTORS.map((contributor) => (
                      <div key={contributor.name} className="credit-card contributor-card">
                        <button
                          className="contributor-name-button"
                          onClick={() =>
                            setSelectedContributor(
                              selectedContributor === contributor.name ? null : contributor.name
                            )
                          }
                        >
                          {contributor.name}
                        </button>
                        {selectedContributor === contributor.name && (
                          <div className="contributor-tooltip">
                            <p className="contributor-tooltip-text">{contributor.contribution}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <a
                    href="https://forms.gle/gdz6BSL6iSpTWdfVA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contribute-link"
                  >
                    나도 기여하러 가기 →
                  </a>
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
