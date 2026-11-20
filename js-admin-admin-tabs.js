/* ============================================================
   admin/admin-tabs.js  (19 de 20)
   Barra de separadores do painel interno em ecrãs pequenos.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const $ = (s) => document.querySelector(s);
  const K = [
    ["processos", "Processos"],
    ["pedidos", "Pedidos"],
    ["clientes", "Clientes"],
    ["documentos", "Documentos"],
    ["relatorios", "Relat\xF3rios"],
    ["definicoes", "Defini\xE7\xF5es"],
    ["admin", "Admin"],
  ];
  const tb = document.createElement("nav");
  tb.id = "aTabs";
  tb.setAttribute("aria-label", "Sec\xE7\xF5es do painel");
  tb.innerHTML = K.map(([k, t]) => {
    const i = document.querySelector("#sbnav-" + k + " svg");
    return `<button type="button" data-k="${k}">${i ? i.outerHTML : ""}<span>${t}</span></button>`;
  }).join("");
  $("#adminView").appendChild(tb);
  tb.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) switchAdminView(b.dataset.k, document.getElementById("sbnav-" + b.dataset.k));
  });
  function sync() {
    const on = document.querySelector("#adminView .sb-item.active"),
      a = document.getElementById("sbnav-admin");
    tb.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("on", !!on && on.id == "sbnav-" + b.dataset.k),
    );
    tb.querySelector("[data-k=admin]").style.display = a && a.style.display != "none" ? "" : "none";
  }
  const sw = window.switchAdminView;
  window.switchAdminView = function (n, el) {
    const r = sw(n, el);
    sync();
    return r;
  };
  document.addEventListener("aj:login", () => setTimeout(sync, 50));
})();
