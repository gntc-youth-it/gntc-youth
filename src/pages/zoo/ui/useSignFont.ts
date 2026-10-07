import { useEffect } from 'react'

// 안내판 느낌의 제목·번호용 글꼴. 동물원 화면에서만 쓰므로 들어올 때 불러온다
const SIGN_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap'

export const useSignFont = () => {
  useEffect(() => {
    if (document.querySelector(`link[href="${SIGN_FONT_HREF}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = SIGN_FONT_HREF
    document.head.appendChild(link)
  }, [])
}
