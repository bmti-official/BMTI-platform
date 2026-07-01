/* eslint-disable */
import React from 'react';

const BodyCheckView = () => {
  return (
    <div className="min-h-screen pt-40 md:pt-48 pb-32 px-6 max-w-4xl mx-auto fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">☘️ 무브먼트 라이브 예약</h2>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto break-keep leading-relaxed text-sm md:text-base">
          원격으로 체형을 점검하고 맞춤형 피드백을 받아보세요. 예약하신 시간에 구글 미트로 진행됩니다.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-gray-100 max-w-2xl mx-auto flex flex-col items-center">
        {/* Placeholder for Naver Booking iFrame or link */}
        <div className="w-full aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center mb-8 p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">네이버 간편 예약 시스템</h3>
          <p className="text-sm text-gray-400 text-center">여기에 네이버 예약창이 연동될 예정입니다.</p>
        </div>

        <div className="w-full bg-gray-50 rounded-2xl p-6 md:p-8">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-black text-[#c0ff00] flex items-center justify-center text-xs">i</span>
            진행 안내
          </h4>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="shrink-0 text-gray-400 font-bold">1.</span>
              <span className="break-keep">위 네이버 예약을 통해 원하시는 날짜와 시간을 선택해 주세요.</span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-gray-400 font-bold">2.</span>
              <span className="break-keep">예약이 확정되면 <b>구글 미트(Google Meet)</b> 접속 링크가 전달됩니다.</span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-gray-400 font-bold">3.</span>
              <span className="break-keep">예약 시간에 맞춰 편안한 복장으로 카메라 세팅 후 접속해 주세요.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BodyCheckView;
