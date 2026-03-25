import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './app/store';
import AppRouter from './routes/AppRouter';
import { setStore } from './services/storeInjector';
import { AppThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

setStore(store);

export default function App() {
  return (
    <Provider store={store}>
      <AppThemeProvider>
        <ErrorBoundary>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRouter />
          </BrowserRouter>
        </ErrorBoundary>
      </AppThemeProvider>
    </Provider>
  );
}