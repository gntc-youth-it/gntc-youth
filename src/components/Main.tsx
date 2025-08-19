import React, { useEffect, useState } from 'react';
import './Main.css';

const Main: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="main">
      <section id="home" className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h2>GNTC-YOUTH</h2>
            <p className="bible-verse">율법은 모세로 말미암아 주신 것이요<br />은혜와 진리는 예수 그리스도로 말미암아 온 것이라</p>
            <p className="verse-reference">요한복음 1장 17절</p>
            <p className="hero-description">함께 성장하고, 함께 섬기며, 함께 예배하는 청년들의 공동체</p>
            <button className="cta-button">더 알아보기</button>
          </div>
          <div className="hero-image">
            <img 
              src="https://cdn.gntc-youth.com/assets/2025-summer-main.webp" 
              alt="GNTC 청년부 2025년 여름 단체사진" 
              className="hero-main-image"
            />
          </div>
        </div>
        
        {/* TOC */}
        <div className={`toc-container ${scrollY > 100 ? 'toc-visible' : ''}`}>
          <div className="toc">
            <h4 className="toc-title">TOC</h4>
            <ul className="toc-list">
              <li>
                <button 
                  className="toc-item" 
                  onClick={() => scrollToSection('home')}
                >
                  홈
                </button>
              </li>
              <li>
                <button 
                  className="toc-item" 
                  onClick={() => scrollToSection('about')}
                >
                  청년부 소개
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="container">
          <h2>청년부 소개</h2>
          <div className="about-content">
            <div className="about-text">
              <p>
                GNTC 청년봉사선교회는 은혜와진리교회 청년들이 모여있는 부서로, 총 34개의 지역에 있습니다.
              </p>
              <p>
                각 지역마다 매주 청년모임이 있어 함께 예배하고 찬양하며 복음전파에 힘쓰고 있습니다.
              </p>
              <p>
                또한, 연간행사로 전 성전의 청년봉사선교회가 함께 모여 교제하는 활동이 있으며, 이를 통해 은혜와진리교회 이름 아래, 하나로 모이고 있습니다.
              </p>
              <p>
                홈페이지를 통해 궁금한 사항은 페이치 하단 연락처로 문의해주시기 바랍니다!
              </p>
            </div>
            <div className="about-stats">
              <div className="stat-item">
                <h3>1000+</h3>
                <p>청년</p>
              </div>
              <div className="stat-item">
                <h3>34개</h3>
                <p>지역 성전</p>
              </div>
              <div className="stat-item">
                <h3>연합</h3>
                <p>여름, 겨울 수련회</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Main; 