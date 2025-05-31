export default async function({ template }) {
  return Mustache.render(template, { title: "About Page", message: "This is the about page." });
}

export function after({ params, query }) {
  console.log("After render for /about", { params, query });
}