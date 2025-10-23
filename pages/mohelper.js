export default async function ({ template }) {
    document.title = 'Missing Objectives Helper | WDM Collection';
    return Mustache.render(template, {});
}

export async function after() {
    
}