import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthCallback.css';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      // URL에서 access_token 추출 (snake_case로 변경)
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token') || urlParams.get('accessToken'); // 둘 다 지원
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

        // 성공 상태 표시
        setIsSuccess(true);

        // 1.5초 후 리다이렉트
        setTimeout(() => {
          // 저장된 리다이렉트 경로가 있으면 그곳으로, 없으면 홈으로
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin'); // 사용 후 삭제
          navigate(redirectUrl);
        }, 1500);
      } else {
        setError('토큰을 받지 못했습니다. 다시 시도해주세요.');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    processCallback();
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
        ) : isSuccess ? (
          <>
            <div className="auth-callback-icon success">✓</div>
            <h2>로그인 성공!</h2>
            <p>환영합니다. 홈으로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="auth-callback-icon loading">
              <div className="spinner"></div>
            </div>
            <h2>로그인 처리 중...</h2>
            <p>잠시만 기다려주세요.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
