import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import initializeBugsnag from './config/bugsnag.jsx';
import bugsnagManager from './utils/bugsnag.jsx';
import store from './store/store';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Initialize Bugsnag before rendering
initializeBugsnag();
bugsnagManager.initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
