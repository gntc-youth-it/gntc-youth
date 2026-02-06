import { isLoggedIn, getUserInfoFromToken } from '../tokenStorage'

// 테스트용 JWT 생성 헬퍼
const createTestJWT = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const jsonStr = JSON.stringify(payload)
  const body = btoa(unescape(encodeURIComponent(jsonStr)))
  return `${header}.${body}.fake-signature`
}

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('isLoggedIn', () => {
    it('토큰이 있으면 true를 반환한다', () => {
      localStorage.setItem('accessToken', 'some-token')
      expect(isLoggedIn()).toBe(true)
    })

    it('토큰이 없으면 false를 반환한다', () => {
      expect(isLoggedIn()).toBe(false)
    })
  })

  describe('getUserInfoFromToken', () => {
    it('유효한 JWT에서 사용자 정보를 추출한다', () => {
      const token = createTestJWT({
        sub: '42',
        name: 'Test User',
        email: 'test@test.com',
        role: 'USER',
        provider: 'kakao',
      })
      localStorage.setItem('accessToken', token)

      expect(getUserInfoFromToken()).toEqual({
        id: 42,
        name: 'Test User',
        email: 'test@test.com',
        role: 'USER',
        provider: 'kakao',
      })
    })

    it('토큰이 없으면 null을 반환한다', () => {
      expect(getUserInfoFromToken()).toBeNull()
    })

    it('잘못된 토큰이면 null을 반환한다', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      localStorage.setItem('accessToken', 'invalid-token')
      expect(getUserInfoFromToken()).toBeNull()

      consoleSpy.mockRestore()
    })

    it('name이 없으면 기본값 "사용자"를 사용한다', () => {
      const token = createTestJWT({ sub: '1' })
      localStorage.setItem('accessToken', token)

      expect(getUserInfoFromToken()?.name).toBe('사용자')
    })

    it('선택 필드(email, role, provider)가 없어도 동작한다', () => {
      const token = createTestJWT({ sub: '1', name: 'Minimal' })
      localStorage.setItem('accessToken', token)

      const result = getUserInfoFromToken()
      expect(result).toEqual({
        id: 1,
        name: 'Minimal',
        email: undefined,
        role: undefined,
        provider: undefined,
      })
    })
  })
})
