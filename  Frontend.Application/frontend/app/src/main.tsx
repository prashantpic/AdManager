import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';

import App from './App';
import store from './store'; // Placeholder: store setup will be in src/store/index.ts
import theme from './core/theme/theme'; // Placeholder: theme setup will be in src/core/theme/theme.ts
import i18n from './core/i18n/i18n'; // Placeholder: i18n setup will be in src/core/i18n/i18n.ts
import './index.css';

// REQ-FE-001: Main SPA entry point
// REQ-FE-005: Initialize React, Router, State Management, Theme, i18n

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Failed to find the root element with ID 'root'.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);