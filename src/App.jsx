import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import QuizView from './components/QuizView';
import ResultView from './components/ResultView';
import BoardView from './components/BoardView';
import Footer from './components/Footer';
import TicketView from './components/TicketView';
import SignupModal from './components/SignupModal';
import BodyCheckView from './components/BodyCheckView';
import MyPageView from './components/MyPageView';
import AiChatHub from './components/AiChatHub';
import SavePromptModal from './components/SavePromptModal';
function App() {
  const initialHash = window.location.hash.replace('#', '');
  const [currentView, setCurrentView] = useState(
    initialHash === 'quiz' ? 'quiz' : (initialHash ? 'result' : 'home')
  );
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [bmtiCode, setBmtiCode] = useState(() => {
    if (initialHash && initialHash !== 'quiz') return initialHash;
    const saved = localStorage.getItem('bmti_code');
    return saved || '';
  }); // e.g. "ALDZ-Tl"
  const [bmtiAnswers, setBmtiAnswers] = useState(() => {
    const saved = localStorage.getItem('bmti_answers');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentGroupRoom, setCurrentGroupRoom] = useState(null);

  // 비로그인 + 테스트 완료 유저 → 다른 탭 클릭 시 카카오 저장 팝업 (세션당 1회)
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingView, setPendingView] = useState(null);
  const savePromptShownRef = useState(() => ({ current: false }))[0];

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
    
    if (currentView === 'result' && bmtiCode) {
      window.history.replaceState(null, '', `#${bmtiCode}`);
    } else if (currentView === 'home' || currentView === 'quiz') {
      window.history.replaceState(null, '', ' '); // clear hash
    }
  }, [currentView, bmtiCode]);

  // Save bmtiCode to localStorage
  useEffect(() => {
    if (bmtiCode) {
      localStorage.setItem('bmti_code', bmtiCode);
    }
  }, [bmtiCode]);

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
                const updatedUser = { ...localUser, ...dbUser };
                setUserProfile(updatedUser);
                setIsLoggedIn(true);
                localStorage.setItem('bmti_user', JSON.stringify(updatedUser)); // keep id for next load
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
    if (isLoggedIn && userProfile && bmtiCode && quizCompleted) {
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
      setCurrentView('home');
    } else {
      setShowSignup(true); // open signup modal
    }
  };

  // Called when signup is completed
  const handleSignupComplete = async (userData) => {
    console.log('✅ User signed up:', userData);
    
    // Save to Supabase
    try {
      // We only want to upsert fields that exist in the form
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            kakao_id: userData.kakaoId,
            nickname: userData.nickname,
            kakao_gender: userData.kakaoGender,
            kakao_age: userData.kakaoAge,
            height: userData.height,
            weight: userData.weight,
            frequency: userData.frequency,
            goals: userData.goals,
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
      
      const fullUserData = { ...userData, id: data.id, bmti_type: data.bmti_type, bmti_answers: data.bmti_answers, appNotification: userData.appNotification };
      setUserProfile(fullUserData);
      setShowSignup(false);
      setIsLoggedIn(true);
      localStorage.setItem('bmti_user', JSON.stringify(fullUserData));

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
        {currentView === 'board' && (
          <BoardView 
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => setShowSignup(true)}
            userProfile={userProfile}
            bmtiCode={bmtiCode}
          />
        )}

        {currentView === 'ticket' && (
          <TicketView 
            isLoggedIn={isLoggedIn}
            bmtiCode={bmtiCode}
            setView={setCurrentView}
            onRequireLogin={() => setShowSignup(true)}
          />
        )}
        {currentView === 'bodycheck' && (
          <BodyCheckView
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => setShowSignup(true)}
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
          />
        )}
        {currentView === 'mypage' && (
          <MyPageView 
            setView={setCurrentView}
            userInfo={userProfile}
            bmtiCode={bmtiCode}
            setBmtiCode={setBmtiCode}
            bmtiAnswers={bmtiAnswers}
          />
        )}
      </main>

      {/* Footer for Home/Board/Ticket/Bodyscan/MyPage views */}
      {['home', 'board', 'ticket', 'mypage'].includes(currentView) && <Footer />}

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
    </div>
  );
}

export default App;
