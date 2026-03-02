import { useState, useEffect } from 'react'

export const useTempleIntroAnimation = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    const templeIntroSection = document.getElementById('temple-intro')
    if (templeIntroSection) {
      observer.observe(templeIntroSection)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isVisible) {
        setIsVisible(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [isVisible])

  const resetAnimation = () => {
    setIsVisible(false)
    setTimeout(() => setIsVisible(true), 100)
  }

  return { isVisible, resetAnimation }
}
