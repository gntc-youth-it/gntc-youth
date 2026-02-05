import React from 'react'

interface PrayerListProps {
  prayers: readonly string[]
  isVisible?: boolean
}

const formatPrayerText = (text: string) => {
  const lines = text.split('\n')
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ))
}

export const PrayerList = ({ prayers, isVisible = true }: PrayerListProps) => {
  return (
    <div className="space-y-4">
      {prayers.map((prayer, index) => (
        <div
          key={index}
          className={`flex gap-3 transition-all duration-500 ${
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: `${index * 100}ms` }}
        >
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
            {index + 1}
          </span>
          <p className="text-gray-700 leading-relaxed">{formatPrayerText(prayer)}</p>
        </div>
      ))}
    </div>
  )
}
