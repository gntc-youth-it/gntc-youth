import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { redirectToKakaoLogin } from '../utils/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    redirectToKakaoLogin();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="login-back-button" onClick={handleGoBack}>
          ← 돌아가기
        </button>

        <div className="login-content">
          <div className="login-header">
            <img
              src="https://cdn.gntc-youth.com/assets/gntc-youth-logo-black.webp"
              alt="GNTC Youth 로고"
              className="login-logo"
            />
            <h1>GNTC YOUTH</h1>
            <p className="login-subtitle">함께 성장하고, 함께 섬기며, 함께 예배하는 청년들의 공동체</p>
          </div>

          <div className="login-divider">
            <span>소셜 계정으로 간편하게 시작하기</span>
          </div>

          <div className="login-buttons">
            <button className="social-login-button kakao" onClick={handleKakaoLogin}>
              <svg className="social-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.86 5.44 4.67 7.03-.2.73-.74 2.75-.85 3.19-.13.52.19.51.4.37.16-.11 2.53-1.71 3.53-2.39.75.1 1.52.15 2.25.15 5.52 0 10-3.58 10-8S17.52 3 12 3z"
                  fill="currentColor"
                />
              </svg>
              카카오로 시작하기
            </button>

            {/* 추후 추가 예정 */}
            <button className="social-login-button naver" disabled>
              <svg className="social-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"
                  fill="currentColor"
                />
              </svg>
              네이버로 시작하기
              <span className="coming-soon">준비중</span>
            </button>

            <button className="social-login-button google" disabled>
              <svg className="social-icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google로 시작하기
              <span className="coming-soon">준비중</span>
            </button>
          </div>

          <p className="login-terms">
            로그인 시 GNTC Youth의{' '}
            <a href="#terms">이용약관</a>과{' '}
            <a href="#privacy">개인정보처리방침</a>에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
