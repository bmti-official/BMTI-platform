import { useState, useEffect } from 'react';
import { authMode, linkAccount, endAuth, resumeAfterRedirect, migrateOnce, currentAuthId, watchAndCleanUrl } from './lib/authLink';
import { isBmtiCode } from './lib/bmtiTypes';
import { supabase } from './lib/supabaseClient';
import { track, trackScreen, trackAnomaly } from './lib/analytics';
import { syncSleepSettingFromServer } from './lib/mallangProfile';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import QuizView from './components/QuizView';
import ResultView from './components/ResultView';
import Footer from './components/Footer';
import SignupModal from './components/SignupModal';
import MyPageView from './components/MyPageView';
import AiChatHub from './components/AiChatHub';
import SavePromptModal from './components/SavePromptModal';
import KakaoChannelPrompt from './components/KakaoChannelPrompt';
// 카카오 로그인에서 돌아오면 주소 끝에 #access_token=... 이 붙는다.
// 여기서는 '못 본 척'만 한다 — 곧바로 지우면 Supabase가 읽기 전에 사라져
// 로그인이 조용히 실패한다. 지우는 일은 세션이 자리잡은 뒤 watchAndCleanUrl이 맡는다.
function takeHash() {
  try {
    const h = window.location.hash.replace('#', '');
    if (/access_token|refresh_token|provider_token|error_description/.test(h)) {
      trackAnomaly('auth_hash');   // 로그인 부스러기가 주소에 붙어 왔다
      return '';
    }
    return h;
  } catch { return ''; }
}

function App() {
  const initialHash = takeHash();
  // 공유 링크(#example-XXXX) — 공유받은 사람은 곧바로 설문(첫 질문)으로 보낸다.
  const exampleCode = initialHash.startsWith('example-') ? initialHash.slice('example-'.length) : null;
  // 유형 코드 모양일 때만 받아들인다(모르는 값이면 무시).
  const hashCode = (initialHash && initialHash !== 'quiz' && !exampleCode && isBmtiCode(initialHash)) ? initialHash : null;
  // 재방문(다이어리 온보딩을 마친) 유저는 첫 화면을 다이어리로 연다. 단, 링크에 해시가 있으면 그 화면 우선.
  const isReturningDiaryUser = (() => { try { return localStorage.getItem('bmti_diary_onboarded') === '1'; } catch { return false; } })();
  const [currentView, setCurrentView] = useState(
    initialHash === 'quiz' ? 'quiz' : (hashCode ? 'result' : (exampleCode ? 'quiz' : (isReturningDiaryUser ? 'aichat' : 'home')))
  );
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [bmtiCode, setBmtiCode] = useState(() => {
    if (hashCode) return hashCode;
    const saved = localStorage.getItem('bmti_code');
    // 예전에 잘못 저장된 값(토큰 등)이 남아 있으면 지우고 없던 일로 한다.
    if (saved && !isBmtiCode(saved)) {
      trackAnomaly('bad_saved_code', { len: saved.length });   // 저장돼 있던 유형 코드가 이상하다
      try { localStorage.removeItem('bmti_code'); } catch { /* 무시 */ }
      return '';
    }
    return saved || '';
  }); // e.g. "ALDZ-Tl"
  const [bmtiAnswers, setBmtiAnswers] = useState(() => {
    const saved = localStorage.getItem('bmti_answers');
    return saved ? JSON.parse(saved) : null;
  });
  // 비로그인 + 테스트 완료 유저 → 다른 탭 클릭 시 카카오 저장 팝업 (세션당 1회)
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingView, setPendingView] = useState(null);
  const savePromptShownRef = useState(() => ({ current: false }))[0];

  // 공유 링크(#example-XXXX)로 들어오면 곧바로 설문(첫 질문)으로 — 예시 결과지 갤러리는 열지 않는다.
  useEffect(() => {
    if (!exampleCode) return;
    try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* noop */ }
  }, []);

  const handleViewChange = (nextView) => {
    // 비로그인 + bmtiCode 존재(테스트 완료) + 아직 팝업 안 뜸 + result에서 다른 탭으로 이동
    if (!isLoggedIn && bmtiCode && !savePromptShownRef.current && currentView === 'result' && nextView !== 'result' && nextView !== 'quiz') {
      savePromptShownRef.current = true;
      setPendingView(nextView);
      setShowSavePrompt(true);
      return;
    }
    setCurrentView(nextView);
  };

  // Save bmtiAnswers to localStorage whenever it changes
  useEffect(() => {
    if (bmtiAnswers) {
      localStorage.setItem('bmti_answers', JSON.stringify(bmtiAnswers));
    }
  }, [bmtiAnswers]);

  // BMTI 변경 이벤트 리스너 추가
  useEffect(() => {
    const handleBmtiChange = (e) => {
      setBmtiCode(e.detail.code);
    };
    
    window.addEventListener('BMTI_UPDATED', handleBmtiChange);
    return () => {
      window.removeEventListener('BMTI_UPDATED', handleBmtiChange);
    };
  }, []);

  // Scroll to top and update hash on view change
  useEffect(() => {
    window.scrollTo(0, 0);
    trackScreen(currentView);   // 화면별 체류 시간 기록
    
    if (currentView === 'result' && bmtiCode) {
      window.history.replaceState(null, '', `#${bmtiCode}`);
    } else if (currentView === 'home' || currentView === 'quiz') {
      window.history.replaceState(null, '', ' '); // clear hash
    }
  }, [currentView, bmtiCode]);

  // Save bmtiCode to localStorage
  useEffect(() => {
    if (bmtiCode && isBmtiCode(bmtiCode)) {
      localStorage.setItem('bmti_code', bmtiCode);
    }
  }, [bmtiCode]);

  // 카카오에서 돌아온 흔적을 세션이 자리잡은 뒤 지운다(토큰이 주소에 남지 않게).
  useEffect(() => { watchAndCleanUrl(); }, []);

  // 이미 로그인해 둔 회원인데 서버 세션이 아직 없으면, 한 번만 조용히 이어 붙인다.
  useEffect(() => {
    if (authMode() !== 'on') return;
    const saved = localStorage.getItem('bmti_user');
    if (!saved) return;
    let alive = true;
    (async () => {
      const authId = await currentAuthId();
      if (!alive) return;
      if (authId) {
        // 세션이 있으면 이 회원 줄에 매단다(이미 매달려 있으면 아무 일도 없다)
        try { await linkAccount(JSON.parse(saved)?.kakaoId || JSON.parse(saved)?.kakao_id); } catch { /* 무시 */ }
      } else {
        migrateOnce();
      }
    })();
    return () => { alive = false; };
  }, []);

  // 카카오에서 돌아온 직후 — 세션만 있고 아직 로그인 상태가 아니면 여기서 마무리한다.
  // (스위치가 꺼져 있으면 아무 일도 하지 않는다)
  useEffect(() => {
    if (authMode() !== 'on' || localStorage.getItem('bmti_user')) return;
    let alive = true;
    resumeAfterRedirect().then((row) => {
      if (!alive) return;
      // 카카오는 다녀왔는데 아직 우리 회원이 아니면 가입 절차로 이어 준다.
      if (!row) { currentAuthId().then((id) => { if (alive && id) setShowSignup(true); }); return; }
      const merged = { ...row, appNotification: row.app_notification ?? false };
      localStorage.setItem('bmti_user', JSON.stringify(merged));
      setUserProfile(merged);
      setIsLoggedIn(true);
      if (row.bmti_type) setBmtiCode(row.bmti_type);
      if (row.bmti_answers) setBmtiAnswers(row.bmti_answers);
    });
    return () => { alive = false; };
  }, []);

  // Load session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('bmti_user');
    if (savedUser) {
      try {
        const localUser = JSON.parse(savedUser);
        if (localUser && localUser.id) {
          // Fetch latest from Supabase
          supabase.from('users').select('*').eq('id', localUser.id).single()
            .then(({ data: dbUser, error }) => {
              if (dbUser && !error) {
                // isPremium은 실제 구독 정보(dbUser)를 그대로 신뢰한다 — 여기서 임의로 true를 강제하면
                // 구독하지 않은 유저도 프리미엄으로 취급되어 재검사 횟수 제한 등이 무력화된다.
                // app_notification은 DB 컬럼명(snake_case)과 클라이언트 필드명(appNotification)이
                // 달라 단순 스프레드로는 안 이어지므로 명시적으로 이어준다.
                const updatedUser = { ...localUser, ...dbUser, appNotification: dbUser.app_notification ?? localUser.appNotification };
                setUserProfile(updatedUser);
                setIsLoggedIn(true);
                localStorage.setItem('bmti_user', JSON.stringify(updatedUser)); // keep id for next load
                syncSleepSettingFromServer(dbUser.sleep_setting); // 기본 수면 기준을 서버에서 복원(다른 기기 이어쓰기)
                if (dbUser.bmti_type) {
                  setBmtiCode(dbUser.bmti_type);
                }
                if (dbUser.bmti_answers) {
                  setBmtiAnswers(dbUser.bmti_answers);
                }
              } else {
                // fallback
                setUserProfile(localUser);
                setIsLoggedIn(true);
                if (localUser.bmti_type) setBmtiCode(localUser.bmti_type);
                if (localUser.bmti_answers) setBmtiAnswers(localUser.bmti_answers);
              }
            });
        }
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
  }, []);

  // Update Supabase when quiz is completed
  useEffect(() => {
    if (isLoggedIn && userProfile && bmtiCode && isBmtiCode(bmtiCode) && quizCompleted) {
      const updateBmti = async () => {
        try {
          let { error } = await supabase
            .from('users')
            .update({ bmti_type: bmtiCode, bmti_answers: bmtiAnswers })
            .eq('id', userProfile.id);

          if (error) {
            // bmti_answers 컬럼이 아직 DB에 없는 환경(마이그레이션 전)에서도
            // 최소한 유형 코드만큼은 계속 저장되도록 폴백한다.
            ({ error } = await supabase
              .from('users')
              .update({ bmti_type: bmtiCode })
              .eq('id', userProfile.id));
          }

          if (!error) {
            await supabase
              .from('bmti_history')
              .insert({ user_id: userProfile.id, bmti_code: bmtiCode })
              .catch(e => console.error(e));

            const updatedProfile = { ...userProfile, bmti_type: bmtiCode, bmti_answers: bmtiAnswers };
            setUserProfile(updatedProfile);
            localStorage.setItem('bmti_user', JSON.stringify(updatedProfile));
          }
        } catch (err) {
          console.error('Failed to update BMTI on Supabase', err);
        }
      };
      updateBmti();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizCompleted, isLoggedIn, bmtiCode]);

  // Handler for login attempts — opens signup modal instead of instant login
  const handleLoginAttempt = () => {
    if (isLoggedIn) {
      setIsLoggedIn(false); // logout
      setUserProfile(null);
      localStorage.removeItem('bmti_user');
      endAuth();                     // Supabase 로그인 세션도 함께 정리한다
      setCurrentView('home');
    } else {
      setShowSignup(true); // open signup modal
    }
  };

  // Called when signup is completed
  const handleSignupComplete = async (userData) => {
    console.log('✅ User signed up:', userData);
    // 로그인 세션이 있으면 이 회원 줄에 이어 붙인다(켜져 있을 때만).
    // 실패해도 가입 흐름은 그대로 이어진다.
    let myAuthId = null;
    if (authMode() === 'on' && userData?.kakaoId) {
      try {
        myAuthId = await currentAuthId();
        await linkAccount(userData.kakaoId);
      } catch { /* 무시 */ }
    }
    
    // Save to Supabase
    try {
      // We only want to upsert fields that exist in the form
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            kakao_id: userData.kakaoId,
            // 새로 가입하는 사람도 곧바로 로그인 계정과 이어 둔다.
            // (이게 없으면 문을 잠근 뒤 가입이 막힌다)
            ...(myAuthId ? { auth_id: myAuthId } : {}),
            nickname: userData.nickname,
            kakao_gender: userData.kakaoGender,
            kakao_age: userData.kakaoAge,
            // 신규 가입 때 고른 알림 신청 여부를 바로 반영한다. 기존 회원의 재로그인
            // (SignupModal의 existingUser 단축 경로)에서는 이 필드가 안 넘어오므로
            // undefined가 되어 아래 upsert에서 컬럼이 그대로 유지된다(덮어쓰지 않음).
            ...(userData.appNotification !== undefined ? { app_notification: userData.appNotification } : {}),
            // bmti_type is updated separately when they complete the quiz
          },
          { onConflict: 'kakao_id' }
        )
        .select()
        .single();
        
      if (error) throw error;
      
      // Save pre-registration if opted in
      // 주의: supabase-js의 쿼리 빌더는 .then()만 구현한 thenable이라 .catch()가 없다 —
      // 체이닝하면 즉시 TypeError가 나서 insert 자체가 실행되지 않으므로 try/catch로 감싼다.
      if (userData.appNotification) {
        try {
          await supabase.from('pre_registrations').insert({ user_id: data.id });
        } catch (e) {
          console.error('Pre-reg error:', e);
        }
      }
      
      // data는 upsert 후 select().single()로 받아온 DB의 전체 행 — 기존 회원이 다시 로그인하는
      // 경우 exercise_frequency/exercise_goals/common_posture 등 예전에 저장해둔 값이 여기 이미
      // 들어있다. userData(가입 폼 입력값)만으로 fullUserData를 만들면 이 필드들이 통째로 빠지므로
      // data를 먼저 깔고 그 위에 방금 입력한 값을 덮어쓴다.
      // appNotification은 기존 회원의 재로그인 단축 경로(SignupModal의 existingUser)에서는
      // userData에 아예 없는 필드라(undefined) 그대로 쓰면 매번 꺼지므로, DB에 저장된
      // app_notification 값을 우선 신뢰한다.
      const fullUserData = { ...data, ...userData, id: data.id, bmti_type: data.bmti_type, bmti_answers: data.bmti_answers, appNotification: userData.appNotification ?? data.app_notification ?? false };
      setUserProfile(fullUserData);
      setShowSignup(false);
      setIsLoggedIn(true);
      localStorage.setItem('bmti_user', JSON.stringify(fullUserData));
      track('signup_done', { hasBmti: !!data.bmti_type });   // 비회원 → 회원 전환

      // 기존 회원이 새 기기에서 로그인하는 경우, 이 기기의 bmtiCode/bmtiAnswers가 비어있거나
      // 계정에 저장된 최신 결과와 다를 수 있으므로 DB 값으로 동기화한다.
      // 단, 이번 세션에서 방금 퀴즈를 완료하고 로그인하는 흐름(quizCompleted === true)이라면
      // 지금 막 나온 새 결과가 최신이므로 DB의 예전 값으로 덮어써서는 안 된다 —
      // 이 경우는 반대로 "Update Supabase when quiz is completed" 이펙트가 새 값을 DB에 반영한다.
      if (!quizCompleted) {
        if (data.bmti_type) {
          setBmtiCode(data.bmti_type);
        }
        if (data.bmti_answers) {
          setBmtiAnswers(data.bmti_answers);
        }
      }
    } catch (e) {
      console.error('Error saving user to Supabase:', e);
      alert('회원가입 처리 중 오류가 발생했습니다.\n상세: ' + (e.message || JSON.stringify(e)));
    }
  };

  return (
    <div className="bg-white min-h-screen text-[var(--color-brand)] relative pb-10">
      <Navbar
        currentView={currentView}
        setView={handleViewChange}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={handleLoginAttempt}
        onRequireLogin={() => setShowSignup(true)}
        userProfile={userProfile}
        bmtiCode={bmtiCode}
      />

      <main>
        {currentView === 'home' && (
          <HomeView
            setView={setCurrentView}
            quizCompleted={quizCompleted}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => setShowSignup(true)}
            bmtiCode={bmtiCode}
            bmtiAnswers={bmtiAnswers}
            userProfile={userProfile}
          />
        )}
        {currentView === 'quiz' && (
          <QuizView
            setView={setCurrentView}
            setQuizCompleted={setQuizCompleted}
            setBmtiCode={setBmtiCode}
            setBmtiAnswers={setBmtiAnswers}
          />
        )}
        {currentView === 'result' && (
          <ResultView
            setView={handleViewChange}
            quizCompleted={quizCompleted}
            setQuizCompleted={setQuizCompleted}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={handleLoginAttempt}
            onRequireLogin={() => setShowSignup(true)}
            bmtiCode={bmtiCode}
            bmtiAnswers={bmtiAnswers}
            userProfile={userProfile}
          />
        )}
        {currentView === 'aichat' && (
          <AiChatHub
            bmtiCode={bmtiCode}
            bmtiAnswers={bmtiAnswers}
            setView={setCurrentView}
            userInfo={userProfile}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => setShowSignup(true)}
            setUserProfile={setUserProfile}
          />
        )}
        {currentView === 'mypage' && (
          <MyPageView
            setView={setCurrentView}
            userInfo={userProfile}
            bmtiCode={bmtiCode}
            setBmtiCode={setBmtiCode}
            bmtiAnswers={bmtiAnswers}
            onLogout={handleLoginAttempt}
          />
        )}
      </main>

      {/* Footer for Home/Ticket/Bodyscan/MyPage views */}
      {['home', 'mypage'].includes(currentView) && <Footer />}

      {/* 비로그인 저장 유도 팝업 */}
      <SavePromptModal
        isOpen={showSavePrompt}
        onClose={() => {
          setShowSavePrompt(false);
          if (pendingView) {
            setCurrentView(pendingView);
            setPendingView(null);
          }
        }}
        onLogin={() => {
          setShowSavePrompt(false);
          setPendingView(null);
          setShowSignup(true);
        }}
        bmtiCode={bmtiCode}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onComplete={handleSignupComplete}
      />

      {currentView !== 'quiz' && <KakaoChannelPrompt />}
    </div>
  );
}

export default App;
