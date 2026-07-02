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
import SpotView from './components/SpotView';
import AiChatHub from './components/AiChatHub';
import AiChatRoom from './components/AiChatRoom';
function App() {
  const [currentView, setCurrentView] = useState(window.location.hash ? 'result' : 'home');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [bmtiCode, setBmtiCode] = useState(() => {
    if (window.location.hash) return window.location.hash.replace('#', '');
    const saved = localStorage.getItem('bmti_code');
    return saved || '';
  }); // e.g. "ALDZ-Tl"
  const [bmtiAnswers, setBmtiAnswers] = useState(() => {
    const saved = localStorage.getItem('bmti_answers');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentGroupRoom, setCurrentGroupRoom] = useState(null);

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
    } else if (currentView === 'home') {
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
                const updatedUser = { ...localUser, ...dbUser, isPremium: true };
                setUserProfile(updatedUser);
                setIsLoggedIn(true);
                localStorage.setItem('bmti_user', JSON.stringify(updatedUser)); // keep id for next load
                if (dbUser.bmti_type) {
                  setBmtiCode(dbUser.bmti_type);
                }
              } else {
                // fallback
                localUser.isPremium = true;
                setUserProfile(localUser);
                setIsLoggedIn(true);
                if (localUser.bmti_type) setBmtiCode(localUser.bmti_type);
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
          const { error } = await supabase
            .from('users')
            .update({ bmti_type: bmtiCode })
            .eq('id', userProfile.id);
            
          if (!error) {
            await supabase
              .from('bmti_history')
              .insert({ user_id: userProfile.id, bmti_code: bmtiCode })
              .catch(e => console.error(e));

            const updatedProfile = { ...userProfile, bmti_type: bmtiCode };
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
  }, [quizCompleted]);

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
            email: userData.email,
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
      if (userData.appNotification) {
        await supabase.from('pre_registrations').insert({ user_id: data.id }).catch(e => console.error('Pre-reg error:', e));
      }
      
      const fullUserData = { ...userData, id: data.id, bmti_type: data.bmti_type, appNotification: userData.appNotification };
      setUserProfile(fullUserData);
      setShowSignup(false);
      setIsLoggedIn(true);
      localStorage.setItem('bmti_user', JSON.stringify(fullUserData));
    } catch (e) {
      console.error('Error saving user to Supabase:', e);
      alert('회원가입 처리 중 오류가 발생했습니다.\n상세: ' + (e.message || JSON.stringify(e)));
    }
  };

  return (
    <div className="bg-white min-h-screen text-[var(--color-brand)] relative pb-10">
      <Navbar
        currentView={currentView}
        setView={setCurrentView}
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
            setView={setCurrentView}
            quizCompleted={quizCompleted}
            setQuizCompleted={setQuizCompleted}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={handleLoginAttempt}
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
        {currentView === 'bodycheck' && <BodyCheckView />}
        {currentView === 'spot' && (
          <SpotView 
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
            onOpenChat={() => setCurrentView('aichat_room')}
          />
        )}
        {currentView === 'aichat_room' && (
          <AiChatRoom bmtiCode={bmtiCode} setView={setCurrentView} userInfo={userProfile} />
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
      {['home', 'board', 'ticket', 'mypage', 'spot'].includes(currentView) && <Footer />}

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
