import { TableOfContents } from './TableOfContents'
import { useScrollVisibility } from '../model/useScrollVisibility'

export const HeroSection = () => {
  const isTocVisible = useScrollVisibility(100)

  return (
    <section
      id="home"
      className="min-h-[80vh] bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900 py-24 px-4 md:px-8 flex items-center"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 uppercase mb-6 animate-fade-in-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
            >
              GNTC-YOUTH
            </h2>

            <p
              className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
            >
              율법은 모세로 말미암아 주신 것이요
              <br />
              은혜와 진리는 예수 그리스도로 말미암아 온 것이라
            </p>

            <p
              className="text-lg text-blue-600 font-semibold italic mb-4 animate-fade-in-up"
              style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
            >
              요한복음 1장 17절
            </p>

            <p
              className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in-up"
              style={{ animationDelay: '0.8s', animationFillMode: 'both' }}
            >
              함께 성장하고, 함께 섬기며, 함께 예배하는 청년들의 공동체
            </p>

            <button
              className="px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 active:translate-y-0 transition-all animate-fade-in-up"
              style={{ animationDelay: '1s', animationFillMode: 'both' }}
            >
              더 알아보기
            </button>
          </div>

          {/* Image */}
          <div
            className="flex justify-center lg:justify-end animate-fade-in-right"
            style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
          >
            <img
              src="https://cdn.gntc-youth.com/assets/2025-summer-main.webp"
              alt="GNTC 청년부 2025년 여름 단체사진"
              className="w-full max-w-lg rounded-2xl shadow-2xl object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </div>

      {/* TOC */}
      <TableOfContents isVisible={isTocVisible} />
    </section>
  )
}
