/* ============================================================
   extras/quote-clients-profile.js  (20 de 20)
   Extras num único módulo: siglas dos responsáveis, clientes registados, pedidos de cotação, formulário de cotação (animação de escrita), completar perfil após login com Google e definições + administração.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

/* ===== AJ extras: cotação, pedidos, clientes, perfil Google, siglas ===== */
(function () {
  const $ = (s) => document.querySelector(s),
    G = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const live = !!window.AJ_LIVE,
    sb = window.AJ_SB;
  const digits = (s) => String(s || "").replace(/\D/g, "");
  const fullTel = (s) => {
    const d = digits(s);
    return d.length == 9 && d[0] == "8" ? "258" + d : d;
  };

  /* ---------- Siglas dos responsáveis (editáveis na Administração) ---------- */
  window.AJ_OWN = window.AJ_OWN || ["JM", "AS"];
  window.AJ_RESP_APPLY = (list) => {
    if (Array.isArray(list) && list.length) AJ_OWN.splice(0, AJ_OWN.length, ...list);
    if (window.__pm) __pm.render();
  };
  if (window.AJ_SITE) AJ_RESP_APPLY(AJ_SITE.get().resp);
  window.AJ_RESP_PANE =
    () => `<div class="cd"><h3>Siglas dos responsáveis</h3><p class="hn">As siglas aparecem nos cartões dos processos e no filtro do quadro (ex.: JM, AS). Pode mudar, acrescentar ou remover.</p>
 <div id="rsList">${AJ_OWN.map((s) => `<div class="rw"><div class="n"><input data-rs-i value="${esc(s)}" maxlength="4" style="max-width:110px;text-transform:uppercase" aria-label="Sigla"></div><button class="bt g2" data-rs="del">Remover</button></div>`).join("")}</div>
 <p style="margin-top:14px"><button class="bt g2" data-rs="add">+ Adicionar sigla</button> <button class="bt" data-rs="save">Guardar siglas</button> <span class="st" id="rsSt"></span></p></div>`;
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-rs]");
    if (!b) return;
    const k = b.dataset.rs,
      list = G("rsList");
    if (k == "del") b.closest(".rw").remove();
    if (k == "add") {
      list.insertAdjacentHTML(
        "beforeend",
        `<div class="rw"><div class="n"><input data-rs-i value="" maxlength="4" placeholder="XX" style="max-width:110px;text-transform:uppercase" aria-label="Sigla"></div><button class="bt g2" data-rs="del">Remover</button></div>`,
      );
      list.lastElementChild.querySelector("input").focus();
    }
    if (k == "save") {
      const v = [
        ...new Set(
          [...document.querySelectorAll("[data-rs-i]")]
            .map((i) => i.value.trim().toUpperCase())
            .filter(Boolean),
        ),
      ];
      const st = G("rsSt");
      if (!v.length) {
        st.textContent = "Tem de existir pelo menos uma sigla.";
        st.className = "st er";
        return;
      }
      try {
        await AJ_SITE.save({ ...AJ_SITE.get(), resp: v });
        AJ_RESP_APPLY(v);
        st.textContent = "Guardado.";
        st.className = "st";
      } catch (x) {
        st.textContent = "Erro: " + x.message;
        st.className = "st er";
      }
    }
  });

  /* ---------- Clientes registados (para escolher ao criar processo) ---------- */
  (function () {
    let L = [],
      t0 = 0;
    const norm = (r) => ({
      id: r.id,
      email: (r.email || "").toLowerCase(),
      nome: (r.nome || "").trim(),
      tel: r.telefone || "",
      criado: r.criado_em || "",
    });
    async function fetchAll() {
      if (!live) {
        try {
          return JSON.parse(localStorage.getItem("aj_demo_clients") || "[]");
        } catch (e) {
          return [];
        }
      }
      const q = (c) =>
        sb
          .from("profiles")
          .select(c)
          .eq("papel", "cliente")
          .order("criado_em", { ascending: false });
      let r = await q("id,email,nome,telefone,criado_em");
      if (r.error) r = await q("id,email,nome,criado_em");
      if (r.error) throw r.error;
      return r.data.map(norm);
    }
    window.AJ_CLIENTS = {
      list: () => L,
      load(force) {
        if (!force && Date.now() - t0 < 30000) return Promise.resolve(L);
        return fetchAll()
          .then((x) => {
            L = x;
            t0 = Date.now();
            return L;
          })
          .catch(() => L);
      },
    };
  })();

  /* ---------- Pedidos de cotação ---------- */
  const PK = "aj_pedidos";
  const P = {
    async add(d) {
      if (live) {
        const { error } = await sb.from("pedidos").insert(d);
        if (error) throw error;
        return;
      }
      const a = JSON.parse(localStorage.getItem(PK) || "[]");
      a.unshift({
        id: crypto.randomUUID(),
        criado_em: new Date().toISOString(),
        estado: "novo",
        ...d,
      });
      localStorage.setItem(PK, JSON.stringify(a));
    },
    async list() {
      if (live) {
        const { data, error } = await sb
          .from("pedidos")
          .select("*")
          .order("criado_em", { ascending: false })
          .limit(200);
        if (error) throw error;
        return data;
      }
      return JSON.parse(localStorage.getItem(PK) || "[]");
    },
    async set(id, patch) {
      if (live) {
        const { error } = await sb.from("pedidos").update(patch).eq("id", id);
        if (error) throw error;
        return;
      }
      const a = JSON.parse(localStorage.getItem(PK) || "[]"),
        x = a.find((y) => y.id == id);
      if (x) Object.assign(x, patch);
      localStorage.setItem(PK, JSON.stringify(a));
    },
  };
  let PED = [],
    pedAll = false;
  const fdt = (d) =>
    d
      ? new Date(d).toLocaleString("pt-PT", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
  function badge(rows) {
    const n = rows.filter((r) => r.estado == "novo").length,
      it = G("sbnav-pedidos");
    if (!it) return;
    let b = it.querySelector(".nb");
    if (!b) {
      b = document.createElement("span");
      b.className = "nb";
      it.appendChild(b);
    }
    b.textContent = n;
    b.style.display = n ? "" : "none";
    const tb = document.querySelector("#aTabs [data-k=pedidos]");
    if (tb) {
      let t = tb.querySelector(".nb");
      if (!t) {
        t = document.createElement("em");
        t.className = "nb";
        tb.appendChild(t);
      }
      t.textContent = n;
      t.style.display = n ? "" : "none";
    }
  }
  function pedCard(d) {
    const st =
      d.estado == "novo"
        ? ["Novo", "novo"]
        : d.estado == "convertido"
          ? ["Processo criado", "conv"]
          : ["Tratado", "trat"];
    const wa = fullTel(d.contacto),
      txt = encodeURIComponent(
        `Olá ${d.nome || ""}! Recebemos o seu pedido de cotação (${d.carga || "carga"}${d.origem ? ", " + d.origem + " → " + (d.destino || "") : ""}). `,
      );
    return `<div class="pd ${st[1]}" data-id="${esc(d.id)}">
   <div class="pd-h"><b>${esc(d.nome || "Sem nome")}</b><span class="pd-st ${st[1]}">${st[0]}</span><small>${fdt(d.criado_em)}</small></div>
   <div class="pd-g">
    <div><label>Contacto</label>${esc(d.contacto || "—")}</div>
    <div><label>Email</label>${esc(d.email || "—")}</div>
    <div><label>Carga</label>${esc(d.carga || "—")}</div>
    <div><label>Rota</label>${esc(d.origem || "?")} → ${esc(d.destino || "?")}</div>
   </div>
   ${d.mensagem ? `<p class="pd-m">${esc(d.mensagem)}</p>` : ""}
   <div class="pd-a">
    ${d.estado == "convertido" ? `<button class="btn2" data-pd="open">Ver processo</button>` : `<button class="btn2 pri" data-pd="proc">Criar processo</button>`}
    ${wa ? `<a class="btn2" href="https://wa.me/${wa}?text=${txt}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
    ${d.estado == "novo" ? `<button class="btn2" data-pd="done">Marcar como tratado</button>` : d.estado == "tratado" ? `<button class="btn2" data-pd="reopen">Reabrir</button>` : ""}
   </div></div>`;
  }
  async function renderPed() {
    const v = G("view-pedidos");
    if (!v) return;
    if (!PED.length) v.innerHTML = '<div class="empty">A carregar…</div>';
    try {
      PED = await P.list();
    } catch (e) {
      v.innerHTML = `<div class="notes-card"><b>Não foi possível carregar os pedidos.</b><p class="hn" style="margin-top:6px">${esc(e.message || e)}. Se é a primeira vez, falta executar o ficheiro supabase_setup.sql no Supabase.</p></div>`;
      return;
    }
    badge(PED);
    const show = PED.filter((d) => pedAll || d.estado == "novo");
    v.innerHTML =
      `<div class="tb" style="margin-bottom:14px"><div class="tabs"><button class="${pedAll ? "" : "on"}" data-pdf="0">Novos (${PED.filter((d) => d.estado == "novo").length})</button><button class="${pedAll ? "on" : ""}" data-pdf="1">Todos (${PED.length})</button></div></div>` +
      (show.length
        ? show.map(pedCard).join("")
        : `<div class="notes-card"><div class="empty">${pedAll ? "Ainda não há pedidos." : "Sem pedidos novos. Quando alguém pedir uma cotação no site, aparece aqui."}</div></div>`);
    const s = G("topbarSub");
    if (s && G("view-pedidos").style.display != "none")
      s.textContent = `${PED.filter((d) => d.estado == "novo").length} novo(s) · ${PED.length} no total`;
  }
  document.addEventListener("click", async (e) => {
    const f = e.target.closest("[data-pdf]");
    if (f) {
      pedAll = f.dataset.pdf == "1";
      return renderPed();
    }
    const b = e.target.closest("[data-pd]");
    if (!b) return;
    const id = b.closest(".pd").dataset.id,
      d = PED.find((x) => x.id == id);
    if (!d) return;
    try {
      if (b.dataset.pd == "proc") {
        if (!window.__pm) return alert("Abra primeiro a área de processos.");
        b.disabled = true;
        switchAdminView("processos", G("sbnav-processos"));
        const i = __pm.createFrom({
          client: d.nome || "",
          cemail: (d.email || "").toLowerCase(),
          tel: fullTel(d.contacto),
          cargo: (d.carga || "").replace(/ \(carro\)$/, ""),
          from: d.origem || "",
          to: d.destino || "Lichinga",
          notes: `Pedido de cotação de ${fdt(d.criado_em)}.${d.mensagem ? "\n" + d.mensagem : ""}`,
        });
        await P.set(id, { estado: "convertido", processo_id: i.id });
        PED = [];
        return;
      }
      if (b.dataset.pd == "open" && d.processo_id) {
        switchAdminView("processos", G("sbnav-processos"));
        return;
      }
      if (b.dataset.pd == "done") await P.set(id, { estado: "tratado" });
      if (b.dataset.pd == "reopen") await P.set(id, { estado: "novo" });
      PED = await P.list();
      renderPed();
    } catch (x) {
      alert("Erro: " + (x.message || x));
    }
  });
  const _sw = window.switchAdminView;
  window.switchAdminView = function (n, el) {
    const r = _sw(n, el);
    if (n == "pedidos") renderPed();
    if (n == "clientes")
      setTimeout(() => {
        const c = document.querySelectorAll("#view-clientes .client-row.cr").length,
          t = G("topbarSub");
        if (t) t.textContent = c + " cliente" + (c == 1 ? "" : "s");
      }, 80);
    return r;
  };
  document.addEventListener("aj:login", (e) => {
    const m = e.detail || {};
    if (m.role != "admin" && m.role != "equipa") return;
    const go = () =>
      P.list()
        .then(badge)
        .catch(() => {});
    go();
    if (!window.__pedT)
      window.__pedT = setInterval(() => {
        if (document.visibilityState == "visible") go();
      }, 6e4);
  });

  /* ---------- Formulário de cotação ---------- */
  (function () {
    const F = G("quoteForm");
    if (!F) return;
    const L = {
      1: "Passo 1 de 3 — Os seus dados",
      2: "Passo 2 de 3 — A sua carga",
      3: "Passo 3 de 3 — Detalhes",
    };
    let carga = "",
      ME = null,
      saved = false;
    const err = (el, msg) => {
      const f = el.closest(".field") || el.parentElement;
      let e = f.querySelector(".fe");
      if (!msg) {
        if (e) e.remove();
        el.removeAttribute("aria-invalid");
        return;
      }
      if (!e) {
        e = document.createElement("div");
        e.className = "fe";
        f.appendChild(e);
      }
      e.textContent = msg;
      el.setAttribute("aria-invalid", "true");
    };
    function go(n) {
      F.querySelectorAll(".form-step").forEach((s) => s.classList.remove("active"));
      G(n == "Done" ? "formStepDone" : "formStep" + n).classList.add("active");
      [1, 2, 3].forEach((i) => G("dot" + i).classList.toggle("active", n == "Done" || i <= n));
      if (n != "Done") G("stepLabel").textContent = L[n];
      else G("stepLabel").textContent = "Pedido pronto";
      if (n == 3) summary();
      const top = F.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.6)
        F.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function who() {
      const logged = !!ME;
      G("qfEmailF").hidden = logged;
      G("qfLoginNote").hidden = logged;
      const w = G("qfWho");
      w.hidden = !logged;
      if (logged) {
        w.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><span>Sessão iniciada como <b>${esc(ME.email)}</b>. O pedido fica ligado à sua conta.</span>`;
        if (!G("nome").value) G("nome").value = ME.nome || "";
      }
    }
    document.addEventListener("aj:login", (e) => {
      ME = e.detail;
      who();
    });
    if (window.AJ_ME) {
      ME = window.AJ_ME;
      who();
    }
    function summary() {
      const c = carga == "Outro" ? G("qfCargaOutro").value.trim() || "Outro" : carga;
      G("qfSum").innerHTML =
        `<div><label>Para</label>${esc(G("nome").value.trim())}</div><div><label>Carga</label>${esc(c || "—")}</div><div><label>Rota</label>${esc(G("qfO").value.trim() || "?")} → ${esc(G("qfD").value.trim() || "?")}</div>`;
    }
    function step1() {
      let ok = true;
      const n = G("nome"),
        t = G("tel"),
        m = G("qfEmail");
      err(n, "");
      err(t, "");
      err(m, "");
      if (n.value.trim().length < 2) {
        err(n, "Indique o seu nome ou empresa.");
        ok = false;
      }
      if (digits(t.value).length < 9) {
        err(t, "Indique um telefone ou WhatsApp válido.");
        ok = false;
      }
      if (!ME && !/^\S+@\S+\.\S+$/.test(m.value.trim())) {
        err(m, "Indique um email válido para lhe respondermos.");
        ok = false;
      }
      if (!ok) F.querySelector("[aria-invalid]").focus();
      return ok;
    }
    function step2() {
      const c = G("qfCarga");
      let ok = true;
      const old = c.parentElement.querySelector(".fe");
      if (old) old.remove();
      if (!carga) {
        const e = document.createElement("div");
        e.className = "fe";
        e.textContent = "Escolha o tipo de carga.";
        c.parentElement.appendChild(e);
        ok = false;
      }
      return ok;
    }
    async function send() {
      const nome = G("nome").value.trim(),
        tel = G("tel").value.trim(),
        email = ME ? ME.email : G("qfEmail").value.trim().toLowerCase();
      const c = carga == "Outro" ? G("qfCargaOutro").value.trim() || "Outro" : carga;
      const o = G("qfO").value.trim(),
        d = G("qfD").value.trim(),
        msg = G("msg").value.trim();
      const corpo = `Novo pedido de cotação — site AJ Serviços LDA\n\nNome/Empresa: ${nome}\nContacto: ${tel}\nEmail: ${email || "Não indicado"}\nTipo de carga: ${c || "Não indicado"}\nOrigem -> Destino: ${o || "?"} -> ${d || "?"}\nDetalhes adicionais: ${msg || "Sem informação adicional"}`;
      AJ_CONTACTS.whatsapp.forEach((num, i) => {
        const b = G("waBtn" + (i + 1));
        if (b) b.href = `https://wa.me/${num}?text=${encodeURIComponent(corpo)}`;
      });
      G("mailBtn").href =
        `mailto:${AJ_CONTACTS.emails.join(",")}?subject=${encodeURIComponent("Pedido de cotação — " + nome)}&body=${encodeURIComponent(corpo)}`;
      const sv = G("qfSaved");
      sv.textContent = "A registar o pedido…";
      sv.className = "qf-saved";
      go("Done");
      if (saved) {
        sv.textContent = "";
        return;
      }
      try {
        let uid = null;
        if (live) {
          const { data } = await sb.auth.getSession();
          uid = data.session && data.session.user.id;
        }
        await P.add({
          nome,
          contacto: tel,
          email: email || null,
          carga: c || null,
          origem: o || null,
          destino: d || null,
          mensagem: msg || null,
          user_id: uid,
        });
        saved = true;
        sv.textContent = "✓ Pedido registado. A nossa equipa já o pode ver.";
        sv.className = "qf-saved ok";
      } catch (x) {
        sv.textContent = "Não foi possível registar online. Envie por WhatsApp ou email abaixo.";
        sv.className = "qf-saved bad";
      }
    }
    function reset() {
      F.reset();
      carga = "";
      saved = false;
      F.querySelectorAll(".qf-chip").forEach((c) => c.setAttribute("aria-checked", "false"));
      G("qfCargaOutro").hidden = true;
      G("qfD").value = "Lichinga";
      F.querySelectorAll(".fe").forEach((e) => e.remove());
      F.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
      who();
      go(1);
    }
    F.addEventListener("click", (e) => {
      const t = e.target.closest("[data-qf]");
      if (!t) return;
      const k = t.dataset.qf;
      if (k == "login" || k == "signup") {
        e.preventDefault();
        return window.AJ_OPEN && AJ_OPEN(k);
      }
      if (k == "next1" && step1()) go(2);
      if (k == "prev2") go(1);
      if (k == "next2" && step2()) go(3);
      if (k == "prev3") go(2);
      if (k == "send") send();
      if (k == "reset") reset();
      if (k == "cargo") {
        carga = t.dataset.v;
        F.querySelectorAll(".qf-chip").forEach((c) =>
          c.setAttribute("aria-checked", String(c === t)),
        );
        const o = G("qfCargaOutro");
        o.hidden = carga != "Outro";
        if (carga == "Outro") o.focus();
        const old = G("qfCarga").parentElement.querySelector(".fe");
        if (old) old.remove();
      }
      if (k == "org") {
        G("qfO").value = t.dataset.v == "Não sei" ? "" : t.dataset.v;
        if (t.dataset.v == "Não sei") G("qfO").placeholder = "";
        G("qfD").focus();
      }
      if (k == "swap") {
        const a = G("qfO"),
          b = G("qfD"),
          v = a.value;
        a.value = b.value;
        b.value = v;
      }
    });
    F.addEventListener("input", (e) => {
      if (e.target.matches("[aria-invalid]")) err(e.target, "");
    });
    G("qfD").value = "Lichinga";
    /* animação de escrita (placeholder com cursor) */
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function typer(span, input, words, delay) {
      if (rm) {
        span.textContent = words[0];
        return;
      }
      let w = 0,
        c = 0,
        del = false;
      const tick = () => {
        if (input.value || document.activeElement === input) {
          span.textContent = "";
          return setTimeout(tick, 400);
        }
        const word = words[w];
        if (!del) {
          c++;
          span.textContent = word.slice(0, c);
          if (c == word.length) {
            del = true;
            return setTimeout(tick, 1500);
          }
        } else {
          c--;
          span.textContent = word.slice(0, c);
          if (c == 0) {
            del = false;
            w = (w + 1) % words.length;
            return setTimeout(tick, 350);
          }
        }
        setTimeout(tick, del ? 35 : 85);
      };
      setTimeout(tick, delay);
    }
    let started = false;
    new IntersectionObserver((es, ob) => {
      if (es[0].isIntersecting && !started) {
        started = true;
        ob.disconnect();
        typer(
          G("qfPhO"),
          G("qfO"),
          ["Dar es Salaam", "Mbeya", "Mtwara", "Nampula", "Japão", "Escreva a origem…"],
          0,
        );
        typer(G("qfPhD"), G("qfD"), ["Lichinga", "Cuamba", "Nampula", "Escreva o destino…"], 600);
      }
    }).observe(F);
  })();

  /* ---------- Completar perfil depois do login com Google ---------- */
  (function () {
    if (!live) return;
    let shown = false;
    document.addEventListener("aj:login", async () => {
      if (shown) return;
      const { data } = await sb.auth.getSession();
      const u = data.session && data.session.user;
      if (!u) return;
      const md = u.user_metadata || {},
        prov = (u.app_metadata && u.app_metadata.provider) || "email";
      if (md.perfil_ok) return;
      if (prov == "email" && (md.nome || md.full_name)) return;
      shown = true;
      open(u, md);
    });
    function open(u, md) {
      const nome0 = md.nome || md.full_name || md.name || "";
      const el = document.createElement("div");
      el.id = "pfM";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-labelledby", "pfT");
      el.innerHTML = `<div class="pf-box"><div class="pf-ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg></div>
     <h2 id="pfT">Complete o seu perfil</h2>
     <p>Entrou com a sua conta Google. Confirme os dados abaixo para podermos associar os seus processos e pedidos de cotação.</p>
     <label>Nome completo<input id="pfN" value="${esc(nome0)}" autocomplete="name" placeholder="O seu nome"></label>
     <label>Email<input id="pfE" value="${esc(u.email)}" readonly></label>
     <label>Telefone / WhatsApp<input id="pfT2" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ex.: 84 123 4567"></label>
     <label>Empresa <small>(opcional)</small><input id="pfC" autocomplete="organization" placeholder="Nome da empresa"></label>
     <div class="fe" id="pfErr"></div>
     <button class="btn btn-solid btn-round" id="pfOk" type="button">Guardar e continuar</button>
     <a href="#" id="pfOut">Sair e continuar mais tarde</a></div>`;
      document.body.appendChild(el);
      document.body.style.overflow = "hidden";
      G("pfN").focus();
      G("pfOut").onclick = (ev) => {
        ev.preventDefault();
        document.body.style.overflow = "";
        window.AJ_LOGOUT && AJ_LOGOUT();
      };
      G("pfOk").onclick = async () => {
        const nome = G("pfN").value.trim(),
          tel = G("pfT2").value.trim(),
          emp = G("pfC").value.trim(),
          er = G("pfErr");
        er.textContent = "";
        if (nome.length < 2) return (er.textContent = "Indique o seu nome.");
        if (digits(tel).length < 9) return (er.textContent = "Indique um telefone válido.");
        const b = G("pfOk");
        b.disabled = true;
        b.textContent = "A guardar…";
        try {
          const r2 = await sb.auth.updateUser({
            data: { nome, telefone: tel, empresa: emp, perfil_ok: true },
          });
          if (r2.error) throw r2.error;
          let r = await sb.rpc("completar_perfil", { p_nome: nome, p_telefone: tel });
          if (r.error) {
            r = await sb.from("profiles").update({ nome, telefone: tel }).eq("id", u.id);
            if (r.error) r = await sb.from("profiles").update({ nome }).eq("id", u.id);
          }
          if (r.error)
            console.warn(
              "Perfil: corra o supabase_setup.sql para guardar o nome na tabela profiles.",
              r.error.message,
            );
          try {
            const p = JSON.parse(localStorage.getItem("aj_prof") || "null");
            if (p) {
              p.nome = nome;
              localStorage.setItem("aj_prof", JSON.stringify(p));
            }
          } catch (x) {}
          if (window.AJ_ME) {
            AJ_ME.nome = nome;
            document.dispatchEvent(new CustomEvent("aj:login", { detail: AJ_ME }));
          }
          const hi = G("cvHi");
          if (hi) hi.textContent = "Olá, " + nome.split(" ")[0];
          document.body.style.overflow = "";
          el.remove();
        } catch (x) {
          er.textContent = "Não foi possível guardar: " + (x.message || x);
          b.disabled = false;
          b.textContent = "Guardar e continuar";
        }
      };
    }
  })();

  /* ---------- Definições + Administração numa só página ---------- */
  (function () {
    const def = G("view-definicoes");
    if (!def || G("defTabs")) return;
    const geral = document.createElement("div");
    geral.id = "defGeral";
    while (def.firstChild) geral.appendChild(def.firstChild);
    const bar = document.createElement("div");
    bar.id = "defTabs";
    bar.innerHTML =
      '<button class="on" data-d="geral">Geral</button><button data-d="admin">Administração</button>';
    const adm = document.createElement("div");
    adm.id = "defAdmin";
    adm.style.display = "none";
    def.append(bar, geral, adm);
    const isAdmin = () => {
      const a = G("sbnav-admin");
      return !!a && a.style.display != "none";
    };
    function tab(k) {
      bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.d == k));
      geral.style.display = k == "geral" ? "" : "none";
      adm.style.display = k == "admin" ? "" : "none";
    }
    function mv() {
      const a = G("adm");
      if (a && a.parentNode !== adm) adm.appendChild(a);
      const ad = isAdmin();
      bar.style.display = ad ? "" : "none";
      if (!ad) tab("geral");
    }
    bar.style.display = "none";
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-d]");
      if (b) {
        mv();
        tab(b.dataset.d);
      }
    });
    const sa = window.AJ_ADMIN_START;
    if (sa)
      window.AJ_ADMIN_START = function (me) {
        const r = sa(me);
        setTimeout(mv, 0);
        return r;
      };
    const sw2 = window.switchAdminView;
    window.switchAdminView = function (n, el) {
      if (n == "admin") {
        const r = sw2("definicoes", G("sbnav-definicoes"));
        mv();
        tab("admin");
        return r;
      }
      const r = sw2(n, el);
      if (n == "definicoes") mv();
      return r;
    };
    document.addEventListener("aj:login", () => setTimeout(mv, 80));
  })();
})();
