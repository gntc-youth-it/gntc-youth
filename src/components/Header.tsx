import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>GNTC 청년부</h1>
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