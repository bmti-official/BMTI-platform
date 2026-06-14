import { useState } from 'react';

const LabView = () => {
  const [activeTab, setActiveTab] = useState('story'); // 'request' or 'story'
  const [formData, setFormData] = useState({
    purpose: '',
    bmti: '',
    bodyState: '',
    description: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.purpose.trim() || !formData.bmti.trim() || !formData.bodyState || !formData.description.trim()) {
      alert("선택 사항을 제외한 필수 항목을 모두 기재해 주세요.");
      return;
    }
    alert("플리 신청이 완료되었습니다!\n'자기점검 50분' 카카오톡 공식 채널에서 확인해보실 수 있습니다.");
    setFormData({ purpose: '', bmti: '', bodyState: '', description: '' });
  };

  return (
    <div className="min-h-screen pt-32 px-4 md:px-6 max-w-4xl mx-auto pb-24 fade-in">
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
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 mb-8 text-center">
            <span className="text-3xl mb-4 block">🎧</span>
            <h3 className="text-lg font-bold text-blue-900 mb-2">"나를 위한 BMTI 플리 만들어주세요!"</h3>
            <p className="text-sm text-blue-700/80 leading-relaxed break-keep">
              이용자분들이 필요한 운동 루틴(플리)을 직접 신청하는 공간입니다.<br className="hidden md:block"/>
              나의 상황을 자세히 작성 할수록 나에게 맞는 플리가 제작이 됩니다.
            </p>
          </div>
          
          {/* Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-6 text-center">새로운 플리 신청하기</h4>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">어떤 목적의 루틴이 필요한가요?</label>
                <input 
                  type="text" 
                  placeholder="예: 무릎 안 아픈 10분 하체 루틴" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" 
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">본인의 BMTI</label>
                <input 
                  type="text" 
                  placeholder="예: ALDZ" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" 
                  value={formData.bmti}
                  onChange={(e) => handleInputChange('bmti', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-3 block">운동환경이 어떻게 되나요?</label>
                
                <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-600 mb-3">피해야하는 상황 (중복 선택 가능)</p>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" className="accent-black w-4 h-4" /> 야외
                    </label>
                    <label className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" className="accent-black w-4 h-4" /> 층간소음
                    </label>
                    <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg focus-within:border-gray-400">
                      <input type="checkbox" className="accent-black w-4 h-4" />
                      <input type="text" placeholder="기타 (직접 작성)" className="w-28 text-sm outline-none bg-transparent" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-600 mb-3">가지고 있는 도구 (중복 선택 가능)</p>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" className="accent-black w-4 h-4" /> 폼롤러
                    </label>
                    <label className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" className="accent-black w-4 h-4" /> 마사지공
                    </label>
                    <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg focus-within:border-gray-400">
                      <input type="checkbox" className="accent-black w-4 h-4" />
                      <input type="text" placeholder="기타 (직접 작성)" className="w-28 text-sm outline-none bg-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-3 block">현재 나의 몸 상태</label>
                <div className="space-y-2">
                  {[
                    { id: 'state1', text: '🔋 에너지 바닥 (깊은 피로)', score: '1점' },
                    { id: 'state2', text: '🔋 배터리 부족 (가벼운 피로)', score: '2점' },
                    { id: 'state3', text: '🔋 보통 (일상적 기준점)', score: '3점' },
                    { id: 'state4', text: '🚀 좋은 컨디션 (안정적 활력)', score: '4점' },
                    { id: 'state5', text: '🚀 최상 컨디션 (퍼포먼스 도약)', score: '5점' }
                  ].map(state => (
                    <label key={state.id} className="flex items-center gap-3 text-sm bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="radio" 
                        name="bodyState" 
                        className="accent-black w-4 h-4" 
                        checked={formData.bodyState === state.id}
                        onChange={() => handleInputChange('bodyState', state.id)}
                      /> 
                      <span className="flex-1">{state.text} <strong className="text-gray-400 ml-1">[{state.score}]</strong></span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">세심한 배려가 필요한 부위나 뻐근하거나 불편한 곳 <span className="text-gray-400 font-normal">(선택 사항)</span></label>
                <input type="text" placeholder="예: 오른쪽 어깨가 특히 결려요" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">오늘의 기분/목표 <span className="text-gray-400 font-normal">(선택 사항)</span></label>
                <input type="text" placeholder="예: 차분하게 하루를 마무리하고 싶어요" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">상세 설명</label>
                <textarea 
                  rows="4" 
                  placeholder="어떤 동작들이 들어가면 좋을지, 피하고 싶은 동작은 무엇인지 자유롭게 적어주세요." 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSubmit}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-md hover:bg-gray-800 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-base">🎧 플리 신청 완료하기!</span>
                  <span className="text-[11px] text-gray-300 font-normal">(BMTI 가이드가 한땀한땀 확인하기 때문에 최대 3-4일이 소요될 수 있습니다.)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabView;
