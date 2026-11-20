/* ============================================================
   core/views.js  (5 de 20)
   Alternância entre as vistas da aplicação (site público, painel interno): switchAdminView, showAdmin, showSite.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

const heroSection = document.querySelector(".hero");
const contactSection = document.getElementById("contacto");
const siteHeader = document.querySelector("header");
const ADMIN_VIEWS = {
  pedidos: { title: "Pedidos", sub: "Pedidos de cota\xE7\xE3o recebidos no site" },
  processos: { title: "Processos", sub: "9 activos \xB7 actualizado agora mesmo" },
  clientes: { title: "Clientes", sub: "9 clientes na base de dados" },
  documentos: { title: "Documentos", sub: "6 documentos associados a processos activos" },
  relatorios: { title: "Relat\xF3rios", sub: "Resumo do m\xEAs em curso" },
  definicoes: {
    title: "Defini\xE7\xF5es",
    sub: "Perfil da empresa e prefer\xEAncias de notifica\xE7\xE3o",
  },
};
function switchAdminView(name, el) {
  Object.keys(ADMIN_VIEWS).forEach((k) => {
    const v = document.getElementById("view-" + k);
    if (v) v.style.display = k === name ? "block" : "none";
  });
  document.querySelectorAll("#adminView .sb-item").forEach((i) => i.classList.remove("active"));
  if (el) el.classList.add("active");
  const info = ADMIN_VIEWS[name];
  if (info) {
    document.getElementById("topbarTitle").textContent = info.title;
    document.getElementById("topbarSub").textContent = info.sub;
  }
}
function showAdmin() {
  document.getElementById("siteView").style.display = "none";
  document.getElementById("adminView").style.display = "block";
  switchAdminView("processos", document.getElementById("sbnav-processos"));
  window.scrollTo(0, 0);
}
function showSite() {
  document.getElementById("adminView").style.display = "none";
  document.getElementById("siteView").style.display = "block";
  window.scrollTo(0, 0);
}
