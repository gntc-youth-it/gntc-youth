// 오너먼트 종류
export type OrnamentType =
  | 'star'
  | 'ball_red'
  | 'ball_gold'
  | 'ball_blue'
  | 'gift'
  | 'candy'
  | 'bell'
  | 'snowflake';

// 오너먼트 위치 (트리 내 상대 좌표, 0-100%)
export interface OrnamentPosition {
  x: number;
  y: number;
}

// 롤링페이퍼 메시지
export interface RollingPaperMessage {
  id: string;
  authorName: string;
  message: string;
  ornamentType: OrnamentType;
  position: OrnamentPosition;
  createdAt: string;
}

// localStorage 키
export const CHRISTMAS_STORAGE_KEY = 'christmas_rolling_papers';
