/* eslint-disable */
import React from 'react';

// 문의(Contact) — 이용자·심사자가 연락처를 쉽게 찾을 수 있는 문의 페이지.
const ContactModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const Row = ({ label, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="w-full sm:w-28 shrink-0 text-xs font-bold text-gray-400">{label}</span>
      <span className="text-sm text-gray-700 break-keep">{children}</span>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
          <h3 className="font-bold text-lg text-gray-900">문의하기</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto hide-scrollbar">
          <p className="text-sm text-gray-600 break-keep mb-4 leading-relaxed">
            서비스 이용·제휴·광고 관련 문의는 아래로 연락 주세요. <strong>카카오톡 채널이 가장 빠르게 답변</strong> 드릴 수 있어요.
          </p>
          <div className="bg-white rounded-xl border border-gray-100 px-4">
            <Row label="카카오톡 채널">
              <a href="http://pf.kakao.com/_xasxgZX/chat" target="_blank" rel="noopener noreferrer" className="text-[#8B7BD8] font-bold underline underline-offset-2">[@자기점검 50분] 1:1 채팅</a>
            </Row>
            <Row label="전화">070-8027-8648</Row>
            <Row label="운영 시간">평일 오전 10시 ~ 오후 6시 (주말·공휴일 휴무)</Row>
            <Row label="사업장 주소">서울특별시 강남구 압구정로2길 46, 214-S117호(신사동)</Row>
            <Row label="대표자 / 사업자번호">이응준 / 877-04-03614</Row>
          </div>
          <p className="text-[11px] text-gray-400 break-keep mt-4 leading-relaxed">
            전화는 통화량이 많아 연결이 어려울 수 있어요. 빠른 답변이 필요하시면 카카오톡 채널을 이용해 주세요.
          </p>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0">
          <button onClick={onClose} className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">확인</button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
