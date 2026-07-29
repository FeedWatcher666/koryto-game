(() => {
  'use strict';
  if (new URLSearchParams(window.location.search).get('legacy') === '1') return;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'styles/v0181-character-drama.css';
  document.head.append(stylesheet);
  const runtime = document.createElement('script');
  runtime.src = 'src/v0181-character-drama.js';
  runtime.defer = true;
  document.head.append(runtime);
})();
