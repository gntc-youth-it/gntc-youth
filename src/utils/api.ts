const API_BASE_URL = 'https://api.gntc-youth.com';

/**
 * JWT 토큰 디코딩 (페이로드만 추출)
 */
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Access Token 가져오기
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Access Token 저장
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

/**
 * Access Token 삭제
 */
export const removeAccessToken = (): void => {
  localStorage.removeItem('accessToken');
};

/**
 * 로그인 여부 확인
 */
export const isLoggedIn = (): boolean => {
  return !!getAccessToken();
};

/**
 * API 요청 헬퍼 함수
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // 쿠키를 포함하여 요청 (Refresh Token)
  });

  // 401 Unauthorized - 토큰 만료
  if (response.status === 401) {
    // 토큰 삭제 후 로그인 페이지로 리다이렉트
    removeAccessToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
};

/**
 * 사용자 정보 인터페이스
 */
export interface UserInfo {
  id: number;
  name: string;
  email?: string;
  role?: string;
  provider?: string;
}

/**
 * JWT 토큰에서 사용자 정보 추출
 */
export const getUserInfoFromToken = (): UserInfo | null => {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const payload = decodeJWT(token);
  if (!payload) {
    return null;
  }

  return {
    id: parseInt(payload.sub || '0'),
    name: payload.name || '사용자',
    email: payload.email,
    role: payload.role,
    provider: payload.provider,
  };
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // 로컬 토큰 삭제
    removeAccessToken();
  }
};

/**
 * 카카오 로그인 URL로 이동
 */
export const redirectToKakaoLogin = (): void => {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
};
