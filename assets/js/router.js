const routes = [
  { path: '/', view: 'home' },
  { path: '/wotlk/calculator', view: 'calculator' },
  { path: '/wotlk/caverns', view: 'caverns' },
  { path: '/wotlk/mohelper', view: 'mohelper' },
];

let currentLang = localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en';
let translations = {};

async function loadLanguage(lang) {
  document.querySelector('html').setAttribute('lang', lang);
  localStorage.setItem('lang', lang);
  const res = await fetch(`locales/${lang}.json`);
  if (!res.ok) return setLanguage('en');
  translations = await res.json();
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
  sel.addEventListener('change', async (e) => {
    await setLanguage(e.target.value);
    await initLayout();
  });
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

async function fetchTemplate(name) {
  const res = await fetch(`templates/${name}.mustache`);
  if (!res.ok) throw new Error(`Template not found: ${name}`);
  return await res.text();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function initLayout() {
  const [headerTpl, footerTpl] = await Promise.all([
    fetchTemplate('_blocks/header'),
    fetchTemplate('_blocks/footer'),
  ]);
  document.getElementById('app-header').innerHTML =
    Mustache.render(headerTpl, { t: translations });
  document.getElementById('app-footer').innerHTML =
    Mustache.render(footerTpl, { t: translations });
  initLangSwitch();
}

async function loadView(viewName, params = {}, query = {}) {
  try {
    const module = await import(`../../pages/${viewName}.js`);
    const handler = module.default || module[`load${capitalize(viewName)}`] || module.load;
    const template = await fetchTemplate(viewName);
    const html = await handler({ params, query, template, t: translations });
    const container = document.querySelector('.content');
    if (container) {
      container.classList.remove('show');
      setTimeout(() => {
        container.innerHTML = html;
        container.classList.add('show');
        if (typeof module.after === 'function') {
          module.after({ params, query, t: translations });
        }
      }, 150);
    }
  } catch (err) {
    console.error(err);
    const tpl = await fetchTemplate('404');
    document.querySelector('.content').innerHTML = Mustache.render(tpl, translations);
  }
}


export async function navigate(path) {
  const match = matchRoute(path);
  if (match) { await loadView(match.view); } else { await loadView('404'); }
  document.querySelectorAll('a.nav-link').forEach(el => el.classList.remove('active'));
  const activeLink = document.querySelector(`a.nav-link[href="#${path}"]`);
  if (activeLink) activeLink.classList.add('active');
}

window.addEventListener('hashchange', () => navigate(getCurrentPath()));

document.addEventListener('DOMContentLoaded', async () => {
  await loadLanguage(currentLang);
  await initLayout();
  await navigate(getCurrentPath());
});
