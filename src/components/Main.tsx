import React, { useEffect, useState } from 'react';
import './Main.css';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

const Main: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState("anyang");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // 기도제목 섹션이 화면에 보이는지 확인
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('Intersection Observer triggered:', entry.isIntersecting);
        if (entry.isIntersecting) {
          setIsVisible(true);
          console.log('Setting isVisible to true');
        }
      },
      { threshold: 0.1 } // threshold를 낮춰서 더 쉽게 트리거되도록
    );

    const prayerSection = document.getElementById('prayer');
    if (prayerSection) {
      observer.observe(prayerSection);
      console.log('Observer attached to prayer section');
    } else {
      console.log('Prayer section not found');
    }

    return () => observer.disconnect();
  }, []);

  // 컴포넌트 마운트 후 1초 뒤에 강제로 visible 상태로 설정 (fallback)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isVisible) {
        console.log('Fallback: forcing visible state');
        setIsVisible(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // 탭 변경 시 애니메이션 재시작
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 100);
  };

  // \n 문자를 <br> 태그로 변환하는 함수
  const formatPrayerText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // 34개 성전 데이터
  const churches = [
    { 
      id: "anyang", 
      name: "안양", 
      media: "https://cdn.gntc-youth.com/assets/2025-anyang-youth.mp4", 
      mediaType: "video",
      prayers: [
        "마음과 뜻과 정성을 다하여 하나님을 사랑하는 안양청년봉사선교회",
        "먼저 주의 나라와 주의 의를 구하는 안양청년봉사선교회",
        "하나님의 성품을 닮아가는 안양청년봉사선교회",
        "하나님의 사랑을 본 받아 그 사랑을 실천하며 복음전파에 힘쓰는 안양청년봉사선교회"
      ]
    },
    { 
      id: "suwon", 
      name: "수원", 
      media: "https://cdn.gntc-youth.com/assets/seoul-church.jpg", 
      mediaType: "image",
      prayers: [
        "수원 지역 청년들의 영적 성장과 복음 전파를 위한 기도"
      ]
    },
    { 
      id: "ansan", 
      name: "안산", 
      media: "https://cdn.gntc-youth.com/assets/busan-church.jpg", 
      mediaType: "image",
      prayers: [
        "하나님 주시는 위로와 새 힘으로 '복음 중심'의 삶을 살아가는 청년봉사선교회",
        "하나님 사랑, 이웃 사랑을 통해 기쁨으로 신앙 생활하는 청년봉사선교회",
        "마지막 때에 오직 복음만이 능력 됨을 깨달아 속한 모든 처소에서 영혼 구원에 귀하게 쓰임 받는 청년봉사선교회",
        "성경 말씀으로 현 시대(세속화, 공산·사회주의, 종교다원주의 外)를 바르게 분별하여 철저히 배격하기에 힘쓰는 청년봉사선교회"
      ]
    },
    { 
      id: "gwacheon", 
      name: "과천", 
      media: "https://cdn.gntc-youth.com/assets/jeonbuk-church.jpg", 
      mediaType: "image",
      prayers: [
        "과천 지역 청년들의 영적 부흥과 복음 전파를 위한 기도"
      ]
    },
    { 
      id: "siheung", 
      name: "시흥", 
      media: "https://cdn.gntc-youth.com/assets/2025-siheung-youth.webp", 
      mediaType: "image",
      prayers: [
        "모이기에 더욱 힘쓰고 주의 일에 힘써  그리스도의 안에 거할 수 있도록",
        "어둡고 혼탁한 세대에 깨어 기도하며  하나님의 뜻을 분별하는 시흥청년",
        "성경대로 국가관, 성경관, 역사관 갖고 그리스도의 군사로써 세상에서 빛과 소금 역할 감당할 수 있도록",
        "성령의 9가지 열매를 맺어 포도나무 예수님께 접붙임 될 수 있도록"
      ]
    },
    { 
      id: "gwangmyeong", 
      name: "광명", 
      media: "https://cdn.gntc-youth.com/assets/abroad4-church.jpg", 
      mediaType: "image",
      prayers: [
        "광명 지역 청년들의 영적 부흥과 복음 전파를 위한 기도"
      ]
    },
    { 
      id: "bupyeong", 
      name: "부평", 
      media: "https://cdn.gntc-youth.com/assets/gyeonggi-church.jpg", 
      mediaType: "image",
      prayers: [
        "부평 지역 청년들의 영적 부흥과 복음 전파를 위한 기도"
      ]
    },
    { 
      id: "bugok", 
      name: "부곡", 
      media: "https://cdn.gntc-youth.com/assets/2025-bugok-youth.webp", 
      mediaType: "image",
      prayers: [
        "재적 50명, 출석 50명 목표",
        "예배중심, 말씀중심으로 살아가는 청년이 되도록",
        "마지막 때에 믿음을 지켜 나라를 위해 기도하는 청년이 되도록",
        "세상을 말씀으로 바라보고 분별하는 삶을 살도록",
        "각자의 자리에서 하나님의 영광을 위해 힘쓰는 청년이 되도록",
        "행함과 진실함으로 나아가는 청년이 되도록"
      ]
    },
    { 
      id: "pangyo", 
      name: "판교", 
      media: "https://cdn.gntc-youth.com/assets/daejeon-church.jpg", 
      mediaType: "image",
      prayers: [
        "판교 지역 청년들의 신앙의 확고함과 성장을 위한 기도"
      ]
    },
    { 
      id: "yeongdeungpo", 
      name: "영등포", 
      media: "https://cdn.gntc-youth.com/assets/2025-yeongdeungpo-youth.mp4", 
      mediaType: "video",
      prayers: [
        "영등포 청년봉사선교회의 부흥 (출석100명 목표)",
        "모이기를 더욱 힘쓰는 영등포 청년 되도록",
        "모든 일을 성경을 통해 바라보고 분별하여 행동하도록",
        "성령으로 충만하여 예배와 전도와 봉사에 힘쓰는 영등포 청년 되도록"
      ]
    },
    { 
      id: "incheon", 
      name: "인천", 
      media: "https://cdn.gntc-youth.com/assets/2025-incheon-youth.webp", 
      mediaType: "image",
      prayers: [
        "인천 청년봉사선교회 부흥",
        "전 청년 성령충만",
        "구원의 확신과 굳건한 믿음으로 삶의 모든 순간을 살아가도록",
        "예배/봉사/전도에 힘쓸 수 있는 마음과 환경의 문 열어주시고 지치지 않는 힘과 능력을 더하여주시길",
        "말씀이 기준이 된 가치관, 역사관, 신앙관을 가지고 말씀대로 살아갈 수 있도록",
        "하나님을 더욱 사랑하고 의지하는 청년들이 되도록",
        "복음 전파에 힘써 인천청년봉사선교회가 복음의 통로 역할을 잘 감당할 수 있도록"
      ]
    },
    { 
      id: "bucheon", 
      name: "부천", 
      media: "https://cdn.gntc-youth.com/assets/abroad2-church.jpg", 
      mediaType: "image",
      prayers: [
        "부천 지역 청년들의 영적 성숙과 섬김을 위한 기도"
      ]
    },
    {
      id: "ilsan",
      name: "일산",
      media: "https://cdn.gntc-youth.com/assets/2025-ilsan-youth.webp",
      mediaType: "image",
      prayers: [
        "일산 지역 청년들의 영적 성숙과 섬김을 위한 기도"
      ]
    },
    {
      id: "sihwa",
      name: "시화",
      media: "https://cdn.gntc-youth.com/assets/2025-sihwa-youth.webp",
      mediaType: "image",
      prayers: [
        "예배에 함께하는 청년들이 15명 이상 모이도록",
        "성령 충만하여 기쁨으로 봉사에 힘쓰는 청년부가 되도록",
        "다양한 나이대의 청년들이 더 많이 모여 함께 교제하도록",
        "나라를 사랑하며 중보하는 청년부가 되도록"
      ]
    },
    { 
      id: "yeongtong", 
      name: "영통", 
      media: "https://cdn.gntc-youth.com/assets/gyeongbuk-church.jpg", 
      mediaType: "image",
      prayers: [
        "영통 지역 청년들의 영적 성숙과 섬김을 위한 기도"
      ]
    },
    { 
      id: "guri", 
      name: "구리", 
      media: "https://cdn.gntc-youth.com/assets/abroad7-church.jpg", 
      mediaType: "image",
      prayers: [
        "구리 지역 청년들의 신앙의 깊이와 성장을 위한 기도"
      ]
    },
    { 
      id: "poil", 
      name: "포일", 
      media: "https://cdn.gntc-youth.com/assets/gyeongnam-church.jpg", 
      mediaType: "image",
      prayers: [
        "포일 지역 청년들의 신앙의 깊이와 성장을 위한 기도"
      ]
    },
    { 
      id: "jeonwon", 
      name: "전원", 
      media: "https://cdn.gntc-youth.com/assets/2025-jeonwon-youth.webp", 
      mediaType: "image",
      prayers: [
        "오직 예수 그리스도로 말미암아 사는 전원 청년부\n- 예수 그리스도의 구속의 은혜와 사랑 안에 사는 전원 청년부\n- 예수 그리스도의 말씀에 순종하고 말씀으로 모든 것을 분별하는 전원 청년부",
        "오직 예수 그리스도를 위하여 사는 전원 청년부\n- 하나님 사랑: 모든 동기와 목적이 하나님을 예배하는 전원 청년부\n- 이웃 사랑: 그리스도의 은혜와 사랑을 전파하기에 앞장서는 전원 청년부",
        "오직 예수 그리스도를 알아가기에 힘쓰는 전원 청년부\n- 진리의 말씀을 다각도로 탐구하고 체험하여 굳건한 믿음을 가지고 사는 전원 청년부\n- 행함 있는 믿음으로 예수 그리스도를 닮아가는 전원 청년부"
      ]
    },
    { 
      id: "gimpo", 
      name: "김포", 
      media: "https://cdn.gntc-youth.com/assets/jeonnam-church.jpg", 
      mediaType: "image",
      prayers: [
        "김포 지역 청년들의 신앙의 열정과 성장을 위한 기도"
      ]
    },
    { 
      id: "pyeongtaek", 
      name: "평택", 
      media: "https://cdn.gntc-youth.com/assets/abroad9-church.jpg", 
      mediaType: "image",
      prayers: [
        "평택 지역 청년들의 신앙의 열정과 성장을 위한 기도"
      ]
    },
    { 
      id: "anjung", 
      name: "안중", 
      media: "https://cdn.gntc-youth.com/assets/abroad3-church.jpg", 
      mediaType: "image",
      prayers: [
        "안중 지역 청년들의 신앙의 깊이와 성장을 위한 기도"
      ]
    },
    { 
      id: "cheonan", 
      name: "천안", 
      media: "https://cdn.gntc-youth.com/assets/abroad5-church.jpg", 
      mediaType: "image",
      prayers: [
        "천안 지역 청년들의 신앙의 열정과 성장을 위한 기도"
      ]
    },
    { 
      id: "yangju", 
      name: "양주", 
      media: "https://cdn.gntc-youth.com/assets/abroad11-church.jpg", 
      mediaType: "image",
      prayers: [
        "양주 지역 청년들의 신앙의 깊이와 성장을 위한 기도"
      ]
    },
    { 
      id: "gangnam", 
      name: "강남", 
      media: "https://cdn.gntc-youth.com/assets/abroad8-church.jpg", 
      mediaType: "image",
      prayers: [
        "강남 지역 청년들의 영적 부흥과 복음 전파를 위한 기도"
      ]
    },
    { 
      id: "yongin", 
      name: "용인", 
      media: "https://cdn.gntc-youth.com/assets/chungnam-church.jpg", 
      mediaType: "image",
      prayers: [
        "용인 지역 청년들의 신앙의 깊이와 성장을 위한 기도"
      ]
    },
    { 
      id: "daejeon", 
      name: "대전", 
      media: "https://cdn.gntc-youth.com/assets/jeju-church.jpg", 
      mediaType: "image",
      prayers: [
        "대전 지역 청년들의 영적 부흥과 복음 전파를 위한 기도"
      ]
    },
    { 
      id: "gwangju", 
      name: "광주", 
      media: "https://cdn.gntc-youth.com/assets/abroad12-church.jpg", 
      mediaType: "image",
      prayers: [
        "광주 지역 청년들의 영적 부흥과 복음 전파를 위한 기도"
      ]
    },
    { 
      id: "seosan", 
      name: "서산", 
      media: "https://cdn.gntc-youth.com/assets/abroad6-church.jpg", 
      mediaType: "image",
      prayers: [
        "서산 지역 청년들의 영적 성숙과 섬김을 위한 기도"
      ]
    },
    { 
      id: "yuljeon", 
      name: "율전", 
      media: "https://cdn.gntc-youth.com/assets/2025-yuljeon-youth.webp", 
      mediaType: "image",
      prayers: [
        "모이기에 힘쓰는 율전청년 40명 목표",
        "하나님 사랑 이웃 사랑",
        "세상속에서 탁월한 그리스도인 (타협없는 믿음)"
      ]
    },
    { 
      id: "dongtan", 
      name: "동탄", 
      media: "https://cdn.gntc-youth.com/assets/2025-dongtan-youth.webp", 
      mediaType: "image",
      prayers: [
        "하나님의 동역자들로서 주 안에서 하나되는 2025년 (고후3:9)",
        "성령충만과 은혜충만으로 예배와 말씀 묵상에 힘쓰는 모든 동탄 청년들 되기를",
        "동탄청년봉사선교회 부흥(목표재적 50 출석목표 30 / 현재 재적 32 평균출석 15~18)",
        "삶의 목표와 의미를 하나님께 두어 영광돌리는 삶이 우리의 기쁨이 되도록"
      ]
    },
    { 
      id: "dangjin", 
      name: "당진", 
      media: "https://cdn.gntc-youth.com/assets/2025-dangjin-youth.webp", 
      mediaType: "image",
      prayers: [
        "모든 당진성전 청년들이 하나가 되어서 성령님 인도하심 아래 양적,질적으로 부흥될 수 있도록 (청년 예배 10명 참석)",
        "모두 하나님이 기억하시는 믿음과 사랑의 수고와 헌신의 삶이 되기를",
        "말씀을 가장 귀하게 여기고 교회에 성전을 사랑하고 섬기는 당진성전 청년들이 되기를"
      ]
    },
    { 
      id: "sejong", 
      name: "세종", 
      media: "https://cdn.gntc-youth.com/assets/abroad13-church.jpg", 
      mediaType: "image",
      prayers: [
        "세종 지역 청년들의 신앙의 열정과 성장을 위한 기도"
      ]
    },
    { 
      id: "jeonju-hyoja", 
      name: "전주효자", 
      media: "https://cdn.gntc-youth.com/assets/abroad1-church.jpg", 
      mediaType: "image",
      prayers: [
        "전주효자 지역 청년들의 신앙의 열정과 성장을 위한 기도"
      ]
    }
  ];

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
              <li>
                <button 
                  className="toc-item" 
                  onClick={() => scrollToSection('prayer')}
                >
                  기도제목
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="container">
          <h2>청년봉사선교회 소개</h2>
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
                홈페이지를 통해 궁금한 사항은 페이지 하단 연락처로 문의해주시기 바랍니다!
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

      <section id="prayer" className="prayer-section">
        <div className="container">
          <h2 className={`prayer-title ${isVisible ? 'prayer-title-visible' : ''}`}>각 성전 청년봉사선교회 기도제목</h2>
          <p className={`prayer-intro ${isVisible ? 'prayer-intro-visible' : ''}`}>34개 성전의 청년봉사선교회를 위한 기도제목입니다. 각 성전을 클릭하여 기도제목을 확인하세요.</p>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="prayer-tabs custom-tabs">
            <TabsList className={`prayer-tabs-list custom-tabs-list ${isVisible ? 'prayer-tabs-visible' : ''}`}>
              {churches.map((church) => (
                <TabsTrigger key={church.id} value={church.id} className="prayer-tab-trigger custom-tab-trigger">
                  {church.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {churches.map((church) => (
              <TabsContent key={church.id} value={church.id} className="prayer-tab-content">
                <div className={`church-info ${isVisible ? 'church-info-visible' : ''}`}>
                  <div className="church-media">
                    {church.mediaType === "video" ? (
                      <video 
                        src={church.media} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="church-video"
                        onError={(e) => {
                          console.log('Video failed to load:', e);
                          // 동영상 로드 실패 시 fallback 이미지 표시
                          const videoElement = e.target as HTMLVideoElement;
                          const fallbackImg = document.createElement('img');
                          fallbackImg.src = 'https://cdn.gntc-youth.com/assets/anyang-church-fallback.jpg';
                          fallbackImg.alt = `${church.name}성전 청년봉사선교회`;
                          fallbackImg.className = 'church-photo';
                          videoElement.parentNode?.replaceChild(fallbackImg, videoElement);
                        }}
                      />
                    ) : (
                      <img 
                        src={church.media} 
                        alt={`${church.name}성전 청년봉사선교회`}
                        className="church-photo"
                      />
                    )}
                  </div>
                  <div className="church-details">
                    <h3>{church.name}성전 청년봉사선교회</h3>
                    <div className="prayer-requests">
                      <h4>기도제목</h4>
                      {church.prayers.map((prayer, index) => (
                        <div key={index} className={`prayer-item prayer-item-${index + 1} ${isVisible ? 'prayer-item-visible' : ''}`}>
                          <span className="prayer-number">{index + 1}.</span>
                          <p>{formatPrayerText(prayer)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>
    </main>
  );
};

export default Main; 