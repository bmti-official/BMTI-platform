/* eslint-disable */
import { useState, useEffect } from 'react';
import { getArchives } from '../lib/chatSystem';
import { CHARACTERS } from '../data';

const ChatHistoryView = ({ setView }) => {
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);

  useEffect(() => {
    setArchives(getArchives());
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 flex-shrink-0 z-10 pt-safe">
        <div className="h-14 flex items-center px-4 relative">
          <button 
            onClick={() => {
              if (selectedArchive) setSelectedArchive(null);
              else setView('aichat_room');
            }}
            className="p-2 -ml-2 text-gray-500 hover:text-black absolute left-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="font-bold text-gray-900 text-base w-full text-center">
            {selectedArchive ? `${formatDate(selectedArchive.chatDate)} 대화 기록` : '이전 대화 기록'}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedArchive ? (
          <div className="p-4 space-y-4">
            <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100 mb-6">
              <span className="text-2xl block mb-1">💡</span>
              <p className="text-xs text-amber-800 font-medium">이전 대화 기록은 7일 후 자동으로 삭제됩니다.</p>
            </div>

            {archives.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl block mb-4 text-gray-300">📁</span>
                <p className="text-sm text-gray-500">최근 7일간의 대화 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {archives.map(archive => (
                  <button
                    key={archive.id}
                    onClick={() => setSelectedArchive(archive)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${archive.roomType === 'group' ? 'bg-purple-50 border border-purple-100' : 'bg-[#c0ff00]/10 border border-[#9BB31B]/20'}`}>
                      <span className="text-xl">{archive.roomType === 'group' ? '👥' : '💬'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm">
                        {archive.roomType === 'group' ? '단톡방 대화' : '1:1 코칭 대화'}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(archive.chatDate)} · 메시지 {archive.messages.length}개</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {selectedArchive.messages.map((msg, idx) => {
              const isMe = msg.sender === 'user' || msg.senderType === 'user';
              const isSystem = msg.sender === 'system' || msg.senderType === 'system';
              
              if (isSystem) {
                return (
                  <div key={msg.id || idx} className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl text-[10px] text-center border border-gray-200 my-4 max-w-xs mx-auto">
                    {msg.content}
                  </div>
                );
              }

              return (
                <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && selectedArchive.roomType === 'group' && (
                    <span className="text-[10px] text-gray-500 ml-10 mb-1 font-medium">
                      {msg.senderName}
                    </span>
                  )}
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200 overflow-hidden mb-1">
                        {selectedArchive.roomType === 'group' && msg.bmti_character ? (
                          <img src={CHARACTERS.find(c => c.id === msg.bmti_character)?.image} className="w-full h-full object-contain scale-110" alt="" />
                        ) : (
                          <span className="text-xs">👤</span>
                        )}
                      </div>
                    )}
                    
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm opacity-80 ${
                      isMe 
                        ? 'bg-black text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="text-center pt-8 pb-4">
              <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full">대화 기록 끝</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryView;
