import { useState } from 'react';

const LabView = () => {
  const [activeTab, setActiveTab] = useState('request'); // 'request' or 'note'

  return (
    <div className="min-h-screen pt-32 px-4 md:px-6 max-w-4xl mx-auto pb-24 fade-in">
      {/* Main Title */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 font-serif tracking-tight text-[#9BB31B]">BMTI 플리 연구소🧪</h2>
        <p className="text-gray-500 text-sm break-keep">
          여러분의 피드백으로 완성되는 맞춤형 운동 플레이리스트
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-3 md:gap-4 mb-10 overflow-x-auto hide-scrollbar pb-2 justify-center">
        <button
          onClick={() => setActiveTab('request')}
          className={`whitespace-nowrap px-6 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-lg transition-all duration-300 border-2 ${
            activeTab === 'request'
              ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          📝 플리 신청
        </button>
        <button
          onClick={() => setActiveTab('note')}
          className={`whitespace-nowrap px-6 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-lg transition-all duration-300 border-2 ${
            activeTab === 'note'
              ? 'bg-black text-white border-black shadow-lg scale-[1.02]'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          🔬 BMTI 플리 노트
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'request' && (
        <div className="fade-in max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 mb-8 text-center">
            <span className="text-3xl mb-4 block">🎧</span>
            <h3 className="text-lg font-bold text-blue-900 mb-2">"내 BMTI에 이 루틴 만들어주세요!"</h3>
            <p className="text-sm text-blue-700/80 leading-relaxed break-keep">
              이용자분들이 필요한 운동 루틴(플리)을 직접 신청하는 공간입니다.<br className="hidden md:block"/>
              추후 정식 앱 출시에 맞춰 맞춤형 플리로 제작해 드립니다.
            </p>
          </div>
          
          {/* Mockup Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-6 text-center">새로운 플리 신청하기</h4>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">어떤 목적의 루틴이 필요한가요?</label>
                <input type="text" placeholder="예: 무릎 안 아픈 10분 하체 루틴" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">본인의 BMTI</label>
                <input type="text" placeholder="예: ALDZ" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">상세 설명</label>
                <textarea rows="4" placeholder="어떤 동작들이 들어가면 좋을지, 피하고 싶은 동작은 무엇인지 자유롭게 적어주세요." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors resize-none"></textarea>
              </div>
              <button 
                onClick={() => alert("플리 신청이 완료되었습니다! 정식 앱 출시에 적극 반영할게요.")}
                className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-md hover:bg-gray-800 transition-colors"
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'note' && (
        <div className="fade-in max-w-2xl mx-auto">
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 md:p-8 mb-8 text-center">
            <span className="text-3xl mb-4 block">📱</span>
            <h3 className="text-lg font-bold text-purple-900 mb-2">"현재 이렇게 만들어지고 있어요"</h3>
            <p className="text-sm text-purple-700/80 leading-relaxed break-keep">
              앱 화면 스케치, 루틴 기획 과정, 가볍게 테스트 중인 영상 캡쳐 등<br className="hidden md:block"/>
              제작 과정을 한 달에 1~2번씩 공유합니다.
            </p>
          </div>

          {/* Mockup Timeline */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">최신 노트</span>
                <span className="text-xs text-gray-400">2024년 6월 15일</span>
              </div>
              <h4 className="font-bold text-lg mb-2">앱 초기 UI 스케치 초안</h4>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                현재 '플리 추천' 메인 화면을 스케치하고 있습니다. BMTI 검사 결과와 연동되어서 로그인하자마자 가장 필요한 10분 루틴이 상단에 뜨도록 설계 중이에요.
              </p>
              <div className="aspect-video bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-medium text-sm border border-gray-100">
                🎨 UI 스케치 이미지 준비중
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">개발 일지</span>
                <span className="text-xs text-gray-400">2024년 5월 28일</span>
              </div>
              <h4 className="font-bold text-lg mb-2">첫 번째 운동 영상 촬영 완료!</h4>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                '팩트형(Z)' 분들을 위한 아주 직관적인 5분 스트레칭 영상을 테스트 촬영했습니다. 각도와 설명을 어떻게 넣을지 고민 중이에요.
              </p>
              <div className="aspect-video bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-medium text-sm border border-gray-100">
                🎬 테스트 영상 캡쳐 준비중
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabView;
