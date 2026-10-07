import { apiRequest } from '../../../../shared/api'
import {
  cancelZooArrival,
  changeZooTeamCourse,
  createZooTeam,
  deleteZooTeam,
  fetchMyZooTeam,
  fetchZooTeam,
  fetchZooTeams,
  joinZooTeam,
  leaveZooTeam,
  markZooArrival,
  startZooTeam,
  transferZooTeamLeader,
} from '../zooTeamApi'

jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

beforeEach(() => {
  mockApiRequest.mockReset()
  mockApiRequest.mockResolvedValue({})
})

describe('zooTeamApi', () => {
  it('조 목록, 내 조, 조 상세를 조회한다', async () => {
    await fetchZooTeams()
    await fetchMyZooTeam()
    await fetchZooTeam(4)

    expect(mockApiRequest).toHaveBeenNthCalledWith(1, '/zoo/teams')
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/zoo/teams/me')
    expect(mockApiRequest).toHaveBeenNthCalledWith(3, '/zoo/teams/4')
  })

  it('조 이름과 코스로 조를 만든다', async () => {
    await createZooTeam({ name: '사자팀', course: 'A' })

    expect(mockApiRequest).toHaveBeenCalledWith('/zoo/teams', {
      method: 'POST',
      body: JSON.stringify({ name: '사자팀', course: 'A' }),
    })
  })

  it('참여, 나가기, 삭제, 마감을 요청한다', async () => {
    await joinZooTeam(4)
    await leaveZooTeam(4)
    await deleteZooTeam(4)
    await startZooTeam(4)

    expect(mockApiRequest).toHaveBeenNthCalledWith(1, '/zoo/teams/4/join', { method: 'POST' })
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/zoo/teams/4/leave', { method: 'POST' })
    expect(mockApiRequest).toHaveBeenNthCalledWith(3, '/zoo/teams/4', { method: 'DELETE' })
    expect(mockApiRequest).toHaveBeenNthCalledWith(4, '/zoo/teams/4/start', { method: 'POST' })
  })

  it('코스 변경과 조장 넘기기는 바꿀 값을 보낸다', async () => {
    await changeZooTeamCourse(4, 'B')
    await transferZooTeamLeader(4, 15)

    expect(mockApiRequest).toHaveBeenNthCalledWith(1, '/zoo/teams/4', {
      method: 'PATCH',
      body: JSON.stringify({ course: 'B' }),
    })
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/zoo/teams/4/leader', {
      method: 'POST',
      body: JSON.stringify({ userId: 15 }),
    })
  })

  it('장소 도착을 기록하고 취소한다', async () => {
    await markZooArrival(4, 'AUSTRALIA')
    await cancelZooArrival(4, 'AUSTRALIA')

    expect(mockApiRequest).toHaveBeenNthCalledWith(1, '/zoo/teams/4/arrivals/AUSTRALIA', { method: 'PUT' })
    expect(mockApiRequest).toHaveBeenNthCalledWith(2, '/zoo/teams/4/arrivals/AUSTRALIA', { method: 'DELETE' })
  })
})
