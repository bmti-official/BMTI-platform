import { renderToString } from 'react-dom/server';
import React from 'react';
import BodyScanView from './src/components/BodyScanView.jsx';

try {
  renderToString(React.createElement(BodyScanView, { setView: () => {} }));
  console.log('Render Success!');
} catch (e) {
  console.error('Render Failed:', e);
}
