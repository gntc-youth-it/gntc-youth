import { renderHook, act, waitFor } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { fetchZooTeam, markZooArrival, joinZooTeam, startZooTeam } from '../../api/zooTeamApi'
import { useZooTeam } from '../useZooTeam'
import type { ZooTeamDetail } from '../team'

jest.mock('../../api/zooTeamApi')

const mockFetchZooTeam = fetchZooTeam as jest.MockedFunction<typeof fetchZooTeam>
const mockMarkZooArrival = markZooArrival as jest.MockedFunction<typeof markZooArrival>
const mockJoinZooTeam = joinZooTeam as jest.MockedFunction<typeof joinZooTeam>
const mockStartZooTeam = startZooTeam as jest.MockedFunction<typeof startZooTeam>

const makeTeam = (overrides: Partial<ZooTeamDetail> = {}): ZooTeamDetail => ({
  id: 4,
  name: '사자팀',
  course: 'A',
  status: 'STARTED',
  leaderUserId: 1,
  members: [{ userId: 1, name: '박석희', profileImagePath: null, isLeader: true, joinedAt: '2026-10-10T09:00:00' }],
  arrivals: [{ stopId: 'AFRICA_1', arrivedAt: '2026-10-10T10:00:00' }],
  createdAt: '2026-10-10T09:00:00',
  startedAt: '2026-10-10T09:30:00',
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useZooTeam', () => {
  it('조 정보를 불러온다', async () => {
    mockFetchZooTeam.mockResolvedValue(makeTeam())

    const { result } = renderHook(() => useZooTeam(4))

    expect(result.current.loadState).toBe('loading')
    await waitFor(() => expect(result.current.loadState).toBe('ready'))
    expect(result.current.team?.name).toBe('사자팀')
    expect(mockFetchZooTeam).toHaveBeenCalledWith(4)
  })

  it('없는 조면 notFound', async () => {
    mockFetchZooTeam.mockRejectedValue(new HttpError(404, '조를 찾을 수 없어요.', 5001))

    const { result } = renderHook(() => useZooTeam(4))

    await waitFor(() => expect(result.current.loadState).toBe('notFound'))
    expect(result.current.team).toBeNull()
  })

  it('처음 불러오기에 실패하면 error', async () => {
    mockFetchZooTeam.mockRejectedValue(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useZooTeam(4))

    await waitFor(() => expect(result.current.loadState).toBe('error'))
  })

  it('도착을 기록하면 응답으로 화면을 바로 바꾼다', async () => {
    mockFetchZooTeam.mockResolvedValue(makeTeam())
    const updated = makeTeam({
      arrivals: [
        { stopId: 'AFRICA_1', arrivedAt: '2026-10-10T10:00:00' },
        { stopId: 'AUSTRALIA', arrivedAt: '2026-10-10T10:20:00' },
      ],
    })
    mockMarkZooArrival.mockResolvedValue(updated)
    const { result } = renderHook(() => useZooTeam(4))
    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    let succeeded = false
    await act(async () => {
      succeeded = await result.current.markArrival('AUSTRALIA')
    })

    expect(succeeded).toBe(true)
    expect(mockMarkZooArrival).toHaveBeenCalledWith(4, 'AUSTRALIA')
    expect(result.current.team?.arrivals).toHaveLength(2)
    expect(result.current.pendingAction).toBeNull()
  })

  it('늦게 도착한 이전 조회 결과가 최신 변경을 덮어쓰지 않는다', async () => {
    const initial = makeTeam()
    mockFetchZooTeam.mockResolvedValueOnce(initial)
    const { result } = renderHook(() => useZooTeam(4))
    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    let resolveStale: (team: ZooTeamDetail) => void = () => undefined
    mockFetchZooTeam.mockImplementationOnce(
      () =>
        new Promise<ZooTeamDetail>((resolve) => {
          resolveStale = resolve
        })
    )
    act(() => {
      void result.current.reload()
    })

    mockMarkZooArrival.mockResolvedValue(
      makeTeam({
        arrivals: [
          { stopId: 'AFRICA_1', arrivedAt: '2026-10-10T10:00:00' },
          { stopId: 'AUSTRALIA', arrivedAt: '2026-10-10T10:20:00' },
        ],
      })
    )
    await act(async () => {
      await result.current.markArrival('AUSTRALIA')
    })
    await act(async () => {
      resolveStale(initial)
    })

    expect(result.current.team?.arrivals).toHaveLength(2)
  })

  it('요청이 실패하면 서버 메시지를 보여주고 다시 불러온다', async () => {
    mockFetchZooTeam.mockResolvedValue(makeTeam({ status: 'RECRUITING', arrivals: [] }))
    mockJoinZooTeam.mockRejectedValue(new HttpError(409, '이미 다른 조에 참여 중이에요.', 5002))
    const { result } = renderHook(() => useZooTeam(4))
    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    let succeeded = true
    await act(async () => {
      succeeded = await result.current.join()
    })

    expect(succeeded).toBe(false)
    expect(result.current.actionError).toEqual({ message: '이미 다른 조에 참여 중이에요.', code: 5002 })
    expect(mockFetchZooTeam).toHaveBeenCalledTimes(2)

    act(() => result.current.clearActionError())
    expect(result.current.actionError).toBeNull()
  })

  it('마감하면 출발 상태로 바뀐다', async () => {
    mockFetchZooTeam.mockResolvedValue(makeTeam({ status: 'RECRUITING', arrivals: [] }))
    mockStartZooTeam.mockResolvedValue(makeTeam({ status: 'STARTED', arrivals: [] }))
    const { result } = renderHook(() => useZooTeam(4))
    await waitFor(() => expect(result.current.loadState).toBe('ready'))

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.team?.status).toBe('STARTED')
  })
})
