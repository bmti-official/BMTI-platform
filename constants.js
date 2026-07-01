FOUND QUIT_REASON_DATA
        </div>

        {/* Custom Quit Reason Section */}
        <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0 text-left">
          <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
            <span className="text-xl">💸</span> 헬스장 기부천사 탈출법
          </h5>
          
          {!isLoggedIn ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[160px] mt-4">
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
              <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <p className="text-[15px] font-bold text-gray-800 mb-5 break-keep">상세 내용을 확인하려면 로그인해주세요</p>
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-[#FEE500] text-black text-sm font-semibold px-6 py-3.5 rounded-full shadow-sm hover:bg-[#F4DC00] transition-colors flex items-center justify-center gap-2"
                >
                  <KakaoIcon className="w-5 h-5" />
                  카카오톡 간편 로그인
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {(() => {
                const quitType = axisCode[0] + axisCode[2];
                const quitData = QUIT_REASON_DATA[quitType] || QUIT_REASON_DATA['OQ'];
                
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#FF6B6B] leading-snug break-keep tracking-tight">
                      {quitData.name}
                    </h3>
                    <div className="flex flex-col gap-5 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">당신의 특징:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{quitData.trait}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">환불 마려운 순간:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{quitData.refund}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">기부천사 탈출법:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{quitData.escape}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
FOUND WORST_VIBE_DATA
        {/* Custom Worst Vibe Section */}
        <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0 text-left">
          <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
            <span className="text-xl">💥</span> 멘탈 바사삭 '최악의 운동 분위기'
          </h5>
          
          {!isLoggedIn ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[160px] mt-4">
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
              <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <p className="text-[15px] font-bold text-gray-800 mb-5 break-keep">상세 내용을 확인하려면 로그인해주세요</p>
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-[#FEE500] text-black text-sm font-semibold px-6 py-3.5 rounded-full shadow-sm hover:bg-[#F4DC00] transition-colors flex items-center justify-center gap-2"
                >
                  <KakaoIcon className="w-5 h-5" />
                  카카오톡 간편 로그인
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {(() => {
                const vibeType = axisCode[0] + axisCode[3];
                const vibeData = WORST_VIBE_DATA[vibeType] || WORST_VIBE_DATA['OM'];
                
                return (
                  <>
                    <h3 className="text-2xl md:text-3xl font-black text-[#FF6B6B] leading-snug break-keep tracking-tight">
                      {vibeData.name}
                    </h3>
                    <div className="flex flex-col gap-5 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">당신의 특징:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{vibeData.trait}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h6 className="font-bold text-gray-900 text-[15px] md:text-base w-max mb-0.5">최악의 분위기:</h6>
                        <p className="text-[15px] md:text-base text-gray-700 leading-relaxed break-keep whitespace-pre-line">{vibeData.worst}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
FOUND BODY_GUIDE_DATA
        </div>
        
        {/* Custom Body Guide Letter Section */}
        <div className="mb-12 last:mb-0 border-b border-gray-100 last:border-0 pb-12 last:pb-0 text-left">
          <h5 className="font-semibold text-sm md:text-base text-gray-500 mb-5 flex items-center gap-2">
            <span className="text-xl">💌</span> 바디 가이드의 따뜻한 시선
          </h5>
          
          {!isLoggedIn ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[160px] mt-4">
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
              <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <p className="text-[15px] font-bold text-gray-800 mb-5 break-keep">상세 내용을 확인하려면 로그인해주세요</p>
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full bg-[#FEE500] text-black text-sm font-semibold px-6 py-3.5 rounded-full shadow-sm hover:bg-[#F4DC00] transition-colors flex items-center justify-center gap-2"
                >
                  <KakaoIcon className="w-5 h-5" />
                  카카오톡 간편 로그인
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col bg-[#FDFBF7] border border-[#F0EBE1] rounded-2xl md:rounded-[2rem] p-6 md:p-8 relative mt-4">
              {/* Decorative Letter Elements */}
              <div className="absolute top-4 right-4 text-2xl opacity-50">✍️</div>
              
              {(() => {
                const guideData = BODY_GUIDE_DATA[axisCode] || BODY_GUIDE_DATA['ACDZ'];
                const paragraphs = guideData.split('\n\n');
                
                return (
                  <div className="flex flex-col gap-5 mt-2">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-[15px] md:text-lg text-gray-800 leading-[1.8] md:leading-[2] break-keep tracking-wide">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
