// 로컬 개발 환경에서는 package.json의 proxy 사용, 프로덕션에서는 실제 URL 사용
const API_BASE_URL =
  process.env.NODE_ENV === 'development' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? '' // 로컬: 프록시 사용
    : 'https://api.gntc-youth.com'; // 프로덕션: 실제 API URL

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
 * HTTP 에러 클래스
 */
export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string | number) {
    super(message);
    this.name = 'HttpError';
  }
}

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
    throw new HttpError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `API Error: ${response.status}`;
    const code = errorData.code;
    throw new HttpError(response.status, message, code);
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

/**
 * 로컬 개발 환경 체크
 */
export const isLocalDevelopment = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
};

/**
 * 테스트 로그인 응답 인터페이스
 */
interface TestLoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  email: string;
  name: string;
  role: string;
}

/**
 * 테스트 로그인 (로컬 개발 전용)
 */
export const testLogin = async (email: string): Promise<TestLoginResponse> => {
  if (!isLocalDevelopment()) {
    throw new Error('테스트 로그인은 로컬 환경에서만 사용 가능합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/test/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '테스트 로그인에 실패했습니다.');
  }

  const data: TestLoginResponse = await response.json();

  // Access Token 저장
  setAccessToken(data.accessToken);

  return data;
};
