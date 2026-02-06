import { getAccessToken, setAccessToken, removeAccessToken } from '../token'

describe('token', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getAccessToken', () => {
    it('토큰이 없으면 null을 반환한다', () => {
      expect(getAccessToken()).toBeNull()
    })

    it('저장된 토큰을 반환한다', () => {
      localStorage.setItem('accessToken', 'test-token')
      expect(getAccessToken()).toBe('test-token')
    })
  })

  describe('setAccessToken', () => {
    it('토큰을 localStorage에 저장한다', () => {
      setAccessToken('my-token')
      expect(localStorage.getItem('accessToken')).toBe('my-token')
    })

    it('기존 토큰을 덮어쓴다', () => {
      setAccessToken('old-token')
      setAccessToken('new-token')
      expect(localStorage.getItem('accessToken')).toBe('new-token')
    })
  })

  describe('removeAccessToken', () => {
    it('토큰을 localStorage에서 제거한다', () => {
      localStorage.setItem('accessToken', 'test-token')
      removeAccessToken()
      expect(localStorage.getItem('accessToken')).toBeNull()
    })

    it('토큰이 없어도 에러가 발생하지 않는다', () => {
      expect(() => removeAccessToken()).not.toThrow()
    })
  })
})
