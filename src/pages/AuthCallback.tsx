import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthCallback.css';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URL에서 accessToken 추출
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setTimeout(() => {
        navigate('/');
      }, 3000);
      return;
    }

    if (accessToken) {
      // localStorage에 토큰 저장
      localStorage.setItem('accessToken', accessToken);

      // Refresh token은 HttpOnly 쿠키로 자동 설정됨

      // 로그인 성공 - 홈으로 이동
      navigate('/');
    } else {
      setError('토큰을 받지 못했습니다. 다시 시도해주세요.');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [navigate]);

  return (
    <div className="auth-callback">
      <div className="auth-callback-content">
        {error ? (
          <>
            <div className="auth-callback-icon error">✕</div>
            <h2>{error}</h2>
            <p>잠시 후 홈으로 돌아갑니다...</p>
          </>
        ) : (
          <>
            <div className="auth-callback-icon loading">
              <div className="spinner"></div>
            </div>
            <h2>로그인 중입니다...</h2>
            <p>잠시만 기다려주세요.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
