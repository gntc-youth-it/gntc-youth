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
  canEdit,
  onEditClick,
}: {
  churchCode: string
  churchName: string
  isVisible: boolean
  canEdit: boolean
  onEditClick: () => void
}) => {
  const { churchInfo, isLoading, notFound } = useChurchInfo(churchCode)
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

  if (!isLoading && notFound) {
    return (
      <div
        className={`flex flex-col items-center gap-8 py-8 transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: '0.3s' }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 2H6v7l6 3.5L18 9V2Z"
            stroke="#D0D0D0"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 2H2v20h20V2h-4"
            stroke="#D0D0D0"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 12.5V22"
            stroke="#D0D0D0"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        <div className="flex flex-col items-center gap-3">
          <h3 className="text-2xl font-bold text-gray-900">
            성전 정보를 찾을 수 없어요
          </h3>
          <p className="text-base text-gray-500">
            아직 등록된 성전 정보가 없습니다
          </p>
          <p className="text-sm text-gray-400">
            성전 정보를 작성하여 교인들과 공유해보세요
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onEditClick}
            className="flex items-center gap-2 px-7 py-3.5 bg-blue-700 text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            성전 정보 작성하기
          </button>
        )}
      </div>
    )
  }

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
            {canEdit && (
              <button
                type="button"
                onClick={onEditClick}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 hover:text-gray-700 transition-colors"
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
          {canEdit && (
            <button
              type="button"
              onClick={onEditClick}
              className="w-full flex md:hidden items-center justify-center gap-2 py-3 mb-8 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 hover:text-gray-800 transition-colors"
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
              성전 정보 수정하기
            </button>
          )}

          <div className="text-left">
            <h4 className="text-xl font-semibold text-blue-600 mb-6">기도제목</h4>
            {prayers.length > 0 ? (
              <PrayerList prayers={prayers} isVisible={isVisible} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
                      stroke="#93C5FD"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                      stroke="#93C5FD"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  아직 등록된 기도제목이 없습니다
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  기도제목이 등록되면 이곳에 표시됩니다
                </p>
              </div>
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

  // 로그인한 사용자의 성전을 기본 탭으로, 없으면 첫 번째 성전
  const defaultTab = user?.churchId && churches.some((c) => c.code === user.churchId)
    ? user.churchId
    : churches.length > 0 ? churches[0].code : ''
  const effectiveTab = activeTab || defaultTab

  const isMaster = user?.role === 'MASTER'
  const canEditActiveChurch = isMaster || (user?.role === 'LEADER' && user?.churchId === effectiveTab)

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

          {churches.map((church) => {
            const canEditThisChurch = isMaster || (user?.role === 'LEADER' && user?.churchId === church.code)
            return (
              <TabsContent
                key={church.code}
                value={church.code}
                className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-lg"
              >
                <ChurchTabContent
                  churchCode={church.code}
                  churchName={church.name}
                  isVisible={isVisible}
                  canEdit={canEditThisChurch}
                  onEditClick={() => setIsEditModalOpen(true)}
                />
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      {canEditActiveChurch && (
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
