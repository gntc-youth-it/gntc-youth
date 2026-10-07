import { renderHook, waitFor } from '@testing-library/react'
import { fetchMyZooTeam, fetchZooTeams } from '../../api/zooTeamApi'
import { sortTeams, useZooLobby } from '../useZooLobby'
import type { ZooTeamSummary } from '../team'

jest.mock('../../api/zooTeamApi')

const mockFetchMyZooTeam = fetchMyZooTeam as jest.MockedFunction<typeof fetchMyZooTeam>
const mockFetchZooTeams = fetchZooTeams as jest.MockedFunction<typeof fetchZooTeams>

const makeSummary = (overrides: Partial<ZooTeamSummary>): ZooTeamSummary => ({
  id: 1,
  name: '사자팀',
  course: 'A',
  status: 'RECRUITING',
  leaderName: '박석희',
  memberCount: 1,
  arrivedCount: 0,
  createdAt: '2026-10-10T09:00:00',
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('sortTeams', () => {
  it('모집 중인 조를 먼저, 같은 상태는 최근에 만든 조부터 보여준다', () => {
    const teams = [
      makeSummary({ id: 1, status: 'STARTED', createdAt: '2026-10-10T09:00:00' }),
      makeSummary({ id: 2, status: 'RECRUITING', createdAt: '2026-10-10T09:10:00' }),
      makeSummary({ id: 3, status: 'RECRUITING', createdAt: '2026-10-10T09:20:00' }),
      makeSummary({ id: 4, status: 'STARTED', createdAt: '2026-10-10T09:30:00' }),
    ]

    expect(sortTeams(teams).map((team) => team.id)).toEqual([3, 2, 4, 1])
  })
})

describe('useZooLobby', () => {
  it('내 조와 조 목록을 함께 불러온다', async () => {
    mockFetchMyZooTeam.mockResolvedValue({ team: null })
    mockFetchZooTeams.mockResolvedValue({
      teams: [makeSummary({ id: 1, status: 'STARTED' }), makeSummary({ id: 2 })],
    })

    const { result } = renderHook(() => useZooLobby(true))

    await waitFor(() => expect(result.current.loadState).toBe('ready'))
    expect(result.current.myTeam).toBeNull()
    expect(result.current.teams.map((team) => team.id)).toEqual([2, 1])
  })

  it('불러오지 못하면 error', async () => {
    mockFetchMyZooTeam.mockRejectedValue(new TypeError('Failed to fetch'))
    mockFetchZooTeams.mockResolvedValue({ teams: [] })

    const { result } = renderHook(() => useZooLobby(true))

    await waitFor(() => expect(result.current.loadState).toBe('error'))
  })

  it('로그인 전에는 요청하지 않는다', () => {
    renderHook(() => useZooLobby(false))

    expect(mockFetchMyZooTeam).not.toHaveBeenCalled()
    expect(mockFetchZooTeams).not.toHaveBeenCalled()
  })
})
