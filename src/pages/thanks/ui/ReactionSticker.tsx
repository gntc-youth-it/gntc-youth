import type { ReactionEmoji } from '../model/types'
import pray from '../assets/reactions/pray.webp'
import heart from '../assets/reactions/heart.webp'
import clap from '../assets/reactions/clap.webp'
import touched from '../assets/reactions/touched.webp'
import laugh from '../assets/reactions/laugh.webp'

const STICKERS: Record<ReactionEmoji, string> = {
  PRAY: pray,
  HEART: heart,
  CLAP: clap,
  TOUCHED: touched,
  LAUGH: laugh,
}

// 의미와 개수는 부모 버튼이 읽어 준다. 이미지는 밝은 카드와 어두운 뷰어에서 함께 쓴다.
export const ReactionSticker = ({ emoji, size = 32 }: { emoji: ReactionEmoji; size?: number }) => (
  <img
    src={STICKERS[emoji]}
    alt=""
    aria-hidden="true"
    width={size}
    height={size}
    draggable={false}
    className="thanks-reaction-sticker"
    style={{ width: size, height: size }}
  />
)
