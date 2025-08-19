import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>GNTC YOUTH</h3>
            <p>함께 성장하고, 함께 섬기며, 함께 예배하는 청년들의 공동체</p>
          </div>
          <div className="footer-section">
            <h4>빠른 링크</h4>
            <ul>
              <li><a href="#home">홈</a></li>
              <li><a href="#about">소개</a></li>
              <li><a href="#schedule">일정</a></li>
              <li><a href="#gallery">갤러리</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>연락처</h4>
            <p>📍 경기도 안양시 만안구 안양로 193</p>
            <p>📞 031-443-3731~2</p>
            <p>✉️ truth@gntc.net</p>
          </div>
          <div className="footer-section">
            <h4>소셜 미디어</h4>
            <div className="social-links">
              <a href="https://instagram.com" className="social-link" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://facebook.com" className="social-link" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://youtube.com" className="social-link" target="_blank" rel="noopener noreferrer">YouTube</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>CopyrightⓒGrace and Truth Church.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 