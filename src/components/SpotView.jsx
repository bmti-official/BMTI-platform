import { useState, useRef, useEffect } from 'react';
import spotHeroImg from '../assets/무브먼트 맵/spot_hero_new.jpg';
import spotComparisonImg from '../assets/무브먼트 맵/spot_comparison.png';
import spotPostureImg from '../assets/무브먼트 맵/spot_office_posture.png';
import spotProcessImg from '../assets/무브먼트 맵/spot_process.png';
import spotPurposeImg from '../assets/무브먼트 맵/spot_purpose.png';
import spotCoachingImg from '../assets/무브먼트 맵/spot_coaching.png';
import spotAtmosphereImg from '../assets/무브먼트 맵/spot_atmosphere.png';
import spotEquipmentImg from '../assets/무브먼트 맵/spot_equipment.png';
import spotExpertiseImg from '../assets/무브먼트 맵/spot_expertise.png';
import spotPriceImg from '../assets/무브먼트 맵/spot_price.png';
import mTypeIconVideo from '../assets/m_type_icon.mp4';
import zTypeIconVideo from '../assets/z_type_icon.mp4';
import { supabase } from '../lib/supabaseClient';

const SpotView = ({ isLoggedIn, onRequireLogin }) => {
  const mVideoRef = useRef(null);
  const zVideoRef = useRef(null);

  useEffect(() => {
    if (mVideoRef.current) {
      mVideoRef.current.play().catch(e => console.log("M Video play failed", e));
    }
    if (zVideoRef.current) {
      zVideoRef.current.play().catch(e => console.log("Z Video play failed", e));
    }
  }, []);

  const [activeTab, setActiveTab] = useState('difference'); // 'difference' | 'what'
  const [diffIndex, setDiffIndex] = useState(0);
  const [appNotification, setAppNotification] = useState(() => {
    try {
      const saved = localStorage.getItem('bmti_user');
      return saved ? JSON.parse(saved).appNotification : false;
    } catch (e) {
      return false;
    }
  });

  const handleToggleAppNotification = async () => {
    if (!isLoggedIn) {
      alert("알림 받기를 위해선 카카오톡 로그인/회원가입이 필요합니다.");
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (appNotification) return; // 한번 켜면 끌 수 없음
    setAppNotification(true);
    try {
      const saved = localStorage.getItem('bmti_user');
      const userObj = saved ? JSON.parse(saved) : {};
      userObj.appNotification = true;
      localStorage.setItem('bmti_user', JSON.stringify(userObj));
      
      if (userObj.id) {
        await supabase.from('pre_registrations').insert({ user_id: userObj.id });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const differences = [
    {
      label: '방문 목적',
      general: '다이어트, 근육량 증가, 단순 땀 배출',
      spot: '신체 밸런스 점검, 올바른 움직임 회복',
      image: spotPurposeImg
    },
    {
      label: '코칭 방식',
      general: '횟수 채우기, 무작정 밀어붙이는 고텐션',
      spot: '원리 설명, 객관적 데이터 기반의 차분한 가이드',
      image: spotCoachingImg
    },
    {
      label: '공간 분위기',
      general: '크고 화려한 음악, 다소 부담스러운 활기',
      spot: '진솔한 소통, 내 몸에 집중할 수 있는 안전한 환경',
      image: spotAtmosphereImg
    },
    {
      label: '전문적인 장비',
      general: '런닝머신, 덤벨 등 단순 근력·유산소 기구 위주',
      spot: '체형분석 장비, 슬링, 리포머, SSC, 렉 등 밸런스 및 정렬 특화 세팅\n(각 장비가 어떤 경우에 좋은지 투명하게 설명해줄게요.)',
      image: spotEquipmentImg
    },
    {
      label: '강사진 전문성',
      general: '근육 발달, 다이어트 위주의 일반 트레이닝',
      spot: '다년간의 현장 지도 경험 및 체형·움직임 분석 지식을 갖춘 전문가',
      image: spotExpertiseImg
    },
    {
      label: '투명한 가격',
      general: '폐쇄적인 가격 공개, 방문 상담 유도, 장기 결제 압박',
      spot: '앱 내 100% 정찰제 공개, 필요한 만큼만 결제하는 합리적 시스템',
      image: spotPriceImg
    },
  ];

  return (
    <div className="min-h-screen pt-36 pb-24 px-4 md:px-6 max-w-4xl mx-auto fade-in">
      {/* Hero Section with Image */}
      <div className="text-center mb-10">
        <div className="rounded-3xl overflow-hidden mb-6 shadow-lg max-w-3xl mx-auto">
          <img src={spotHeroImg} alt="무브먼트 센터 공간" className="w-full h-48 md:h-64 object-cover object-bottom" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ fontFamily: "'Noto Serif KR', serif" }}>
          📍 무브먼트 맵
        </h1>
        <p className="text-gray-500 text-sm md:text-base leading-relaxed break-keep max-w-xl mx-auto">
          움직임 분석과 솔루션을 제공하는 '📍무브먼트 센터'와 '🙋🏻🙋🏻‍♀️ 나'를 연결하다.
        </p>
        
        {/* Clean CTA with Toggle */}
        <div className="mt-8 max-w-[420px] mx-auto rounded-2xl shadow-sm border border-gray-200 bg-white p-6 flex flex-col items-center justify-center text-center gap-4 relative">
          
          <div className="flex items-center justify-center gap-3 w-full">
            <video 
              ref={mVideoRef}
              src={mTypeIconVideo} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-[14px] md:rounded-2xl shadow-sm bg-gray-50 flex-shrink-0"
            />
            
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-[20px] md:text-[22px] font-black tracking-tight text-gray-900 mb-1 mt-1 break-keep leading-tight flex flex-col items-center">
                <span>📍 무브먼트 맵</span>
                <span className="font-medium text-[13px] md:text-[15px] text-gray-500 mt-0.5">어플리케이션</span>
              </h2>
              <p className="font-bold text-xs md:text-sm break-keep text-gray-500">
                ☃️ 올 겨울 출시 예정!! 🎅🏻
              </p>
            </div>
            
            <video 
              ref={zVideoRef}
              src={zTypeIconVideo} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-[14px] md:rounded-2xl shadow-sm bg-gray-50 flex-shrink-0"
            />
          </div>

          {/* 이미 사전 알림 신청을 했다면 이 박스는 숨기고 마이페이지에서만 확인 가능 */}
          {!appNotification && (
            <div className="flex items-center justify-between w-full bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2">
              <span className="font-bold text-sm md:text-base break-keep text-gray-700 text-left">
                🎁 지금 사전 등록하면<br/>50% 할인 쿠폰 100% 증정!
              </span>
              <button
                onClick={handleToggleAppNotification}
                className="w-12 h-7 rounded-full flex-shrink-0 relative bg-gray-300"
              >
                <div className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-sm" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-8 justify-center">
        <button
          onClick={() => setActiveTab('difference')}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border-2 ${
            activeTab === 'difference'
              ? 'bg-black text-white border-black shadow-lg'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          📍무브먼트 맵이 뭔가요?
        </button>
        <button
          onClick={() => setActiveTab('what')}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border-2 ${
            activeTab === 'what'
              ? 'bg-black text-white border-black shadow-lg'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          📍무브먼트 센터란?
        </button>
      </div>

      {/* ======================== TAB 1: 점검 스팟이란? ======================== */}
      {activeTab === 'what' && (
        <div className="fade-in space-y-8">

          {/* 소개 카드 */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl p-8 md:p-10 border border-emerald-100/60 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold mb-5 flex items-center gap-2">
              <span className="text-2xl">🙋🏻🙋🏻‍♀️</span>
              움직임 분석과 솔루션을 제공하는: 📍무브먼트 센터 들어 봤나요?
            </h2>
            <div className="space-y-4 text-sm md:text-base text-gray-700 leading-relaxed break-keep">
              <p>
                다이어트, 바디 프로필, 땀 흘리는 헬스장과 필라테스를 찾아주는 어플리케이션은 이미 차고 넘칩니다. 
                하지만 <strong className="text-black">내 몸이 애매하게 뻐근할 때</strong>, 혹은 병원 치료가 막 끝난 후 
                <strong className="text-black">'어디서, 어떻게 안전하게 움직여야 할지'</strong> 막막했던 적 없으신가요?
              </p>

              {/* 비교 이미지 삽입 */}
              <div className="rounded-2xl overflow-hidden shadow-md my-5 max-w-sm sm:max-w-md mx-auto">
                <img src={spotComparisonImg} alt="일반 피트니스 vs 무브먼트 센터 비교" className="w-full" />
              </div>

              <p>
                검색창에 '운동 센터'를 쳐봐도 고텐션의 화려한 피트니스 센터만 나올 뿐, 
                내 체형을 꼼꼼히 들여다보고 객관적으로 분석해 줄 <strong className="text-black">전문적인 오프라인 공간</strong>은 
                찾기조차 어렵고 인식조차 부족한 것이 현실입니다.
              </p>
              <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-emerald-100 mt-4">
                <p className="text-emerald-800 font-medium">
                  그래서 우리는, 억지로 무거운 기구를 들게 하는 대신 내 몸의 흔들리는 밸런스를 진솔하게 확인하고 
                  안전한 움직임의 나침반이 되어주는 이 특별한 공간들을 
                  <strong className="text-emerald-900"> 📍 무브먼트 센터</strong>이라 부르기로 했습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 타겟 유저 섹션 */}
          <div>
            <h2 className="text-xl font-bold mb-5 text-center">
              📍 무브먼트 센터, 어떤 사람에게 필요할까요?
            </h2>
            <div className="space-y-4">
              {/* 타겟 1 */}
              <div className="bg-white rounded-2xl p-6 md:p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 min-w-[48px] rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl shadow-sm">
                    💼
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-2 text-gray-900">
                      "병원 가기는 애매하고, 헬스장은 부담스러운 직장인"
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed break-keep">
                      거북목, 굽은 등, 뻐근한 허리를 달고 살지만 당장 병원에 갈 정도는 아닌 분들. 
                      무작정 땀을 빼는 거친 운동이나 공격적인 세일즈 대신, 
                      <strong>내 체형이 왜 무너졌는지 차분하고 팩트 기반으로 점검해 줄 공간</strong>이 필요합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 타겟 2 */}
              <div className="bg-white rounded-2xl p-6 md:p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 min-w-[48px] rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl shadow-sm">
                    🩹
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-2 text-gray-900">
                      "치료는 끝났는데, 혼자 움직이기는 무서운 일상 복귀자"
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed break-keep">
                      병원에서의 집중 치료나 시술이 막 끝난 상태. "이제 가벼운 운동을 하셔도 됩니다"라는 말을 들었지만 
                      잘못 움직였다가 다시 아파질까 두렵습니다. 의료적인 단계는 지났어도, 
                      <strong>내 관절과 근육의 밸런스를 안전하게 가이드해 줄 검증된 오프라인 공간</strong>이 간절합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 타겟 3 */}
              <div className="bg-white rounded-2xl p-6 md:p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 min-w-[48px] rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl shadow-sm">
                    📊
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-2 text-gray-900">
                      "내 몸의 진짜 상태를 분석하고 싶은 자기 주도적 관리자"
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed break-keep">
                      "자세를 바르게 하세요"라는 뻔한 말보다, 10분 동안 앉아있을 때 내 중심축이 어떻게 무너지는지 등 
                      <strong>객관적이고 시각적인 데이터로 내 몸의 밑천을 확인</strong>하고 
                      올바른 움직임을 처방받고 싶은 분들을 위한 베이스캠프입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 자세 무너짐 일러스트 */}
            <div className="mt-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <img src={spotPostureImg} alt="시간에 따른 자세 무너짐" className="w-full max-w-md mx-auto" />
              <p className="text-center text-xs text-gray-400 mt-3">시간이 지날수록 무의식적으로 무너지는 자세의 변화</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================== TAB 2: 무브먼트 센터만의 다른 온도 ======================== */}
      {activeTab === 'difference' && (
        <div className="fade-in space-y-10">

          {/* 1. 비교 테이블 */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-center">한눈에 보는 📍 무브먼트 맵의 차별점</h2>
            <p className="text-gray-500 text-sm text-center mb-6 break-keep leading-relaxed">
              무작정 땀을 흘리는 곳이 아닙니다.<br/>
              내 몸의 진짜 상태를 파악하고, 안전한 움직임을 되찾는 것에 집중합니다.
            </p>

            {/* Interactive Card */}
            <div 
              className="bg-white rounded-3xl p-5 md:p-8 border border-gray-200 shadow-md cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1 select-none flex flex-col"
              onClick={() => setDiffIndex((prev) => (prev + 1) % differences.length)}
            >
              {/* Hotel-like Image Header */}
              <div className="w-full aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden mb-6 shadow-sm border border-gray-100 bg-gray-50">
                <img 
                  key={diffIndex} // Forces re-render to apply transition or just let it swap normally
                  src={differences[diffIndex].image} 
                  alt={differences[diffIndex].label} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                />
              </div>

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg md:text-xl font-bold bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full inline-block">
                  {differences[diffIndex].label}
                </h3>
                <div className="flex items-center gap-1">
                  {differences.map((_, idx) => (
                    <div key={idx} className={`h-2 rounded-full transition-all ${idx === diffIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-gray-200'}`} />
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                
                {/* 📍 무브먼트 센터 (먼저 배치, 크기 키움) */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 md:p-8 border border-emerald-100 relative overflow-hidden shadow-sm flex-1 md:flex-[1.5]">
                  <div className="text-emerald-700 font-bold mb-3 flex items-center gap-2 text-base md:text-lg">
                    📍 무브먼트 맵
                  </div>
                  <p className="text-emerald-900 font-bold break-keep leading-relaxed text-lg md:text-2xl whitespace-pre-line">
                    {differences[diffIndex].spot}
                  </p>
                </div>

                {/* 🏋️ 일반 피트니스 센터 (나중에 배치, 크기 줄임) */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative overflow-hidden flex-1 md:flex-[1]">
                  <div className="text-gray-400 font-bold mb-2 flex items-center gap-2 text-xs md:text-sm">
                    🏋️ 일반 피트니스 센터
                  </div>
                  <p className="text-gray-500 font-medium break-keep leading-relaxed text-sm md:text-base">
                    {differences[diffIndex].general}
                  </p>
                </div>

              </div>
              
              <div className="mt-8 text-center">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-full animate-bounce">
                  카드 클릭 시 다음 항목으로 이동 <span className="text-lg">〉</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. 깐깐한 기준 */}
          <div className="bg-white rounded-3xl p-7 md:p-9 border border-gray-100 shadow-sm">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-black mb-3 flex flex-wrap items-center gap-2 text-gray-900 leading-tight">
                <span className="text-2xl md:text-3xl">🔒</span>
                <span>아무나 들어올 수 없는<br className="md:hidden" /> 📍 무브먼트 맵만의 깐깐한 기준</span>
              </h2>
              <p className="text-base text-gray-500 font-medium break-keep bg-gray-50 inline-block px-4 py-2 rounded-full">
                아무 공간이나 📍 무브먼트 센터의 이름을 달 수는 없습니다.
              </p>
            </div>

            <div className="space-y-4">
              {/* 선별 기준 */}
              <div className="flex gap-4 items-start bg-gray-50/80 p-5 md:p-6 rounded-2xl border border-gray-100 transition-all hover:bg-gray-50">
                <div className="text-2xl md:text-3xl mt-0.5">🧐</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1.5 md:text-lg">타협 없는 직접 선별</h4>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed break-keep">
                    수많은 분들의 굳어지고 틀어진 체형을 꼼꼼히 분석해 온 노하우를 바탕으로, <strong className="text-black bg-gray-200/50 px-1 rounded">전문가가 직접 발로 뛰며 깐깐한 기준을 세워 공간을 선별</strong>합니다.
                  </p>
                </div>
              </div>

              {/* 배제 기준 */}
              <div className="flex gap-4 items-start bg-red-50/40 p-5 md:p-6 rounded-2xl border border-red-50 transition-all hover:bg-red-50/60">
                <div className="text-2xl md:text-3xl mt-0.5">🚫</div>
                <div>
                  <h4 className="font-bold text-red-900 mb-1.5 md:text-lg">상술과 비전문성 철저 배제</h4>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed break-keep">
                    무리한 장기 결제를 유도하는 상술이나, 몸이 무너진 원인에 대한 이해 없이 <strong className="text-red-500">거칠게 동작만 반복시키는 곳은 철저히 배제</strong>합니다.
                  </p>
                </div>
              </div>

              {/* 약속 */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-6 md:p-8 border border-emerald-100 mt-6 relative overflow-hidden shadow-sm">
                <div className="absolute -right-4 -bottom-4 text-7xl md:text-8xl opacity-10">🛡️</div>
                <div className="relative z-10">
                  <h4 className="font-black text-emerald-900 text-lg md:text-xl mb-3 flex items-center gap-2">
                    ✨ 무브먼트 맵의 약속
                  </h4>
                  <p className="text-emerald-800 font-medium text-sm md:text-base leading-relaxed break-keep mb-5">
                    오직 내 몸의 밸런스를 객관적으로 분석할 수 있는 <strong className="bg-emerald-200/50 px-1 rounded">진정성 있는 코칭 역량</strong>과, 팩트를 기반으로 움직임을 안내하는 곳만을 📍 무브먼트 맵으로 연결해 드립니다.
                  </p>
                  <div className="w-full h-px bg-emerald-200/50 my-4"></div>
                  <p className="text-emerald-950 font-black text-base md:text-lg break-keep leading-relaxed">
                    병원을 나서서 다시 일상으로 돌아가는 길,<br/>안심하고 기댈 수 있는 가장 튼튼한 <span className="text-emerald-700 border-b-2 border-emerald-400 pb-0.5">'안전망'</span>이 되겠습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 방문 전 미리 보는 점검 프로세스 */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-center">방문 전 미리 보는 점검 프로세스</h2>
            <p className="text-gray-500 text-sm text-center mb-6 break-keep">
              "가서 바로 무거운 기구를 들어야 하면 어쩌지?" 하는 걱정은 내려놓으셔도 좋습니다.<br/>
              📍 무브먼트 센터의 모든 과정은 내 몸을 이해하는 것부터 차분하게 시작됩니다.
            </p>

            {/* 프로세스 일러스트 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
              <img src={spotProcessImg} alt="점검 프로세스 4단계" className="w-full" />
            </div>

            <div className="space-y-4">
              {[
                {
                  step: 'STEP 1',
                  title: '사전 인터뷰',
                  icon: '💬',
                  color: 'from-blue-50 to-indigo-50',
                  borderColor: 'border-blue-100',
                  desc: '무작정 몸부터 움직이지 않습니다. 평소의 생활 습관, 현재 가장 뻐근하고 불편한 부분, 그리고 앞으로 바라는 몸의 상태에 대해 차분하고 진솔하게 대화를 나눕니다.'
                },
                {
                  step: 'STEP 2',
                  title: '3D 체형 불균형 분석',
                  icon: '📐',
                  color: 'from-emerald-50 to-teal-50',
                  borderColor: 'border-emerald-100',
                  desc: '눈대중으로 "자세가 틀어졌네요"라고 판단하지 않고, 객관적인 데이터를 확인합니다. 프리미엄 전문 측정 장비를 활용해 내 몸의 무게중심과 비대칭 상태가 어떤지 시각적으로 명확하게 알 수 있습니다.'
                },
                {
                  step: 'STEP 3',
                  title: '결과 분석 및 체형 성향 파악',
                  icon: '📊',
                  color: 'from-amber-50 to-orange-50',
                  borderColor: 'border-amber-100',
                  desc: '측정된 데이터를 바탕으로 자세가 무너지는 근본적인 원인을 짚어냅니다. 내 몸의 밸런스 상태와 나에게 꼭 맞는 고유한 체형 움직임 성향을 알기 쉽게 설명해 드립니다.'
                },
                {
                  step: 'STEP 4',
                  title: '맞춤 움직임 가이드',
                  icon: '🧘',
                  color: 'from-purple-50 to-pink-50',
                  borderColor: 'border-purple-100',
                  desc: '객관적인 분석이 끝난 후, 지금 내 몸에 가장 필요하고 안전한 움직임을 안내받습니다. 무리한 동작 없이, 정확한 원리와 함께 내 몸을 스스로 컨트롤하는 방법을 익힙니다.'
                },
              ].map((item, i) => (
                <div key={i} className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 md:p-7 border ${item.borderColor} shadow-sm relative overflow-hidden`}>
                  {/* Step 번호 배경 */}
                  <div className="absolute -top-2 -right-2 text-[80px] font-black text-black/[0.03] leading-none select-none pointer-events-none">
                    {i + 1}
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 min-w-[48px] rounded-2xl bg-white/80 flex items-center justify-center text-2xl shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full tracking-wider">{item.step}</span>
                        <h3 className="font-bold text-base text-gray-900">{item.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed break-keep">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotView;
