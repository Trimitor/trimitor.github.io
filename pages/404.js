export default async function ({ template }) {
    document.title = '404 Page | WDM Collection';
    return Mustache.render(template, {});
}