import { Provider } from 'react-redux';
import store from './app/store';
import AppRouter from './routes/AppRouter';

/**
 * App
 *
 * Root of the application.
 * - Redux Provider wraps everything (store has auth + future modules)
 * - AppRouter handles all routing, session check, idle logout
 *
 * Styled-components ThemeProvider for multi-tenant theming will be
 * inserted here once the tenant module is ready:
 *
 *   <ThemeProvider theme={tenantTheme}>
 *     <AppRouter />
 *   </ThemeProvider>
 */
export default function App() {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
}