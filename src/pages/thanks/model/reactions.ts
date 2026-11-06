import type { ReactionEmoji } from './types'

export interface ReactionOption {
  id: ReactionEmoji
  label: string
}

export const REACTIONS: readonly ReactionOption[] = [
  { id: 'PRAY', label: '아멘' },
  { id: 'HEART', label: '좋아요' },
  { id: 'CLAP', label: '박수' },
  { id: 'TOUCHED', label: '감동이에요' },
  { id: 'LAUGH', label: '웃겨요' },
]
