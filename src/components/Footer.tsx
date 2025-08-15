import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>GNTC 청년부</h3>
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
            <p>📍 서울특별시 강남구 테헤란로 123</p>
            <p>📞 02-1234-5678</p>
            <p>✉️ youth@gntc.org</p>
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
          <p>&copy; 2024 GNTC 청년부. 모든 권리 보유.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 