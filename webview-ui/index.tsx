import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('Webview script loaded');

const container = document.getElementById('root');
console.log('Container:', container);

if (container) {
    console.log('Creating React root');
    const root = createRoot(container);
    root.render(<App />);
    console.log('App rendered');
} else {
    console.error('Root container not found!');
}
