import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../shared/ui'
import { CHURCHES, ChurchMedia, PrayerList } from '../../../entities/church'
import { usePrayerAnimation } from '../model/usePrayerAnimation'

export const PrayerSection = () => {
  const [activeTab, setActiveTab] = useState('anyang')
  const { isVisible, resetAnimation } = usePrayerAnimation()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    resetAnimation()
  }

  return (
    <section id="prayer" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className={`text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4 tracking-tight transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          각 성전 청년봉사선교회 기도제목
        </h2>

        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          34개 성전의 청년봉사선교회를 위한 기도제목입니다. 각 성전을 클릭하여 기도제목을 확인하세요.
        </p>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-white/90 border border-gray-200 rounded-xl p-4 shadow-lg backdrop-blur-sm mb-8 max-h-[200px] overflow-y-auto md:max-h-none md:overflow-visible">
            {CHURCHES.map((church) => (
              <TabsTrigger
                key={church.id}
                value={church.id}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                {church.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {CHURCHES.map((church) => (
            <TabsContent
              key={church.id}
              value={church.id}
              className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-lg"
            >
              <div
                className={`flex flex-col items-center gap-8 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: '0.3s' }}
              >
                {/* Media */}
                <div className="w-full flex justify-center">
                  <ChurchMedia
                    church={church}
                    className="w-full max-w-xl rounded-2xl shadow-xl object-cover"
                  />
                </div>

                {/* Details */}
                <div className="w-full max-w-3xl text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8">
                    {church.name}성전 청년봉사선교회
                  </h3>

                  <div className="text-left">
                    <h4 className="text-xl font-semibold text-blue-600 mb-6">기도제목</h4>
                    <PrayerList prayers={church.prayers} isVisible={isVisible} />
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
