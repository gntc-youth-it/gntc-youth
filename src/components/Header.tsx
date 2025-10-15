import React, { useState } from 'react';
import './Header.css';

const Header: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    closeSidebar();
  };

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