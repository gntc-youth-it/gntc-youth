import { Header } from '../../../widgets/header'
import { HeroSection } from '../../../widgets/hero-section'
import { AboutSection } from '../../../widgets/about-section'
import { PrayerSection } from '../../../widgets/prayer-section'
import { Footer } from '../../../widgets/footer'

export const HomePage = () => {
  return (
    <>
      <Header />
      <main className="pt-16">
        <HeroSection />
        <AboutSection />
        <PrayerSection />
      </main>
      <Footer />
    </>
  )
}
