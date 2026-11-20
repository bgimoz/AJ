/* ============================================================
   core/account-menu.js  (13 de 20)
   Botão e menu da conta (iniciais do utilizador, terminar sessão) e separador de administração.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const $ = (s) => document.querySelector(s),
    G = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const logoSrc = () => {
    const i = document.querySelector("#siteView img.brand-mark");
    return i ? i.dataset.o || i.src : "";
  };
  document.querySelectorAll(".au-logo").forEach((l) => {
    const i = new Image();
    i.className = "brand-mark au-lg";
    i.alt = "";
    i.src = logoSrc();
    l.prepend(i);
  });
  if (window.AJ_SITE) AJ_SITE.reapply();
  const menu = document.createElement("div");
  menu.id = "acctMenu";
  document.body.appendChild(menu);
  let ME = null;
  const ini = (n) =>
    (n || "?")
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const nb = $("#adminView .topbar .new-btn");
  if (nb) {
    const a = document.createElement("button");
    a.id = "acctBtn";
    a.className = "acct";
    a.title = "A minha conta";
    nb.after(a);
  }
  const cvo = G("cvOut");
  if (cvo) {
    cvo.style.display = "none";
    const a = document.createElement("button");
    a.id = "cvAcct";
    a.className = "acct";
    a.title = "A minha conta";
    cvo.after(a);
  }
  document.addEventListener("aj:login", (e) => {
    ME = e.detail;
    ["acctBtn", "cvAcct", "navAcct"].forEach((i) => {
      const b = G(i);
      if (b) b.textContent = ini(ME.nome);
    });
  });
  function openMenu(btn) {
    const r = btn.getBoundingClientRect();
    menu.innerHTML = `<div class="am-h"><b>${esc(ME.nome)}</b><small>${esc(ME.email)}</small><em>${ME.role == "admin" ? "Administrador" : ME.role == "equipa" ? "Equipa AJ" : "Cliente"}</em></div><button data-m="acc">Minha conta</button>${document.getElementById("siteView").style.display !== "none" ? '<button data-m="area">A minha \xE1rea</button>' : '<button data-m="site">Ver o site p\xFAblico</button>'}${ME.role != "cliente" ? '<button data-m="def">Defini\xE7\xF5es</button>' : ""}<button data-m="out" class="red">Terminar sess\xE3o</button>`;
    menu.style.display = "block";
    const w = menu.offsetWidth,
      hh = menu.offsetHeight;
    menu.style.left = Math.min(Math.max(8, r.right - w), innerWidth - w - 8) + "px";
    let top = r.bottom + 8;
    if (top + hh > innerHeight - 8) top = Math.max(8, r.top - hh - 8);
    menu.style.top = top + "px";
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("#adminView .sb-foot") && ME) {
        e.stopPropagation();
        menu.style.display = "none";
        AJ_ACCOUNT_OPEN();
        return;
      }
      const b = e.target.closest("#acctBtn,#cvAcct,#navAcct");
      if (b && ME) {
        e.stopPropagation();
        if (menu.style.display == "block") menu.style.display = "none";
        else openMenu(b);
        return;
      }
      const m = e.target.closest("#acctMenu [data-m]");
      if (m) {
        menu.style.display = "none";
        const k = m.dataset.m;
        if (k == "site") showSite();
        if (k == "acc") AJ_ACCOUNT_OPEN();
        if (k == "area") AJ_OPEN("login");
        if (k == "def") switchAdminView("definicoes", G("sbnav-definicoes"));
        if (k == "out" && confirm("Terminar a sess\xE3o?")) AJ_LOGOUT();
        return;
      }
      if (!e.target.closest("#acctMenu")) menu.style.display = "none";
    },
    true,
  );
  document.addEventListener("keydown", (e) => {
    if (e.key == "Escape") menu.style.display = "none";
  });
  let DR = {},
    tabs = false;
  const st = (t) => {
    const s = G("admSt");
    if (s) {
      s.textContent = t;
      clearTimeout(s._t);
      s._t = setTimeout(() => (s.textContent = ""), 3e3);
    }
  };
  const _s = window.AJ_ADMIN_START;
  window.AJ_ADMIN_START = function (me) {
    _s(me);
    if (tabs) return;
    tabs = true;
    const bar = document.querySelector("#adm .tabs"),
      sp = G("admSt");
    [
      ["A", "Apar\xEAncia"],
      ["R", "Siglas"],
      ["T", "Atividade"],
      ["D", "Dados"],
    ].forEach(([k, l]) => {
      const b = document.createElement("button");
      b.dataset.t = k;
      b.textContent = l;
      bar.insertBefore(b, sp);
      const p = document.createElement("div");
      p.className = "xp";
      p.dataset.p = k;
      p.style.display = "none";
      G("adm").appendChild(p);
    });
  };
  const SW = ["#0BA5C7", "#3E5C8A", "#4C8A64", "#C8873C", "#8A5CB0", "#C83C3C", "#1F2933"];
  const PANES = {
    R() {
      return window.AJ_RESP_PANE();
    },
    A() {
      const c = AJ_SITE.get(),
        m = c.manut || {};
      DR = { logo: c.logo || "", cor: c.cor || "" };
      const cur = c.logo || logoSrc();
      return `<div class="cd"><h3>Log\xF3tipo</h3><p class="hn">PNG ou JPG, de prefer\xEAncia quadrado ou com fundo transparente. Aparece no site, no ecr\xE3 de entrada e no painel.</p><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><img id="xLogo" src="${cur}" alt="" style="width:64px;height:64px;object-fit:contain;border-radius:12px;border:1px solid var(--ink-20)"><input type="file" id="xFile" accept="image/*" style="max-width:240px"><button class="bt g2" data-x="nologo">Usar o original</button></div></div>
 <div class="cd"><h3>Cor de destaque</h3><p class="hn">Muda a cor principal do site e dos pain\xE9is.</p><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input type="color" id="xCor" value="${c.cor || "#0BA5C7"}" style="width:64px;height:44px;padding:2px">${SW.map((s) => `<button class="bt" data-x="sw" data-c="${s}" style="background:${s};width:34px;height:34px;padding:0;border-radius:50%"></button>`).join("")}<button class="bt g2" data-x="nocor">Original</button></div></div>
 <div class="cd"><h3>Modo de manuten\xE7\xE3o</h3><p class="hn">Os visitantes veem s\xF3 a mensagem abaixo. A \xE1rea reservada continua acess\xEDvel pela liga\xE7\xE3o discreta.</p><label class="tg"><input type="checkbox" id="xMOn" ${m.on ? "checked" : ""}> Ativar modo de manuten\xE7\xE3o</label><label>Mensagem<input id="xMT" value="${esc(m.texto || "")}" placeholder="Voltamos em breve."></label></div>
 <button class="bt" data-x="pubA">Publicar apar\xEAncia</button>`;
    },
    T() {
      const S = window.__pm ? __pm.getS() : { items: [] };
      const L = S.items
        .flatMap((i) => (i.log || []).map((l) => ({ ...l, c: i.client || i.num })))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .slice(0, 60);
      return `<div class="cd"><h3>Atividade recente</h3><p class="hn">\xDAltimas a\xE7\xF5es em todos os processos (mudan\xE7as de estado, passos conclu\xEDdos, avisos aos clientes\u2026).</p>${L.map((l) => `<div class="rw"><div class="n"><b>${esc(l.c)}</b><small>${esc(l.t)}${l.p ? " \xB7 vis\xEDvel ao cliente" : ""}</small></div><small>${esc(l.d)}</small></div>`).join("") || '<p class="hn">Ainda sem atividade.</p>'}</div>`;
    },
    D() {
      const S = window.__pm ? __pm.getS() : { items: [], cols: [] };
      return `<div class="cd"><h3>Exportar dados</h3><p class="hn">${S.items.length} processos em ${S.cols.length} colunas. Fa\xE7a c\xF3pias com regularidade.</p><button class="bt" data-x="csv">Todos os processos (CSV para Excel)</button> <button class="bt g2" data-x="json">C\xF3pia de seguran\xE7a (JSON)</button></div>`;
    },
  };
  window.AJ_XTAB = (k) => {
    const p = document.querySelector(`#adm .xp[data-p="${k}"]`);
    if (p && PANES[k]) p.innerHTML = PANES[k]();
  };
  const readLogo = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => {
          const s = Math.min(1, 320 / Math.max(im.width, im.height)),
            c = document.createElement("canvas");
          c.width = Math.round(im.width * s);
          c.height = Math.round(im.height * s);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL("image/png"));
        };
        im.onerror = rej;
        im.src = r.result;
      };
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  document.addEventListener("change", async (e) => {
    if (e.target.id == "xFile" && e.target.files[0]) {
      try {
        DR.logo = await readLogo(e.target.files[0]);
        G("xLogo").src = DR.logo;
      } catch (x) {
        st("Imagem inv\xE1lida.");
      }
    }
    if (e.target.id == "xCor") DR.cor = e.target.value;
  });
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-x]");
    if (!t) return;
    const k = t.dataset.x;
    if (k == "nologo") {
      DR.logo = "";
      G("xLogo").src = logoSrc();
    }
    if (k == "sw") {
      DR.cor = t.dataset.c;
      G("xCor").value = t.dataset.c;
    }
    if (k == "nocor") {
      DR.cor = "";
      G("xCor").value = "#0BA5C7";
    }
    if (k == "csv") __pm.csv(true);
    if (k == "json") __pm.json();
    if (k == "pubA") {
      try {
        await AJ_SITE.save({
          ...AJ_SITE.get(),
          logo: DR.logo,
          cor: DR.cor,
          manut: { on: G("xMOn").checked, texto: G("xMT").value.trim() },
        });
        st("Apar\xEAncia publicada.");
      } catch (x) {
        st("Erro: " + x.message);
      }
    }
  });
})();
