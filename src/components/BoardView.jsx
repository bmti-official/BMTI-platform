import { useState } from 'react';

// ===== Mock Data =====
const TALK_POSTS = {
  Z: [
    { id: 1, title: "운동 전 스트레칭 5분이면 충분하다고요? 팩트체크 해봤습니다", body: "논문 기반으로 정리했어요. 동적 스트레칭 5분 vs 정적 스트레칭 10분, 부상률 차이는 거의 없더라고요. 핵심은 관절 가동 범위 확보!", author: "효율갑러너", date: "10분 전", likes: 24, tag: "운동습관", comments: [
      { id: 1, author: "근거중시녀", text: "오 논문 출처 좀 공유해주세요!", date: "8분 전", replies: [
        { id: 1, author: "효율갑러너", text: "ACSM 2024 가이드라인이에요! 검색하면 바로 나와요", date: "5분 전" }
      ]},
      { id: 2, author: "스트레칭러버", text: "저도 동적 스트레칭만 하는데 부상 전혀 없어요", date: "3분 전", replies: [] }
    ]},
    { id: 2, title: "체지방 측정, 인바디 vs 줄자 — 어떤 게 더 정확할까?", body: "매주 인바디 찍는 분들 많은데, 사실 줄자로 허리-엉덩이 비율만 재도 체형 변화 추적엔 충분해요.", author: "데이터운동러", date: "1시간 전", likes: 31, tag: "일상", comments: [
      { id: 1, author: "인바디매니아", text: "줄자는 측정 오차가 크지 않나요?", date: "40분 전", replies: [] }
    ]},
    { id: 3, title: "단백질 보충 타이밍, 운동 직후가 아니어도 됩니다", body: "골든타임 신화는 과장됐어요. 하루 총 섭취량이 핵심이라는 연구 결과들이 계속 나오고 있습니다.", author: "팩트폭격기", date: "3시간 전", likes: 45, tag: "운동습관", comments: [] }
  ],
  M: [
    { id: 4, title: "오늘도 헬스장 앞에서 10분 고민하다 결국 들어감 🥹", body: "가기 싫어서 차에서 10분 앉아있다가... 들어가니까 역시 기분 좋아지더라. 이거 저만 그래요?", author: "소심한근육", date: "5분 전", likes: 89, tag: "일상", comments: [
      { id: 1, author: "공감100배", text: "ㅋㅋㅋ 저도요!! 주차장에서 유튜브 보다가 결국 들어가요", date: "3분 전", replies: [
        { id: 1, author: "소심한근육", text: "아 진짜요?? 동지다 ㅋㅋㅋ", date: "2분 전" },
        { id: 2, author: "운동왕언니", text: "저는 문 앞에서 돌아간 적도 있어요... 😂", date: "1분 전" }
      ]},
      { id: 2, author: "따뜻한맘", text: "들어간 거 자체가 대단해요!! 👏", date: "2분 전", replies: [] }
    ]},
    { id: 5, title: "다이어트 정체기 3주째... 체중은 안 빠지는데 치킨은 생각나고 😭", body: "진짜 너무 우울해요. 열심히 하는데 왜 안 빠지는 걸까요 ㅠㅠ 다들 정체기 어떻게 버텼어요?", author: "포기하면편해", date: "2시간 전", likes: 67, tag: "고민", comments: [
      { id: 1, author: "정체기극복녀", text: "저는 체중 말고 인바디 근육량 보기 시작했더니 마음이 편해졌어요!", date: "1시간 전", replies: [] }
    ]},
    { id: 6, title: "같이 러닝할 사람 구해요! 초보 대환영 🏃‍♀️", body: "혼자 뛰니까 너무 외로워요... 주 2~3회 한강공원에서 5km 같이 뛰실 분!", author: "다같이화이팅", date: "4시간 전", likes: 34, tag: "일상", comments: [] }
  ]
};

const TIP_POSTS = {
  Q: [
    { id: 1, title: "Q. 스쿼트할 때 무릎이 발끝을 넘어가면 안 되는 원리가 뭔가요?", body: "항상 무릎 발끝 안 넘기라고 하는데, 해부학적으로 왜 그런 건지 궁금합니다.", author: "원리탐구녀", date: "오늘", tag: "하체", answered: true, answer: { author: "🏋️ BMTI 가이드", text: "실제로는 무릎이 발끝을 약간 넘어가도 괜찮습니다. 중요한 건 무게중심이 발 중앙에 있는지, 그리고 고관절이 충분히 접히는지예요. 무릎을 억지로 안 넘기려다 오히려 허리에 부담이 갈 수 있어요." }},
    { id: 2, title: "Q. 유산소를 먼저 하면 근손실이 생기는 과학적 근거가 있나요?", body: "무조건 근력운동 먼저 하라는데, 왜 그런지 원리가 궁금해요.", author: "이론파운동러", date: "어제", tag: "전신", answered: true, answer: { author: "🏋️ BMTI 가이드", text: "유산소를 먼저 하면 글리코겐이 소모되어 근력운동 시 최대 출력이 떨어집니다. 하지만 목표가 체지방 감소라면 유산소 먼저가 더 효과적일 수 있어요. 본인의 목표에 맞게 선택하세요!" }},
    { id: 3, title: "Q. 근육통이 있어야 운동이 잘 된 건가요?", body: "운동 다음날 근육통이 없으면 효과가 없는 건지 궁금합니다.", author: "궁금한초보", date: "2일 전", tag: "전신", answered: false, answer: null }
  ],
  D: [
    { id: 4, title: "D. 랫풀다운 할 때 팔뚝에만 자극이 오는데 정상인가요?", body: "등에 와야 한다고 하는데 아무리 해도 팔뚝만 뻐근해요 ㅠㅠ", author: "등운동고민녀", date: "오늘", tag: "상체", answered: true, answer: { author: "🏋️ BMTI 가이드", text: "팔에 자극이 오는 건 그립을 너무 꽉 쥐고 있기 때문이에요. 엄지를 바 위에 걸치는 '썸리스 그립'을 써보세요. 그리고 팔꿈치를 옆구리 쪽으로 당긴다는 느낌으로 하시면 등 자극이 확 올라요!" }},
    { id: 5, title: "D. 플랭크 30초만에 허리가 먼저 아파요 — 어디가 잘못된 걸까요?", body: "코어 운동인데 허리에 통증이 오면 자세가 잘못된 건가요?", author: "코어초보", date: "어제", tag: "코어", answered: true, answer: { author: "🏋️ BMTI 가이드", text: "골반이 앞으로 빠지면서(전방경사) 허리에 부담이 가는 전형적인 케이스예요. 꼬리뼈를 살짝 말아 넣고, 배꼽을 척추 쪽으로 당긴다는 느낌으로 코어를 조여주세요." }},
    { id: 6, title: "D. 런지할 때 앞쪽 허벅지만 타는데 엉덩이에는 어떻게 넣죠?", body: "대퇴사두에만 자극이 오고 글루트에는 아무 느낌이 없어요.", author: "런지고민", date: "3일 전", tag: "하체", answered: false, answer: null }
  ]
};

const BoardView = ({ isLoggedIn, onRequireLogin }) => {
  const [activeTab, setActiveTab] = useState('talk');
  const [talkType, setTalkType] = useState('M');
  const [tipType, setTipType] = useState('Q');
  const [talkSort, setTalkSort] = useState('latest');
  const [expandedId, setExpandedId] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});

  const toggleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleExpand = (postId) => {
    setExpandedId(expandedId === postId ? null : postId);
  };

  const getSortedPosts = (posts) => {
    if (talkSort === 'popular') {
      return [...posts].sort((a, b) => b.likes - a.likes);
    }
    if (talkSort === 'comments') {
      return [...posts].sort((a, b) => b.comments.length - a.comments.length);
    }
    return posts;
  };

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      alert("카카오톡 간편 로그인이 필요합니다.");
      if (onRequireLogin) onRequireLogin();
      return;
    }
    // If logged in, maybe show a write modal or alert
    alert("게시글 작성 기능은 곧 오픈됩니다!");
  };

  return (
    <div className="min-h-screen pt-32 px-4 md:px-6 max-w-4xl mx-auto pb-24 fade-in">
      {/* Main Tabs removed */}

      {/* ===== 과몰입 톡톡 ===== */}
      {activeTab === 'talk' && (
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
            <button
              onClick={() => setTalkSort('latest')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                talkSort === 'latest' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              🕐 최신글
            </button>
            <button
              onClick={() => setTalkSort('popular')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                talkSort === 'popular' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              🔥 인기글
            </button>
            <button
              onClick={() => setTalkSort('comments')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                talkSort === 'comments' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              💬 댓글순
            </button>
          </div>

          {/* Posts */}
          <div className="flex flex-col gap-4">
            {getSortedPosts(TALK_POSTS[talkType]).map(post => {
              const isExpanded = expandedId === post.id;
              const isLiked = likedPosts[post.id];
              return (
                <div key={post.id} className="border border-gray-100 rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-md">
                  {/* Post Header */}
                  <div className="p-5 md:p-6 cursor-pointer" onClick={() => toggleExpand(post.id)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        post.tag === '일상' ? 'bg-yellow-100 text-yellow-700' :
                        post.tag === '고민' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>{post.tag}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold mb-2 leading-snug">{post.title}</h3>
                    <p className={`text-sm text-gray-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>{post.body}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-xs text-gray-500 gap-3">
                        <span className={`font-bold ${talkType === 'Z' ? 'text-blue-600' : 'text-pink-500'}`}>{post.author}</span>
                        <span>{post.date}</span>
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
                              <div className="flex gap-3">
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                                  {comment.author[0]}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold">{comment.author}</span>
                                    <span className="text-[11px] text-gray-400">{comment.date}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.text}</p>
                                </div>
                              </div>
                              {/* Replies */}
                              {comment.replies.length > 0 && (
                                <div className="ml-10 mt-3 flex flex-col gap-3 border-l-2 border-gray-200 pl-4">
                                  {comment.replies.map(reply => (
                                    <div key={reply.id} className="flex gap-3">
                                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 mt-0.5">
                                        {reply.author[0]}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="text-xs font-bold">{reply.author}</span>
                                          <span className="text-[10px] text-gray-400">{reply.date}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">{reply.text}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Comment Input */}
                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          placeholder="댓글을 입력하세요..."
                          className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
                        />
                        <button className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors flex-shrink-0">
                          등록
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none flex justify-center z-40 fade-in">
            <button 
              onClick={handleWriteClick}
              className="pointer-events-auto bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-xl shadow-black/20 hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300"
            >
              {talkType === 'Z' ? '팩트로 해답 얻기' : '따뜻한 위로 받기'}
            </button>
          </div>
        </div>
      )}

      {/* Tips section removed */}
    </div>
  );
};

export default BoardView;
