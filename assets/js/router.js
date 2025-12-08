const routes = [
  { path: '/', view: 'home' },
  { path: '/wotlk/calculator', view: 'calculator' },
  { path: '/wotlk/caverns', view: 'caverns' },
  { path: '/wotlk/mohelper', view: 'mohelper' },
];

let currentLang = localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en';
let translations = {};
let currentNavigationId = 0;
let currentCleanup = null;
let hashChangeTimeout;

const templateCache = new Map();

async function loadLanguage(lang) {
  try {
    document.querySelector('html').setAttribute('lang', lang);
    localStorage.setItem('lang', lang);
    
    const res = await fetch(`locales/${lang}.json`);
    if (!res.ok) {
      console.warn(`Language ${lang} not found, falling back to English`);
      if (lang === 'en') {
        console.error('Default language not available');
        translations = {};
        return;
      }
      return setLanguage('en');
    }
    
    translations = await res.json();
  } catch (err) {
    console.error('Failed to load language:', err);
    translations = {};
  }
}

export async function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  await loadLanguage(lang);
  navigate(getCurrentPath());
}

function initLangSwitch() {
  const sel = document.getElementById('lang-switch');
  if (!sel) return;
  
  sel.value = currentLang;
  sel.removeEventListener('change', handleLangChange);
  sel.addEventListener('change', handleLangChange);
}

async function handleLangChange(e) {
  await setLanguage(e.target.value);
  await initLayout();
}

function matchRoute(path) {
  for (const route of routes) {
    if (route.path === path) return { view: route.view };
  }
  return null;
}

function getCurrentPath() {
  return location.hash.slice(1) || '/';
}

function parseQuery(path) {
  const [pathname, queryString] = path.split('?');
  const query = {};
  
  if (queryString) {
    const params = new URLSearchParams(queryString);
    for (const [key, value] of params) {
      query[key] = value;
    }
  }
  
  return { pathname, query };
}

async function fetchTemplate(name) {
  if (templateCache.has(name)) {
    return templateCache.get(name);
  }
  
  const res = await fetch(`templates/${name}.mustache`);
  if (!res.ok) throw new Error(`Template not found: ${name}`);
  
  const template = await res.text();
  templateCache.set(name, template);
  return template;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function initLayout() {
  try {
    const [headerTpl, footerTpl] = await Promise.all([
      fetchTemplate('_blocks/header'),
      fetchTemplate('_blocks/footer'),
    ]);
    
    const headerEl = document.getElementById('app-header');
    const footerEl = document.getElementById('app-footer');
    
    if (headerEl) {
      headerEl.innerHTML = Mustache.render(headerTpl, { t: translations });
    }
    if (footerEl) {
      footerEl.innerHTML = Mustache.render(footerTpl, { t: translations });
    }
    
    initLangSwitch();
  } catch (err) {
    console.error('Failed to initialize layout:', err);
  }
}

async function loadView(viewName, params = {}, query = {}, navigationId) {
  if (navigationId !== undefined && navigationId !== currentNavigationId) {
    return;
  }
  
  const container = document.querySelector('.content');
  if (!container) {
    console.error('Content container not found');
    return;
  }
  
  if (currentCleanup) {
    try {
      await currentCleanup();
    } catch (err) {
      console.warn('Cleanup failed:', err);
    }
    currentCleanup = null;
  }

  container.classList.add('loading');
  container.classList.remove('show');
  
  try {
    const module = await import(`../../pages/${viewName}.js`);
    const handler = module.default || module[`load${capitalize(viewName)}`] || module.load;
    
    if (typeof handler !== 'function') {
      throw new Error(`No valid handler found for view: ${viewName}`);
    }
    
    const template = await fetchTemplate(viewName);
    const html = await handler({ params, query, template, t: translations });

    if (navigationId !== undefined && navigationId !== currentNavigationId) {
      return;
    }
    
    setTimeout(() => {
      if (navigationId !== undefined && navigationId !== currentNavigationId) {
        return;
      }
      
      container.innerHTML = html;
      container.classList.remove('loading');
      container.classList.add('show');
      
      if (typeof module.after === 'function') {
        module.after({ params, query, t: translations });
      }
      
      if (typeof module.cleanup === 'function') {
        currentCleanup = module.cleanup;
      }
    }, 150);
    
  } catch (err) {
    console.error('Failed to load view:', err);
    if (navigationId !== undefined && navigationId !== currentNavigationId) {
      return;
    }
    
    try {
      const tpl = await fetchTemplate('404');
      container.innerHTML = Mustache.render(tpl, { t: translations });
      container.classList.remove('loading');
      container.classList.add('show');
    } catch (err404) {
      console.error('Failed to load 404 page:', err404);
      container.innerHTML = '<h1>Page not found</h1>';
      container.classList.remove('loading');
      container.classList.add('show');
    }
  }
}

export async function navigate(path) {
  const navigationId = ++currentNavigationId;
  const { pathname, query } = parseQuery(path);
  const match = matchRoute(pathname);
  const viewName = match ? match.view : '404';
  
  try {
    await loadView(viewName, {}, query, navigationId);
  } catch (err) {
    if (navigationId === currentNavigationId) {
      console.error('Navigation failed:', err);
      await loadView('404', {}, query, navigationId);
    }
  }
  
  if (navigationId === currentNavigationId) {
    updateActiveLink(pathname);
  }
}

function updateActiveLink(path) {
  document.querySelectorAll('a.nav-link').forEach(el => {
    el.classList.remove('active');
  });
  
  const activeLink = document.querySelector(`a.nav-link[href="#${path}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

window.addEventListener('hashchange', () => {
  clearTimeout(hashChangeTimeout);
  hashChangeTimeout = setTimeout(() => {
    navigate(getCurrentPath());
  }, 10);
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadLanguage(currentLang);
    await initLayout();
    await navigate(getCurrentPath());
  } catch (err) {
    console.error('Failed to initialize application:', err);
  }
});

window.addEventListener('beforeunload', () => {
  if (currentCleanup) {
    try {
      currentCleanup();
    } catch (err) {
      console.warn('Cleanup on unload failed:', err);
    }
  }
});