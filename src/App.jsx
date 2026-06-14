import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import QuizView from './components/QuizView';
import ResultView from './components/ResultView';
import BoardView from './components/BoardView';
import LabView from './components/LabView';
import Footer from './components/Footer';
import TicketView from './components/TicketView';
import SignupModal from './components/SignupModal';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [bmtiCode, setBmtiCode] = useState(''); // e.g. "ALDZ-Tl"

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Handler for login attempts — opens signup modal instead of instant login
  const handleLoginAttempt = () => {
    if (isLoggedIn) {
      setIsLoggedIn(false); // logout
      setUserProfile(null);
    } else {
      setShowSignup(true); // open signup modal
    }
  };

  // Called when signup is completed
  const handleSignupComplete = (userData) => {
    console.log('✅ User signed up:', userData);
    setUserProfile(userData);
    setShowSignup(false);
    setIsLoggedIn(true);
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
          />
        )}
        {currentView === 'quiz' && (
          <QuizView
            setView={setCurrentView}
            setQuizCompleted={setQuizCompleted}
            setBmtiCode={setBmtiCode}
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
        {currentView === 'lab' && <LabView />}
        {currentView === 'ticket' && (
          <TicketView 
            isLoggedIn={isLoggedIn}
            bmtiCode={bmtiCode}
            setView={setCurrentView}
            onRequireLogin={() => setShowSignup(true)}
          />
        )}
      </main>

      {/* Footer for Home/Board/Lab views */}
      {['home', 'board', 'lab', 'ticket'].includes(currentView) && <Footer />}

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
