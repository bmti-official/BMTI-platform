import { useState, useEffect } from 'react';
import { CHARACTERS } from '../data';
import { supabase } from '../lib/supabaseClient';

// Helper: format a post/comment date without seconds
const formatDate = (isoString) => new Date(isoString).toLocaleString(undefined, {
  year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit'
});

// 인기글 정렬용 시간감쇠 스코어 — 좋아요가 아무리 쌓여도 오래된 글이 계속
// 상위권을 독점하지 않도록, 경과 시간이 늘어날수록 점수를 지수적으로 깎는다.
// (레딧 hot 랭킹과 같은 방식: score = likes / (경과시간(h) + 2)^1.5)
const getHotScore = (post) => {
  const hoursElapsed = (Date.now() - post.createdAt) / (1000 * 60 * 60);
  return post.likes / Math.pow(hoursElapsed + 2, 1.5);
};

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


// Author badge component
const AuthorBadge = ({ author, bmti, size = 'md', isAi = false, date }) => {
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
            {isAi && <span className="mr-1 text-[10px] bg-gray-700 text-white px-1.5 py-0.5 rounded-md">AI</span>}
            {author}
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
        {date && <span className="text-[10px] text-gray-400 mt-0.5">{date}</span>}
      </div>
    </div>
  );
};

const BoardView = ({ isLoggedIn, onRequireLogin, userProfile, bmtiCode }) => {
  const [talkType, setTalkType] = useState(() => {
    if (bmtiCode && bmtiCode.includes('M')) return 'M';
    return 'Z';
  });
  const [talkSort, setTalkSort] = useState('latest');
  const [expandedId, setExpandedId] = useState(null);
  const [posts, setPosts] = useState({ Z: [], M: [] });
  const [isFetching, setIsFetching] = useState(false);

  const fetchPosts = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, category, tab_type, created_at,
          users ( id, nickname, bmti_type, is_ai ),
          comments (
            id, content, created_at, parent_id,
            users ( id, nickname, bmti_type, is_ai )
          ),
          post_likes ( user_id )
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
          isAi: !!c.users?.is_ai,
          text: c.content,
          date: formatDate(c.created_at),
          replies: post.comments
            .filter(r => r.parent_id === c.id)
            .map(r => ({
              id: r.id,
              author: r.users?.nickname || '익명',
              bmti: r.users?.bmti_type,
              isAi: !!r.users?.is_ai,
              text: r.content,
              date: formatDate(r.created_at),
            }))
        }));

        return {
          id: post.id,
          body: post.content,
          author: post.users?.nickname || '익명',
          bmti: post.users?.bmti_type,
          isAi: !!post.users?.is_ai,
          date: formatDate(post.created_at),
          createdAt: new Date(post.created_at).getTime(),
          likes: post.post_likes?.length || 0,
          likedByMe: !!userProfile?.id && (post.post_likes || []).some(l => l.user_id === userProfile.id),
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
  }, [talkType, userProfile?.id]);

  // 탭을 한 번이라도 확인하면 그날은 네비게이션 바의 빨강 점을 없앤다.
  // (Navbar.jsx가 읽는 키/이벤트와 반드시 맞춰야 한다.)
  useEffect(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    localStorage.setItem('last_vote_date', todayStr);
    window.dispatchEvent(new Event('vote_updated'));
  }, []);

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeContent, setWriteContent] = useState('');
  const [writeTag, setWriteTag] = useState('일상');
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);

  const myNickname = userProfile?.nickname || '익명';
  const isAdmin = myNickname === 'BMTI';
  const myBmti = bmtiCode?.split('-')[0] || '';

  const toggleLike = async (postId) => {
    if (!userProfile?.id) {
      alert('다시 로그인해주세요.');
      return;
    }
    const post = posts[talkType]?.find(p => p.id === postId);
    if (!post) return;

    if (post.likedByMe) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userProfile.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userProfile.id });
    }
    fetchPosts();
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

  const handleDeleteComment = async (postId, commentId) => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      await supabase.from('comments').delete().eq('id', commentId);
      fetchPosts();
    }
  };

  const handleDeleteReply = async (postId, commentId, replyId) => {
    if (window.confirm('정말로 이 답글을 삭제하시겠습니까?')) {
      await supabase.from('comments').delete().eq('id', replyId);
      fetchPosts();
    }
  };

  const getSortedPosts = (list) => {
    if (talkSort === 'popular') return [...list].sort((a, b) => getHotScore(b) - getHotScore(a));
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
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userProfile.id,
          tab_type: talkType,
          category: writeTag,
          content: writeContent.trim()
        });

      if (error) throw error;

      // AI 댓글은 여기서 즉시 부르지 않는다 — ai-board-tick(pg_cron)이 무플 상태가
      // 일정 시간 지속될 때만 나중에 하나 달아준다 (AI가 항상 먼저 반응하지 않도록).

      alert('게시글이 등록되었습니다.');

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

      alert('댓글이 등록되었습니다.');

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

      alert('답글이 등록되었습니다.');

      setReplyInputs(prev => ({ ...prev, [key]: '' }));
      setShowReplyFor(null);
      fetchPosts();
    } catch(e) {
      console.error(e);
    }
  };

  const getWriteButtonText = () => {
    return '💬 글 남기기';
  };

  return (
    <div className="min-h-screen pt-44 px-4 md:px-6 max-w-4xl mx-auto pb-24 fade-in">

      {/* ===== 과몰입 톡톡 ===== */}
      <div className="fade-in">
        {/* Sub-description */}
        <p className="text-center text-gray-500 text-sm mb-8 break-keep">
          {talkType === 'Z' && '일상 · 고민 · 운동습관을 나누는 공간 — "그래서 원인이 뭔가요?" 🔍'}
          {talkType === 'M' && '일상 · 고민 · 운동습관을 나누는 공간 — "이거 저만 그래요?" 🙋‍♀️'}
        </p>

        {/* Type Toggle */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 pb-2">
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
                const isLiked = post.likedByMe;
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
                        {isLoggedIn && (isAdmin || (!post.isAi && post.author === myNickname)) && (
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
                      <AuthorBadge author={post.author} bmti={post.bmti} isAi={post.isAi} date={post.date} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                        className={`flex items-center gap-1 transition-all ${isLiked ? 'text-red-500 scale-110' : 'hover:text-red-400'}`}
                      >
                        {isLiked ? '❤️' : '🤍'} {post.likes}
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
                                <AuthorBadge author={comment.author} bmti={comment.bmti} size="sm" isAi={comment.isAi} date={comment.date} />
                              </div>
                              {isLoggedIn && (isAdmin || (!comment.isAi && comment.author === myNickname)) && (
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
                                        <AuthorBadge author={reply.author} bmti={reply.bmti} size="sm" isAi={reply.isAi} date={reply.date} />
                                      </div>
                                      {isLoggedIn && (isAdmin || (!reply.isAi && reply.author === myNickname)) && (
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
        <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none flex flex-col items-center z-40 fade-in">
          {!isLoggedIn ? (
            <div className="pointer-events-auto flex flex-col items-center">
              <button
                onClick={onRequireLogin}
                className="bg-[#FEE500] text-[#3C1E1E] px-8 py-3.5 rounded-full text-sm font-bold shadow-xl shadow-black/10 hover:bg-[#F4DC00] hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#3C1E1E]">
                  <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.556 1.7 4.8 4.27 6.054-.188.703-.682 2.544-.78 2.936-.122.485.176.478.373.344.154-.103 2.45-1.674 3.447-2.355.54.08 1.103.12 1.69.12 4.97 0 9-3.185 9-7.114C21 6.185 16.97 3 12 3z" />
                </svg>
                {talkType === 'Z' ? '카카오로 10초 해답 얻기' : '카카오로 10초 위로 받기'}
              </button>
              <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1 drop-shadow-md bg-white/70 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                <span>🔕</span> 광고 안 보냄 · 결과만 저장
              </p>
            </div>
          ) : (
            <button
              onClick={handleWriteClick}
              className="pointer-events-auto bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-xl shadow-black/20 hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300"
            >
              {talkType === 'Z' ? '팩트로 해답 얻기' : '따뜻한 위로 받기'}
            </button>
          )}
        </div>
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
              <AuthorBadge author={myNickname} bmti={myBmti} />
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
