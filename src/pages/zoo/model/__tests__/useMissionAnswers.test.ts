import { renderHook, waitFor } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { fetchZooMissionResults } from '../../api/zooTeamApi'
import { useMissionAnswers } from '../useMissionAnswers'

jest.mock('../../api/zooTeamApi')

const mockFetchZooMissionResults = fetchZooMissionResults as jest.MockedFunction<typeof fetchZooMissionResults>

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
})
