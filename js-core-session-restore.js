/* ============================================================
   core/session-restore.js  (17 de 20)
   Restaura a sessão e o separador do painel ao recarregar a página e memoriza o separador atual.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const rm = () => document.documentElement.classList.remove("aj-restore");
  setTimeout(rm, 3e3);
  const sw = window.switchAdminView;
  window.switchAdminView = function (n, el) {
    AJ_UI_SET("sub", n);
    return sw(n, el);
  };
  if (window.AJ_LIVE && AJ_UI_GET("area") && !/access_token=|type=/.test(location.hash)) {
    AJ_SB.auth.getSession().then(async ({ data }) => {
      try {
        if (data.session) await AJ_ENTER(data.session.user);
        else AJ_UI_SET("area", "");
      } catch (e) {
      } finally {
        rm();
      }
    });
  } else rm();
  const home = () => {
    const s = document.getElementById("siteView");
    history.replaceState(null, "", location.pathname);
    if (s.style.display === "none") showSite();
    else scrollTo({ top: 0, behavior: "smooth" });
  };
  const link = (el, fn) => {
    if (!el) return;
    el.style.cursor = "pointer";
    el.setAttribute("role", "link");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", "AJ Servi\xE7os LDA \u2014 in\xEDcio");
    el.addEventListener("click", fn);
    el.addEventListener("keydown", (e) => {
      if (e.key == "Enter" || e.key == " ") {
        e.preventDefault();
        fn();
      }
    });
  };
  link(document.querySelector("header .brand"), home);
  document.querySelectorAll(".au-logo,#clientView .lg-brand").forEach((e) => link(e, home));
  link(document.querySelector("#adminView .sb-brand"), () =>
    switchAdminView("processos", document.getElementById("sbnav-processos")),
  );
})();
