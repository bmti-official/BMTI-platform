const fs = require('fs');
const code = fs.readFileSync('src/App.jsx', 'utf8');

const newCode = code.replace(
  'const [currentView, setCurrentView] = useState(\'home\');',
  `const [currentView, setCurrentView] = useState(window.location.hash ? 'result' : 'home');`
).replace(
  'const [bmtiCode, setBmtiCode] = useState(\'\'); // e.g. "ALDZ-Tl"',
  `const [bmtiCode, setBmtiCode] = useState(window.location.hash ? window.location.hash.replace('#', '') : ''); // e.g. "ALDZ-Tl"`
);

fs.writeFileSync('src/App.jsx', newCode);
console.log('Patched App.jsx');
