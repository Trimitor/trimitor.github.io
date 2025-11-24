export default async function ({ template, t }) {
  document.title = `${t.notfound_title} | WDM Collection`;
  return Mustache.render(template, { t });
}