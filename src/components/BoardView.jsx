import { useState } from 'react';
import { BOARD_DATA } from '../data';

const BoardView = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatType, setChatType] = useState('Z');

  return (
    <div className="min-h-screen pt-32 px-6 max-w-4xl mx-auto pb-24 fade-in">
      {/* Header/Tabs */}
      <div className="flex items-end gap-6 border-b border-gray-200 mb-10 pb-4">
        <button
          onClick={() => setActiveTab('chat')}
          className={`font-black transition-all ${
            activeTab === 'chat' ? 'text-4xl md:text-5xl text-black' : 'text-3xl md:text-4xl text-gray-400 hover:text-gray-700'
          }`}
        >
          BMTI 소통방
        </button>
        <button
          onClick={() => setActiveTab('qna')}
          className={`font-medium pb-1 md:pb-2 transition-all ${
            activeTab === 'qna' ? 'text-xl md:text-2xl text-black border-b-2 border-black' : 'text-base md:text-lg text-gray-400 hover:text-gray-700'
          }`}
        >
          QnA
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col gap-4">
        {activeTab === 'chat' && (
          <div className="fade-in">
            <div className="flex justify-center gap-6 mb-10">
              <button
                onClick={() => setChatType('Z')}
                className={`px-8 py-3 rounded-full font-bold text-lg transition-all ${
                  chatType === 'Z' ? 'bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-md scale-105' : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                팩트형(Z)
              </button>
              <button
                onClick={() => setChatType('M')}
                className={`px-8 py-3 rounded-full font-bold text-lg transition-all ${
                  chatType === 'M' ? 'bg-pink-100 text-pink-700 border-2 border-pink-200 shadow-md scale-105' : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                공감형(M)
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {BOARD_DATA.chat[chatType].map(post => (
                <div key={post.id} className="p-6 border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white">
                  <h3 className="text-lg md:text-xl font-medium mb-3">{post.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 gap-4">
                    <span className={`font-bold ${chatType === 'Z' ? 'text-blue-600' : 'text-pink-500'}`}>{post.author}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'qna' && (
          <div>
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-center text-gray-600 font-medium">
              💡 {BOARD_DATA.qna.description}
            </div>
            <div className="flex flex-col gap-4">
              {BOARD_DATA.qna.posts.map(post => (
                <div key={post.id} className="p-6 border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white">
                  <h3 className="text-lg md:text-xl font-medium mb-3">{post.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 gap-4">
                    <span className="font-medium text-gray-700">{post.author}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button id="write-post" className="bg-black text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
          글쓰기
        </button>
      </div>
    </div>
  );
};

export default BoardView;
