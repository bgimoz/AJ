/* ============================================================
   admin/site-settings.js  (12 de 20)
   Administração (AJ_SITE, AJ_ADMIN_START): membros e papéis, textos, cores e logótipo do site, aviso global e modo de manutenção.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const sb = window.AJ_SB,
    live = window.AJ_LIVE,
    $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const orig = {},
    LK = "aj_site_cfg";
  let CFG = null,
    built = false,
    ME = null,
    DATA = { m: [], c: [] };
  const demoM = [
      { id: "1", email: "equipa@demo.pt", nome: "Equipa Demo", papel: "equipa" },
      { id: "2", email: "maria@exemplo.pt", nome: "Maria Cliente", papel: "cliente" },
    ],
    demoC = [];
  const phone = (n) => `+${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  const hero = () => {
    const h = $("#siteView h1");
    return [h, h && h.nextElementSibling];
  };
  const toHtml = (t) => esc(t).replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const toMd = (h) => h.replace(/<\/?em>/g, "*").replace(/&amp;/g, "&");
  function snap() {
    const [h, p] = hero();
    orig.t = h.innerHTML;
    orig.s = p.innerHTML;
    orig.wa = [...AJ_CONTACTS.whatsapp];
    orig.em = [...AJ_CONTACTS.emails];
  }
  function apply(c) {
    c = c || {};
    if (window.AJ_RESP_APPLY) AJ_RESP_APPLY(c.resp);
    const [h, p] = hero();
    h.innerHTML = c.titulo ? toHtml(c.titulo) : orig.t;
    p.innerHTML = c.sub ? esc(c.sub) : orig.s;
    const wa = (c.wa || []).map((x) => x.replace(/\D/g, "")).filter(Boolean),
      em = (c.em || []).map((x) => x.trim()).filter(Boolean);
    AJ_CONTACTS.whatsapp.splice(0, 9, ...(wa.length ? wa : orig.wa));
    AJ_CONTACTS.emails.splice(0, 9, ...(em.length ? em : orig.em));
    const f = $(".wa-float");
    if (f) f.href = f.href.replace(/wa\.me\/\d+/, "wa.me/" + AJ_CONTACTS.whatsapp[0]);
    document.querySelectorAll(".contact-line").forEach((l) => {
      const [a, b2] = l.children;
      if (!a || !b2) return;
      if (/whatsapp/i.test(a.textContent)) b2.textContent = phone(AJ_CONTACTS.whatsapp[0]);
      if (/e-?mail/i.test(a.textContent)) b2.textContent = AJ_CONTACTS.emails[0];
    });
    {
      const rs = document.documentElement.style;
      if (c.cor) {
        rs.setProperty("--amber", c.cor);
        rs.setProperty("--amber-10", c.cor + "1F");
      } else {
        rs.removeProperty("--amber");
        rs.removeProperty("--amber-10");
      }
      document.querySelectorAll("img.brand-mark").forEach((im) => {
        if (!im.dataset.o) im.dataset.o = im.src;
        im.src = c.logo || im.dataset.o;
      });
      document.documentElement.classList.toggle("logo-custom", !!c.logo);
      let mt = $("#ajMaint");
      if (c.manut && c.manut.on) {
        if (!mt) {
          mt = document.createElement("div");
          mt.id = "ajMaint";
          $("#siteView").appendChild(mt);
        }
        mt.innerHTML = `<div><h2>${esc(c.manut.texto || "Voltamos em breve.")}</h2><a onclick="showAdmin()">Iniciar sess\xE3o</a></div>`;
      } else if (mt) mt.remove();
    }
    let b = $("#ajBanner");
    if (c.aviso && c.aviso.on && c.aviso.texto) {
      if (!b) {
        b = document.createElement("div");
        b.id = "ajBanner";
        $("#siteView").prepend(b);
      }
      b.innerHTML = `<span>${esc(c.aviso.texto)}</span><button aria-label="Fechar">\xD7</button>`;
      b.querySelector("button").onclick = () => b.remove();
    } else if (b) b.remove();
  }
  async function loadCfg() {
    if (!live) {
      try {
        return JSON.parse(localStorage.getItem(LK));
      } catch (e) {
        return null;
      }
    }
    const { data } = await sb.from("site_config").select("valor").eq("chave", "site").maybeSingle();
    return data && data.valor;
  }
  async function saveCfg(v) {
    if (!live) {
      localStorage.setItem(LK, JSON.stringify(v));
      return;
    }
    const { error } = await sb
      .from("site_config")
      .upsert({ chave: "site", valor: v, atualizado_em: new Date().toISOString() });
    if (error) throw error;
  }
  const API = {
    async members() {
      if (!live) return { m: demoM, c: demoC };
      const [a, b] = await Promise.all([
        sb.from("profiles").select("id,email,nome,papel").order("criado_em"),
        sb.from("convites").select("*").order("criado_em"),
      ]);
      if (a.error) throw a.error;
      if (b.error) throw b.error;
      return { m: a.data, c: b.data };
    },
    async setRole(id, papel) {
      if (!live) {
        demoM.find((x) => x.id == id).papel = papel;
        return;
      }
      const { error } = await sb.from("profiles").update({ papel }).eq("id", id);
      if (error) throw error;
    },
    async invite(email, nome, papel) {
      if (!live) {
        const e = demoM.find((x) => x.email == email);
        if (e) e.papel = papel;
        else demoC.push({ email, nome, papel });
        return;
      }
      const { error } = await sb.from("convites").upsert({ email, nome, papel });
      if (error) throw error;
    },
    async unInvite(email) {
      if (!live) {
        const i = demoC.findIndex((x) => x.email == email);
        if (i > -1) demoC.splice(i, 1);
        return;
      }
      const { error } = await sb.from("convites").delete().eq("email", email);
      if (error) throw error;
    },
  };
  const PAP = { admin: "Administrador", equipa: "Equipa", cliente: "Cliente" };
  const opts = (v, list) =>
    list
      .map(
        (k) =>
          `<option value="${k}" ${k == v ? "selected" : ""}>${k == "cliente" && list.length > 2 ? "Cliente (sem acesso interno)" : PAP[k]}</option>`,
      )
      .join("");
  function status(t, er) {
    const s = $("#admSt");
    if (s) {
      s.textContent = t;
      s.className = "st" + (er ? " er" : "");
      clearTimeout(s._t);
      if (!er) s._t = setTimeout(() => (s.textContent = ""), 3e3);
    }
  }
  async function refresh() {
    try {
      DATA = await API.members();
      renderM();
    } catch (e) {
      status("Erro: " + e.message, 1);
    }
  }
  function memberRow(u) {
    const self = ME && u.email == ME.email;
    return `<div class="rw"><div class="n"><b>${esc(u.nome || u.email)}${self ? " (voc\xEA)" : ""}</b><small>${esc(u.email)}</small></div><select data-role="${u.id}" ${self ? "disabled" : ""}>${opts(u.papel, ["admin", "equipa", "cliente"])}</select></div>`;
  }
  function renderM() {
    const eq = DATA.m.filter((u) => u.papel != "cliente"),
      cl = DATA.m.filter((u) => u.papel == "cliente");
    $("#admM").innerHTML =
      `<div class="cd"><h3>Adicionar membro</h3><p class="hn">Escreva o email da pessoa. Quando ela criar conta com esse email, entra automaticamente com o papel escolhido. Se j\xE1 tiver conta, o papel muda de imediato.</p>
 <div class="g c3"><label>Nome<input id="inNome" placeholder="Nome (opcional)"></label><label>Email<input id="inEmail" type="email" placeholder="nome@exemplo.com"></label><label>Papel<select id="inPapel"><option value="equipa">Equipa</option><option value="admin">Administrador</option></select></label></div>
 <p style="margin-top:14px"><button class="bt" data-a="inv">Adicionar membro</button></p></div>
 <div class="cd"><h3>Equipa (${eq.length})</h3><p class="hn">Administradores gerem membros e o site. A equipa gere processos.</p>${eq.map(memberRow).join("") || '<p class="hn">Ningu\xE9m ainda.</p>'}</div>
 ${DATA.c.length ? `<div class="cd"><h3>Convites pendentes (${DATA.c.length})</h3>${DATA.c.map((c) => `<div class="rw"><div class="n"><b>${esc(c.nome || c.email)}</b><small>${esc(c.email)} \xB7 ${PAP[c.papel]} \xB7 \xE0 espera de criar conta</small></div><button class="bt g2" data-un="${esc(c.email)}">Cancelar</button></div>`).join("")}</div>` : ""}
 <div class="cd"><details><summary>Clientes registados (${cl.length})</summary><div style="margin-top:10px">${cl.map(memberRow).join("") || '<p class="hn">Ainda n\xE3o h\xE1 clientes.</p>'}</div></details></div>`;
  }
  function renderS() {
    const c = CFG || {},
      [h, p] = hero(),
      w = c.wa || [],
      e = c.em || [],
      A = c.aviso || {};
    $("#admS").innerHTML =
      `<div class="cd"><h3>Aviso no topo do site</h3><p class="hn">Faixa colorida vis\xEDvel a todos os visitantes (f\xE9rias, feriados, mudan\xE7a de hor\xE1rio\u2026).</p>
 <label class="tg"><input type="checkbox" id="sAvOn" ${A.on ? "checked" : ""}> Mostrar aviso</label><label>Texto<input id="sAv" value="${esc(A.texto || "")}" placeholder="Ex.: Fechados de 24 a 26 de dezembro."></label></div>
 <div class="cd"><h3>Contactos</h3><p class="hn">Atualiza o bot\xE3o flutuante de WhatsApp, a sec\xE7\xE3o de contactos e o formul\xE1rio de cota\xE7\xE3o. N\xFAmeros s\xF3 com d\xEDgitos e indicativo (ex.: 258865686897).</p>
 <div class="g c3">${[0, 1, 2].map((i) => `<label>WhatsApp ${i + 1}<input data-wa value="${esc(w[i] ?? orig.wa[i] ?? "")}"></label>`).join("")}${[0, 1, 2].map((i) => `<label>Email ${i + 1}<input data-em value="${esc(e[i] ?? orig.em[i] ?? "")}"></label>`).join("")}</div></div>
 <div class="cd"><h3>Texto principal</h3><p class="hn">Use *asteriscos* para destacar palavras a cor.</p>
 <label>T\xEDtulo<textarea id="sT">${esc(c.titulo ?? toMd(orig.t))}</textarea></label><label style="margin-top:10px">Subt\xEDtulo<textarea id="sS">${esc(c.sub ?? p.textContent)}</textarea></label></div>
 <button class="bt" data-a="pub">Publicar altera\xE7\xF5es</button> <button class="bt g2" data-a="rst">Repor original</button>`;
  }
  function collect() {
    return {
      aviso: { on: $("#sAvOn").checked, texto: $("#sAv").value.trim() },
      wa: [...document.querySelectorAll("[data-wa]")].map((i) => i.value),
      em: [...document.querySelectorAll("[data-em]")].map((i) => i.value),
      titulo: $("#sT").value.trim(),
      sub: $("#sS").value.trim(),
    };
  }
  function build() {
    $("#view-admin").innerHTML =
      `<div id="adm"><div class="tabs"><button data-t="M" class="on">Membros</button><button data-t="S">Site</button><span id="admSt" class="st"></span></div><div id="admM"></div><div id="admS" style="display:none"></div></div>`;
    $("#adm").addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.t) {
        document
          .querySelectorAll("#adm .tabs button")
          .forEach((b) => b.classList.toggle("on", b == t));
        $("#admM").style.display = t.dataset.t == "M" ? "" : "none";
        $("#admS").style.display = t.dataset.t == "S" ? "" : "none";
        if (t.dataset.t == "S") renderS();
        document
          .querySelectorAll("#adm .xp")
          .forEach((p) => (p.style.display = p.dataset.p == t.dataset.t ? "" : "none"));
        if (window.AJ_XTAB) AJ_XTAB(t.dataset.t);
        return;
      }
      try {
        if (t.dataset.a == "inv") {
          const em = $("#inEmail").value.trim().toLowerCase();
          if (!/^\S+@\S+\.\S+$/.test(em)) return status("Email inv\xE1lido.", 1);
          t.disabled = true;
          await API.invite(em, $("#inNome").value.trim(), $("#inPapel").value);
          status("Membro adicionado.");
          await refresh();
        }
        if (t.dataset.un) {
          await API.unInvite(t.dataset.un);
          await refresh();
        }
        if (t.dataset.a == "pub") {
          const v = { ...(CFG || {}), ...collect() };
          await saveCfg(v);
          CFG = v;
          apply(v);
          status("Publicado no site.");
        }
        if (t.dataset.a == "rst") {
          if (!confirm("Repor os textos e contactos originais do site?")) return;
          await saveCfg({});
          CFG = {};
          apply({});
          renderS();
          status("Original reposto.");
        }
      } catch (x) {
        status("Erro: " + x.message, 1);
        t.disabled = false;
      }
    });
    $("#adm").addEventListener("change", async (e) => {
      const id = e.target.dataset.role;
      if (!id) return;
      if (e.target.value == "cliente" && !confirm("Retirar o acesso interno a esta pessoa?")) {
        return refresh();
      }
      try {
        await API.setRole(id, e.target.value);
        status("Papel atualizado.");
        await refresh();
      } catch (x) {
        status("Erro: " + x.message, 1);
        refresh();
      }
    });
  }
  window.AJ_SITE = {
    get: () => CFG || {},
    save: async (v) => {
      await saveCfg(v);
      CFG = v;
      apply(v);
    },
    reapply: () => apply(CFG),
  };
  window.AJ_ADMIN_START = function (me) {
    ME = me;
    if (!built) {
      built = true;
      build();
    }
    refresh();
  };
  document.addEventListener("DOMContentLoaded", () => {});
  snap();
  {
    let cc = null;
    try {
      cc = JSON.parse(localStorage.getItem("aj_cfg_cache"));
    } catch (e) {}
    if (cc) {
      CFG = cc;
      apply(cc);
    }
    (window.requestIdleCallback || setTimeout)(() =>
      loadCfg()
        .then((c) => {
          try {
            localStorage.setItem("aj_cfg_cache", JSON.stringify(c || {}));
          } catch (e) {}
          if (JSON.stringify(c || {}) !== JSON.stringify(cc || {})) {
            CFG = c;
            apply(c);
          }
        })
        .catch(() => {}),
    );
  }
  if (typeof ADMIN_VIEWS !== "undefined")
    ADMIN_VIEWS.admin = {
      title: "Administra\xE7\xE3o",
      sub: "Membros e edi\xE7\xE3o r\xE1pida do site",
    };
})();
