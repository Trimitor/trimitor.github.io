const routes = [
  { path: '/', view: 'home' },
  { path: '/about', view: 'about' },
];

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
  return await res.text();
}

async function loadView(viewName) {
  try {
    const module = await import(`./pages/${viewName}.js`);
    const template = await fetchTemplate(viewName);
    const html = await module.default({ template });
    document.querySelector('.content').innerHTML = html;
  } catch (err) {
    const template = await fetchTemplate('404');
    document.querySelector('.content').innerHTML = Mustache.render(template, {});
  }
}

export async function navigate(path) {
  const match = matchRoute(path);
  if (match) {
    await loadView(match.view);
  } else {
    await loadView('404');
  }

  document.querySelectorAll('a.nav-link').forEach(el => el.classList.remove('active'));
  const activeLink = document.querySelector(`a.nav-link[href="#${path}"]`);
  if (activeLink) activeLink.classList.add('active');
}

window.addEventListener('hashchange', () => navigate(getCurrentPath()));
document.addEventListener('DOMContentLoaded', () => navigate(getCurrentPath()));