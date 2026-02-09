import { useState, useEffect, useRef, useCallback } from 'react'
import { useChurches } from '../../../entities/church'
import { useCountUp } from '../../../shared/lib'

export const AboutSection = () => {
  const { churches, isLoading } = useChurches()
  const churchCount = churches.length
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) {
      setIsVisible(true)
    }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleIntersect])

  const youthCount = useCountUp(1000, isVisible)
  const churchAnimCount = useCountUp(churchCount, isVisible && !isLoading)

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16 tracking-tight">
          청년봉사선교회 소개
        </h2>

        <div className="space-y-16">
          {/* Description */}
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-lg text-gray-600 leading-relaxed">
              GNTC 청년봉사선교회는 은혜와진리교회 청년들이 모여있는 부서로, 총{' '}
              {isLoading ? '...' : `${churchCount}개`}의 지역에 있습니다.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              각 지역마다 매주 청년모임이 있어 함께 예배하고 찬양하며 복음전파에 힘쓰고 있습니다.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              또한, 연간행사로 전 성전의 청년봉사선교회가 함께 모여 교제하는 활동이 있으며, 이를 통해
              은혜와진리교회 이름 아래, 하나로 모이고 있습니다.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              홈페이지를 통해 궁금한 사항은 페이지 하단 연락처로 문의해주시기 바랍니다!
            </p>
          </div>

          {/* Stats */}
          <div
            ref={sectionRef}
            className="flex flex-col sm:flex-row justify-center gap-6 flex-wrap"
          >
            <div className="flex-1 min-w-[200px] max-w-[250px] mx-auto sm:mx-0 text-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
              <h3 className="text-4xl font-bold text-blue-600 mb-2">
                {isVisible ? `${youthCount}+` : '0'}
              </h3>
              <p className="text-gray-600 font-medium">청년</p>
            </div>

            <div className="flex-1 min-w-[200px] max-w-[250px] mx-auto sm:mx-0 text-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
              <h3 className="text-4xl font-bold text-blue-600 mb-2">
                {isLoading ? '-' : `${churchAnimCount}개`}
              </h3>
              <p className="text-gray-600 font-medium">지역 성전</p>
            </div>

            <div className="flex-1 min-w-[200px] max-w-[250px] mx-auto sm:mx-0 text-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
              <h3 className="text-4xl font-bold text-blue-600 mb-2">연합</h3>
              <p className="text-gray-600 font-medium">여름, 겨울 수련회</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
