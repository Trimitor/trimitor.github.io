export default async function ({ template }) {
    document.title = 'Caverns and Mines Data | Trimitor';
    return Mustache.render(template, {});
}

export async function after() {
    let caverns = await fetch('data/caverns.json');
    caverns = await caverns.json();
    console.log(caverns);
}