/* ============================================================
   site/top-loader.js  (2 de 20)
   Barra de progresso no topo da página (#topBar) enquanto há pedidos de rede.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const bar = document.createElement("div");
  bar.id = "topBar";
  document.documentElement.appendChild(bar);
  let n = 0,
    t = null;
  const off = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      bar.className = "done";
      t = setTimeout(() => (bar.className = ""), 350);
    }, 120);
  };
  const on = () => {
    clearTimeout(t);
    bar.className = "run";
  };
  const f = window.fetch;
  if (f)
    window.fetch = function () {
      n++;
      on();
      return f.apply(this, arguments).finally(() => {
        if (--n <= 0) {
          n = 0;
          off();
        }
      });
    };
  document.addEventListener(
    "pointerdown",
    (e) => {
      const el =
        e.target.closest &&
        e.target.closest(".btn,button,.go,.sb-item,[role=button],.k,a.l,a[href]");
      if (!el || el.disabled) return;
      el.classList.remove("rip");
      void el.offsetWidth;
      el.classList.add("rip");
      if (!n && el.matches(".btn,.sb-item,a[href],#aTabs button")) {
        on();
        t = setTimeout(() => {
          if (!n) off();
        }, 600);
      }
    },
    { passive: true },
  );
  document.addEventListener("touchstart", () => {}, { passive: true });
})();
