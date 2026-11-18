/* 本產品型錄說明頁語系與返回連結；不讀取其他產品資料。 */
(() => {
  'use strict';
  const Locale = window.SuperDrillLocale;
  const query = new URLSearchParams(location.search);
  const lang = Locale.normalize(query.get('lang'));
  query.set('lang', lang);
  document.documentElement.lang = lang === 'zh-TW' ? 'zh-Hant' : 'en';
  document.title = Locale.text('Super Drill 型錄與待確認資料｜Nine9', lang);
  Locale.apply(document.getElementById('main-content'), lang);
  const switchQuery = new URLSearchParams(query);
  switchQuery.set('lang', lang === 'en' ? 'zh-TW' : 'en');
  const toggle = document.getElementById('languageToggle');
  toggle.href = `${location.pathname}?${switchQuery}${location.hash}`;
  toggle.textContent = lang === 'en' ? '繁體中文' : 'English';
  toggle.setAttribute('aria-label', lang === 'en' ? 'Switch to Traditional Chinese' : '切換英文');
  document.querySelectorAll('[data-product-return]').forEach(link => {
    const url = new URL('./index.html', location.href); url.search = query.toString(); link.href = url.href;
  });
  document.querySelectorAll('[data-hub-link]').forEach(link => {
    const url = new URL('/Machining/Drilling/index.html', location.href);
    const parameters = new URLSearchParams(query);
    if (parameters.get('tool')) parameters.set('sdTool', parameters.get('tool'));
    url.search = parameters.toString(); link.href = url.href;
  });
  history.replaceState(null, '', `${location.pathname}?${query}${location.hash}`);
  for (const [path, id] of [['../../header/header.html', 'header-placeholder'], ['../../footer/footer.html', 'footer-placeholder']]) {
    fetch(path).then(response => { if (!response.ok) throw new Error('Shared component could not be loaded'); return response.text(); }).then(markup => {
      const target = document.getElementById(id); target.innerHTML = markup; Locale.apply(target, lang);
      if (id !== 'header-placeholder') return;
      const button = document.getElementById('mobileMenuBtn'), nav = document.getElementById('topNav');
      if (!button || !nav) return;
      button.innerHTML = '<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 3h12v1H2zm0 4h12v1H2zm0 4h12v1H2z"/></svg>';
      button.setAttribute('aria-controls', 'topNav'); button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', Locale.text('開啟選單', lang));
      button.addEventListener('click', () => button.setAttribute('aria-expanded', String(nav.classList.toggle('active'))));
    }).catch(error => console.warn(error.message));
  }
  document.getElementById('printNotes').addEventListener('click', () => window.print());
})();
