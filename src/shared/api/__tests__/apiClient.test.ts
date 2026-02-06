jest.mock('../config', () => ({
  API_BASE_URL: '',
}))

jest.mock('../../lib', () => ({
  getAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
  removeAccessToken: jest.fn(),
}))

import { apiRequest, HttpError } from '../apiClient'
import { getAccessToken, setAccessToken, removeAccessToken } from '../../lib'

const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('HttpError', () => {
  it('status, message, code 속성을 가진다', () => {
    const error = new HttpError(404, 'Not Found', 'NOT_FOUND')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('HttpError')
    expect(error.status).toBe(404)
    expect(error.message).toBe('Not Found')
    expect(error.code).toBe('NOT_FOUND')
  })

  it('code 없이 생성할 수 있다', () => {
    const error = new HttpError(500, 'Server Error')

    expect(error.status).toBe(500)
    expect(error.code).toBeUndefined()
  })
})

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAccessToken.mockReturnValue(null)
  })

  it('올바른 URL과 헤더로 요청한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    })

    await apiRequest('/api/test')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        credentials: 'include',
      })
    )
  })

  it('토큰이 있으면 Authorization 헤더를 포함한다', async () => {
    mockGetAccessToken.mockReturnValue('my-token')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await apiRequest('/api/test')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      })
    )
  })

  it('토큰이 없으면 Authorization 헤더가 없다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await apiRequest('/api/test')

    const callHeaders = mockFetch.mock.calls[0][1].headers
    expect(callHeaders.Authorization).toBeUndefined()
  })

  it('응답 JSON을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'success' }),
    })

    const result = await apiRequest('/api/test')

    expect(result).toEqual({ message: 'success' })
  })

  it('커스텀 옵션을 전달할 수 있다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await apiRequest('/api/test', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
      })
    )
  })

  it('요청 실패 시 HttpError를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server Error', code: 'ERR_500' }),
    })

    await expect(apiRequest('/api/test')).rejects.toMatchObject({
      name: 'HttpError',
      status: 500,
      message: 'Server Error',
      code: 'ERR_500',
    })
  })

  it('에러 응답의 JSON 파싱 실패 시 기본 메시지를 사용한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('not json')),
    })

    await expect(apiRequest('/api/test')).rejects.toMatchObject({
      name: 'HttpError',
      status: 502,
      message: 'API Error: 502',
    })
  })

  describe('401 토큰 갱신', () => {
    it('401 응답 시 토큰을 갱신하고 재요청한다', async () => {
      mockGetAccessToken.mockReturnValue('old-token')

      mockFetch
        // 첫 번째 요청: 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({}),
        })
        // 토큰 갱신 요청: 성공
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'new-token' }),
        })
        // 재시도 요청: 성공
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'retry-success' }),
        })

      const result = await apiRequest('/api/test')

      expect(result).toEqual({ data: 'retry-success' })
      expect(setAccessToken).toHaveBeenCalledWith('new-token')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('토큰 갱신 실패 시 토큰을 제거하고 에러를 던진다', async () => {
      mockGetAccessToken.mockReturnValue('expired-token')

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({}),
        })

      await expect(apiRequest('/api/test')).rejects.toThrow(
        'Session expired. Please login again.'
      )
      expect(removeAccessToken).toHaveBeenCalled()
    })
  })
})
