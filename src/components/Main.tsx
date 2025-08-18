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
              src="https://cdn.gntc-youth.com/assets/2025-summer-main.jpeg" 
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
                GNTC 청년부는 하나님의 말씀을 바탕으로 한 청년들의 공동체입니다. 
                우리는 함께 성경을 배우고, 기도하며, 서로를 돌보는 가운데 
                영적으로 성장해 나가고 있습니다.
              </p>
              <p>
                매주 수요일 저녁 모임과 주일 예배를 통해 하나님과의 관계를 
                깊게 하고, 청년들 간의 친교를 나누며, 지역사회에 
                하나님의 사랑을 전하는 일에 참여하고 있습니다.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat-item">
                <h3>20+</h3>
                <p>청년부원</p>
              </div>
              <div className="stat-item">
                <h3>매주</h3>
                <p>수요일 모임</p>
              </div>
              <div className="stat-item">
                <h3>연중</h3>
                <p>특별 프로그램</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Main; 