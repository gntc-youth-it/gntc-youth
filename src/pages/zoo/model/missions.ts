import barbarySheepFaceSign from '../assets/barbary-sheep-face-sign.webp'
import bearSizeBoard from '../assets/bear-size-board.webp'
import elephantFootCareSign from '../assets/elephant-foot-care-sign.webp'
import hyenaPhotoZone from '../assets/hyena-photo-zone.webp'
import type { StopId } from './course'

export interface MissionQuestion {
  // 서버에 답과 함께 저장되는 값. 행사 중에 바꾸면 이미 낸 답과 짝이 맞지 않으니 고정해 둔다
  id: string
  text: string
  // 있으면 객관식, 없으면 주관식
  choices?: string[]
}

// 사진 찍을 곳을 못 찾을까 봐 보여주는 현장 사진
export interface PhotoSpot {
  image: string
  description: string
}

export interface StopMission {
  questions: MissionQuestion[]
  // 질문을 다 푼 뒤에 하는 사진 미션
  photoMission: string
  photoSpot?: PhotoSpot
}

export const ANSWER_MAX_LENGTH = 200

// 장소별 문제. 채점은 행사 후 운영진이 모아서 하므로 정답은 두지 않는다
export const ZOO_MISSIONS: Record<StopId, StopMission> = {
  AFRICA_1: {
    questions: [
      { id: 'q1', text: '키가 6M나 되는 기린의 목뼈는 몇 개일까요?' },
      { id: 'q2', text: '세상에서 가장 빨리 달리는 새는?' },
    ],
    photoMission: '기린이 보이게 조원 전원이 키 순서로 서서 기린 목 만들어 찍기',
  },
  AUSTRALIA: {
    questions: [
      { id: 'q1', text: '타조 다음으로 큰 새의 평균 달리기 속도는?' },
      { id: 'q2', text: '이 새는 씨앗의 전파자라고 합니다. 그 새의 이름은?' },
    ],
    photoMission: '캥거루 우리 앞에서 조원 전원이 동시에 뛰는 점프샷',
  },
  BIG_ANIMAL: {
    questions: [
      { id: 'q1', text: '지구상에 존재하는 다섯 종의 코뿔소를 적으세요.' },
      { id: 'q2', text: '코끼리의 어금니는 몇 개일까요?' },
      { id: 'q3', text: '큰뿔소의 뿔이 100cm 정도 자라는 데 걸리는 대략적인 시간은?' },
    ],
    photoMission: "'코끼리의 발관리' 안내판 앞에서 한 명은 코끼리, 한 명은 사육사가 되어 발관리를 재연하는 장면샷",
    photoSpot: {
      image: elephantFootCareSign,
      description: "이 '코끼리의 발관리' 안내판을 찾아 그 앞에서 찍어요.",
    },
  },
  BEAR: {
    questions: [
      { id: 'q1', text: '곰탱이의 뜻은 무엇인가요?' },
      { id: 'q2', text: "말레이곰인 '꼬마'와 '오순이'는 반달가슴곰인가요?", choices: ['O', 'X'] },
    ],
    photoMission: "'누가 더 클까요' 곰 크기 비교판 앞에서 곰 실루엣처럼 키 순서로 서서 찍기",
    photoSpot: {
      image: bearSizeBoard,
      description: "이 '누가 더 클까요?' 곰 크기 비교판을 찾아 그 앞에서 찍어요.",
    },
  },
  PREDATOR: {
    questions: [
      { id: 'q1', text: '늑대는 다른 이름으로 뭐라 불렸나요? (2가지)' },
      { id: 'q2', text: '한국에서 여우가 모두 멸종한 것으로 추정되는 시기는?' },
      { id: 'q3', text: '현재 살아남은 호랑이 개체 수는 약 몇 마리인가요?' },
      { id: 'q4', text: '한국 표범의 다양한 이름 2가지를 적으시오.' },
    ],
    photoMission: '줄무늬 하이에나를 찍어보세요!',
  },
  AFRICA_3: {
    questions: [
      { id: 'q1', text: '사자의 무리를 뭐라고 일컫나요?' },
      { id: 'q2', text: '아프리카 미옴보 나무 숲에서 사는 동물은?' },
    ],
    photoMission: '하이에나 가족 얼굴판 포토존 앞에서 단체샷을 찍어봅시다.',
    photoSpot: {
      image: hyenaPhotoZone,
      description: '이 하이에나 가족 얼굴판 포토존을 찾아 그 앞에서 찍어요.',
    },
  },
  AFRICA_2: {
    questions: [
      { id: 'q1', text: '흰오릭스, 돌산양, 바바리양은 모두 어떤 동물인가요?' },
      { id: 'q2', text: '하마 이빨 개수는?' },
      { id: 'q3', text: '미어캣이 같은 무리인지 아닌지를 구별하는 방법은?' },
    ],
    photoMission: '바바리양의 기묘한 표정을 따라 하여 셀카로 찍어봅시다.',
    photoSpot: {
      image: barbarySheepFaceSign,
      description: "'바바리양의 기묘한 표정' 안내판이에요. 이 표정을 따라 해 보세요.",
    },
  },
}

export const getStopMission = (stopId: StopId): StopMission => ZOO_MISSIONS[stopId]
