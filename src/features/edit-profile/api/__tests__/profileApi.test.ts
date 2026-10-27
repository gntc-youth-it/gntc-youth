import { apiRequest } from '../../../../shared/api'
import { patchProfile } from '../profileApi'

jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('patchProfile', () => {
  it('보낸 필드만 PATCH로 보낸다', async () => {
    mockApiRequest.mockResolvedValue({ name: '김하늘' })

    await patchProfile({ profileImageId: 9 })

    expect(mockApiRequest).toHaveBeenCalledWith('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ profileImageId: 9 }),
    })
  })
})
