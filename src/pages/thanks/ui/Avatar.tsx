import { useEffect, useState } from 'react'
import { cn } from '../../../shared/lib'
import { toMediaSrc } from '../lib/mediaSrc'
import type { ThanksAuthor } from '../model/types'

const COLORS = ['#FFE0CB', '#DCECF5', '#DDEEDC', '#F8EBC4', '#E9E2F5', '#F5DFE6']

interface AvatarProps {
  author: ThanksAuthor
  size?: number
  className?: string
}

// 프로필 사진이 없으면 이름 첫 글자를 띄운다
export const Avatar = ({ author, size = 32, className }: AvatarProps) => {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [author.profileImageUrl])

  const style = { width: size, height: size }

  if (author.profileImageUrl && !failed) {
    return (
      <img
        src={toMediaSrc(author.profileImageUrl)}
        alt=""
        style={style}
        className={cn('shrink-0 rounded-full object-cover', className)}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={{ ...style, backgroundColor: COLORS[author.userId % COLORS.length], fontSize: Math.round(size * 0.42) }}
      className={cn('grid shrink-0 place-items-center rounded-full font-bold text-[#191F28]', className)}
    >
      {author.name.slice(0, 1)}
    </span>
  )
}
