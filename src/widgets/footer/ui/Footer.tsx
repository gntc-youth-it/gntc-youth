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
                <a href="#schedule" className="text-gray-400 hover:text-white transition-colors">
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
              <p>📍 경기도 안양시 만안구 안양로 193</p>
              <p>📞 031-443-3731~2</p>
              <p>✉️ truth@gntc.net</p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4">소셜 미디어</h4>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/gntc_youth/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Instagram
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
