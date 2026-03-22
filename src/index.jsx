import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';
import hospitalIcon from './assets/icons/logo192.png';

document.querySelector("link[rel*='icon']").href = hospitalIcon;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
);