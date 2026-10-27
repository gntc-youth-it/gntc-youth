import type { ReactionEmoji } from './types'

export interface ReactionOption {
  id: ReactionEmoji
  emoji: string
  label: string
}

export const REACTIONS: readonly ReactionOption[] = [
  { id: 'PRAY', emoji: '🙏', label: '아멘' },
  { id: 'HEART', emoji: '❤️', label: '좋아요' },
  { id: 'CLAP', emoji: '👏', label: '박수' },
  { id: 'TOUCHED', emoji: '🥹', label: '감동이에요' },
  { id: 'LAUGH', emoji: '😂', label: '웃겨요' },
]

export const getReactionEmoji = (id: ReactionEmoji): string =>
  REACTIONS.find((option) => option.id === id)?.emoji ?? '🙏'
