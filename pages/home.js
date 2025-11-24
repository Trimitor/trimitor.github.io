export default async function ({ template, t }) {
  document.title = `${t.home_title} | WDM Collection`;
  return Mustache.render(template, { t });
}
