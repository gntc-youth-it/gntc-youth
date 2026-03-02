import { Header } from '../../../widgets/header'
import { HeroSection } from '../../../widgets/hero-section'
import { AboutSection } from '../../../widgets/about-section'
import { TempleIntroSection } from '../../../widgets/temple-intro-section'
import { Footer } from '../../../widgets/footer'

export const HomePage = () => {
  return (
    <>
      <Header />
      <main className="pt-16">
        <HeroSection />
        <AboutSection />
        <TempleIntroSection />
      </main>
      <Footer />
    </>
  )
}
