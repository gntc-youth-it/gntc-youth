const KakaoTalkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.53-.96 3.4-.99 3.63 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.56.08 1.14.12 1.72.12 5.52 0 10-3.58 10-7.81C22 6.58 17.52 3 12 3z" />
  </svg>
)

const CONTACT_INFO = {
  address: '경기도 안양시 만안구 안양로 193',
  phone: '031-443-3731~2',
  email: 'gntceum@gmail.com',
}

const SOCIAL_LINKS = {
  kakao: 'https://pf.kakao.com/_xjrYZX',
}

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">GNTC YOUTH</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              함께 성장하고, 함께 섬기며, 함께 예배하는 청년들의 공동체
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">빠른 링크</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-white transition-colors">
                  홈
                </a>
              </li>
              <li>
                <a href="/schedule" className="text-gray-400 hover:text-white transition-colors">
                  일정
                </a>
              </li>
              <li>
                <a href="/gallery" className="text-gray-400 hover:text-white transition-colors">
                  갤러리
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">연락처</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>📍 {CONTACT_INFO.address}</p>
              <p>📞 {CONTACT_INFO.phone}</p>
              <p>✉️ {CONTACT_INFO.email}</p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4">카카오톡</h4>
            <div className="flex gap-4">
              <a
                href={SOCIAL_LINKS.kakao}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <KakaoTalkIcon />
                카카오톡 채널
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">CopyrightⓒGrace and Truth Church.</p>
        </div>
      </div>
    </footer>
  )
}
