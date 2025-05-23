import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';

import App from './App';
import { store } from './store'; // Will be created in src/store/index.ts
import theme from './core/theme/theme'; // Will be created in src/core/theme/theme.ts
import i18n from './core/i18n/i18n'; // Will be created in src/core/i18n/i18n.ts
import GlobalStyles from './core/theme/GlobalStyles'; // Will be created in src/core/theme/GlobalStyles.tsx
import './index.css';
// import ErrorBoundary from './core/errors/ErrorBoundary'; // Will be created in src/core/errors/ErrorBoundary.tsx

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element with id 'root'");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* <ErrorBoundary> */}
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <I18nextProvider i18n={i18n}>
            <CssBaseline />
            <GlobalStyles />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </I18nextProvider>
        </ThemeProvider>
      </Provider>
    {/* </ErrorBoundary> */}
  </React.StrictMode>
);