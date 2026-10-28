// 하루 세 번의 감사에 작은 햇살을 더하는 심볼.
export const ThanksMark = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path
      d="M20 3v4M7.5 7.5l3 3M3 20h4M33 20h4M29.5 10.5l3-3"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <circle cx="20" cy="22" r="11" fill="currentColor" />
    <path d="M15 23c1 5 9 5 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const ThanksBrand = () => (
  <span className="thanks-brand">
    <span className="thanks-brand-mark">
      <ThanksMark />
    </span>
    <span className="thanks-wordmark">범사에 감사로그</span>
  </span>
)
