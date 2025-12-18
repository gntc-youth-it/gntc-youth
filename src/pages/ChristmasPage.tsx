import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, getUserInfoFromToken } from '../utils/api';
import { RollingPaperMessage } from '../types/christmas';
import {
  getMessages,
  saveMessage,
  generateRandomPosition,
  getRandomOrnamentType,
} from '../utils/christmasStorage';
import ChristmasTree from '../components/ChristmasTree';
import MessageModal from '../components/MessageModal';
import MessageDetailModal from '../components/MessageDetailModal';
import './ChristmasPage.css';

const ChristmasPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [messages, setMessages] = useState<RollingPaperMessage[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] =
    useState<RollingPaperMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로그인 체크
    if (!isLoggedIn()) {
      sessionStorage.setItem('redirectAfterLogin', '/christmas');
      navigate('/login');
      return;
    }

    // 사용자 정보 가져오기
    const userInfo = getUserInfoFromToken();
    if (userInfo) {
      setUserName(userInfo.name);
    }

    // 메시지 로드
    const loadedMessages = getMessages();
    setMessages(loadedMessages);
    setIsLoading(false);
  }, [navigate]);

  // 메시지 작성 완료 핸들러
  const handleWriteMessage = (messageText: string) => {
    const existingPositions = messages.map((m) => m.position);
    const newMessage = saveMessage({
      authorName: userName,
      message: messageText,
      ornamentType: getRandomOrnamentType(),
      position: generateRandomPosition(existingPositions),
    });
    setMessages([...messages, newMessage]);
    setIsWriteModalOpen(false);
  };

  // 오너먼트 클릭 핸들러
  const handleOrnamentClick = (message: RollingPaperMessage) => {
    setSelectedMessage(message);
  };

  // 눈송이 배열 생성 (50개)
  const snowflakes = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
    size: 4 + Math.random() * 6,
  }));

  if (isLoading) {
    return (
      <div className="christmas-page">
        <div className="christmas-loading">
          <div className="loading-spinner"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="christmas-page">
      {/* 눈 내리는 효과 */}
      <div className="snowfall">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="snowflake-particle"
            style={{
              left: `${flake.left}%`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
            }}
          />
        ))}
      </div>

      <div className="christmas-container">
        {/* 헤더 */}
        <header className="christmas-header">
          <h1 className="christmas-title">Merry Christmas</h1>
          <p className="christmas-subtitle">GNTC 청년부</p>
        </header>

        {/* 크리스마스 트리 */}
        <ChristmasTree
          messages={messages}
          onOrnamentClick={handleOrnamentClick}
        />

        {/* 안내 텍스트 */}
        <p className="christmas-hint">
          오너먼트를 클릭하면 메시지를 볼 수 있어요
        </p>

        {/* 메시지 작성 버튼 */}
        <button
          className="write-message-button"
          onClick={() => setIsWriteModalOpen(true)}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            className="write-icon"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          메시지 남기기
        </button>

        {/* 메시지 개수 표시 */}
        <p className="christmas-message-count">
          {messages.length}개의 메시지가 트리에 걸려있어요
        </p>

        {/* 홈으로 돌아가기 링크 */}
        <button className="back-to-home" onClick={() => navigate('/')}>
          홈으로 돌아가기
        </button>
      </div>

      {/* 메시지 작성 모달 */}
      <MessageModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onConfirm={handleWriteMessage}
      />

      {/* 메시지 상세 모달 */}
      <MessageDetailModal
        isOpen={selectedMessage !== null}
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </div>
  );
};

export default ChristmasPage;
