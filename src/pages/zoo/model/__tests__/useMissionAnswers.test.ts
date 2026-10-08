import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { fetchZooMissionResults } from '../../api/zooTeamApi'
import type { ZooMissionResultsResponse, ZooMissionTeamResult } from '../team'
import { useMissionAnswers } from '../useMissionAnswers'

jest.mock('../../api/zooTeamApi')

const mockFetchZooMissionResults = fetchZooMissionResults as jest.MockedFunction<typeof fetchZooMissionResults>

const makeTeam = (name: string): ZooMissionTeamResult => ({
  id: 4,
  name,
  course: 'A',
  status: 'STARTED',
  leaderName: '박석희',
  members: ['박석희'],
  missions: [],
})

const deferred = () => {
  let resolve: (value: ZooMissionResultsResponse) => void = () => undefined
  const promise = new Promise<ZooMissionResultsResponse>((done) => (resolve = done))
  return { promise, resolve }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useMissionAnswers', () => {
  it('모든 조의 제출 내용과 불러온 시각을 가져온다', async () => {
    mockFetchZooMissionResults.mockResolvedValue({
      teams: [{ id: 4, name: '사자팀', course: 'A', status: 'STARTED', leaderName: '박석희', members: ['박석희'], missions: [] }],
    })

    const { result } = renderHook(() => useMissionAnswers())

    await waitFor(() => expect(result.current.loadState).toBe('ready'))
    expect(result.current.teams.map((team) => team.name)).toEqual(['사자팀'])
    expect(result.current.loadedAt).toBeInstanceOf(Date)
  })

  it('운영자 권한이 없으면 forbidden', async () => {
    mockFetchZooMissionResults.mockRejectedValue(new HttpError(403, '운영자만 볼 수 있어요.', 5008))

    const { result } = renderHook(() => useMissionAnswers())

    await waitFor(() => expect(result.current.loadState).toBe('forbidden'))
  })

  it('처음에 불러오지 못하면 error', async () => {
    mockFetchZooMissionResults.mockRejectedValue(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useMissionAnswers())

    await waitFor(() => expect(result.current.loadState).toBe('error'))
  })

  it('새로고침이 겹쳐도 늦게 도착한 이전 응답이 더 새 답을 덮어쓰지 않는다', async () => {
    mockFetchZooMissionResults.mockResolvedValue({ teams: [makeTeam('처음')] })
    const { result } = renderHook(() => useMissionAnswers())
    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    const older = deferred()
    const newer = deferred()
    mockFetchZooMissionResults.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)
    let olderLoad: Promise<void> = Promise.resolve()
    let newerLoad: Promise<void> = Promise.resolve()
    act(() => {
      olderLoad = result.current.reload()
      newerLoad = result.current.reload()
    })

    await act(async () => {
      newer.resolve({ teams: [makeTeam('나중')] })
      await newerLoad
    })
    await act(async () => {
      older.resolve({ teams: [makeTeam('이전')] })
      await olderLoad
    })

    expect(result.current.teams.map((team) => team.name)).toEqual(['나중'])
  })

  it('보여주던 답을 새로 불러오지 못하면 답은 그대로 두고 알리며, 다시 불러오면 알림을 지운다', async () => {
    mockFetchZooMissionResults.mockResolvedValue({ teams: [makeTeam('사자팀')] })
    const { result } = renderHook(() => useMissionAnswers())
    await waitFor(() => expect(result.current.loadState).toBe('ready'))
    expect(result.current.refreshFailed).toBe(false)

    mockFetchZooMissionResults.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await act(() => result.current.reload())

    expect(result.current.loadState).toBe('ready')
    expect(result.current.refreshFailed).toBe(true)
    expect(result.current.teams.map((team) => team.name)).toEqual(['사자팀'])

    await act(() => result.current.reload())
    expect(result.current.refreshFailed).toBe(false)
  })
})
