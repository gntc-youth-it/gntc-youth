import { apiRequest } from './api';
import {
  Ornament,
  OrnamentResponse,
  toOrnament,
  toOrnamentCreateRequest,
  OrnamentType,
  OrnamentPosition,
} from '../types/christmas';

/**
 * 모든 오너먼트 조회
 */
export const fetchOrnaments = async (): Promise<Ornament[]> => {
  const responses = await apiRequest<OrnamentResponse[]>('/ornaments');
  return responses.map(toOrnament);
};

/**
 * 오너먼트 생성
 */
export const createOrnament = async (
  writerName: string,
  type: OrnamentType,
  message: string,
  position: OrnamentPosition
): Promise<Ornament> => {
  const request = toOrnamentCreateRequest(writerName, type, message, position);
  const response = await apiRequest<OrnamentResponse>('/ornaments', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return toOrnament(response);
};
