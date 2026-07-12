/* eslint-disable */
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isReservedNickname } from '../data';

const KakaoIcon = ({ className = "w-5 h-5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

const AGE_RANGES = [
  { id: '10s', label: '10대' },
  { id: '20s', label: '20대' },
  { id: '30s', label: '30대' },
  { id: '40s', label: '40대' },
  { id: '50s+', label: '50대 이상' },
];



const SignupModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(0); // 0: kakao intro, 1: 닉네임, 2: 약관 동의
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    gender: '',
    ageRange: '',
    appNotification: true,
    marketingConsent: false,
    privacyConsent: false
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.nickname || !formData.nickname.trim()) newErrors.nickname = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRandomNickname = () => {
    const ADJECTIVES = ['열정적인', '꾸준한', '행복한', '건강한', '활기찬', '멋진', '강력한', '유연한'];
    const NOUNS = ['헬린이', '운동러', '홈트족', '러너', '다이어터', '근육맨', '요기니'];
    const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    return `${randomAdj}${randomNoun}${randomNumber}`;
  };



  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      alert('카카오 SDK가 로드되지 않았습니다.');
      return;
    }

    window.Kakao.Auth.login({
      success: function(authObj) {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async function(res) {
            // Check if user already exists in Supabase
            try {
              const { data: existingUser, error } = await supabase
                .from('users')
                .select('*')
                .eq('kakao_id', res.id.toString())
                .single();

              if (existingUser) {
                // User exists, skip signup steps
                onComplete({
                  id: existingUser.id,
                  kakaoId: existingUser.kakao_id,
                  nickname: existingUser.nickname,
                  kakaoGender: existingUser.kakao_gender,
                  kakaoAge: existingUser.kakao_age,
                  bmti_type: existingUser.bmti_type
                });
                return;
              }
            } catch (e) {
              console.log('Proceeding to new user signup');
            }

            const profile = res.kakao_account?.profile;
            const nickname = profile?.nickname || generateRandomNickname();

            const kakaoGenderRaw = profile?.gender || res.kakao_account?.gender;
            const kakaoGender = kakaoGenderRaw === 'male' ? '남성' : kakaoGenderRaw === 'female' ? '여성' : '성별 비공개';

            const ageRangeRaw = res.kakao_account?.age_range;
            let kakaoAge = '20대';
            if (ageRangeRaw) {
              const prefix = ageRangeRaw.split('~')[0];
              kakaoAge = `${prefix}대`;
              if (parseInt(prefix) >= 50) kakaoAge = '50대 이상';
            } else {
              kakaoAge = '연령 비공개';
            }

            const email = res.kakao_account?.email || '';

            // 프로필 정보 세팅 및 Step 1으로 이동
            setFormData(prev => ({
              ...prev,
              nickname: nickname,
              email: email,
              kakaoId: res.id.toString(),
              kakaoGender: kakaoGender,
              kakaoAge: kakaoAge
            }));

            setStep(1);
          },
          fail: function(error) {
            console.error('카카오 사용자 정보 요청 실패:', error);
            alert('사용자 정보를 가져오는데 실패했습니다.');
          }
        });
      },
      fail: function(err) {
        console.error('카카오 로그인 실패:', err);
        // 사용자가 취소한 경우 등
      }
    });
  };

  const handleNext = async () => {
    if (step === 0) {
      handleKakaoLogin();
      return;
    }
    if (!validateStep(step)) return;

    if (step === 1) {
      if (isReservedNickname(formData.nickname)) {
        alert('BMTI 파트너 코드와 같은 닉네임은 사용할 수 없습니다. 다른 닉네임을 입력해주세요.');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('nickname', formData.nickname);

        if (error) throw error;

        if (data && data.length > 0) {
          alert('이미 사용중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
          return;
        }
      } catch (e) {
        console.error('닉네임 중복 확인 오류:', e);
        alert('닉네임 확인 중 오류가 발생했습니다.');
        return;
      }
    }

    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    if (!formData.privacyConsent) {
      setErrors({ privacyConsent: true });
      return;
    }
    console.log('📊 Collected user data:', formData);
    onComplete(formData);
  };

  const handleBack = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden relative">
        {/* Close button */}
        <button
          id="signup-close"
          onClick={onClose}
          className="absolute top-5 right-5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress bar (hidden on step 0) */}
        {step > 0 && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-black transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-8 md:p-10">
          {/* ===== STEP 0: Kakao Login Intro ===== */}
          {step === 0 && (
            <div className="fade-in text-center">
              <div className="w-20 h-20 bg-[#FEE500] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#FEE500]/30">
                <KakaoIcon className="w-10 h-10 fill-[#3C1E1E]" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">카카오톡으로 시작하기</h3>
              <p className="text-gray-500 text-sm mb-8 break-keep leading-relaxed">
                간편하게 로그인하고 나만의 BMTI 결과지를<br />
                저장하고 친구와 공유하세요!
              </p>



              <div className="bg-gray-50 rounded-xl p-4 mb-5 text-xs text-gray-500 text-left w-full border border-gray-100">
                <p className="font-bold text-gray-700 mb-2.5 flex items-center gap-1.5"><span className="text-sm">💡</span> 연동되는 카카오톡 정보</p>
                <ul className="space-y-1.5 ml-1">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gray-400 rounded-full"></div>카카오톡 계정(이메일)</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 bg-gray-400 rounded-full"></div>닉네임 / 성별 / 연령대</li>
                </ul>
              </div>

              <button
                id="kakao-login-start"
                onClick={handleNext}
                className="w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-4 rounded-2xl text-base hover:bg-[#F4DC00] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <KakaoIcon className="w-5 h-5 fill-[#3C1E1E]" />
                카카오톡으로 계속하기
              </button>
              <p className="text-xs text-gray-400 mt-4">소셜 로그인 시 서비스 이용약관에 동의합니다.</p>
            </div>
          )}

          {/* ===== STEP 1: 닉네임 ===== */}
          {step === 1 && (
            <div className="fade-in">
              <button onClick={handleBack} className="mb-4 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                이전
              </button>
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">STEP 1 / {totalSteps}</p>
              <h3 className="text-2xl font-bold mb-1 text-gray-900">기본 정보</h3>
              <p className="text-sm text-gray-500 mb-8">사용하실 닉네임을 알려주세요.</p>

              {/* Nickname */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">
                    닉네임
                    {errors.nickname && <span className="text-red-400 ml-2 font-medium text-xs">입력해주세요</span>}
                  </label>
                  <button
                    onClick={() => updateField('nickname', generateRandomNickname())}
                    className="text-xs font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full"
                  >
                    🎲 랜덤 추천
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="사용하실 닉네임을 입력하세요"
                  value={formData.nickname}
                  onChange={(e) => updateField('nickname', e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-medium focus:outline-none focus:border-black transition-colors ${
                    errors.nickname ? 'border-red-300' : 'border-gray-200'
                  }`}
                  maxLength={10}
                />
              </div>

              <button
                id="step1-next"
                onClick={handleNext}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                다음
              </button>
            </div>
          )}

          {/* ===== STEP 2: Consent & Complete ===== */}
          {step === 2 && (
            <div className="fade-in">
              <button onClick={handleBack} className="mb-4 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                이전
              </button>
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">STEP {totalSteps} / {totalSteps}</p>
              <h3 className="text-2xl font-bold mb-1 text-gray-900">거의 다 왔어요!</h3>
              <p className="text-sm text-gray-500 mb-8">아래 내용을 확인하고 가입을 완료해주세요.</p>

              {/* Summary */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">입력하신 정보 요약</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">성별 / 연령대</span>
                    <span className="font-bold text-gray-800">{formData.kakaoGender || '선택안함'} / {formData.kakaoAge || '알 수 없음'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">닉네임</span>
                    <span className="font-bold text-gray-800">{formData.nickname}</span>
                  </div>
                </div>
              </div>

              {/* App Launch Notification */}
              <div className="bg-[#c0ff00]/10 border border-[#c0ff00]/30 rounded-2xl p-5 mb-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-gray-900 mb-1">⛄️ 'BMTI: 운동일기' 앱 출시 알림 받기</p>
                    <p className="text-xs text-gray-500 break-keep leading-relaxed">
                      올 겨울 출시 예정인 'BMTI: 운동일기' 앱의 알림을 가장 먼저 받아보세요! 사전 등록 혜택도 함께 제공됩니다.
                    </p>
                  </div>
                  <button
                    id="toggle-app-notification"
                    onClick={() => updateField('appNotification', !formData.appNotification)}
                    className={`w-12 h-7 rounded-full flex-shrink-0 transition-all duration-300 relative ${
                      formData.appNotification ? 'bg-black' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${
                      formData.appNotification ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-3 mb-8">
                <label className={`flex items-start gap-3 cursor-pointer group ${errors.privacyConsent ? '' : ''}`}>
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.privacyConsent}
                      onChange={(e) => updateField('privacyConsent', e.target.checked)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      formData.privacyConsent
                        ? 'bg-black border-black'
                        : `bg-white ${errors.privacyConsent ? 'border-red-400' : 'border-gray-300'} group-hover:border-gray-400`
                    }`}>
                      {formData.privacyConsent && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">
                    <span className="font-bold text-red-500">[필수]</span> 개인정보 수집 및 이용에 동의합니다.
                    {errors.privacyConsent && <span className="text-red-400 text-xs ml-1">동의가 필요합니다</span>}
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.marketingConsent}
                      onChange={(e) => updateField('marketingConsent', e.target.checked)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      formData.marketingConsent
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}>
                      {formData.marketingConsent && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">
                    <span className="font-bold text-gray-400">[선택]</span> 마케팅 정보 수신에 동의합니다. (카카오톡 알림)
                  </span>
                </label>
              </div>

              <button
                id="signup-complete"
                onClick={handleComplete}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md text-base"
              >
                가입 완료하고 결과 확인하기 🎉
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
