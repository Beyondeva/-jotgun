import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { App } from './app/App';
import { watchSystemTheme } from './lib/theme';
import { preloadDecor } from './design/decor';
import { watchStaleBuild } from './lib/staleBuild';
import './design/tokens.css';
import './design/base.css';
import './design/components.css';
import './app/app.css';
import './features/inbox/inbox.css';
import './app/responsive.css'; // last: screen-size overrides

// FA styles are imported above; don't let it inject a <style> at runtime too
config.autoAddCss = false;
// the theme itself is already applied by the inline script in index.html
watchStaleBuild(); // recover from a deploy that removed chunks this page still asks for
watchSystemTheme();
preloadDecor(); // a decorated theme's art starts downloading alongside the app

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
