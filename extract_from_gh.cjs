const fs = require('fs');

const code = fs.readFileSync('gh_pages_index.js', 'utf-8');

// Find the objects
// Since they are minified, they might look like const X={"AD":{name:"...",...},"AQ":...}
// We can find them by a known string!
// "이론은 됐고 일단 움직이고 보는 오운완 열정러" -> QUIT_REASON_DATA
// "잔잔바리 운동과 오구오구? 가성비 최악" -> WORST_VIBE_DATA
// "전문적인 체형 관리 현장에서 수많은 분들의 신체 패턴을 직접 점검하고 마주하며 한 가지 확실하게 느낀 것이 있습니다. 그저 눕는 것에 그치지 않고, 아픈 곳의 원인을 현미경처럼 들여다보며 최고 효율의 휴식을 설계하는 그 '놀라운 분석력'이 몸의 기능 부전을 가장 날카롭게 교정해 낸다는 사실입니다." -> BODY_GUIDE_DATA

function extractObjectByString(str) {
  const index = code.indexOf(str);
  if (index === -1) return null;
  
  // Backtrack to find the start of the object {
  let start = index;
  let depth = 0;
  while (start > 0) {
    if (code[start] === '}') depth++;
    if (code[start] === '{') {
      if (depth === 0) break;
      depth--;
    }
    start--;
  }
  
  // Forward to find the end of the object }
  let end = start;
  depth = 0;
  while (end < code.length) {
    if (code[end] === '{') depth++;
    if (code[end] === '}') {
      depth--;
      if (depth === 0) {
        end++;
        break;
      }
    }
    end++;
  }
  
  return code.substring(start, end);
}

const quitData = extractObjectByString("이론은 됐고 일단 움직이고 보는 오운완 열정러");
const worstVibeData = extractObjectByString("잔잔바리 운동과 오구오구? 가성비 최악");
const bodyGuideData = extractObjectByString("전문적인 체형 관리 현장에서 수많은 분들의 신체 패턴을 직접 점검하고 마주하며 한 가지 확실하게 느낀 것이 있습니다. 그저 눕는 것에 그치지 않고, 아픈 곳의 원인을 현미경처럼 들여다보며 최고 효율의 휴식을 설계하는 그 '놀라운 분석력'이 몸의 기능 부전을 가장 날카롭게 교정해 낸다는 사실입니다.");

console.log("const QUIT_REASON_DATA = " + quitData + ";\n");
console.log("const WORST_VIBE_DATA = " + worstVibeData + ";\n");
console.log("const BODY_GUIDE_DATA = " + bodyGuideData + ";\n");
