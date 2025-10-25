import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookTransition from '../components/BookTransition';
import { isLoggedIn, getUserInfoFromToken, apiRequest, HttpError } from '../utils/api';
import './CellSelectPage.css';

interface CellResponse {
  cell_id: number;
  cell_name: string;
}

interface CellListResponse {
  cell_infos: CellResponse[];
}

const CellSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [cells, setCells] = useState<CellResponse[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);

  useEffect(() => {
    // 로그인 상태 확인
    if (!isLoggedIn()) {
      sessionStorage.setItem('redirectAfterLogin', '/bible/select-cell');
      navigate('/login');
      return;
    }

    // 사용자 정보 가져오기
    const userInfo = getUserInfoFromToken();
    if (userInfo) {
      setUserName(userInfo.name);
    }

    // 구역 목록 가져오기
    const fetchCells = async () => {
      try {
        const data = await apiRequest<CellListResponse>('/cell');
        setCells(data.cell_infos);
      } catch (error) {
        console.error('Failed to fetch cells:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCells();
  }, [navigate]);

  const handleCellSelect = async () => {
    if (!selectedCellId) {
      alert('구역을 선택해주세요.');
      return;
    }

    try {
      // 구역 가입 API 호출
      await apiRequest(`/cell/${selectedCellId}`, {
        method: 'POST',
      });

      // 성공 시 메인 페이지로 이동
      navigate('/bible/main');
    } catch (error) {
      console.error('Failed to join cell:', error);
      if (error instanceof HttpError) {
        alert(`구역 가입에 실패했습니다: ${error.message}`);
      } else {
        alert('구역 가입에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="cell-select">
      <BookTransition>
        <div className="cell-select-container">
          {/* 배경 장식 */}
          <div className="bible-bg-decoration"></div>

          {/* 메인 콘텐츠 */}
          <div className="cell-select-content">
            <h1 className="cell-select-title">{userName}님</h1>
            <p className="cell-select-description">
              소속된 구역을 선택해주세요
            </p>

            {/* 구역 목록 */}
            <div className="cell-list">
              {cells.length > 0 ? (
                cells.map((cell) => (
                  <button
                    key={cell.cell_id}
                    className={`cell-item ${selectedCellId === cell.cell_id ? 'selected' : ''}`}
                    onClick={() => setSelectedCellId(cell.cell_id)}
                  >
                    <div className="cell-item-content">
                      <span className="cell-name">{cell.cell_name}</span>
                      <div className="cell-check">
                        {selectedCellId === cell.cell_id && <span className="check-icon">✓</span>}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="cell-empty">
                  <p>등록된 구역이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 확인 버튼 */}
            <button
              className="cell-submit-button"
              onClick={handleCellSelect}
              disabled={!selectedCellId}
            >
              선택 완료
            </button>
          </div>
        </div>
      </BookTransition>
    </div>
  );
};

export default CellSelectPage;
