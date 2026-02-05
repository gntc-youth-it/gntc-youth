interface TableOfContentsProps {
  isVisible: boolean
}

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

export const TableOfContents = ({ isVisible }: TableOfContentsProps) => {
  const items = [
    { id: 'home', label: '홈' },
    { id: 'about', label: '청년부 소개' },
    { id: 'prayer', label: '기도제목' },
  ]

  return (
    <div
      className={`fixed right-4 top-1/2 -translate-y-1/2 z-50 transition-all duration-500 ease-out hidden lg:block ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl p-5 shadow-lg min-w-[120px]">
        <h4 className="text-xs font-semibold text-gray-900 text-center tracking-wider uppercase mb-3">
          TOC
        </h4>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="transition-all duration-300"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                transitionDelay: `${(index + 1) * 200}ms`,
              }}
            >
              <button
                className="w-full text-left px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all hover:translate-x-1"
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
