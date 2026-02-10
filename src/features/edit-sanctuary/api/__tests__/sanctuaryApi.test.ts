jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

import { getFilePresignedUrl, updateChurchInfo } from '../sanctuaryApi'
import { apiRequest } from '../../../../shared/api'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('getFilePresignedUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('파일 정보로 presigned URL을 요청하고 fileId와 presignedUrl을 반환한다', async () => {
    mockApiRequest.mockResolvedValue({
      fileId: 1,
      presignedUrl: 'https://s3.example.com/uploads/test.jpg',
    })

    const result = await getFilePresignedUrl('photo.jpg', 'image/jpeg', 1048576)

    expect(mockApiRequest).toHaveBeenCalledWith('/files/presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        fileSize: 1048576,
      }),
    })
    expect(result.fileId).toBe(1)
    expect(result.presignedUrl).toBe('https://s3.example.com/uploads/test.jpg')
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('권한이 없습니다.'))

    await expect(
      getFilePresignedUrl('photo.jpg', 'image/jpeg', 1024)
    ).rejects.toThrow('권한이 없습니다.')
  })
})

describe('updateChurchInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('성전 정보를 저장한다 (사진 + 기도제목)', async () => {
    mockApiRequest.mockResolvedValue(undefined)

    await updateChurchInfo('ANYANG', {
      groupPhotoFileId: 1,
      prayerTopics: [
        { content: '교회의 부흥을 위해', sortOrder: 1 },
        { content: '청년들의 신앙 성장을 위해', sortOrder: 2 },
      ],
    })

    expect(mockApiRequest).toHaveBeenCalledWith('/churches/ANYANG/info', {
      method: 'PUT',
      body: JSON.stringify({
        groupPhotoFileId: 1,
        prayerTopics: [
          { content: '교회의 부흥을 위해', sortOrder: 1 },
          { content: '청년들의 신앙 성장을 위해', sortOrder: 2 },
        ],
      }),
    })
  })

  it('사진 없이 기도제목만 저장할 수 있다', async () => {
    mockApiRequest.mockResolvedValue(undefined)

    await updateChurchInfo('SUWON', {
      groupPhotoFileId: null,
      prayerTopics: [{ content: '기도제목 1', sortOrder: 1 }],
    })

    expect(mockApiRequest).toHaveBeenCalledWith('/churches/SUWON/info', {
      method: 'PUT',
      body: JSON.stringify({
        groupPhotoFileId: null,
        prayerTopics: [{ content: '기도제목 1', sortOrder: 1 }],
      }),
    })
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('서버 오류'))

    await expect(
      updateChurchInfo('ANYANG', {
        groupPhotoFileId: null,
        prayerTopics: [{ content: 'test', sortOrder: 1 }],
      })
    ).rejects.toThrow('서버 오류')
  })
})
