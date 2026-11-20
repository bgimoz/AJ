/* ============================================================
   site/navigation-theme.js  (7 de 20)
   Navegação e tema: botão claro/escuro, menu móvel (folha inferior), barra CTA móvel e validação do formulário.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const $ = (s) => document.querySelector(s),
    H = document.documentElement;
  const svg = (p) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    SUN =
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    MENU = '<path d="M4 7h16M4 12h16M4 17h16"/>';
  let mode = "auto";
  try {
    mode = localStorage.getItem("aj_theme") || "auto";
  } catch (e) {}
  const mq = matchMedia("(prefers-color-scheme: dark)");
  function apply() {
    const d = mode == "dark" || (mode == "auto" && mq.matches);
    H.setAttribute("data-theme", d ? "dark" : "light");
    const m = $("meta[name=theme-color]");
    if (m) m.content = d ? "#081318" : "#0B2630";
    document
      .querySelectorAll(".seg button")
      .forEach((b) => b.classList.toggle("on", b.dataset.t == mode));
  }
  function setMode(m) {
    mode = m;
    try {
      localStorage.setItem("aj_theme", m);
    } catch (e) {}
    apply();
  }
  if (mq.addEventListener) mq.addEventListener("change", apply);
  $(".nav-right").insertAdjacentHTML(
    "beforeend",
    `<button class="hbtn" id="themeBtn" aria-label="Alternar tema claro/escuro"><span class="m">${svg(MOON)}</span><span class="s">${svg(SUN)}</span></button><button class="hbtn" id="menuBtn" aria-label="Abrir menu" aria-expanded="false" aria-controls="navSheet">${svg(MENU)}</button>`,
  );
  $("#themeBtn").onclick = () => setMode(H.getAttribute("data-theme") == "dark" ? "light" : "dark");
  const L = [
    ["#servicos", "Servi\xE7os"],
    ["#processo", "Como funciona"],
    ["#portal", "Portal do cliente"],
    ["#faq", "Perguntas"],
    ["#contacto", "Pedir cota\xE7\xE3o"],
  ];
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="navSheet" aria-hidden="true"><div class="sh"></div><div class="nsb" role="dialog" aria-modal="true" aria-label="Menu"><div class="sh-top"><b>Menu</b><button class="hbtn" id="shX" aria-label="Fechar menu">\xD7</button></div>${L.map(([h, t]) => `<a class="l" href="${h}">${t}<span aria-hidden="true">\u203A</span></a>`).join("")}<div class="seg" role="group" aria-label="Apar\xEAncia"><button data-t="auto">Autom\xE1tico</button><button data-t="light">Claro</button><button data-t="dark">Escuro</button></div><button class="btn btn-solid btn-round" id="shLogin" data-auth="out">Entrar ou criar conta</button><button class="btn btn-solid btn-round" id="shArea" data-auth="in">A minha \xE1rea</button></div></div>`,
  );
  const sh = $("#navSheet"),
    mb = $("#menuBtn");
  const open = (v) => {
    sh.classList.toggle("on", v);
    sh.setAttribute("aria-hidden", String(!v));
    mb.setAttribute("aria-expanded", String(v));
    document.body.style.overflow = v ? "hidden" : "";
    (v ? $("#shX") : mb).focus({ preventScroll: true });
  };
  mb.onclick = () => open(true);
  $("#shX").onclick = () => open(false);
  sh.querySelector(".sh").onclick = () => open(false);
  sh.addEventListener("click", (e) => {
    if (e.target.closest("a.l")) open(false);
  });
  sh.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => setMode(b.dataset.t)));
  ["shLogin", "shArea"].forEach(
    (i) =>
      (document.getElementById(i).onclick = () => {
        open(false);
        AJ_OPEN("login");
      }),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key == "Escape" && sh.classList.contains("on")) open(false);
  });
  apply();
  const wf = $(".wa-float");
  $("#siteView").insertAdjacentHTML(
    "beforeend",
    `<div id="mBar" class="print-hide"><a class="btn btn-solid btn-round" href="#contacto">Pedir cota\xE7\xE3o</a><a class="wa" href="${wf.href}" target="_blank" rel="noopener" aria-label="Falar por WhatsApp">${wf.innerHTML}</a></div>`,
  );
  $("#mBar .wa").addEventListener("click", function () {
    this.href = wf.href;
  });
  document.addEventListener("focusin", (e) => {
    if (e.target.matches("input,textarea,select")) document.body.classList.add("kb");
  });
  document.addEventListener("focusout", () => document.body.classList.remove("kb"));
  const spy = new IntersectionObserver(
    (es) =>
      es.forEach((en) => {
        if (en.isIntersecting)
          document
            .querySelectorAll(".navlinks a")
            .forEach((a) => a.classList.toggle("on", a.getAttribute("href") == "#" + en.target.id));
      }),
    { rootMargin: "-45% 0px -50% 0px" },
  );
  ["servicos", "processo", "rota", "portal", "faq", "contacto"].forEach((i) => {
    const s = document.getElementById(i);
    if (s) spy.observe(s);
  });
  document.querySelectorAll(".faq-q").forEach((q) => {
    const it = q.parentElement;
    q.setAttribute("role", "button");
    q.tabIndex = 0;
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("keydown", (e) => {
      if (e.key == "Enter" || e.key == " ") {
        e.preventDefault();
        q.click();
      }
    });
    new MutationObserver(() =>
      q.setAttribute("aria-expanded", String(it.classList.contains("open"))),
    ).observe(it, { attributes: true, attributeFilter: ["class"] });
  });
  function need(id, ok, msg) {
    const el = document.getElementById(id);
    let e = el.parentElement.querySelector(".fe");
    if (!e) {
      e = document.createElement("div");
      e.className = "fe";
      e.setAttribute("role", "alert");
      el.parentElement.appendChild(e);
    }
    const bad = !ok(el.value.trim());
    el.setAttribute("aria-invalid", String(bad));
    e.textContent = bad ? msg : "";
    return !bad;
  }
  const base = window.nextStep;
  window.nextStep = function (n) {
    const r =
      n == 1
        ? [
            need("nome", (v) => v.length > 1, "Escreva o seu nome ou o da empresa."),
            need(
              "tel",
              (v) => v.replace(/\D/g, "").length >= 7,
              "Escreva um n\xFAmero v\xE1lido (m\xEDnimo 7 d\xEDgitos).",
            ),
          ]
        : [
            need("carga", (v) => !!v, "Escolha o tipo de carga."),
            need("rota2", (v) => !!v, "Escolha a rota."),
          ];
    if (r.every(Boolean)) {
      base(n);
      $("#quoteForm").scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };
  $("#quoteForm").addEventListener("keydown", (e) => {
    if (e.key != "Enter" || e.target.tagName == "TEXTAREA") return;
    e.preventDefault();
    const s = $(".form-step.active");
    if (s && s.id != "formStep3") {
      const b = s.querySelector(".btn-solid");
      if (b) b.click();
    }
  });
})();
