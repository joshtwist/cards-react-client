import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <div className="bodyWrapper">
      <App />
    </div>
    <p>_________________</p>
    <a href="/">New Game</a> | Made by <a href="https://twitter.com/joshtwist">@joshtwist</a> | Uses <a href="https://cardsagainsthumanity.com/">CAH</a> material under <a href="https://creativecommons.org/licenses/by-nc-sa/2.0/">Creative Commons BY-NC-SA 2.0 license</a>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
