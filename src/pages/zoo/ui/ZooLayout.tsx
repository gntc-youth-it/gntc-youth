import type { ReactNode } from 'react'
import { Header } from '../../../widgets/header'
import { useSignFont } from './useSignFont'

interface ZooLayoutProps {
  children: ReactNode
  // 화면 아래 고정 바가 있으면 마지막 내용이 가려지지 않게 여백을 둔다
  hasBottomBar?: boolean
}

export const ZooLayout = ({ children, hasBottomBar = false }: ZooLayoutProps) => {
  useSignFont()

  return (
    <>
      <Header />
      <main className={`min-h-screen bg-white pt-16 ${hasBottomBar ? 'pb-48' : 'pb-16'}`}>
        <div className="mx-auto max-w-xl px-4 pt-8 sm:pt-12">{children}</div>
      </main>
    </>
  )
}
