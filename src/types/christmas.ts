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

// API 응답용 오너먼트 (snake_case)
export interface OrnamentResponse {
  id: number;
  writer_name: string;
  type: OrnamentType;
  message: string;
  x: number;
  y: number;
}

// API 요청용 오너먼트 생성 (snake_case)
export interface OrnamentCreateRequest {
  writer_name: string;
  type: OrnamentType;
  message: string;
  x: number;
  y: number;
}

// 프론트엔드 내부용 오너먼트 (camelCase)
export interface Ornament {
  id: number;
  writerName: string;
  type: OrnamentType;
  message: string;
  position: OrnamentPosition;
}

// API 응답 → 프론트엔드 변환
export const toOrnament = (response: OrnamentResponse): Ornament => ({
  id: response.id,
  writerName: response.writer_name,
  type: response.type,
  message: response.message,
  position: { x: response.x, y: response.y },
});

// 프론트엔드 → API 요청 변환
export const toOrnamentCreateRequest = (
  writerName: string,
  type: OrnamentType,
  message: string,
  position: OrnamentPosition
): OrnamentCreateRequest => ({
  writer_name: writerName,
  type,
  message,
  x: position.x,
  y: position.y,
});
