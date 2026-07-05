import { CHARACTERS, CHARACTER_NAMES } from '../data';

/**
 * BMTI 교환일기 허브 — 소개 페이지
 */
const AiChatHub = ({ bmtiCode, setView }) => {
  const axisCode = bmtiCode ? bmtiCode.split('-')[0] : '';
  const charData = CHARACTERS.find(c => c.id === axisCode);

  // 접근 제어: BMTI 미완료
  if (!bmtiCode) {
    return (
      <div className="min-h-[100dvh] pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center fade-in bg-[#f8f9fa]">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
          <span className="text-4xl">📝</span>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-900">BMTI 교환일기</h2>
        <p className="text-gray-500 mb-8 max-w-sm break-keep leading-relaxed text-sm">
          정확한 맞춤형 코칭을 위해 카카오 간편 로그인 및 BMTI 설문 완료가 필요합니다.
        </p>
        <button onClick={() => setView('quiz')} className="bg-black text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-black/20 hover:bg-gray-800 transition-all hover:-translate-y-1">
          로그인 및 설문 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-32 px-4 md:px-6 max-w-2xl mx-auto fade-in">
      {/* 타이틀 영역 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-3 flex items-center justify-center gap-2">📝 BMTI 교환일기</h1>
        <p className="text-gray-500 font-medium text-[15px] px-4 break-keep leading-relaxed">
          사소한 자세 습관부터 오늘의 컨디션까지, 📝 BMTI 교환일기에 남겨보세요.
        </p>
      </div>

      {/* 상세 설명 */}
      <div className="px-2">
        {/* Chat Box */}
        <div className="space-y-3 mb-8 mx-auto max-w-sm">
          <div className="flex gap-2 items-start">
            <div className="relative w-10 h-10 flex-shrink-0 mt-1">
              {charData ? (
                <div className={`w-10 h-10 rounded-full ${charData.color || 'bg-gray-50'} flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden`}>
                  <img src={charData.image} alt="AI" className={`w-[85%] h-[85%] object-contain ${charData.imgClass || ''}`} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm shadow-sm border border-blue-100">🤖</div>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <span className="text-[13px] font-bold text-gray-700 px-1">{charData ? CHARACTER_NAMES[charData.id] : '[유형명]'}</span>
              <div className="bg-white text-gray-800 border border-gray-100 text-[14px] px-4 py-3 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] leading-relaxed whitespace-pre-wrap">
                안녕하세요! 저는 당신의 일기 메이트 {charData ? CHARACTER_NAMES[charData.id] : '[유형명]'}이에요. 오늘 몸을 쓰면서 느꼈던 불편함이나 뻐근함을 일기장에 끄적이듯 남겨주세요. 매일의 기록을 모아 당신의 신체 패턴을 짚어드릴게요.
              </div>
              <div className="bg-white text-gray-800 border border-gray-100 text-[14px] px-4 py-3 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] leading-relaxed whitespace-pre-wrap">
                단, 저는 진단을 내리지 않아요. 정말 아플 땐 병원이 먼저랍니다.
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          {/* 교환일기 컨셉 1 */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
              <span className="text-xl">✍️</span> 나만의 캐릭터와 일상 공유
            </h4>
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl">
              <div className="flex flex-col items-end">
                <div className="bg-black text-white text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]">
                  요즘 자꾸 늘어지네.. 일기 쓰기도 귀찮아 ㅠ
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="relative w-7 h-7 flex-shrink-0">
                  {charData ? (
                    <img src={charData.image} alt="AI" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-sm shadow-sm border border-blue-100">🤖</div>
                  )}
                </div>
                <div className="bg-white text-gray-800 border border-gray-100 text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] leading-relaxed">
                  나를 대변하는 BMTI 캐릭터와 함께 일기를 쓰고, <strong className="text-blue-600">내 성향에 꼭 맞는 따뜻한 답장</strong>을 실시간으로 받아보세요.
                </div>
              </div>
            </div>
          </div>

          {/* 교환일기 컨셉 2 */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
              <span className="text-xl">💌</span> 매일매일 남기는 나의 기록
            </h4>
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl">
              <div className="flex flex-col items-end">
                <div className="bg-black text-white text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%]">
                  오늘 드디어 목표 달성했어! 너무 뿌듯해!
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="relative w-7 h-7 flex-shrink-0">
                  {charData ? (
                    <img src={charData.image} alt="AI" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-sm shadow-sm border border-amber-100">🤖</div>
                  )}
                </div>
                <div className="bg-white border border-gray-100 text-gray-800 text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] leading-relaxed">
                  사소한 성취부터 오늘 하루의 감정까지! <strong className="text-amber-600">일기로 남기면 캐릭터가 특별한 피드백을 보내줍니다.</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="text-center mt-8 mb-4">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            💡 본 기능은 새롭게 단장 중입니다!<br />
            더 멋진 교환일기 서비스로 곧 찾아뵙겠습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiChatHub;
