import { OrnamentType, OrnamentPosition } from '../types/christmas';

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
