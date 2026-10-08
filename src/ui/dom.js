export const $ = (id) => document.getElementById(id);

// Ne touche au DOM que si le HTML a changé : les boutons restent cliquables malgré les mises à jour 10x/s.
export function setHTML(el, html) {
  if (el.__html === html) return;
  el.__html = html;
  el.innerHTML = html;
}
