import { useState } from 'react'
import { Header } from '../../../widgets/header'
import { Footer } from '../../../widgets/footer'

interface ScheduleEvent {
  date: string // 'YYYY-MM-DD'
  title: string
  color: string // tailwind bg color class
}

// 하드코딩된 일정 데이터 (2026년)
const EVENTS: ScheduleEvent[] = [
  { date: '2026-03-07', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-08', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-09', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-10', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-11', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-12', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-13', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-14', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-15', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-16', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-17', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-18', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-19', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-20', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-21', title: '총괄기획팀 9기 모집', color: 'purple' },
  { date: '2026-03-22', title: '총괄기획팀 9기 모집', color: 'purple' },
]

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getEventsForDate(dateKey: string) {
  return EVENTS.filter((e) => e.date === dateKey)
}

export const SchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(0) // 0 = January 2026
  const year = 2026

  const daysInMonth = getDaysInMonth(year, currentMonth)
  const firstDay = getFirstDayOfMonth(year, currentMonth)

  const prevMonth = () => {
    setCurrentMonth((prev) => (prev > 0 ? prev - 1 : 11))
  }

  const nextMonth = () => {
    setCurrentMonth((prev) => (prev < 11 ? prev + 1 : 0))
  }

  // 달력 셀 배열 생성
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d)
  }

  // 이번 달 전체 일정 목록 (사이드바용)
  const monthEvents = EVENTS.filter((e) => {
    const [y, m] = e.date.split('-').map(Number)
    return y === year && m === currentMonth + 1
  }).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* 페이지 타이틀 */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">일정</h1>
            <p className="mt-2 text-gray-500">2026년 GNTC Youth 일정을 확인하세요</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* 캘린더 */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* 월 네비게이션 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="이전 달"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {year}년 {MONTH_NAMES[currentMonth]}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="다음 달"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS_OF_WEEK.map((day, i) => (
                  <div
                    key={day}
                    className={`py-3 text-center text-sm font-semibold ${
                      i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-50" />
                  }

                  const dateKey = formatDateKey(year, currentMonth, day)
                  const dayEvents = getEventsForDate(dateKey)
                  const dayOfWeek = (firstDay + day - 1) % 7

                  return (
                    <div
                      key={dateKey}
                      className="min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-50 p-1 sm:p-2 hover:bg-gray-50/50 transition-colors"
                    >
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                          dayOfWeek === 0
                            ? 'text-red-500'
                            : dayOfWeek === 6
                            ? 'text-blue-500'
                            : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.map((event) => {
                          const colors = COLOR_MAP[event.color] || COLOR_MAP.blue
                          return (
                            <div
                              key={`${event.date}-${event.title}-${event.color}`}
                              className={`${colors.bg} ${colors.text} text-2xs sm:text-xs px-1.5 py-0.5 rounded truncate`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 이번 달 일정 목록 사이드바 */}
            <div className="lg:w-80 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {MONTH_NAMES[currentMonth]} 일정
              </h3>
              {monthEvents.length === 0 ? (
                <p className="text-gray-400 text-sm">이번 달 일정이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {monthEvents.map((event) => {
                    const colors = COLOR_MAP[event.color] || COLOR_MAP.blue
                    const day = parseInt(event.date.split('-')[2], 10)
                    const dayOfWeek = new Date(parseInt(event.date.split('-')[0]), parseInt(event.date.split('-')[1]) - 1, day).getDay()
                    return (
                      <div key={`${event.date}-${event.title}-${event.color}`} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${colors.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {parseInt(event.date.split('-')[1])}월 {day}일 ({DAYS_OF_WEEK[dayOfWeek]})
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
