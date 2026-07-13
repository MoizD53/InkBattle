import './mock.ts';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import HomePage from './src/pages/HomePage.tsx';

(global as any).import = { meta: { env: { BASE_URL: '/InkBattle/' } } };

try {
  console.log("Mounting HomePage...");
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  
  const root = createRoot(rootElement);
  
  // Need to use act or just wait for effects
  root.render(
    React.createElement(BrowserRouter, null, 
      React.createElement(HomePage)
    )
  );
  
  // Wait a few seconds to let effects and intervals run
  setTimeout(() => {
    console.log("No crash after 3 seconds.");
    process.exit(0);
  }, 3000);
} catch (e) {
  console.error("CRASH:", e);
}
