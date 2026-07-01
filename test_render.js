import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const htmlPath = path.resolve('dist/index.html');
const jsPath = path.resolve(fs.readdirSync('dist/assets').find(f => f.endsWith('.js')));

console.log("Found JS:", jsPath);
