const routes = [
  { path: '/', view: 'home' },
  { path: '/wotlk/calculator', view: 'calculator' },
  { path: '/wotlk/caverns', view: 'caverns' },
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function loadView(viewName, params = {}, query = {}) {
  try {
    const module = await import(`../../pages/${viewName}.js`);
    const handler = module.default || module[`load${capitalize(viewName)}`] || module.load;

    const template = await fetchTemplate(viewName);
    const html = await handler({ params, query, template });

    const container = document.querySelector('.content');
    if (container) {
      container.classList.remove('show');

      setTimeout(() => {
        container.innerHTML = html;
        container.classList.add('show');

        if (typeof module.after === 'function') {
          module.after({ params, query });
        }
      }, 150);
    }
  } catch (err) {
    console.error(err);
    const template = await fetchTemplate('404');
    const html = Mustache.render(template, {});
    document.querySelector('.content').innerHTML = html;
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