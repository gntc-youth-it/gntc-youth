import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../shared/ui'
import { ChurchMedia, PrayerList, useChurches, useChurchInfo } from '../../../entities/church'
import type { PrayerTopicResponse } from '../../../entities/church'
import { buildCdnUrl } from '../../../shared/lib'
import { useAuth } from '../../../features/auth'
import { EditSanctuaryModal } from '../../../features/edit-sanctuary'
import { usePrayerAnimation } from '../model/usePrayerAnimation'

const ChurchTabContent = ({
  churchCode,
  churchName,
  isVisible,
  isMaster,
  onEditClick,
}: {
  churchCode: string
  churchName: string
  isVisible: boolean
  isMaster: boolean
  onEditClick: () => void
}) => {
  const { churchInfo, isLoading } = useChurchInfo(churchCode)
  const [mediaLoaded, setMediaLoaded] = useState(false)

  const mediaUrl = churchInfo?.groupPhotoPath
    ? buildCdnUrl(churchInfo.groupPhotoPath)
    : null

  // 미디어 URL이 변경되면 로드 상태 초기화
  useEffect(() => {
    setMediaLoaded(false)
  }, [mediaUrl])

  const handleMediaLoad = useCallback(() => {
    setMediaLoaded(true)
  }, [])

  const prayers = [...(churchInfo?.prayerTopics ?? [])]
    .sort((a: PrayerTopicResponse, b: PrayerTopicResponse) => a.sortOrder - b.sortOrder)
    .map((t: PrayerTopicResponse) => t.content)

  // 미디어가 없으면 API 로딩만 대기, 미디어가 있으면 둘 다 대기
  const showSkeleton = isLoading || (mediaUrl != null && !mediaLoaded)

  return (
    <div
      className={`flex flex-col items-center gap-8 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: '0.3s' }}
    >
      {showSkeleton && (
        <div className="w-full flex justify-center">
          <div className="w-full max-w-xl h-64 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      )}

      {/* 미디어: 로딩 중에는 h-0으로 숨기되 DOM에는 존재하여 로드 진행 */}
      {!isLoading && mediaUrl && (
        <div className={`w-full flex justify-center ${showSkeleton ? 'h-0 overflow-hidden' : ''}`}>
          <ChurchMedia
            mediaUrl={mediaUrl}
            churchName={churchName}
            className="w-full max-w-xl rounded-2xl shadow-xl object-cover"
            onLoad={handleMediaLoad}
          />
        </div>
      )}

      {!showSkeleton && (
        <div className="w-full max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              {churchName}성전 청년봉사선교회
            </h3>
            {isMaster && (
              <button
                type="button"
                onClick={onEditClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.08 1.92a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12L5.4 12.6l-3.8.76.76-3.8L10.08 1.92Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                수정
              </button>
            )}
          </div>

          <div className="text-left">
            <h4 className="text-xl font-semibold text-blue-600 mb-6">기도제목</h4>
            {prayers.length > 0 ? (
              <PrayerList prayers={prayers} isVisible={isVisible} />
            ) : (
              <p className="text-gray-500">기도제목이 아직 등록되지 않았습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const PrayerSection = () => {
  const { churches, isLoading } = useChurches()
  const [activeTab, setActiveTab] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { isVisible, resetAnimation } = usePrayerAnimation()
  const { user } = useAuth()

  const isMaster = user?.role === 'MASTER'

  // API에서 받은 첫 번째 성전을 기본 탭으로 설정
  const effectiveTab = activeTab || (churches.length > 0 ? churches[0].code : '')

  const activeChurchName = churches.find((c) => c.code === effectiveTab)?.name ?? ''

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    resetAnimation()
  }

  if (isLoading) {
    return (
      <section id="prayer" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-80 mx-auto" />
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto" />
          </div>
        </div>
      </section>
    )
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
          {churches.length}개 성전의 청년봉사선교회를 위한 기도제목입니다. 각 성전을 클릭하여
          기도제목을 확인하세요.
        </p>

        <Tabs value={effectiveTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-white/90 border border-gray-200 rounded-xl p-4 shadow-lg backdrop-blur-sm mb-8 max-h-[200px] overflow-y-auto md:max-h-none md:overflow-visible">
            {churches.map((church) => (
              <TabsTrigger
                key={church.code}
                value={church.code}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                {church.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {churches.map((church) => (
            <TabsContent
              key={church.code}
              value={church.code}
              className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-lg"
            >
              <ChurchTabContent
                churchCode={church.code}
                churchName={church.name}
                isVisible={isVisible}
                isMaster={isMaster}
                onEditClick={() => setIsEditModalOpen(true)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {isMaster && (
        <EditSanctuaryModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          churchId={effectiveTab}
          churchName={activeChurchName}
        />
      )}
    </section>
  )
}
