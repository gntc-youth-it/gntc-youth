import {
  RollingPaperMessage,
  CHRISTMAS_STORAGE_KEY,
  OrnamentType,
  OrnamentPosition,
} from '../types/christmas';

// UUID 생성
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 초기 Mock 데이터
const getInitialMockData = (): RollingPaperMessage[] => [
  {
    id: 'mock-1',
    authorName: '김철수',
    message: '메리 크리스마스! 올해도 함께해서 행복했어요. 새해에도 건강하세요!',
    ornamentType: 'ball_red',
    position: { x: 35, y: 45 },
    createdAt: '2024-12-20T10:30:00.000Z',
  },
  {
    id: 'mock-2',
    authorName: '이영희',
    message: '즐거운 성탄절 보내세요! 항상 응원합니다.',
    ornamentType: 'ball_gold',
    position: { x: 55, y: 50 },
    createdAt: '2024-12-21T14:20:00.000Z',
  },
  {
    id: 'mock-3',
    authorName: '박민수',
    message: '올 한해 수고 많으셨습니다. 따뜻한 연말 보내세요!',
    ornamentType: 'gift',
    position: { x: 45, y: 65 },
    createdAt: '2024-12-22T09:15:00.000Z',
  },
  {
    id: 'mock-4',
    authorName: '정수진',
    message: '사랑하는 청년부 여러분, 행복한 크리스마스 되세요!',
    ornamentType: 'bell',
    position: { x: 30, y: 60 },
    createdAt: '2024-12-22T16:45:00.000Z',
  },
  {
    id: 'mock-5',
    authorName: '최준혁',
    message: '하나님의 은혜가 함께하는 크리스마스 되길 바랍니다.',
    ornamentType: 'ball_blue',
    position: { x: 60, y: 70 },
    createdAt: '2024-12-23T11:00:00.000Z',
  },
];

// 모든 메시지 조회
export const getMessages = (): RollingPaperMessage[] => {
  try {
    const data = localStorage.getItem(CHRISTMAS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // 처음 방문 시 Mock 데이터로 초기화
    const initialData = getInitialMockData();
    localStorage.setItem(CHRISTMAS_STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  } catch {
    return getInitialMockData();
  }
};

// 메시지 저장
export const saveMessage = (
  message: Omit<RollingPaperMessage, 'id' | 'createdAt'>
): RollingPaperMessage => {
  const messages = getMessages();
  const newMessage: RollingPaperMessage = {
    ...message,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
  };
  messages.push(newMessage);
  localStorage.setItem(CHRISTMAS_STORAGE_KEY, JSON.stringify(messages));
  return newMessage;
};

// 트리 영역 판정 (삼각형 형태)
const isInsideTree = (x: number, y: number): boolean => {
  // y: 15-90 범위 (트리 본체 - 더 넓게)
  if (y < 15 || y > 90) return false;

  // y가 낮을수록 (위쪽) x 범위가 좁음
  const treeWidth = 8 + (y - 15) * 0.55;
  const center = 50;
  return x >= center - treeWidth && x <= center + treeWidth;
};

// 충돌 감지
const hasCollision = (
  newPos: OrnamentPosition,
  existing: OrnamentPosition[]
): boolean => {
  const MIN_DISTANCE = 5; // 최소 거리 (%) - 더 촘촘하게
  return existing.some((pos) => {
    const dx = newPos.x - pos.x;
    const dy = newPos.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE;
  });
};

// 랜덤 위치 생성 (트리 형태에 맞게)
export const generateRandomPosition = (
  existingPositions: OrnamentPosition[]
): OrnamentPosition => {
  const maxAttempts = 100; // 더 많은 시도

  for (let i = 0; i < maxAttempts; i++) {
    // y는 15-90 범위에서 랜덤
    const y = 15 + Math.random() * 75;

    // y에 따른 x 범위 계산
    const treeWidth = 8 + (y - 15) * 0.55;
    const center = 50;
    const minX = center - treeWidth + 2;
    const maxX = center + treeWidth - 2;

    const x = minX + Math.random() * (maxX - minX);

    const newPos = { x, y };

    if (isInsideTree(x, y) && !hasCollision(newPos, existingPositions)) {
      return newPos;
    }
  }

  // 실패 시 랜덤 위치 반환 (겹쳐도 OK)
  const y = 20 + Math.random() * 65;
  const treeWidth = 8 + (y - 15) * 0.55;
  const x = 50 - treeWidth + Math.random() * treeWidth * 2;
  return { x, y };
};

// 랜덤 오너먼트 타입 선택
export const getRandomOrnamentType = (): OrnamentType => {
  const types: OrnamentType[] = [
    'ball_red',
    'ball_gold',
    'ball_blue',
    'gift',
    'candy',
    'bell',
    'snowflake',
  ];
  return types[Math.floor(Math.random() * types.length)];
};

// 상대 시간 포맷
export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
};
