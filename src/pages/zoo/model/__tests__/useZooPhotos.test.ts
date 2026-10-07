import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { fetchZooPhotos, unvoteZooPhoto, voteZooPhoto } from '../../api/zooPhotoApi'
import type { ZooPhoto } from '../photo'
import { useZooPhotos } from '../useZooPhotos'

jest.mock('../../api/zooPhotoApi')

const mockFetchZooPhotos = fetchZooPhotos as jest.MockedFunction<typeof fetchZooPhotos>
const mockVoteZooPhoto = voteZooPhoto as jest.MockedFunction<typeof voteZooPhoto>
const mockUnvoteZooPhoto = unvoteZooPhoto as jest.MockedFunction<typeof unvoteZooPhoto>

const makePhoto = (overrides: Partial<ZooPhoto> = {}): ZooPhoto => ({
  id: 12,
  stopId: 'AFRICA_1',
  teamId: 4,
  teamName: '사자팀',
  photoPath: 'uploads/lion.webp',
  submittedAt: '2026-10-10T10:12:00',
  updatedAt: '2026-10-10T10:12:00',
  isMyTeam: false,
  isVoted: false,
  ...overrides,
})

const renderLoaded = async (photos: ZooPhoto[]) => {
  mockFetchZooPhotos.mockResolvedValue({ photos })
  const hook = renderHook(() => useZooPhotos())
  await waitFor(() => expect(hook.result.current.loadState).toBe('ready'))
  return hook
}

const photoById = (photos: ZooPhoto[], id: number) => photos.find((photo) => photo.id === id)

beforeEach(() => {
  jest.clearAllMocks()
  mockVoteZooPhoto.mockResolvedValue(undefined)
  mockUnvoteZooPhoto.mockResolvedValue(undefined)
})

describe('useZooPhotos', () => {
  it('사진 목록을 불러온다', async () => {
    const { result } = await renderLoaded([makePhoto(), makePhoto({ id: 13 })])

    expect(result.current.photos.map((photo) => photo.id)).toEqual([12, 13])
  })

  it('처음에 불러오지 못하면 error', async () => {
    mockFetchZooPhotos.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useZooPhotos())

    await waitFor(() => expect(result.current.loadState).toBe('error'))
  })

  it('하트를 누르면 바로 투표한 것으로 보이고, 투표한 사진을 다시 누르면 취소한다', async () => {
    const { result } = await renderLoaded([makePhoto(), makePhoto({ id: 13, isVoted: true })])

    await act(() => result.current.toggleVote(result.current.photos[0]))
    expect(mockVoteZooPhoto).toHaveBeenCalledWith(12)
    expect(photoById(result.current.photos, 12)?.isVoted).toBe(true)

    await act(() => result.current.toggleVote(photoById(result.current.photos, 13)!))
    expect(mockUnvoteZooPhoto).toHaveBeenCalledWith(13)
    expect(photoById(result.current.photos, 13)?.isVoted).toBe(false)
  })

  it('투표에 실패하면 하트를 되돌리고 이유를 알려준다', async () => {
    mockVoteZooPhoto.mockRejectedValue(new HttpError(500, '서버에서 알 수 없는 오류가 발생했습니다.', 9999))
    const { result } = await renderLoaded([makePhoto()])

    await act(() => result.current.toggleVote(result.current.photos[0]))

    expect(result.current.photos[0].isVoted).toBe(false)
    expect(result.current.voteError?.message).toBe('서버에서 알 수 없는 오류가 발생했습니다.')
  })

  it('지워진 사진이면 목록을 다시 받는다', async () => {
    mockVoteZooPhoto.mockRejectedValue(new HttpError(404, '사진을 찾을 수 없어요.', 5009))
    const { result } = await renderLoaded([makePhoto()])
    mockFetchZooPhotos.mockResolvedValue({ photos: [] })

    await act(() => result.current.toggleVote(result.current.photos[0]))

    await waitFor(() => expect(result.current.photos).toEqual([]))
    expect(result.current.voteError?.message).toBe('사진을 찾을 수 없어요.')
  })

  it('요청이 끝나기 전에 같은 사진을 다시 누르면 무시한다', async () => {
    let finishVote: () => void = () => undefined
    mockVoteZooPhoto.mockImplementation(() => new Promise<void>((resolve) => (finishVote = resolve)))
    const { result } = await renderLoaded([makePhoto()])

    let firstTap: Promise<void> = Promise.resolve()
    act(() => {
      firstTap = result.current.toggleVote(result.current.photos[0])
    })
    await act(() => result.current.toggleVote(result.current.photos[0]))

    expect(mockVoteZooPhoto).toHaveBeenCalledTimes(1)
    expect(mockUnvoteZooPhoto).not.toHaveBeenCalled()

    await act(async () => {
      finishVote()
      await firstTap
    })
    expect(result.current.photos[0].isVoted).toBe(true)
  })

  it('우리 조 사진은 투표하지 않는다', async () => {
    const { result } = await renderLoaded([makePhoto({ isMyTeam: true })])

    await act(() => result.current.toggleVote(result.current.photos[0]))

    expect(mockVoteZooPhoto).not.toHaveBeenCalled()
    expect(result.current.photos[0].isVoted).toBe(false)
  })

  it('다시 불러온 목록이 늦게 와도 방금 누른 투표를 덮어쓰지 않는다', async () => {
    const { result } = await renderLoaded([makePhoto()])

    await act(() => result.current.toggleVote(result.current.photos[0]))
    mockFetchZooPhotos.mockResolvedValue({ photos: [makePhoto({ isVoted: false }), makePhoto({ id: 14 })] })
    await act(() => result.current.reload())

    expect(result.current.photos.map((photo) => [photo.id, photo.isVoted])).toEqual([
      [12, true],
      [14, false],
    ])
  })
})
