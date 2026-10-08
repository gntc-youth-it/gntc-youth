import { Link } from 'react-router-dom'

// 동물원 첫 화면으로 돌아가는 링크. 조원은 첫 화면에서 다시 내 조 화면으로 간다
export const BackToZoo = () => (
  <Link to="/zoo" className="inline-flex items-center gap-1 text-[14px] text-[#6B7684] hover:text-[#333D4B]">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 6 9 12 15 18" />
    </svg>
    동물원 나들이
  </Link>
)
