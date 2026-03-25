import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';
import hospitalIcon from './assets/icons/logo192.png';

try {
  const link = document.querySelector("link[rel*='icon']");
  if (link) {
    link.href = hospitalIcon;
  } else {
    console.warn("Favicon link not found");
  }
} catch (e) {
  console.error("Error setting favicon:", e);
}

try {
  console.log("Initializing React Root...");
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Root element not found!");
  } else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      //<React.StrictMode>
        <App />
      //</React.StrictMode>
    );
    console.log("React Root rendered App.");
  }
} catch (e) {
  console.error("Error during React render:", e);
  document.body.innerHTML = "<h1>Early React Error: " + e.message + "</h1>";
}