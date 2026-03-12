jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

import { apiRequest } from '../../../../shared/api'
import { fetchBibleBooks, fetchChapterCount, fetchVerses } from '../bibleApi'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('fetchBibleBooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('성경 66권 목록을 반환한다', async () => {
    const mockBooks = [
      { bookCode: 'GENESIS', bookName: '창세기', order: 1 },
      { bookCode: 'EXODUS', bookName: '출애굽기', order: 2 },
    ]
    mockApiRequest.mockResolvedValue({ books: mockBooks })

    const result = await fetchBibleBooks()

    expect(mockApiRequest).toHaveBeenCalledWith('/book')
    expect(result).toEqual(mockBooks)
    expect(result).toHaveLength(2)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('서버 오류'))

    await expect(fetchBibleBooks()).rejects.toThrow('서버 오류')
  })
})

describe('fetchChapterCount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('특정 책의 장 수를 반환한다', async () => {
    mockApiRequest.mockResolvedValue({ chapters: 50 })

    const result = await fetchChapterCount('GENESIS')

    expect(mockApiRequest).toHaveBeenCalledWith('/book/GENESIS')
    expect(result).toBe(50)
  })

  it('존재하지 않는 책 코드로 요청 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('해당 성경 책이 존재하지 않습니다.'))

    await expect(fetchChapterCount('INVALID')).rejects.toThrow(
      '해당 성경 책이 존재하지 않습니다.'
    )
  })
})

describe('fetchVerses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('특정 장의 절 목록을 반환한다', async () => {
    const mockVerses = [
      { verseId: 1, verseNumber: 1, content: '태초에 하나님이 천지를 창조하시니라' },
      { verseId: 2, verseNumber: 2, content: '땅이 혼돈하고 공허하며' },
    ]
    mockApiRequest.mockResolvedValue({ verses: mockVerses })

    const result = await fetchVerses('GENESIS', 1)

    expect(mockApiRequest).toHaveBeenCalledWith('/book/GENESIS/1')
    expect(result).toEqual(mockVerses)
    expect(result[0].verseId).toBe(1)
  })

  it('존재하지 않는 장으로 요청 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('해당 장이 존재하지 않습니다.'))

    await expect(fetchVerses('GENESIS', 999)).rejects.toThrow(
      '해당 장이 존재하지 않습니다.'
    )
  })
})
