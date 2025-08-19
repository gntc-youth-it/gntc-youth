import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <nav className="navigation">
          <ul>
            <li><a href="#home">홈</a></li>
            <li><a href="#about">소개</a></li>
            <li><a href="#schedule">일정</a></li>
            <li><a href="#gallery">갤러리</a></li>
            <li><a href="#contact">연락처</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 