export default async function({ template }) {
  document.title = 'Home Page | Trimitor';
  return Mustache.render(template, { title: "Home Page", message: "Welcome to the home page!" });
}