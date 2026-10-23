import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { App } from './app/App';
import { watchSystemTheme } from './lib/theme';
import './design/tokens.css';
import './design/base.css';
import './design/components.css';
import './app/app.css';
import './features/inbox/inbox.css';

// FA styles are imported above; don't let it inject a <style> at runtime too
config.autoAddCss = false;
// the theme itself is already applied by the inline script in index.html
watchSystemTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
