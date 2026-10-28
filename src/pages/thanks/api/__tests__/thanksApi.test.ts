import { apiRequest, getFilePresignedUrl } from '../../../../shared/api'
import { uploadToS3 } from '../../../../shared/lib'
import {
  addReaction,
  createComment,
  createThanksEntry,
  deleteComment,
  deleteThanksEntry,
  fetchComments,
  fetchThanksEntries,
  removeReaction,
  uploadEntryMedia,
} from '../thanksApi'

jest.mock('../../../../shared/api', () => ({
  ...jest.requireActual('../../../../shared/api'),
  apiRequest: jest.fn(),
  getFilePresignedUrl: jest.fn(),
}))

jest.mock('../../../../shared/lib', () => ({
  ...jest.requireActual('../../../../shared/lib'),
  uploadToS3: jest.fn(),
}))

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>
const mockGetFilePresignedUrl = getFilePresignedUrl as jest.MockedFunction<typeof getFilePresignedUrl>
const mockUploadToS3 = uploadToS3 as jest.MockedFunction<typeof uploadToS3>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('thanksApi', () => {
  it('그날 기록을 날짜로 불러온다', async () => {
    mockApiRequest.mockResolvedValue({ date: '2026-11-09', entries: [] })

    await fetchThanksEntries('2026-11-09')

    expect(mockApiRequest).toHaveBeenCalledWith('/thanks/entries?date=2026-11-09')
  })

  it('감사제목과 사진 파일 번호로 기록을 올린다', async () => {
    await createThanksEntry({ content: '점심 사 준 동기에게 감사', fileId: 31 })

    expect(mockApiRequest).toHaveBeenCalledWith('/thanks/entries', {
      method: 'POST',
      body: JSON.stringify({ content: '점심 사 준 동기에게 감사', fileId: 31 }),
    })
  })

  it('기록을 지운다', async () => {
    await deleteThanksEntry(5)

    expect(mockApiRequest).toHaveBeenCalledWith('/thanks/entries/5', { method: 'DELETE' })
  })

  it('반응을 켜고 끈다', async () => {
    await addReaction(12, 'PRAY')
    await removeReaction(12, 'HEART')

    expect(mockApiRequest).toHaveBeenCalledWith('/thanks/entries/12/reactions/PRAY', { method: 'PUT' })
    expect(mockApiRequest).toHaveBeenCalledWith('/thanks/entries/12/reactions/HEART', { method: 'DELETE' })
  })

  it('댓글을 불러오고, 달고, 지운다', async () => {
    await fetchComments(12)
    await createComment(12, '기도할게요')
    await deleteComment(7)

    expect(mockApiRequest).toHaveBeenCalledWith('/thanks/entries/12/comments')
    expect(mockApiRequest).toHaveBeenCalledWith('/thanks/entries/12/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '기도할게요' }),
    })
    expect(mockApiRequest).toHaveBeenCalledWith('/thanks/comments/7', { method: 'DELETE' })
  })

  it('줄인 사진을 S3에 올리고 파일 번호를 돌려준다', async () => {
    const blob = new Blob(['photo'], { type: 'image/webp' })
    const onProgress = jest.fn()
    mockGetFilePresignedUrl.mockResolvedValue({ fileId: 31, presignedUrl: 'https://s3.example.com/uploads/a.webp' })

    const fileId = await uploadEntryMedia(blob, onProgress)

    expect(mockGetFilePresignedUrl).toHaveBeenCalledWith('thanks.webp', 'image/webp', blob.size)
    expect(mockUploadToS3).toHaveBeenCalledWith('https://s3.example.com/uploads/a.webp', blob, 'image/webp', { onProgress })
    expect(fileId).toBe(31)
  })

  it.each([
    ['video/mp4', 'thanks.mp4'],
    ['video/quicktime', 'thanks.mov'],
    ['image/jpeg', 'thanks.jpg'],
  ])('%s 파일은 %s 이름으로 올린다', async (type, filename) => {
    const blob = new Blob(['media'], { type })
    mockGetFilePresignedUrl.mockResolvedValue({ fileId: 32, presignedUrl: 'https://s3.example.com/uploads/b' })

    await uploadEntryMedia(blob, jest.fn())

    expect(mockGetFilePresignedUrl).toHaveBeenCalledWith(filename, type, blob.size)
  })
})
