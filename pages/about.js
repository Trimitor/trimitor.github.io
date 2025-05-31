export default async function({ template }) {
  return Mustache.render(template, { title: "About Page", message: "This is the about page." });
}