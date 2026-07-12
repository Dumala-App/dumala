import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {injectSpeedInsights} from '@vercel/speed-insights';
import RootRouter from './RootRouter.tsx';
import { AppErrorBoundary } from './components/ErrorBoundary.tsx';
import './landing-critical.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <RootRouter />
    </AppErrorBoundary>
  </StrictMode>,
);

injectSpeedInsights();
