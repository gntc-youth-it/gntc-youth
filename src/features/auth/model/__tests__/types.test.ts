import { normalizeTestLoginResponse } from '../types'

describe('normalizeTestLoginResponse', () => {
  it('snake_case API 응답을 camelCase로 변환한다', () => {
    const raw = {
      access_token: 'token123',
      refresh_token: 'refresh456',
      user_id: 1,
      email: 'test@test.com',
      name: 'Test User',
      role: 'USER',
    }

    expect(normalizeTestLoginResponse(raw)).toEqual({
      accessToken: 'token123',
      refreshToken: 'refresh456',
      userId: 1,
      email: 'test@test.com',
      name: 'Test User',
      role: 'USER',
    })
  })

  it('모든 필드를 올바르게 매핑한다', () => {
    const raw = {
      access_token: 'a',
      refresh_token: 'r',
      user_id: 99,
      email: 'admin@church.com',
      name: '관리자',
      role: 'ADMIN',
    }

    const result = normalizeTestLoginResponse(raw)
    expect(result.accessToken).toBe('a')
    expect(result.refreshToken).toBe('r')
    expect(result.userId).toBe(99)
    expect(result.email).toBe('admin@church.com')
    expect(result.name).toBe('관리자')
    expect(result.role).toBe('ADMIN')
  })
})
