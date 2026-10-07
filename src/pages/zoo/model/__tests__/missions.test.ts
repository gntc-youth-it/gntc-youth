import { COURSE_STOP_IDS } from '../course'
import { ZOO_MISSIONS, getStopMission } from '../missions'

describe('장소별 미션', () => {
  it('제1아프리카관은 문제 2개 뒤에 사진 미션을 한다', () => {
    const mission = getStopMission('AFRICA_1')

    expect(mission.questions.map((question) => question.text)).toEqual([
      '키가 6M나 되는 기린의 목뼈는 몇 개일까요?',
      '세상에서 가장 빨리 달리는 새는?',
    ])
    expect(mission.photoMission).toContain('기린 목')
  })

  it('호주관은 문제 2개 뒤에 점프샷 사진 미션을 한다', () => {
    const mission = getStopMission('AUSTRALIA')

    expect(mission.questions.map((question) => question.text)).toEqual([
      '타조 다음으로 큰 새의 평균 달리기 속도는?',
      '이 새는 씨앗의 전파자라고 합니다. 그 새의 이름은?',
    ])
    expect(mission.photoMission).toBe('캥거루 우리 앞에서 조원 전원이 동시에 뛰는 점프샷')
  })

  it('대동물관은 문제 3개 뒤에 안내판 앞 사진 미션을 하고, 안내판 사진을 함께 보여준다', () => {
    const mission = getStopMission('BIG_ANIMAL')

    expect(mission.questions).toHaveLength(3)
    expect(mission.questions[0].text).toBe('지구상에 존재하는 다섯 종의 코뿔소를 적으세요.')
    expect(mission.photoMission).toContain("'코끼리의 발관리' 안내판")
    expect(mission.photoSpot?.image).toBeTruthy()
    expect(mission.photoSpot?.description).toContain('안내판')
  })

  it('곰사 2번은 O/X 중에서 고르는 문제다', () => {
    const mission = getStopMission('BEAR')

    expect(mission.questions.map((question) => question.choices)).toEqual([undefined, ['O', 'X']])
    expect(mission.photoSpot?.description).toContain('곰 크기 비교판')
  })

  it('맹수사는 문제 4개 뒤에 줄무늬 하이에나 사진 미션을 한다', () => {
    const mission = getStopMission('PREDATOR')

    expect(mission.questions.map((question) => question.id)).toEqual(['q1', 'q2', 'q3', 'q4'])
    expect(mission.questions[3].text).toBe('한국 표범의 다양한 이름 2가지를 적으시오.')
    expect(mission.photoMission).toBe('줄무늬 하이에나를 찍어보세요!')
  })

  it('제3아프리카관은 문제 2개 뒤에 하이에나 얼굴판 포토존 사진 미션을 하고, 포토존 사진을 함께 보여준다', () => {
    const mission = getStopMission('AFRICA_3')

    expect(mission.questions.map((question) => question.text)).toEqual([
      '사자의 무리를 뭐라고 일컫나요?',
      '아프리카 미옴보 나무 숲에서 사는 동물은?',
    ])
    expect(mission.photoMission).toContain('하이에나 가족 얼굴판 포토존')
    expect(mission.photoSpot?.image).toBeTruthy()
  })

  it('제2아프리카관은 문제 3개 뒤에 바바리양 표정 따라 하기 셀카 미션을 하고, 안내판 사진을 함께 보여준다', () => {
    const mission = getStopMission('AFRICA_2')

    expect(mission.questions).toHaveLength(3)
    expect(mission.questions[1].text).toBe('하마 이빨 개수는?')
    expect(mission.photoMission).toContain('셀카')
    expect(mission.photoSpot?.image).toBeTruthy()
  })

  it('7곳 모두 문제와 사진 미션이 있다', () => {
    COURSE_STOP_IDS.A.forEach((stopId) => {
      const mission = getStopMission(stopId)
      expect(mission.questions.length).toBeGreaterThan(0)
      expect(mission.photoMission.trim()).not.toBe('')
    })
  })

  it.each(Object.entries(ZOO_MISSIONS))('%s 문제 id는 장소 안에서 겹치지 않는다', (_stopId, mission) => {
    const ids = mission.questions.map((question) => question.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(mission.questions.length).toBeGreaterThan(0)
    expect(mission.photoMission.trim()).not.toBe('')
  })
})
