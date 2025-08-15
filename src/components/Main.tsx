import React from 'react';
import './Main.css';

const Main: React.FC = () => {
  return (
    <main className="main">
      <section id="home" className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h2>GNTC 청년부에 오신 것을 환영합니다</h2>
            <p>함께 성장하고, 함께 섬기며, 함께 예배하는 청년들의 공동체</p>
            <button className="cta-button">더 알아보기</button>
          </div>
          <div className="hero-image">
            <div className="image-placeholder">
              <span>청년부 단체사진</span>
              <p>여기에 실제 단체사진이 들어갑니다</p>
            </div>
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

      <section id="schedule" className="schedule-section">
        <div className="container">
          <h2>주요 일정</h2>
          <div className="schedule-grid">
            <div className="schedule-item">
              <div className="schedule-icon">📖</div>
              <h3>수요일 저녁 모임</h3>
              <p className="time">매주 수요일 오후 7:30</p>
              <p>성경 공부와 기도 모임</p>
            </div>
            <div className="schedule-item">
              <div className="schedule-icon">🙏</div>
              <h3>주일 예배</h3>
              <p className="time">매주 주일 오전 11:00</p>
              <p>청년부 전용 예배</p>
            </div>
            <div className="schedule-item">
              <div className="schedule-icon">🍽️</div>
              <h3>청년부 모임</h3>
              <p className="time">매주 주일 오후 1:00</p>
              <p>점심 식사와 친교</p>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="gallery-section">
        <div className="container">
          <h2>갤러리</h2>
          <div className="gallery-grid">
            <div className="gallery-item large">
              <div className="gallery-placeholder">
                <span>청년부 모임 사진</span>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-placeholder">
                <span>수련회 사진</span>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-placeholder">
                <span>봉사활동 사진</span>
              </div>
            </div>
            <div className="gallery-item">
              <div className="gallery-placeholder">
                <span>친교 모임 사진</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="container">
          <h2>연락처</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>위치</h3>
              <p>서울특별시 강남구 테헤란로 123</p>
              <h3>연락처</h3>
              <p>전화: 02-1234-5678</p>
              <p>이메일: youth@gntc.org</p>
            </div>
            <div className="contact-form">
              <h3>문의하기</h3>
              <form>
                <input type="text" placeholder="이름" />
                <input type="email" placeholder="이메일" />
                <textarea placeholder="메시지를 입력하세요"></textarea>
                <button type="submit">보내기</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Main; 