import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { getUserInfoFromToken, logout, isLoggedIn as checkIsLoggedIn, UserInfo } from '../utils/api';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    closeSidebar();
  };

  const handleLogin = () => {
    // 사이드바가 열려있으면 닫기
    closeSidebar();
    // 로그인 페이지로 이동
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsLoggedIn(false);
      setUser(null);
      closeSidebar();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = checkIsLoggedIn();
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        // JWT 토큰에서 사용자 정보 추출
        const userInfo = getUserInfoFromToken();
        if (userInfo) {
          setUser(userInfo);
        } else {
          // 토큰이 유효하지 않으면 로그아웃 처리
          setIsLoggedIn(false);
          setUser(null);
        }
      }
    };

    checkLoginStatus();
  }, []);

  // 사이드바가 열렸을 때 body 스크롤 막기
  useEffect(() => {
    if (isSidebarOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isSidebarOpen]);

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <a href="#home" onClick={scrollToTop} className="logo-link">
            <img
              src="https://cdn.gntc-youth.com/assets/gntc-youth-logo-black.webp"
              alt="GNTC Youth 로고"
              className="logo-image"
            />
            <h1>GNTC YOUTH</h1>
          </a>
        </div>

        {/* 햄버거 메뉴 버튼 (모바일) */}
        <button
          className="hamburger-button"
          onClick={toggleSidebar}
          aria-label="메뉴 열기"
        >
          <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
        </button>

        {/* 데스크톱 네비게이션 */}
        <nav className="navigation desktop-navigation">
          <ul>
            <li><a href="#home">홈</a></li>
            <li><a href="#about">소개</a></li>
            <li><a href="#schedule">일정</a></li>
            <li><a href="#gallery">갤러리</a></li>
            <li><a href="#contact">연락처</a></li>
          </ul>

          {/* 로그인 버튼/사용자 정보 */}
          <div className="auth-section">
            {isLoggedIn && user ? (
              <div className="user-info">
                <span className="user-welcome">{user.name}님 환영합니다</span>
                <button onClick={handleLogout} className="logout-button">로그아웃</button>
              </div>
            ) : (
              <button onClick={handleLogin} className="login-button">로그인</button>
            )}
          </div>
        </nav>
      </div>

      {/* 사이드바 오버레이 */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* 모바일 사이드바 */}
      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>메뉴</h2>
        </div>

        {/* 모바일 로그인 섹션 */}
        <div className="sidebar-auth">
          {isLoggedIn && user ? (
            <div className="sidebar-user-info">
              <div className="sidebar-user-welcome">
                <span className="sidebar-user-name">{user.name}님</span>
                <span className="sidebar-user-greeting">환영합니다</span>
              </div>
              <button onClick={handleLogout} className="sidebar-logout-button">로그아웃</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="sidebar-login-button">로그인</button>
          )}
        </div>

        <ul className="sidebar-menu">
          <li><a href="#home" onClick={handleNavClick}>홈</a></li>
          <li><a href="#about" onClick={handleNavClick}>소개</a></li>
          <li><a href="#schedule" onClick={handleNavClick}>일정</a></li>
          <li><a href="#gallery" onClick={handleNavClick}>갤러리</a></li>
          <li><a href="#contact" onClick={handleNavClick}>연락처</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header; 