export default async function({ template }) {
  return Mustache.render(template, { title: "Home Page", message: "Welcome to the home page!" });
}