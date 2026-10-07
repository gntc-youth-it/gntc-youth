import { apiRequest } from '../../../../shared/api'
import { fetchZooPhotoResults, fetchZooPhotos, unvoteZooPhoto, voteZooPhoto } from '../zooPhotoApi'

jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

beforeEach(() => {
  mockApiRequest.mockReset()
  mockApiRequest.mockResolvedValue({})
})

describe('zooPhotoApi', () => {
  it('사진 목록과 운영자 결과를 조회한다', async () => {
    await fetchZooPhotos()
    await fetchZooPhotoResults()

    expect(mockApiRequest).toHaveBeenNthCalledWith(1, '/zoo/photos')
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/zoo/photos/results')
  })

  it('투표는 PUT, 취소는 DELETE로 보낸다', async () => {
    await voteZooPhoto(12)
    await unvoteZooPhoto(12)

    expect(mockApiRequest).toHaveBeenNthCalledWith(1, '/zoo/photos/12/vote', { method: 'PUT' })
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/zoo/photos/12/vote', { method: 'DELETE' })
  })
})
