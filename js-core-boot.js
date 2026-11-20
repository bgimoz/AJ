/* ============================================================
   core/boot.js  (1 de 20)
   Corre no <head>, antes de tudo (bloqueante): AJ_UI_GET/AJ_UI_SET (preferências em localStorage), classe aj-restore e tema claro/escuro sem "flash".
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

window.AJ_UI_GET = function (k) {
  try {
    return JSON.parse(localStorage.getItem("aj_ui") || "{}")[k];
  } catch (e) {}
};
window.AJ_UI_SET = function (k, v) {
  try {
    var o = JSON.parse(localStorage.getItem("aj_ui") || "{}");
    if (v === "" || v == null) delete o[k];
    else o[k] = v;
    localStorage.setItem("aj_ui", JSON.stringify(o));
  } catch (e) {}
};
if (AJ_UI_GET("area")) document.documentElement.classList.add("aj-restore");
try {
  var t = localStorage.getItem("aj_theme");
  document.documentElement.setAttribute(
    "data-theme",
    t == "dark" || (t != "light" && matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light",
  );
} catch (e) {}
