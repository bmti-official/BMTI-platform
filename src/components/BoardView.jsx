import { useState } from 'react';
import { CHARACTERS } from '../data';

// Helper: get character image by BMTI code
const getCharImage = (code) => {
  if (!code) return null;
  const axisCode = code.split('-')[0];
  const char = CHARACTERS.find(c => c.id === axisCode);
  return char?.image || null;
};

// ===== Mock Data =====
const INITIAL_POSTS = {
  Z: [
    { id: 1, body: "운동 전 스트레칭 5분이면 충분하다고요? 팩트체크 해봤습니다. 논문 기반으로 정리했어요. 동적 스트레칭 5분 vs 정적 스트레칭 10분, 부상률 차이는 거의 없더라고요. 핵심은 관절 가동 범위 확보!", author: "효율갑러너", bmti: "ACDZ", date: "10분 전", likes: 24, tag: "운동습관", comments: [
      { id: 1, author: "근거중시녀", bmti: "ACQZ", text: "오 논문 출처 좀 공유해주세요!", date: "8분 전", replies: [
        { id: 1, author: "효율갑러너", bmti: "ACDZ", text: "ACSM 2024 가이드라인이에요! 검색하면 바로 나와요", date: "5분 전" }
      ]},
      { id: 2, author: "스트레칭러버", bmti: "OLQM", text: "저도 동적 스트레칭만 하는데 부상 전혀 없어요", date: "3분 전", replies: [] }
    ]},
    { id: 2, body: "체지방 측정, 인바디 vs 줄자 — 어떤 게 더 정확할까? 매주 인바디 찍는 분들 많은데, 사실 줄자로 허리-엉덩이 비율만 재도 체형 변화 추적엔 충분해요.", author: "데이터운동러", bmti: "ALDZ", date: "1시간 전", likes: 31, tag: "일상", comments: [
      { id: 1, author: "인바디매니아", bmti: "OCDM", text: "줄자는 측정 오차가 크지 않나요?", date: "40분 전", replies: [] }
    ]},
    { id: 3, body: "단백질 보충 타이밍, 운동 직후가 아니어도 됩니다. 골든타임 신화는 과장됐어요. 하루 총 섭취량이 핵심이라는 연구 결과들이 계속 나오고 있습니다.", author: "팩트폭격기", bmti: "ACQZ", date: "3시간 전", likes: 45, tag: "운동습관", comments: [] }
  ],
  M: [
    { id: 4, body: "오늘도 헬스장 앞에서 10분 고민하다 결국 들어감 🥹 가기 싫어서 차에서 10분 앉아있다가... 들어가니까 역시 기분 좋아지더라. 이거 저만 그래요?", author: "소심한근육", bmti: "OCDZ", date: "5분 전", likes: 89, tag: "일상", comments: [
      { id: 1, author: "공감100배", bmti: "OLQM", text: "ㅋㅋㅋ 저도요!! 주차장에서 유튜브 보다가 결국 들어가요", date: "3분 전", replies: [
        { id: 1, author: "소심한근육", bmti: "OCDZ", text: "아 진짜요?? 동지다 ㅋㅋㅋ", date: "2분 전" },
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
const AuthorBadge = ({ author, bmti, size = 'md' }) => {
  const img = getCharImage(bmti);
  const s = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const textS = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const codeS = size === 'sm' ? 'text-[9px]' : 'text-[10px]';
  return (
    <div className="flex items-center gap-2">
      {img ? (
        <img src={img} alt={bmti} className={`${s} rounded-full object-contain bg-gray-100 border border-gray-200 p-0.5`} />
      ) : (
        <div className={`${s} rounded-full bg-gray-200 flex items-center justify-center ${textS} font-bold text-gray-500`}>
          {author?.[0]}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <span className={`${textS} font-bold text-gray-800`}>{author}</span>
        {bmti && (
          <span className={`${codeS} font-bold bg-[#c0ff00] px-1.5 py-0.5 rounded-full text-black border border-[#9BB31B]/30`}>
            {bmti}
          </span>
        )}
      </div>
    </div>
  );
};

const BoardView = ({ isLoggedIn, onRequireLogin, userProfile, bmtiCode }) => {
  const [talkType, setTalkType] = useState('M');
  const [talkSort, setTalkSort] = useState('latest');
  const [expandedId, setExpandedId] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeContent, setWriteContent] = useState('');
  const [writeTag, setWriteTag] = useState('일상');
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);

  const myNickname = userProfile?.nickname || '익명';
  const myBmti = bmtiCode?.split('-')[0] || '';

  const toggleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleExpand = (postId) => {
    setExpandedId(expandedId === postId ? null : postId);
  };

  const handleDeletePost = (postId, e) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 글을 삭제하시겠습니까?')) {
      setPosts(prev => ({
        ...prev,
        [talkType]: prev[talkType].filter(p => p.id !== postId)
      }));
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
    setShowWriteModal(true);
  };

  const handleSubmitPost = () => {
    if (!writeContent.trim()) return;
    const newPost = {
      id: Date.now(),
      body: writeContent.trim(),
      author: myNickname,
      bmti: myBmti,
      date: '방금 전',
      likes: 0,
      tag: writeTag,
      comments: []
    };
    setPosts(prev => ({
      ...prev,
      [talkType]: [newPost, ...prev[talkType]]
    }));
    setWriteContent('');
    setWriteTag('일상');
    setShowWriteModal(false);
  };

  const handleSubmitComment = (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setPosts(prev => {
      const updated = { ...prev };
      updated[talkType] = updated[talkType].map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [...p.comments, {
            id: Date.now(),
            author: myNickname,
            bmti: myBmti,
            text,
            date: '방금 전',
            replies: []
          }]
        };
      });
      return updated;
    });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSubmitReply = (postId, commentId) => {
    const key = `${postId}-${commentId}`;
    const text = replyInputs[key]?.trim();
    if (!text) return;
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
              replies: [...c.replies, {
                id: Date.now(),
                author: myNickname,
                bmti: myBmti,
                text,
                date: '방금 전'
              }]
            };
          })
        };
      });
      return updated;
    });
    setReplyInputs(prev => ({ ...prev, [key]: '' }));
    setShowReplyFor(null);
  };

  return (
    <div className="min-h-screen pt-32 px-4 md:px-6 max-w-4xl mx-auto pb-24 fade-in">

      {/* ===== 과몰입 톡톡 ===== */}
      <div className="fade-in">
        {/* Sub-description */}
        <p className="text-center text-gray-500 text-sm mb-8">일상 · 고민 · 운동습관을 나누는 공간 — "이거 저만 그래요?" 🙋‍♀️</p>

        {/* Type Toggle */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setTalkType('Z')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
              talkType === 'Z' ? 'bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-md' : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            팩트형(Z) - 팩트직구
          </button>
          <button
            onClick={() => setTalkType('M')}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
              talkType === 'M' ? 'bg-pink-100 text-pink-700 border-2 border-pink-200 shadow-md' : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            공감형(M) - 폭풍공감
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
          {getSortedPosts(posts[talkType]).map(post => {
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
                    {isLoggedIn && post.author === myNickname && (
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
                      <AuthorBadge author={post.author} bmti={post.bmti} />
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
                                <AuthorBadge author={comment.author} bmti={comment.bmti} size="sm" />
                                <span className="text-[11px] text-gray-400 mt-0.5">{comment.date}</span>
                              </div>
                              {isLoggedIn && comment.author === myNickname && (
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
                                        <AuthorBadge author={reply.author} bmti={reply.bmti} size="sm" />
                                        <span className="text-[10px] text-gray-400 mt-0.5">{reply.date}</span>
                                      </div>
                                      {isLoggedIn && reply.author === myNickname && (
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
                                  <img src={getCharImage(bmtiCode)} alt="" className="w-6 h-6 rounded-full object-contain bg-gray-100 border border-gray-200 p-0.5 mt-0.5 shrink-0" />
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
                          <img src={getCharImage(bmtiCode)} alt="" className="w-7 h-7 rounded-full object-contain bg-gray-100 border border-gray-200 p-0.5 shrink-0" />
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

        {/* Bottom CTA */}
        <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none flex justify-center z-40 fade-in">
          <button
            onClick={handleWriteClick}
            className="pointer-events-auto bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-xl shadow-black/20 hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300"
          >
            {talkType === 'Z' ? '팩트로 해답 얻기' : '따뜻한 위로 받기'}
          </button>
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
                {talkType === 'Z' ? '💬 팩트 직구 쓰기' : '💬 따뜻한 이야기 쓰기'}
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
                rows="5"
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
