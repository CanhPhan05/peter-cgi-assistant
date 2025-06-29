import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

// Hide initial loader
const hideInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide loader after React renders
setTimeout(hideInitialLoader, 100); 