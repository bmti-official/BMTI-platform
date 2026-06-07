import { useState } from 'react';

const KakaoIcon = ({ className = "w-5 h-5 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
  </svg>
);

const EXERCISE_GOALS = [
  { id: 'diet', label: '다이어트', emoji: '🔥' },
  { id: 'muscle', label: '근력 강화', emoji: '💪' },
  { id: 'health', label: '건강 유지', emoji: '💚' },
  { id: 'flexibility', label: '유연성 향상', emoji: '🧘' },
  { id: 'stress', label: '스트레스 해소', emoji: '🧠' },
  { id: 'posture', label: '체형 교정', emoji: '🦴' },
];

const EXERCISE_FREQUENCY = [
  { id: 'none', label: '거의 안 함' },
  { id: '1-2', label: '주 1~2회' },
  { id: '3-4', label: '주 3~4회' },
  { id: '5+', label: '주 5회 이상' },
];

const AGE_RANGES = [
  { id: '10s', label: '10대' },
  { id: '20s', label: '20대' },
  { id: '30s', label: '30대' },
  { id: '40s', label: '40대' },
  { id: '50s+', label: '50대 이상' },
];

const SignupModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(0); // 0: kakao intro, 1: basic info, 2: body info, 3: goals, 4: consent
  const [formData, setFormData] = useState({
    gender: '',
    ageRange: '',
    height: '',
    weight: '',
    goals: [],
    frequency: '',
    appNotification: true,
    marketingConsent: false,
    privacyConsent: false,
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const toggleGoal = (goalId) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.gender) newErrors.gender = true;
      if (!formData.ageRange) newErrors.ageRange = true;
    }
    if (currentStep === 2) {
      if (!formData.height) newErrors.height = true;
      if (!formData.weight) newErrors.weight = true;
    }
    if (currentStep === 3) {
      if (formData.goals.length === 0) newErrors.goals = true;
      if (!formData.frequency) newErrors.frequency = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (!validateStep(step)) return;

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

              <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left">
                <p className="text-xs font-semibold text-gray-400 mb-3 tracking-wider">카카오 계정으로 제공되는 정보</p>
                <div className="space-y-2.5">
                  {[
                    { icon: '👤', text: '닉네임' },
                    { icon: '📧', text: '이메일 주소' },
                    { icon: '🖼️', text: '프로필 사진' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.text}</span>
                      <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">자동</span>
                    </div>
                  ))}
                </div>
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

          {/* ===== STEP 1: Gender & Age ===== */}
          {step === 1 && (
            <div className="fade-in">
              <button onClick={handleBack} className="mb-4 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                이전
              </button>
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">STEP 1 / {totalSteps}</p>
              <h3 className="text-2xl font-bold mb-1 text-gray-900">기본 정보</h3>
              <p className="text-sm text-gray-500 mb-8">맞춤 분석을 위해 기본 정보를 알려주세요.</p>

              {/* Gender */}
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-700 mb-3 block">
                  성별
                  {errors.gender && <span className="text-red-400 ml-2 font-medium text-xs">선택해주세요</span>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'male', label: '남성', emoji: '🙋‍♂️' },
                    { id: 'female', label: '여성', emoji: '🙋‍♀️' },
                  ].map(g => (
                    <button
                      key={g.id}
                      id={`gender-${g.id}`}
                      onClick={() => updateField('gender', g.id)}
                      className={`py-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        formData.gender === g.id
                          ? 'border-black bg-black text-white shadow-md scale-[1.02]'
                          : `border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 ${errors.gender ? 'border-red-200' : ''}`
                      }`}
                    >
                      <span className="text-lg">{g.emoji}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-700 mb-3 block">
                  연령대
                  {errors.ageRange && <span className="text-red-400 ml-2 font-medium text-xs">선택해주세요</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map(age => (
                    <button
                      key={age.id}
                      id={`age-${age.id}`}
                      onClick={() => updateField('ageRange', age.id)}
                      className={`px-5 py-2.5 rounded-full border-2 text-sm font-bold transition-all duration-200 ${
                        formData.ageRange === age.id
                          ? 'border-black bg-black text-white shadow-md'
                          : `border-gray-200 text-gray-600 hover:border-gray-400 ${errors.ageRange ? 'border-red-200' : ''}`
                      }`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
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

          {/* ===== STEP 2: Height & Weight ===== */}
          {step === 2 && (
            <div className="fade-in">
              <button onClick={handleBack} className="mb-4 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                이전
              </button>
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">STEP 2 / {totalSteps}</p>
              <h3 className="text-2xl font-bold mb-1 text-gray-900">신체 정보</h3>
              <p className="text-sm text-gray-500 mb-8">정확한 체형 분석을 위해 입력해주세요.</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Height */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    키
                    {errors.height && <span className="text-red-400 ml-1 font-medium text-xs">필수</span>}
                  </label>
                  <div className="relative">
                    <input
                      id="input-height"
                      type="number"
                      inputMode="numeric"
                      placeholder="170"
                      value={formData.height}
                      onChange={(e) => updateField('height', e.target.value)}
                      className={`w-full px-4 py-4 rounded-2xl border-2 text-center text-lg font-bold focus:outline-none focus:border-black transition-colors ${
                        errors.height ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">cm</span>
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    체중
                    {errors.weight && <span className="text-red-400 ml-1 font-medium text-xs">필수</span>}
                  </label>
                  <div className="relative">
                    <input
                      id="input-weight"
                      type="number"
                      inputMode="numeric"
                      placeholder="65"
                      value={formData.weight}
                      onChange={(e) => updateField('weight', e.target.value)}
                      className={`w-full px-4 py-4 rounded-2xl border-2 text-center text-lg font-bold focus:outline-none focus:border-black transition-colors ${
                        errors.weight ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">kg</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex items-start gap-3">
                <span className="text-lg mt-0.5">🔒</span>
                <p className="text-xs text-gray-500 leading-relaxed break-keep">
                  입력하신 신체 정보는 BMTI 분석에만 활용되며, 외부에 공개되지 않습니다. 더 정확한 맞춤 결과를 위해 입력을 권장합니다.
                </p>
              </div>

              <button
                id="step2-next"
                onClick={handleNext}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                다음
              </button>
            </div>
          )}

          {/* ===== STEP 3: Goals & Frequency ===== */}
          {step === 3 && (
            <div className="fade-in">
              <button onClick={handleBack} className="mb-4 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                이전
              </button>
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">STEP 3 / {totalSteps}</p>
              <h3 className="text-2xl font-bold mb-1 text-gray-900">운동 성향</h3>
              <p className="text-sm text-gray-500 mb-8">관심 있는 운동 목적을 모두 선택해주세요.</p>

              {/* Exercise Goals (Multi-select) */}
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-700 mb-3 block">
                  운동 목적 <span className="text-gray-400 font-medium">(복수 선택 가능)</span>
                  {errors.goals && <span className="text-red-400 ml-2 font-medium text-xs">1개 이상 선택해주세요</span>}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {EXERCISE_GOALS.map(goal => (
                    <button
                      key={goal.id}
                      id={`goal-${goal.id}`}
                      onClick={() => toggleGoal(goal.id)}
                      className={`py-3.5 px-4 rounded-2xl border-2 text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                        formData.goals.includes(goal.id)
                          ? 'border-black bg-black text-white shadow-md'
                          : `border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 ${errors.goals ? 'border-red-200' : ''}`
                      }`}
                    >
                      <span className="text-base">{goal.emoji}</span>
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise Frequency */}
              <div className="mb-8">
                <label className="text-sm font-bold text-gray-700 mb-3 block">
                  현재 운동 빈도
                  {errors.frequency && <span className="text-red-400 ml-2 font-medium text-xs">선택해주세요</span>}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {EXERCISE_FREQUENCY.map(freq => (
                    <button
                      key={freq.id}
                      id={`freq-${freq.id}`}
                      onClick={() => updateField('frequency', freq.id)}
                      className={`py-3 px-4 rounded-2xl border-2 text-sm font-bold transition-all duration-200 ${
                        formData.frequency === freq.id
                          ? 'border-black bg-black text-white shadow-md'
                          : `border-gray-200 text-gray-600 hover:border-gray-400 ${errors.frequency ? 'border-red-200' : ''}`
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="step3-next"
                onClick={handleNext}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                다음
              </button>
            </div>
          )}

          {/* ===== STEP 4: Consent & Complete ===== */}
          {step === 4 && (
            <div className="fade-in">
              <button onClick={handleBack} className="mb-4 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                이전
              </button>
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">STEP 4 / {totalSteps}</p>
              <h3 className="text-2xl font-bold mb-1 text-gray-900">거의 다 왔어요!</h3>
              <p className="text-sm text-gray-500 mb-8">아래 내용을 확인하고 가입을 완료해주세요.</p>

              {/* Summary */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">입력하신 정보 요약</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">성별</span>
                    <span className="font-bold text-gray-800">{formData.gender === 'male' ? '남성' : '여성'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">연령대</span>
                    <span className="font-bold text-gray-800">{AGE_RANGES.find(a => a.id === formData.ageRange)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">키 / 체중</span>
                    <span className="font-bold text-gray-800">{formData.height}cm / {formData.weight}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">운동 빈도</span>
                    <span className="font-bold text-gray-800">{EXERCISE_FREQUENCY.find(f => f.id === formData.frequency)?.label}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500">운동 목적</span>
                    <span className="font-bold text-gray-800 text-right">
                      {formData.goals.map(g => EXERCISE_GOALS.find(eg => eg.id === g)?.label).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* App Launch Notification */}
              <div className="bg-[#c0ff00]/10 border border-[#c0ff00]/30 rounded-2xl p-5 mb-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-gray-900 mb-1">🚀 BMTI 앱 출시 알림 받기</p>
                    <p className="text-xs text-gray-500 break-keep leading-relaxed">
                      BMTI 앱이 출시되면 카카오톡으로 가장 먼저 알려드릴게요! 사전 등록 혜택도 함께 제공됩니다.
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
