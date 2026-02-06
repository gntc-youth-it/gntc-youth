import { decodeJWT } from '../jwt'

// 테스트용 JWT 생성 헬퍼 (base64url 인코딩)
const createTestJWT = (payload: Record<string, unknown>): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.fake-signature`
}

describe('decodeJWT', () => {
  it('유효한 JWT의 페이로드를 반환한다', () => {
    const payload = { sub: '1', name: 'Test User', email: 'test@test.com' }
    const token = createTestJWT(payload)

    expect(decodeJWT(token)).toEqual(payload)
  })

  it('다양한 필드를 가진 페이로드를 처리한다', () => {
    const payload = {
      sub: '42',
      name: 'Admin',
      role: 'ADMIN',
      provider: 'kakao',
      iat: 1700000000,
      exp: 1700003600,
    }
    const token = createTestJWT(payload)

    expect(decodeJWT(token)).toEqual(payload)
  })

  it('한글이 포함된 페이로드를 처리한다', () => {
    const payload = { sub: '1', name: '홍길동' }
    const token = createTestJWT(payload)

    expect(decodeJWT(token)).toEqual(payload)
  })

  it('잘못된 토큰이면 null을 반환한다', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(decodeJWT('invalid-token')).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith('Failed to decode JWT')

    consoleSpy.mockRestore()
  })

  it('빈 문자열이면 null을 반환한다', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(decodeJWT('')).toBeNull()

    consoleSpy.mockRestore()
  })
})
