// 투표한 사진의 하트 색
export const HEART_RED = '#F04452'

interface HeartIconProps {
  filled: boolean
  size?: number
  // 채워진 하트 색. 초록 바탕 위에서는 흰색으로 쓴다
  color?: string
}

export const HeartIcon = ({ filled, size = 22, color = HEART_RED }: HeartIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={filled ? color : 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)
