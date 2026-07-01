import { useState, useEffect } from 'react';
import { CHARACTERS } from '../data';
import { supabase } from '../lib/supabaseClient';
import { earnStar } from '../lib/starSystem';

// Helper: get character image by BMTI code
const getCharImage = (code) => {
  if (!code) return null;
  const axisCode = code.split('-')[0];
  const char = CHARACTERS.find(c => c.id === axisCode);
  return char?.image || null;
};

// Helper: get specific scale for certain BMTI characters
const getCharScale = (code) => {
  if (!code) return '';
  const axisCode = code.split('-')[0];
  if (axisCode === 'ACQZ') {
    return 'scale-[2.8] md:scale-[3.0]';
  } else if (['ACDM', 'ALDM', 'OCDM', 'ACDZ', 'ALQZ'].includes(axisCode)) {
    return 'scale-[2.2] md:scale-[2.4]';
  } else if (axisCode === 'OLDM') {
    return 'scale-[1.8] md:scale-[2.0]';
  }
  return 'scale-[1.5] md:scale-[1.6]';
};

const EMOTIONS = [
  { 
    id: 1, 
    icon: '🔥', 
    name: '분노', 
    desc: '답답한 소통과 쏟아지는 업무/공부에 터져버림',
    aiResponse: '화가 치밀어 오를 때는 교감신경이 활성화되어 나도 모르게 뒷목과 어깨 주변 근육이 뻣뻣하게 굳어지기 쉽습니다. 오늘은 무리하게 몸을 혹사하기보다는, 잔뜩 화가 나 뭉쳐버린 근육을 부드럽게 달래주는 시간이 필요해 보입니다.',
    boardTitle: "오늘 '분노'로 터져버릴 것 같았던 사람들은 어떤 움직임으로 자기 점검하고 있을까요?"
  },
  { 
    id: 2, 
    icon: '💦', 
    name: '무기력', 
    desc: '업무/공부에 기가 빨려 퇴근/하교길에 손가락 하나 까딱하기 싫음',
    aiResponse: '에너지가 바닥났을 때는 거창한 운동을 해야 한다는 압박감조차 피곤하게 다가오죠. 무리하실 필요 없습니다. 그저 누운 자리에서 발목을 위아래로 까딱이거나, 무릎을 가볍게 구부렸다 펴는 것만으로도 하체의 혈액순환을 돕고 굳어있는 관절을 풀어줄 수 있습니다.',
    boardTitle: "기가 다 빨려버린 '무기력' 동지들이 선택한 최소한의 생존 자기 점검은?"
  },
  { 
    id: 3, 
    icon: '🌪️', 
    name: '불안감', 
    desc: '쳐내도 끝없는 데드라인에 쫓기며 심장이 쫄깃함',
    aiResponse: '마음이 조급하고 쫓기는 기분이 들 때는 내 몸의 중심을 잡는 것이 중요합니다. 코어에 가볍게 힘을 주고, 천천히 관절이 움직이는 궤적에 집중하다 보면 붕 떠 있던 불안한 마음이 내 몸 안으로 조금씩 가라앉는 것을 느낄 수 있을 것입니다.',
    boardTitle: "심장이 쫄깃해진 '불안감'을 잠재우기 위해 사람들은 어떤 자기 점검에 집중할까요?"
  },
  { 
    id: 4, 
    icon: '🪫', 
    name: '허무함', 
    desc: '\'내가 지금 여기서 뭘 하고 있나\' 영혼이 가출함',
    aiResponse: '영혼이 가출한 듯 텅 빈 느낌이 들 때는, 외부의 소음을 끄고 나에게 오롯이 집중할 수 있는 50분 남짓의 시간이 필요할지도 모릅니다. 무거운 중량보다는 관절의 가동 범위를 부드럽게 넓혀주는 맨몸 운동이 지친 몸과 마음을 차분히 정돈해 줄 것입니다.',
    boardTitle: "허무함을 느끼는 사람들이 조용히 스스로를 돌보는 자기 점검은?"
  },
  { 
    id: 5, 
    icon: '🍀', 
    name: '상쾌함', 
    desc: '오늘따라 일/공부도 술술 풀리고 칼퇴까지 완벽함',
    aiResponse: '오늘 하루 정말 기분 좋게 마무리하셨네요. 관절과 근육의 컨디션도 평소보다 훨씬 가볍고 유연하게 느껴지실 겁니다. 이렇게 에너지가 좋은 날은 평소보다 조금 더 도전적인 동작이나 땀을 흘리는 운동을 해보는 것도 좋은 활력소가 됩니다.',
    boardTitle: "칼퇴 후 텐션 최고조인 사람들의 오늘 자기 점검은?"
  }
];

const INITIAL_POSTS = {
  VOTE: [],
  Z: [
    { id: 1, body: "운동 전 스트레칭 5분이면 충분하다고요? 팩트체크 해봤습니다. 논문 기반으로 정리했어요. 동적 스트레칭 5분 vs 정적 스트레칭 10분, 부상률 차이는 거의 없더라고요. 핵심은 관절 가동 범위 확보!", author: "효율갑러너", bmti: "ACDZ", date: "10분 전", likes: 24, tag: "운동습관", isPremium: true, comments: [
      { id: 1, author: "근거중시녀", bmti: "ACQZ", text: "오 논문 출처 좀 공유해주세요!", date: "8분 전", replies: [
        { id: 1, author: "효율갑러너", bmti: "ACDZ", text: "ACSM 2024 가이드라인이에요! 검색하면 바로 나와요", date: "5분 전", isPremium: true }
      ]},
      { id: 2, author: "스트레칭러버", bmti: "OLQM", text: "저도 동적 스트레칭만 하는데 부상 전혀 없어요", date: "3분 전", replies: [] }
    ]},
    { id: 2, body: "체지방 측정, 인바디 vs 줄자 — 어떤 게 더 정확할까? 매주 인바디 찍는 분들 많은데, 사실 줄자로 허리-엉덩이 비율만 재도 체형 변화 추적엔 충분해요.", author: "데이터운동러", bmti: "ALDZ", date: "1시간 전", likes: 31, tag: "일상", comments: [
      { id: 1, author: "인바디매니아", bmti: "OCDM", text: "줄자는 측정 오차가 크지 않나요?", date: "40분 전", replies: [] }
    ]},
    { id: 3, body: "단백질 보충 타이밍, 운동 직후가 아니어도 됩니다. 골든타임 신화는 과장됐어요. 하루 총 섭취량이 핵심이라는 연구 결과들이 계속 나오고 있습니다.", author: "팩트폭격기", bmti: "ACQZ", date: "3시간 전", likes: 45, tag: "운동습관", comments: [] }
  ],
  M: [
    { id: 4, body: "오늘도 헬스장 앞에서 10분 고민하다 결국 들어감 🥹 가기 싫어서 차에서 10분 앉아있다가... 들어가니까 역시 기분 좋아지더라. 이거 저만 그래요?", author: "소심한근육", bmti: "OCDZ", date: "5분 전", likes: 89, tag: "일상", isPremium: true, comments: [
      { id: 1, author: "공감100배", bmti: "OLQM", text: "ㅋㅋㅋ 저도요!! 주차장에서 유튜브 보다가 결국 들어가요", date: "3분 전", replies: [
        { id: 1, author: "소심한근육", bmti: "OCDZ", text: "아 진짜요?? 동지다 ㅋㅋㅋ", date: "2분 전", isPremium: true },
        { id: 2, author: "운동왕언니", bmti: "ACDM", text: "저는 문 앞에서 돌아간 적도 있어요... 😂", date: "1분 전" }
      ]},
      { id: 2, author: "따뜻한맘", bmti: "ALDM", text: "들어간 거 자체가 대단해요!! 👏", date: "2분 전", replies: [] }
    ]},
    { id: 5, body: "다이어트 정체기 3주째... 체중은 안 빠지는데 치킨은 생각나고 😭 진짜 너무 우울해요. 열심히 하는데 왜 안 빠지는 걸까요 ㅠㅠ 다들 정체기 어떻게 버텼어요?", author: "포기하면편해", bmti: "OCQM", date: "2시간 전", likes: 67, tag: "고민", comments: [
      { id: 1, author: "정체기극복녀", bmti: "ALQZ", text: "저는 체중 말고 인바디 근육량 보기 시작했더니 마음이 편해졌어요!", date: "1시간 전", replies: [] }
    ]},
    { id: 6, body: "같이 러닝할 사람 구해요! 초보 대환영 🏃‍♀️ 혼자 뛰니까 너무 외로워요... 주 2~3회 한강공원에서 5km 같이 뛰실 분!", author: "다같이화이팅", bmti: "OLDM", date: "4시간 전", likes: 34, tag: "일상", comments: [] }
  ]
};

// Author badge component
const AuthorBadge = ({ author, bmti, size = 'md', isPremium = false }) => {
  const img = getCharImage(bmti);
  const scaleClass = getCharScale(bmti);
  const s = 'w-8 h-8';
  const textS = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const codeS = size === 'sm' ? 'text-[9px]' : 'text-[10px]';
  return (
    <div className="flex items-center gap-2">
      {img ? (
        <img src={img} alt={bmti} className={`${s} object-contain ${scaleClass}`} />
      ) : (
        <div className={`${s} rounded-full bg-gray-200 flex items-center justify-center ${textS} font-bold text-gray-500`}>
          {author?.[0]}
        </div>
      )}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className={`${textS} font-bold ${author === 'BMTI' ? 'text-blue-600' : 'text-gray-800'} leading-none flex items-center`}>
            {author === 'BMTI' && <span className="mr-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md">관리자</span>}
            {isPremium && author !== 'BMTI' ? '🎟️ ' : ''}{author}
          </span>
          {bmti && (
            <span className={`${codeS} font-bold px-1.5 py-0.5 rounded-full border leading-none ${
              bmti.endsWith('Z') ? 'bg-blue-100 text-blue-700 border-blue-200' :
              bmti.endsWith('M') ? 'bg-pink-100 text-pink-700 border-pink-200' :
              'bg-[#c0ff00] text-black border-[#9BB31B]/30'
            }`}>
              {bmti}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const BoardView = ({ isLoggedIn, onRequireLogin, userProfile, bmtiCode }) => {
  const [talkType, setTalkType] = useState('VOTE');
  const [talkSort, setTalkSort] = useState('latest');
  const [expandedId, setExpandedId] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [posts, setPosts] = useState({ VOTE: [], Z: [], M: [] });
  const [isFetching, setIsFetching] = useState(false);

  const fetchPosts = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, category, tab_type, created_at, likes_count,
          users ( id, nickname, bmti_type ),
          comments (
            id, content, created_at, parent_id,
            users ( id, nickname, bmti_type )
          )
        `)
        .eq('tab_type', talkType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedPosts = data.map(post => {
        const topLevelComments = post.comments.filter(c => !c.parent_id);
        const commentsWithReplies = topLevelComments.map(c => ({
          id: c.id,
          author: c.users?.nickname || '익명',
          bmti: c.users?.bmti_type,
          text: c.content,
          date: new Date(c.created_at).toLocaleString(),
          replies: post.comments
            .filter(r => r.parent_id === c.id)
            .map(r => ({
              id: r.id,
              author: r.users?.nickname || '익명',
              bmti: r.users?.bmti_type,
              text: r.content,
              date: new Date(r.created_at).toLocaleString(),
            }))
        }));

        return {
          id: post.id,
          body: post.content,
          author: post.users?.nickname || '익명',
          bmti: post.users?.bmti_type,
          date: new Date(post.created_at).toLocaleString(),
          likes: post.likes_count || 0,
          tag: post.category,
          comments: commentsWithReplies
        };
      });

      setPosts(prev => ({ ...prev, [talkType]: formattedPosts }));
    } catch (e) {
      console.error('Error fetching posts:', e);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [talkType]);
  
  const [emotionStep, setEmotionStep] = useState('select'); // 'select' | 'loading' | 'result'
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  const [lastVoteDate, setLastVoteDate] = useState(localStorage.getItem('last_vote_date'));
  useEffect(() => {
    const handleVoteUpdate = () => setLastVoteDate(localStorage.getItem('last_vote_date'));
    window.addEventListener('vote_updated', handleVoteUpdate);
    return () => window.removeEventListener('vote_updated', handleVoteUpdate);
  }, []);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const showVoteDot = !!bmtiCode && lastVoteDate !== getTodayString();

  const handleSelectEmotion = (emotionId) => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!bmtiCode) {
      alert("설문을 완료한 사람만 감정을 선택할 수 있습니다.");
      return;
    }
    
    setSelectedEmotion(emotionId);
    setEmotionStep('loading');
    
    setTimeout(() => {
      setEmotionStep('result');
      
      // Update red dot state
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      localStorage.setItem('last_vote_date', todayStr);
      window.dispatchEvent(new Event('vote_updated'));
    }, 3000);
  };
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeContent, setWriteContent] = useState('');
  const [writeTag, setWriteTag] = useState('일상');
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);

  const myNickname = userProfile?.nickname || '익명';
  const isAdmin = myNickname === 'BMTI';
  const myBmti = bmtiCode?.split('-')[0] || '';

  const toggleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleExpand = (postId) => {
    setExpandedId(expandedId === postId ? null : postId);
  };

  const handleDeletePost = async (postId, e) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 글을 삭제하시겠습니까?')) {
      await supabase.from('posts').delete().eq('id', postId);
      fetchPosts();
    }
  };

  const handleDeleteComment = (postId, commentId) => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      setPosts(prev => {
        const updated = { ...prev };
        updated[talkType] = updated[talkType].map(p => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== commentId)
          };
        });
        return updated;
      });
    }
  };

  const handleDeleteReply = (postId, commentId, replyId) => {
    if (window.confirm('정말로 이 답글을 삭제하시겠습니까?')) {
      setPosts(prev => {
        const updated = { ...prev };
        updated[talkType] = updated[talkType].map(p => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: p.comments.map(c => {
              if (c.id !== commentId) return c;
              return {
                ...c,
                replies: c.replies.filter(r => r.id !== replyId)
              };
            })
          };
        });
        return updated;
      });
    }
  };

  const getSortedPosts = (list) => {
    if (talkSort === 'popular') return [...list].sort((a, b) => b.likes - a.likes);
    if (talkSort === 'comments') return [...list].sort((a, b) => b.comments.length - a.comments.length);
    return list;
  };

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      alert("카카오톡 간편 로그인이 필요합니다.");
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!bmtiCode) {
      alert("설문을 완료한 사람만 작성할 수 있습니다.");
      return;
    }
    setShowWriteModal(true);
  };

  const handleSubmitPost = async () => {
    if (!writeContent.trim()) return;
    if (!userProfile?.id) {
      alert("다시 로그인해주세요.");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userProfile.id,
          tab_type: talkType,
          category: talkType === 'VOTE' ? selectedEmotion : writeTag,
          content: writeContent.trim()
        })
        .select();

      if (error) throw error;
      
      // Auto-reply call (Gemini Edge Function)
      // This runs asynchronously in background
      if (talkType === 'VOTE' || talkType === 'Z' || talkType === 'M') {
        supabase.functions.invoke('gemini-reply', {
          body: { post_id: data[0].id, content: writeContent.trim(), tab_type: talkType }
        }).catch(err => console.error("AI reply error:", err));
      }

      const starResult = earnStar('post');
      if (starResult.success) {
        alert(`게시글이 등록되었습니다. ${starResult.message}`);
      }

      setWriteContent('');
      setWriteTag('일상');
      setShowWriteModal(false);
      fetchPosts(); // refresh
    } catch (e) {
      console.error('Error creating post', e);
      alert('게시글 작성에 실패했습니다.');
    }
  };

  const handleSubmitComment = async (postId) => {
    if (!bmtiCode) {
      alert("설문을 완료한 사람만 댓글을 작성할 수 있습니다.");
      return;
    }
    if (!userProfile?.id) {
      alert("다시 로그인해주세요."); return;
    }
    
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userProfile.id,
          content: text
        });

      if (error) throw error;

      const starResult = earnStar('comment');
      if (starResult.success) {
        alert(`댓글이 등록되었습니다. ${starResult.message}`);
      }

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      fetchPosts(); // refresh
    } catch (e) {
      console.error('Error adding comment', e);
    }
  };

  const handleSubmitReply = async (postId, commentId) => {
    if (!bmtiCode) {
      alert("설문을 완료한 사람만 대댓글을 작성할 수 있습니다.");
      return;
    }
    if (!userProfile?.id) {
      alert("다시 로그인해주세요."); return;
    }
    const key = `${postId}-${commentId}`;
    const text = replyInputs[key]?.trim();
    if (!text) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userProfile.id,
          parent_id: commentId,
          content: text
        });
      if (error) throw error;

      const starResult = earnStar('reply');
      if (starResult.success) {
        alert(`답글이 등록되었습니다. ${starResult.message}`);
      }

      setReplyInputs(prev => ({ ...prev, [key]: '' }));
      setShowReplyFor(null);
      fetchPosts();
    } catch(e) {
      console.error(e);
    }
  };

  const getWriteButtonText = (emotionId) => {
    switch (emotionId) {
      case 1: return '🔥 분노를 쏟아내기';
      case 2: return '💦 내가 무기력한 이유';
      case 3: return '🌪️ 내가 불안한 이유';
      case 4: return '🪫 내가 번아웃이 온 이유';
      case 5: return '🍀 요즘 기분이 좋은 이유';
      default: return '💬 글 남기기';
    }
  };

  return (
    <div className="min-h-screen pt-44 px-4 md:px-6 max-w-4xl mx-auto pb-24 fade-in">

      {/* ===== 과몰입 톡톡 ===== */}
      <div className="fade-in">
        {/* Sub-description */}
        <p className="text-center text-gray-500 text-sm mb-8 break-keep">
          {talkType === 'VOTE' && '오늘 하루, 당신의 멘탈을 가장 흔든 감정은? - "여기에 툭 던져두세요" 🗑️'}
          {talkType === 'Z' && '일상 · 고민 · 운동습관을 나누는 공간 — "그래서 원인이 뭔가요?" 🔍'}
          {talkType === 'M' && '일상 · 고민 · 운동습관을 나누는 공간 — "이거 저만 그래요?" 🙋‍♀️'}
        </p>

        {/* Type Toggle */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 pb-2">
          <button
            onClick={() => setTalkType('VOTE')}
            className={`relative whitespace-nowrap px-5 py-2 rounded-full font-bold transition-all shrink-0 flex flex-col items-center justify-center leading-tight ${
              talkType === 'VOTE' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 shadow-md' : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <span className="text-[13px] md:text-sm">🗑️ 오늘의 감정 쓰레기통</span>
            <span className="text-[10px] md:text-[11px] font-medium opacity-80 mt-0.5">매일 비움</span>
            {showVoteDot && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setTalkType('Z')}
            className={`whitespace-nowrap px-5 py-2 rounded-full font-bold transition-all shrink-0 flex flex-col items-center justify-center leading-tight ${
              talkType === 'Z' ? 'bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-md' : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <span className="text-[13px] md:text-sm">🥊 팩트로 해답 얻기</span>
            <span className="text-[10px] md:text-[11px] font-medium opacity-80 mt-0.5">팩트 직구</span>
          </button>
          <button
            onClick={() => setTalkType('M')}
            className={`whitespace-nowrap px-5 py-2 rounded-full font-bold transition-all shrink-0 flex flex-col items-center justify-center leading-tight ${
              talkType === 'M' ? 'bg-pink-100 text-pink-700 border-2 border-pink-200 shadow-md' : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <span className="text-[13px] md:text-sm">🔥 따뜻한 위로 받기</span>
            <span className="text-[10px] md:text-[11px] font-medium opacity-80 mt-0.5">폭풍 공감</span>
          </button>
        </div>

        {/* VOTE 탭 전용 화면 분기 */}
        {talkType === 'VOTE' && (
          <div className="mb-8">
            {emotionStep === 'select' && (
              <div className="fade-in">
                <h3 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-6">오늘 하루, 업무/공부 중에 당신의 멘탈을 가장 흔든 감정은 무엇인가요?</h3>
                <div className="flex flex-col gap-3">
                  {EMOTIONS.map(emotion => (
                    <button
                      key={emotion.id}
                      onClick={() => handleSelectEmotion(emotion.id)}
                      className="flex items-center gap-4 bg-white p-4 md:p-5 rounded-2xl border-2 border-gray-200 hover:border-black transition-all group text-left shadow-sm hover:shadow-md"
                    >
                      <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">{emotion.icon}</span>
                      <div>
                        <h4 className="font-bold text-lg md:text-xl text-gray-900 mb-1">{emotion.name}</h4>
                        <p className="text-sm md:text-base text-gray-500 break-keep">{emotion.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {emotionStep === 'loading' && (
              <div className="fade-in flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 md:w-20 md:h-20 mb-6 relative">
                  {getCharImage(bmtiCode) ? (
                    <img src={getCharImage(bmtiCode)} alt="AI" className={`w-full h-full object-contain animate-bounce ${getCharScale(bmtiCode)}`} />
                  ) : (
                    <div className="text-5xl animate-bounce">🤖</div>
                  )}
                </div>
                <p className="text-base md:text-lg font-bold text-gray-600 flex items-center gap-1">
                  나를 대변하는 BMTI 캐릭터의 대답<span className="animate-pulse">...</span>
                </p>
              </div>
            )}
            
            {emotionStep === 'result' && (
              <div className="fade-in">
                {/* AI Response Box (Chat UI) */}
                <div className="mb-8 px-2">
                  <div className="flex gap-3">
                    {/* Profile Image */}
                    <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 relative flex items-center justify-center">
                      {getCharImage(bmtiCode) ? (
                        <img src={getCharImage(bmtiCode)} alt="AI" className={`w-full h-full object-contain ${getCharScale(bmtiCode)}`} />
                      ) : (
                        <span className="text-xl">🤖</span>
                      )}
                    </div>
                    {/* Chat Content */}
                    <div className="flex flex-col flex-1 max-w-[85%]">
                      {/* Name / ID */}
                      <span className="text-xs md:text-sm font-bold text-gray-700 mb-1.5 ml-1">
                        {bmtiCode ? bmtiCode : 'BMTI-AI'}
                      </span>
                      {/* Bubble */}
                      <div className="bg-white border border-gray-200 text-gray-800 text-sm md:text-base leading-relaxed break-keep p-3.5 md:p-4 rounded-2xl rounded-tl-sm shadow-sm relative">
                        {EMOTIONS.find(e => e.id === selectedEmotion)?.aiResponse}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Board Title */}
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 text-center break-keep px-4">
                  {EMOTIONS.find(e => e.id === selectedEmotion)?.boardTitle}
                </h3>
              </div>
            )}
          </div>
        )}

        {/* Sort Tabs & Posts (VOTE 탭은 result 상태일 때만 노출) */}
        {!(talkType === 'VOTE' && emotionStep !== 'result') && (
          <>
            {/* Sort Tabs */}
            <div className="flex gap-2 mb-6">
              {['latest', 'popular', 'comments'].map(s => (
                <button
                  key={s}
                  onClick={() => setTalkSort(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    talkSort === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s === 'latest' ? '🕐 최신글' : s === 'popular' ? '🔥 인기글' : '💬 댓글순'}
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="flex flex-col gap-4">
              {getSortedPosts(
                talkType === 'VOTE' ? posts.VOTE.filter(p => p.emotionId === selectedEmotion) : posts[talkType]
              ).map(post => {
                const isExpanded = expandedId === post.id;
                const isLiked = likedPosts[post.id];
                return (
                  <div key={post.id} className="border border-gray-100 rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-md">
                    {/* Post Header */}
                    <div className="p-5 md:p-6 cursor-pointer" onClick={() => toggleExpand(post.id)}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          post.tag === '일상' ? 'bg-yellow-100 text-yellow-700' :
                          post.tag === '고민' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>{post.tag}</span>
                        {isLoggedIn && (post.author === myNickname || isAdmin) && (
                          <button
                            onClick={(e) => handleDeletePost(post.id, e)}
                            className="text-[11px] text-gray-400 hover:text-red-500 font-bold transition-colors px-2 py-1"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                      <p className={`text-sm md:text-base text-gray-800 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>{post.body}</p>
                  


                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <AuthorBadge author={post.author} bmti={post.bmti} isPremium={post.isPremium || (post.author === myNickname && userProfile?.isPremium)} />
                      <span className="text-[11px] text-gray-400">{post.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                        className={`flex items-center gap-1 transition-all ${isLiked ? 'text-red-500 scale-110' : 'hover:text-red-400'}`}
                      >
                        {isLiked ? '❤️' : '🤍'} {post.likes + (isLiked ? 1 : 0)}
                      </button>
                      <span className="flex items-center gap-1">💬 {post.comments.length}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded: Comments */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6 fade-in">
                    {post.comments.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요! ✍️</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {post.comments.map(comment => (
                          <div key={comment.id}>
                            {/* Comment */}
                            <div className="flex gap-3 justify-between items-start">
                              <div className="flex gap-3">
                                <AuthorBadge author={comment.author} bmti={comment.bmti} size="sm" isPremium={comment.isPremium || (comment.author === myNickname && userProfile?.isPremium)} />
                                <span className="text-[11px] text-gray-400 mt-0.5">{comment.date}</span>
                              </div>
                              {isLoggedIn && (comment.author === myNickname || isAdmin) && (
                                <button
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="text-[10px] text-gray-400 hover:text-red-500 font-bold transition-colors"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-1.5 ml-0.5">{comment.text}</p>
                            <button
                              onClick={() => setShowReplyFor(showReplyFor === `${post.id}-${comment.id}` ? null : `${post.id}-${comment.id}`)}
                              className="text-[11px] text-gray-400 hover:text-gray-600 mt-1.5 ml-0.5 font-medium"
                            >
                              답글 달기
                            </button>

                            {/* Replies */}
                            {comment.replies.length > 0 && (
                              <div className="ml-6 mt-3 flex flex-col gap-3 border-l-2 border-gray-200 pl-4">
                                {comment.replies.map(reply => (
                                  <div key={reply.id}>
                                    <div className="flex gap-3 justify-between items-start">
                                      <div className="flex gap-3">
                                        <AuthorBadge author={reply.author} bmti={reply.bmti} size="sm" isPremium={reply.isPremium || (reply.author === myNickname && userProfile?.isPremium)} />
                                        <span className="text-[10px] text-gray-400 mt-0.5">{reply.date}</span>
                                      </div>
                                      {isLoggedIn && (reply.author === myNickname || isAdmin) && (
                                        <button
                                          onClick={() => handleDeleteReply(post.id, comment.id, reply.id)}
                                          className="text-[10px] text-gray-400 hover:text-red-500 font-bold transition-colors"
                                        >
                                          삭제
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 ml-0.5">{reply.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input */}
                            {showReplyFor === `${post.id}-${comment.id}` && isLoggedIn && (
                              <div className="ml-6 mt-2 flex gap-2 fade-in">
                                {getCharImage(bmtiCode) && (
                                  <img src={getCharImage(bmtiCode)} alt="" className={`w-8 h-8 object-contain ${getCharScale(bmtiCode)} mt-0.5 shrink-0`} />
                                )}
                                <input
                                  type="text"
                                  placeholder="답글을 입력하세요..."
                                  value={replyInputs[`${post.id}-${comment.id}`] || ''}
                                  onChange={(e) => setReplyInputs(prev => ({ ...prev, [`${post.id}-${comment.id}`]: e.target.value }))}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply(post.id, comment.id)}
                                  className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs outline-none focus:border-gray-400 transition-colors"
                                />
                                <button
                                  onClick={() => handleSubmitReply(post.id, comment.id)}
                                  className="bg-black text-white px-3 py-1.5 rounded-full text-[11px] font-bold hover:bg-gray-800 transition-colors shrink-0"
                                >
                                  등록
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Comment Input */}
                    {isLoggedIn && (
                      <div className="mt-4 flex gap-2 items-center">
                        {getCharImage(bmtiCode) && (
                          <img src={getCharImage(bmtiCode)} alt="" className={`w-10 h-10 object-contain ${getCharScale(bmtiCode)} shrink-0`} />
                        )}
                        <input
                          type="text"
                          placeholder="댓글을 입력하세요..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                          className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
                        />
                        <button
                          onClick={() => handleSubmitComment(post.id)}
                          className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors shrink-0"
                        >
                          등록
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!(talkType === 'VOTE' && emotionStep !== 'result') && (
          <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none flex justify-center z-40 fade-in">
            <button
              onClick={handleWriteClick}
              className="pointer-events-auto bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-xl shadow-black/20 hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300"
            >
              {talkType === 'VOTE' ? getWriteButtonText(selectedEmotion) : talkType === 'Z' ? '팩트로 해답 얻기' : '따뜻한 위로 받기'}
            </button>
          </div>
        )}
          </>
        )}


      </div>

      {/* ===== Write Modal ===== */}
      {showWriteModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowWriteModal(false)}>
          <div
            className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl p-6 md:p-8 shadow-2xl animate-[slideUp_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {talkType === 'VOTE' ? '💬 감정 기록 남기기' : talkType === 'Z' ? '💬 팩트 직구 쓰기' : '💬 따뜻한 이야기 쓰기'}
              </h3>
              <button onClick={() => setShowWriteModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            {/* Author Preview */}
            <div className="mb-5">
              <AuthorBadge author={myNickname} bmti={myBmti} isPremium={userProfile?.isPremium} />
            </div>

            {/* Category Selection */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 mb-2">카테고리</p>
              <div className="flex gap-2">
                {['운동습관', '일상', '고민'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setWriteTag(tag)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      writeTag === tag
                        ? tag === '운동습관' ? 'bg-green-100 text-green-700 border-2 border-green-200'
                        : tag === '일상' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200'
                        : 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                        : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <textarea
                rows="4"
                placeholder="자유롭게 이야기를 나눠보세요..."
                value={writeContent}
                onChange={(e) => setWriteContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors resize-none leading-relaxed"
                autoFocus
              ></textarea>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitPost}
              disabled={!writeContent.trim()}
              className={`w-full font-bold py-4 rounded-xl transition-all ${
                writeContent.trim()
                  ? 'bg-black text-white shadow-md hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              게시하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardView;
