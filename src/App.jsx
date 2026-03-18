import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './app/store';
import AppRouter from './routes/AppRouter';

/**
 * BrowserRouter must live HERE — outside AppRouter.
 * AppRouter uses useEffect + useSelector which need both
 * the Redux Provider AND the Router context to be stable.
 * If BrowserRouter is inside AppRouter, navigation fired
 * by sagas gets lost when AppRouter re-renders.
 */
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRouter />
      </BrowserRouter>
    </Provider>
  );
}