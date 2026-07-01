import { useState } from 'react';
import TermsModal from './TermsModal';

const PLANS = [
  {
    id: 'coupon-10',
    emoji: '🎁',
    badge: '쿠폰 전용',
    badgeColor: 'bg-rose-100 text-rose-600',
    name: '[자기점검 10분] 베이직 플리',
    duration: '10분',
    desc: '하루 10분, 나의 BMTI 유형에 맞춰 무리하지 않고 일상의 빠근함을 다독여보는 가벼운 루틴입니다.',
    price: 0,
    originalPrice: '10,000원',
    priceLabel: '무료 (쿠폰 적용)',
  },
  {
    id: 'basic-10',
    emoji: '🌱',
    badge: null,
    name: '[자기점검 10분] 베이직 플리',
    duration: '10분',
    desc: '하루 10분, 나의 BMTI 유형에 맞춰 무리하지 않고 일상의 빠근함을 다독여보는 가벼운 루틴입니다.',
    price: 10000,
    originalPrice: null,
    priceLabel: '10,000원',
  },
  {
    id: 'standard-30',
    emoji: '🌿',
    badge: null,
    name: '[자기점검 30분] 스탠다드 플리',
    duration: '30분',
    desc: '나의 체형과 움직임 유형을 조금 더 깊이 알아가며, 차분하게 몸의 긴장을 풀어갈 수 있도록 30분 분량으로 구성했습니다.',
    price: 20000,
    originalPrice: null,
    priceLabel: '20,000원',
  },
  {
    id: 'signature-50',
    emoji: '🌳',
    badge: null,
    name: '[자기점검 50분] 시그니쳐 플리',
    duration: '50분',
    desc: '내 BMTI 성향에 맞춰 영상 큐레이션부터 코칭 방식까지 완벽하게 커스텀되는 50분 코스입니다. 정적인 이완과 동적인 움직임 중 내가 선호하는 방식은 물론, 설명을 먼저 듣고 움직일지, 내 성향에 맞는 AI 코칭 톤(팩트/공감)은 무엇인지까지 내게 딱 맞게 세팅됩니다. 오직 나만을 위해 조립된 최적의 환경에서 내 몸의 쓰임새를 온전히 점검해 보세요.',
    price: 40000,
    originalPrice: null,
    priceLabel: '40,000원',
  },
];

const LabView = ({ isLoggedIn, quizCompleted, setView, onRequireLogin }) => {
  const [activeTab, setActiveTab] = useState('story');
  const [formData, setFormData] = useState({
    planId: '',
    environments: [],
    envCustom: '',
    tools: [],
    toolsCustom: '',
    bodyState: '',
    bodyPart: '딱히 없음',
    bodyPartCustom: '',
    description: ''
  });
  const [showErrors, setShowErrors] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const selectedPlan = PLANS.find(p => p.id === formData.planId);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, item) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...arr, item] };
      }
    });
  };

  const handleSubmit = () => {
    const hasEnv = formData.environments.length > 0 || formData.envCustom.trim() !== '';
    const hasTool = formData.tools.length > 0 || formData.toolsCustom.trim() !== '';
    const hasBodyPart = formData.bodyPart !== '기타(직접 작성)' || formData.bodyPartCustom.trim() !== '';
    const isValid = formData.planId && hasEnv && hasTool && formData.bodyState && hasBodyPart && formData.description.trim() && agreedToTerms;

    if (!isValid) {
      setShowErrors(true);
      alert("모든 항목을 입력해주셔야\n플리 신청이 완료가 됩니다!");
      return;
    }

    if (selectedPlan && selectedPlan.price === 0) {
      alert("플리 신청이 완료되었습니다!\n'자기점검 50분' 카카오톡 공식 채널에서 확인해보실 수 있습니다.");
      setFormData({ planId: '', environments: [], envCustom: '', tools: [], toolsCustom: '', bodyState: '', bodyPart: '딱히 없음', bodyPartCustom: '', description: '' });
      setAgreedToTerms(false);
      setShowErrors(false);
    } else {
      setShowPayment(true);
    }
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    alert("결제가 완료되었습니다!\n플리 신청이 접수되었습니다.\n'자기점검 50분' 카카오톡 공식 채널에서 확인해보실 수 있습니다.");
    setFormData({ planId: '', environments: [], envCustom: '', tools: [], toolsCustom: '', bodyState: '', bodyPart: '딱히 없음', bodyPartCustom: '', description: '' });
    setAgreedToTerms(false);
    setShowErrors(false);
  };

  return (
    <div className="min-h-screen pt-44 px-4 md:px-6 max-w-4xl mx-auto pb-24 fade-in">
      {/* Main Title */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 font-serif tracking-tight">BMTI 플리 신청</h2>
        <p className="text-gray-500 text-sm break-keep">
          나만의 BMTI 맞춤형 운동 플레이리스트를 직접 신청하세요
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-3 md:gap-4 mb-10 overflow-x-auto hide-scrollbar pb-2 justify-center">
        <button
          onClick={() => setActiveTab('story')}
          className={`whitespace-nowrap px-6 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-lg transition-all duration-300 border-2 ${
            activeTab === 'story'
              ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          📖 BMTI 플리 이야기
        </button>
        <button
          onClick={() => setActiveTab('request')}
          className={`whitespace-nowrap px-6 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-lg transition-all duration-300 border-2 ${
            activeTab === 'request'
              ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          📝 플리 신청하기
        </button>
      </div>

      {/* ===== Story Tab: 상세 페이지 ===== */}
      {activeTab === 'story' && (
        <div className="fade-in max-w-2xl mx-auto">

          {/* Hero Section */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden">
            <div className="absolute top-6 right-6 text-6xl opacity-10">🎧</div>
            <span className="inline-block bg-[#c0ff00] text-black text-xs font-bold px-3 py-1 rounded-full mb-4">실제 사례</span>
            <h3 className="text-2xl md:text-3xl font-bold leading-snug mb-3 break-keep">
              "운동이 싫었던 게 아니라,<br/>
              <span className="text-[#c0ff00]">나한테 안 맞았던 거</span>였어요."
            </h3>
            <p className="text-gray-400 text-sm md:text-base">
              BMTI 유형: <strong className="text-white">OCDZ</strong> · 27세 · 직장인 · 수빈 님
            </p>
          </div>

          {/* Chapter 1: 고민 */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-sm">😩</span>
              <h4 className="text-lg md:text-xl font-bold text-gray-900">Chapter 1. 늘 작심삼일이었어요</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <p className="text-gray-700 leading-relaxed break-keep text-sm md:text-base">
                수빈 님은 매년 1월이면 헬스장을 등록했어요. 유튜브에서 본 고강도 루틴을 따라 해보고, 
                유행하는 홈트 영상도 시도해 봤죠. 하지만 매번 <strong>일주일도 못 가서 포기</strong>했습니다.
              </p>
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-red-800 italic break-keep">
                  "다른 사람들은 다 잘하는 것 같은데, 저만 의지가 부족한 건가 싶었어요.
                  뭘 해도 재미가 없고, 몸이 따라주지 않았거든요."
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">💢 고강도 = 스트레스</span>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">😴 에너지 부족</span>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">🤷 뭘 해야 할지 모름</span>
              </div>
            </div>
          </div>

          {/* Chapter 2: BMTI 검사 & 플리 신청 */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm">🔍</span>
              <h4 className="text-lg md:text-xl font-bold text-gray-900">Chapter 2. BMTI 검사를 받았어요</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <p className="text-gray-700 leading-relaxed break-keep text-sm md:text-base">
                친구의 추천으로 BMTI 검사를 해봤는데, 결과는 <strong className="text-black">OCDZ (관찰적 집중 실전 팩트형)</strong>. 
                수빈 님은 고강도보다는 <strong>부드럽고 천천히 집중하는 움직임</strong>에 더 잘 맞는 유형이었어요.
              </p>
              <div className="bg-[#f5f9e6] border border-[#e2edbc] rounded-xl p-5">
                <p className="text-sm font-bold text-[#6b7c30] mb-2">💡 BMTI 분석 결과 핵심</p>
                <ul className="text-sm text-gray-700 space-y-2 break-keep">
                  <li className="flex items-start gap-2"><span className="text-[#9BB31B] mt-0.5">●</span> 에너지 소비가 느린 편이라 과격한 운동 시 피로도가 극대화</li>
                  <li className="flex items-start gap-2"><span className="text-[#9BB31B] mt-0.5">●</span> 호흡 기반, 스트레칭 위주의 루틴이 가장 효과적</li>
                  <li className="flex items-start gap-2"><span className="text-[#9BB31B] mt-0.5">●</span> 혼자서 조용히 하는 운동을 선호하는 성향</li>
                </ul>
              </div>
              <p className="text-gray-700 leading-relaxed break-keep text-sm md:text-base">
                그래서 수빈 님은 바로 <strong>BMTI 맞춤 플리를 신청</strong>했어요.
                "무릎이 아프지 않은 10분짜리 아침 루틴"이라는 구체적인 요청을 남겼습니다.
              </p>
            </div>
          </div>

          {/* Chapter 3: 플리 제작 과정 */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-sm">⚙️</span>
              <h4 className="text-lg md:text-xl font-bold text-gray-900">Chapter 3. 나만의 플리가 만들어졌어요</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <p className="text-gray-700 leading-relaxed break-keep text-sm md:text-base">
                BMTI 팀은 수빈 님의 유형(OCDZ)과 요청사항을 바탕으로 <strong>세 단계의 맞춤 과정</strong>을 거쳐 플리를 제작했습니다.
              </p>

              {/* Process Steps */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
                    <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <h5 className="font-bold text-gray-900 mb-1">유형 분석 & 신체 맵핑</h5>
                    <p className="text-sm text-gray-500 break-keep">OCDZ 유형의 관절 가동 범위, 근피로도 패턴, 선호 움직임 데이터를 분석합니다.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">2</div>
                    <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <h5 className="font-bold text-gray-900 mb-1">동작 큐레이션 & 배열</h5>
                    <p className="text-sm text-gray-500 break-keep">무릎 부담이 없는 동작만 엄선하여, 에너지 소비 곡선에 맞게 동작 순서를 최적화합니다.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#c0ff00] rounded-full flex items-center justify-center text-black font-bold text-sm shrink-0">3</div>
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 mb-1">10분 플리 완성 & 전달</h5>
                    <p className="text-sm text-gray-500 break-keep">영상/오디오 가이드가 포함된 10분짜리 플레이리스트가 만들어져 수빈 님에게 전달됩니다.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-3">🎵 수빈 님의 맞춤 플리 구성</p>
                <div className="space-y-2.5">
                  {[
                    { time: '0:00 ~ 2:00', name: '기상 호흡 안정화', desc: '앉은 자세 · 4-7-8 호흡법' },
                    { time: '2:00 ~ 5:00', name: '목 · 어깨 순환 스트레칭', desc: '거북목 해소 · 견갑골 이완' },
                    { time: '5:00 ~ 8:00', name: '골반 센터 안정화', desc: '브릿지 변형 · 코어 활성화' },
                    { time: '8:00 ~ 10:00', name: '마무리 전신 이완', desc: '사바아사나 · 자기 인지 호흡' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-xs text-gray-400 font-mono w-20 shrink-0">{item.time}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                      </div>
                      <span className="text-gray-300 text-sm">▶</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chapter 4: 한 달 후 결과 */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-sm">✨</span>
              <h4 className="text-lg md:text-xl font-bold text-gray-900">Chapter 4. 한 달 후, 달라진 것들</h4>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <p className="text-gray-700 leading-relaxed break-keep text-sm md:text-base">
                수빈 님은 매일 아침 10분씩, 딱 한 달만 해보자는 마음으로 시작했어요.
                결과는 본인도 놀랄 정도였습니다.
              </p>

              {/* Before / After */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50/40 border border-red-100 rounded-xl p-5">
                  <p className="text-xs font-bold text-red-400 mb-3">BEFORE — 플리 적용 전</p>
                  <ul className="space-y-2 text-sm text-gray-700 break-keep">
                    <li>😫 아침에 일어나기 힘들고 몸이 무거움</li>
                    <li>💤 오후 2시면 에너지 바닥</li>
                    <li>🤕 목·어깨 만성 결림</li>
                    <li>❌ 운동 지속 기간: 평균 4~5일</li>
                  </ul>
                </div>
                <div className="bg-green-50/40 border border-green-100 rounded-xl p-5">
                  <p className="text-xs font-bold text-green-600 mb-3">AFTER — 플리 적용 한 달 후</p>
                  <ul className="space-y-2 text-sm text-gray-700 break-keep">
                    <li>☀️ 아침 기상이 수월해짐</li>
                    <li>⚡ 오후에도 집중력 유지</li>
                    <li>🙆 목·어깨 결림 60% 완화</li>
                    <li>✅ 운동 지속 기간: <strong className="text-green-700">30일 연속 달성!</strong></li>
                  </ul>
                </div>
              </div>

              {/* Final quote */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-6 relative overflow-hidden">
                <span className="absolute top-3 left-4 text-4xl text-white/10 font-serif">"</span>
                <p className="text-sm md:text-base leading-relaxed italic break-keep relative z-10 pl-4">
                  "10분인데 어떻게 효과가 있냐고요?<br/>
                  그건 <strong className="text-[#c0ff00]">나한테 맞는 10분</strong>이기 때문이에요.<br/>
                  처음으로 운동이 부담이 아니라 <strong className="text-[#c0ff00]">위로</strong>처럼 느껴졌어요."
                </p>
                <p className="text-xs text-gray-400 mt-4 text-right">— 수빈 님 (OCDZ)</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <p className="text-2xl md:text-3xl font-black text-gray-900">30</p>
                  <p className="text-xs text-gray-400 font-bold mt-1">연속 일수</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <p className="text-2xl md:text-3xl font-black text-gray-900">10<span className="text-base font-bold text-gray-400">분</span></p>
                  <p className="text-xs text-gray-400 font-bold mt-1">하루 투자</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <p className="text-2xl md:text-3xl font-black text-[#9BB31B]">60<span className="text-base font-bold text-gray-400">%</span></p>
                  <p className="text-xs text-gray-400 font-bold mt-1">결림 완화</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-[#f5f9e6] border border-[#e2edbc] rounded-3xl p-8 text-center">
            <p className="text-lg md:text-xl font-bold text-gray-900 mb-2 break-keep">나도 수빈 님처럼,<br/>나만의 플리를 만들어 볼까요?</p>
            <p className="text-sm text-gray-500 mb-6">검사 결과 기반 10분 맞춤 루틴을 제작해 드립니다.</p>
            <button
              onClick={() => setActiveTab('request')}
              className="bg-black text-white font-bold text-base px-10 py-4 rounded-full shadow-lg hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all duration-300"
            >
              📝 나만의 플리 신청하러 가기
            </button>
          </div>
        </div>
      )}

      {/* ===== Request Tab ===== */}
      {activeTab === 'request' && (
        <div className="fade-in max-w-2xl mx-auto">
          {!quizCompleted ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 text-center border-2 border-gray-100 shadow-sm mb-8">
              <div className="text-5xl mb-6">📝</div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 break-keep">
                나만의 플리를 신청하려면<br/>먼저 BMTI 검사를 완료해야 해요!
              </h2>
              <p className="text-gray-500 mb-8 break-keep">내게 꼭 맞는 운동 루틴을 찾기 위한 첫걸음을 시작해보세요.</p>
              <button 
                onClick={() => setView('quiz')}
                className="bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors w-full md:w-auto"
              >
                설문하러 가기
              </button>
            </div>
          ) : !isLoggedIn ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 text-center border-2 border-gray-100 shadow-sm mb-8">
              <div className="text-5xl mb-6">🔒</div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 break-keep">
                나만의 플리를 신청하려면<br/>카카오톡 로그인이 필요해요!
              </h2>
              <p className="text-gray-500 mb-8 break-keep">로그인하고 나만의 BMTI 플리를 만들어보세요.</p>
              <button 
                onClick={onRequireLogin}
                className="bg-[#FEE500] text-[#3C1E1E] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#F4DC00] transition-colors w-full md:w-auto flex items-center justify-center gap-2 mx-auto"
              >
                💬 카카오톡 로그인/회원가입
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 mb-8 text-center">
                <span className="text-3xl mb-4 block">🎧</span>
                <h3 className="text-lg font-bold text-blue-900 mb-2">"나를 위한 BMTI 플리 만들어주세요!"</h3>
                <p className="text-sm text-blue-700/80 leading-relaxed break-keep">
                  이용자분들이 필요한 운동 루틴(플리)을 직접 신청하는 공간입니다.<br />
                  나의 상황을 자세히 작성 할수록 나에게 맞는 플리가 제작이 됩니다.
                </p>
              </div>
              
              {/* Form */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-6 text-center">새로운 플리 신청하기</h4>
                <div className="space-y-6">
                  <div>
                    <label className={`text-sm font-bold mb-3 block ${
                      showErrors && !formData.planId ? 'text-red-500' : 'text-gray-800'
                    }`}>나의 BMTI 플리 시간은?</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {PLANS.map(plan => {
                        const isSelected = formData.planId === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => handleInputChange('planId', plan.id)}
                            className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                              isSelected
                                ? 'border-black bg-gray-50 shadow-lg scale-[1.01]'
                                : showErrors && !formData.planId
                                  ? 'border-red-300 bg-red-50/20 hover:border-red-400'
                                  : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{plan.emoji}</span>
                              {plan.badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badgeColor}`}>{plan.badge}</span>
                              )}
                            </div>
                            <h5 className="text-sm font-bold text-gray-900 mb-1.5 break-keep">{plan.name} ({plan.duration})</h5>
                            <p className="text-xs text-gray-500 leading-relaxed mb-3 break-keep">{plan.desc}</p>
                            <div className="flex items-center gap-2">
                              {plan.originalPrice && (
                                <span className="text-xs text-gray-400 line-through">{plan.originalPrice}</span>
                              )}
                              <span className={`text-sm font-black ${
                                plan.price === 0 ? 'text-rose-500' : 'text-gray-900'
                              }`}>
                                {plan.price === 0 ? '➡️ 무료' : plan.priceLabel}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-3 block">운동환경이 어떻게 되나요?</label>
                
                <div className={`mb-4 bg-gray-50 p-4 rounded-xl border ${
                  showErrors && formData.environments.length === 0 && !formData.envCustom.trim() ? 'border-red-500 bg-red-50/30' : 'border-gray-100'
                }`}>
                  <p className={`text-xs font-bold mb-3 ${showErrors && formData.environments.length === 0 && !formData.envCustom.trim() ? 'text-red-500' : 'text-gray-600'}`}>주된 운동 환경 (중복 선택 가능)</p>
                  <div className="flex flex-wrap gap-2">
                    {['홈트', '헬스장', '야외/공원', '사무실/학교'].map(env => (
                      <label key={env} className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="checkbox" 
                          className="accent-black w-4 h-4 cursor-pointer" 
                          checked={formData.environments.includes(env)}
                          onChange={() => handleArrayChange('environments', env)}
                        /> {env}
                      </label>
                    ))}
                    <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg focus-within:border-gray-400">
                      <input 
                        type="checkbox" 
                        className="accent-black w-4 h-4 cursor-pointer" 
                        checked={formData.envCustom.trim() !== ''}
                        readOnly
                      />
                      <input 
                        type="text" 
                        placeholder="기타 (직접 작성)" 
                        className="w-28 text-sm outline-none bg-transparent" 
                        value={formData.envCustom}
                        onChange={(e) => handleInputChange('envCustom', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className={`bg-gray-50 p-4 rounded-xl border ${
                  showErrors && formData.tools.length === 0 && !formData.toolsCustom.trim() ? 'border-red-500 bg-red-50/30' : 'border-gray-100'
                }`}>
                  <p className={`text-xs font-bold mb-3 ${showErrors && formData.tools.length === 0 && !formData.toolsCustom.trim() ? 'text-red-500' : 'text-gray-600'}`}>활용하고 싶은 도구 (중복 선택 가능)</p>
                  <div className="flex flex-wrap gap-2">
                    {['폼롤러', '마사지공(또는 테니스공)', '탄성밴드(세라밴드, 루프밴드)', '아령(덤벨)또는 케틀벨', '요가링(젠링)', '딱히 없음(맨몸)'].map(tool => (
                      <label key={tool} className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="checkbox" 
                          className="accent-black w-4 h-4 cursor-pointer" 
                          checked={formData.tools.includes(tool)}
                          onChange={() => handleArrayChange('tools', tool)}
                        /> {tool}
                      </label>
                    ))}
                    <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg focus-within:border-gray-400">
                      <input 
                        type="checkbox" 
                        className="accent-black w-4 h-4 cursor-pointer" 
                        checked={formData.toolsCustom.trim() !== ''}
                        readOnly
                      />
                      <input 
                        type="text" 
                        placeholder="기타 (직접 작성)" 
                        className="w-28 text-sm outline-none bg-transparent" 
                        value={formData.toolsCustom}
                        onChange={(e) => handleInputChange('toolsCustom', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-3 block">현재 나의 몸 상태</label>
                <div className={`bg-gray-50 p-6 rounded-xl border ${
                  showErrors && !formData.bodyState ? 'border-red-500 bg-red-50/30' : 'border-gray-100'
                }`}>
                  <div className={`flex justify-between text-xs font-bold mb-6 px-2 ${showErrors && !formData.bodyState ? 'text-red-500' : 'text-gray-500'}`}>
                    <span className="text-center w-20">🔋 에너지 바닥<br/>(깊은 피로)</span>
                    <span className="text-center w-24">🚀 최상 컨디션<br/>(퍼포먼스 도약)</span>
                  </div>
                  <div className="flex justify-between items-center relative px-6 md:px-10">
                    <div className="absolute left-0 right-0 h-1.5 bg-gray-200 top-1/2 -translate-y-1/2 z-0 rounded-full mx-6 md:mx-10"></div>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <label key={`state${val}`} className="relative z-10 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="bodyState" 
                          className="sr-only" 
                          checked={formData.bodyState === `state${val}`}
                          onChange={() => handleInputChange('bodyState', `state${val}`)}
                        />
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-300
                          ${formData.bodyState === `state${val}` 
                            ? 'bg-black text-white scale-125 shadow-lg ring-4 ring-black/10' 
                            : 'bg-white text-gray-400 border-2 border-gray-200 group-hover:border-gray-400 group-hover:scale-110'
                          }`}
                        >
                          {val}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">세심한 배려가 필요하거나 뻐근 또는 불편한 부위 <span className="text-gray-400 font-normal">(한 부위 선택 가능)</span></label>
                <div className="relative mb-2">
                  <select 
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-black transition-colors appearance-none bg-white font-medium ${
                      showErrors && formData.bodyPart === '기타(직접 작성)' && !formData.bodyPartCustom.trim() ? 'border-red-500 bg-red-50/30' : 'border-gray-200'
                    }`}
                    value={formData.bodyPart}
                    onChange={(e) => handleInputChange('bodyPart', e.target.value)}
                  >
                    <option value="딱히 없음">딱히 없음</option>
                    <option value="목·어깨 (거북목, 승모근 긴장 등)">목·어깨 (거북목, 승모근 긴장 등)</option>
                    <option value="허리">허리</option>
                    <option value="골반·고관절 (고관절 찝힘, 좌우 불균형 등)">골반·고관절 (고관절 찝힘, 좌우 불균형 등)</option>
                    <option value="무릎">무릎</option>
                    <option value="손목·발목">손목·발목</option>
                    <option value="발·발목">발·발목</option>
                    <option value="얼굴 비대칭">얼굴 비대칭</option>
                    <option value="기타(직접 작성)">기타(직접 작성)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                {formData.bodyPart === '기타(직접 작성)' && (
                  <input 
                    type="text" 
                    placeholder="불편한 부위를 직접 적어주세요" 
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-black transition-colors bg-gray-50 ${
                      showErrors && formData.bodyPart === '기타(직접 작성)' && !formData.bodyPartCustom.trim() ? 'border-red-500 bg-red-50/30' : 'border-gray-200'
                    }`}
                    value={formData.bodyPartCustom}
                    onChange={(e) => handleInputChange('bodyPartCustom', e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">상세 설명 <span className="text-gray-400 font-normal">(선택하신 부위가 평소 언제, 어떻게 불편한지 편하게 적어주세요.)</span></label>
                <textarea 
                  rows="4" 
                  placeholder="예시) 오래 앉아 있으면 오른쪽 허리가 뻐근해요 / 계단을 내려갈 때 무릎에서 뚝뚝 소리가 나요 / 아프진 않은데 체형 교정이 목적이에요." 
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-black transition-colors resize-none ${
                    showErrors && !formData.description.trim() ? 'border-red-500 bg-red-50/30' : 'border-gray-200'
                  }`}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                ></textarea>
              </div>

              <div className="pt-2">
                <label className={`flex items-center gap-2 text-sm cursor-pointer mb-4 ${
                  showErrors && !agreedToTerms ? 'text-red-500' : 'text-gray-700'
                }`}>
                  <input 
                    type="checkbox" 
                    className="accent-black w-4 h-4 cursor-pointer" 
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span>[필수] <button type="button" onClick={() => setIsTermsOpen(true)} className={`underline font-bold hover:text-black ${showErrors && !agreedToTerms ? 'text-red-600' : 'text-gray-900'}`}>이용약관 및 개인정보 수집/이용</button>에 동의합니다.</span>
                </label>
                
               <button 
                  onClick={handleSubmit}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-md hover:bg-gray-800 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-base">🎧 플리 신청 완료하기!{selectedPlan && selectedPlan.price > 0 ? ` (${selectedPlan.priceLabel})` : ''}</span>
                  <span className="text-[11px] text-gray-300 font-normal text-center break-keep px-2">
                    {selectedPlan && selectedPlan.price === 0
                      ? '(쿠폰 적용으로 무료로 신청됩니다!)'
                      : <>(결제 후 BMTI 가이드가 한땀한땀 확인하기 때문에<br className="md:hidden" /> 최대 3-4일이 소요될 수 있습니다.)</>
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* ===== Payment Modal ===== */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">💳</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">결제 정보 확인</h3>
              <p className="text-sm text-gray-500">선택하신 플리 상품을 확인해주세요.</p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{selectedPlan.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedPlan.name}</p>
                  <p className="text-xs text-gray-500">{selectedPlan.duration} 플리</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">결제 금액</span>
                <span className="text-xl font-black text-gray-900">{selectedPlan.priceLabel}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePaymentComplete}
                className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-md hover:bg-gray-800 transition-colors text-base"
              >
                결제하기
              </button>
              <button
                onClick={() => setShowPayment(false)}
                className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                뒤로 가기
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-4 break-keep">
              * 현재는 데모 화면입니다. 실제 결제 시스템은 추후 연동될 예정입니다.
            </p>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};

export default LabView;
