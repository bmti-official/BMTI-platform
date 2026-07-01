const jsdom = require('jsdom');
const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync('dist/index.html', 'utf-8');
const bundleMatch = indexHtml.match(/src="\/BMTI-platform\/assets\/(index-[^"]+\.js)"/);
if (!bundleMatch) {
  console.error("Bundle not found");
  process.exit(1);
}

const bundlePath = path.join('dist/assets', bundleMatch[1]);
const bundleJs = fs.readFileSync(bundlePath, 'utf-8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", () => { console.error("JSDOM ERROR:", ...arguments); });
virtualConsole.on("warn", () => { console.warn("JSDOM WARN:", ...arguments); });
virtualConsole.on("info", () => { console.info("JSDOM INFO:", ...arguments); });
virtualConsole.on("dir", () => { console.dir("JSDOM DIR:", ...arguments); });

const dom = new jsdom.JSDOM(indexHtml, {
  url: "http://localhost",
  runScripts: "dangerously",
  virtualConsole
});

try {
  dom.window.eval(bundleJs);
} catch (e) {
  console.error("Eval error:", e);
}

setTimeout(() => {
  console.log("Rendered!");
  process.exit(0);
}, 3000);
