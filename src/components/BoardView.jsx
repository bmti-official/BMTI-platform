import { useState } from 'react';
import { BOARD_DATA } from '../data';

const BoardView = () => {
  const [activeTab, setActiveTab] = useState('lounge');
  const tabs = [
    { id: 'lounge', label: 'BMTI 라운지' },
    { id: 'challenge', label: '챌린지' },
    { id: 'qna', label: 'QnA' }
  ];

  return (
    <div className="min-h-screen pt-32 px-6 max-w-4xl mx-auto pb-24 fade-in">
      <h1 className="text-4xl font-serif mb-12 text-center">Community</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`board-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-4 text-lg font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-b-2 border-black text-black'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Post List */}
      <div className="flex flex-col gap-4">
        {BOARD_DATA[activeTab].map(post => (
          <div key={post.id} className="p-6 border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer bg-white">
            <h3 className="text-xl font-medium mb-3">{post.title}</h3>
            <div className="flex items-center text-sm text-gray-500 gap-4">
              <span className="font-medium text-gray-700">{post.author}</span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
          </div>
        ))}
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
