/* ============================================================
   core/auth-database.js  (11 de 20)
   Cliente Supabase (AJ_SB), camada de dados AJ_DB (carregar/guardar processos), login, registo, recuperação de palavra-passe e área do cliente.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const CFG = window.AJ_CONFIG || {},
    $ = (s) => document.querySelector(s);
  const live = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  const sb = live ? supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null;
  window.AJ_SB = sb;
  window.AJ_LIVE = live;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const VIEWS = ["siteView", "loginView", "clientView", "adminView"];
  const show = (id, pop) => {
    if (id == "siteView" && !pop && history.state && history.state.v) {
      history.back();
      return;
    }
    VIEWS.forEach((v) => ($("#" + v).style.display = v == id ? "block" : "none"));
    scrollTo(0, 0);
    AJ_UI_SET("area", id == "adminView" ? "admin" : id == "clientView" ? "client" : "");
    if (!pop && id != "siteView") history.pushState({ v: id }, "");
  };
  addEventListener("popstate", (e) => show((e.state && e.state.v) || "siteView", true));
  function status(t, err) {
    const s = $("#ajSync");
    s.textContent = t;
    s.className = err ? "err" : "";
    s.style.display = "block";
    clearTimeout(s._t);
    if (!err) s._t = setTimeout(() => (s.style.display = "none"), 1800);
  }
  let snap = new Map(),
    cur = null,
    timer = null;
  const rowC = (c, i) => ({ id: c.id, pos: i, nome: c.name, cor: c.color });
  const rowP = (p, i) => ({
    id: p.id,
    pos: i,
    num: p.num,
    cliente: p.client,
    mercadoria: p.cargo,
    origem: p.from,
    destino: p.to,
    responsavel: p.owner,
    prioridade: p.prio,
    prazo: p.due || null,
    coluna_id: p.col,
    checklist: (p.stages && p.stages.length
      ? [{ t: "__fases__", m: 1, f: p.stages, k: p.stage | 0 }]
      : []
    ).concat(p.check),
    notas: p.notes,
    log: p.log,
    cliente_email: (p.cemail || "").trim().toLowerCase() || null,
    mensagem_cliente: p.cmsg || "",
    telefone_cliente: p.tel || null,
    referencia: p.ref || null,
    valor: p.valor === "" || p.valor == null ? null : +p.valor,
    etiquetas: p.tags || [],
    arquivado: !!p.arch,
    docs: p.docs || [],
  });
  const chk = (r) => {
    if (r.error) throw r.error;
  };
  async function flush() {
    const S = cur,
      cr = S.cols.map(rowC),
      pr = S.items.map(rowP),
      J = JSON.stringify;
    const cc = cr.filter((r) => snap.get("c" + r.id) !== J(r)),
      pc = pr.filter((r) => snap.get("p" + r.id) !== J(r));
    const gone = (k) =>
      [...snap.keys()]
        .filter((x) => x[0] == k && !(k == "c" ? cr : pr).some((r) => k + r.id == x))
        .map((x) => x.slice(1));
    const dp = gone("p"),
      dc = gone("c");
    try {
      if (cc.length) chk(await sb.from("colunas").upsert(cc));
      if (pc.length) chk(await sb.from("processos").upsert(pc));
      if (dp.length) chk(await sb.from("processos").delete().in("id", dp));
      if (dc.length) chk(await sb.from("colunas").delete().in("id", dc));
      cc.forEach((r) => snap.set("c" + r.id, J(r)));
      pc.forEach((r) => snap.set("p" + r.id, J(r)));
      dp.forEach((i) => snap.delete("p" + i));
      dc.forEach((i) => snap.delete("c" + i));
      DB.lastSave = Date.now();
      try {
        localStorage.setItem("aj_pm_cache", JSON.stringify(S));
      } catch (e) {}
      status("\u2713 Guardado");
    } catch (e) {
      status("Erro ao guardar: " + (e.message || e), true);
    }
  }
  const DB = (window.AJ_DB = {
    demo: !live,
    lastSave: 0,
    async load() {
      if (live) {
        let c = null;
        try {
          c = JSON.parse(localStorage.getItem("aj_pm_cache"));
        } catch (e) {}
        if (c && c.cols && c.items) {
          snap = new Map();
          c.cols.forEach((x, i) => snap.set("c" + x.id, JSON.stringify(rowC(x, i))));
          c.items.forEach((x, i) => snap.set("p" + x.id, JSON.stringify(rowP(x, i))));
          setTimeout(() => window.__pm && window.__pm.reload(), 150);
          return c;
        }
      }
      return DB.fresh();
    },
    async fresh() {
      if (!live) {
        try {
          const s = JSON.parse(localStorage.getItem("aj_processos_v1"));
          return s && s.cols ? s : null;
        } catch (e) {
          return null;
        }
      }
      const [c, p] = await Promise.all([
        sb.from("colunas").select("*").order("pos"),
        sb.from("processos").select("*").order("pos"),
      ]);
      chk(c);
      chk(p);
      let cols = c.data.map((r) => ({ id: r.id, name: r.nome, color: r.cor }));
      const items = p.data.map((r) => ({
        id: r.id,
        num: r.num,
        client: r.cliente || "",
        cargo: r.mercadoria || "",
        from: r.origem || "",
        to: r.destino || "",
        owner: r.responsavel || "",
        prio: r.prioridade || "media",
        due: r.prazo || "",
        col: r.coluna_id,
        check: (r.checklist || []).filter((x) => !(x && x.m)),
        stages: ((r.checklist || []).find((x) => x && x.m) || {}).f,
        stage: ((r.checklist || []).find((x) => x && x.m) || {}).k | 0,
        notes: r.notas || "",
        log: r.log || [],
        cemail: r.cliente_email || "",
        cmsg: r.mensagem_cliente || "",
        tel: r.telefone_cliente || "",
        ref: r.referencia || "",
        valor: r.valor == null ? "" : r.valor,
        tags: r.etiquetas || [],
        arch: !!r.arquivado,
        docs: r.docs || [],
      }));
      snap = new Map();
      cols.forEach((x, i) => snap.set("c" + x.id, JSON.stringify(rowC(x, i))));
      items.forEach((x, i) => snap.set("p" + x.id, JSON.stringify(rowP(x, i))));
      const S = { cols, items };
      if (!cols.length) {
        S.cols = [
          ["Em espera", "#7A7F87"],
          ["Em an\xE1lise", "#3E5C8A"],
          ["Pago", "#C8873C"],
          ["Conclu\xEDdo", "#4C6E5A"],
        ].map(([name, color]) => ({ id: crypto.randomUUID(), name, color }));
        DB.save(S);
      }
      try {
        localStorage.setItem("aj_pm_cache", JSON.stringify(S));
      } catch (e) {}
      return S;
    },
    save(S) {
      cur = S;
      if (!live) {
        try {
          localStorage.setItem("aj_processos_v1", JSON.stringify(S));
        } catch (e) {}
        return;
      }
      clearTimeout(timer);
      status("A guardar\u2026");
      timer = setTimeout(flush, 500);
    },
    async flushNow() {
      if (!live) return;
      clearTimeout(timer);
      if (cur) await flush();
    },
  });
  let mode = "login",
    me = null,
    pending = "",
    cool = null;
  const G = (id) => document.getElementById(id);
  const COPY = {
    login: ["Bem-vindo de volta", "Inicie sess\xE3o para aceder \xE0 sua \xE1rea.", "Entrar"],
    signup: [
      "Crie a sua conta",
      "Demora menos de um minuto. Depois ligamos os seus processos \xE0 conta.",
      "Criar conta",
    ],
    forgot: [
      "Recuperar palavra-passe",
      "Indique o seu email e enviamos uma liga\xE7\xE3o para definir uma nova.",
      "Enviar liga\xE7\xE3o",
    ],
    reset: [
      "Definir palavra-passe",
      "Escolha a palavra-passe que vai usar daqui para a frente.",
      "Guardar e entrar",
    ],
  };
  const LV = ["Muito fraca", "Fraca", "Razo\xE1vel", "Boa", "Forte"],
    LC = ["#C83C3C", "#C8873C", "#C8B13C", "#4C8A64", "#2E9E5B"];
  const score = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const msg = (t) => (G("auErr").textContent = t || "");
  function meter() {
    const p = G("auPass").value,
      m = G("auMeter"),
      s = score(p);
    m.classList.toggle("on", !!p && (mode == "signup" || mode == "reset"));
    const b = m.querySelector("i");
    b.style.width = (p ? (s + 1) * 20 : 0) + "%";
    b.style.background = LC[s];
    m.querySelector("span").textContent = p ? LV[s] : "";
  }
  function busy(v) {
    const b = G("auBtn");
    b.disabled = v;
    b.classList.toggle("load", v);
  }
  function setMode(m) {
    mode = m;
    const c = COPY[m],
      on = (id, v) => (G(id).style.display = v ? "" : "none");
    G("auH").textContent = c[0];
    G("auP").textContent = c[1];
    G("auBtn").firstElementChild.textContent = c[2];
    on("fName", m == "signup");
    on("fEmail", m != "reset");
    on("fPass", m != "forgot");
    on("fPass2", m == "signup" || m == "reset");
    on("fTerms", m == "signup");
    on("fRow", m == "login");
    on("auTabs", m == "login" || m == "signup");
    G("auForm").hidden = false;
    G("auDone").hidden = true;
    busy(false);
    G("auPassL").textContent = m == "reset" ? "Nova palavra-passe" : "Palavra-passe";
    G("auPass").autocomplete = m == "login" ? "current-password" : "new-password";
    document
      .querySelectorAll("#auTabs button")
      .forEach((b) => b.classList.toggle("on", b.dataset.m == m));
    G("auAlt").innerHTML =
      m == "forgot"
        ? '<a href="#" data-m="login">\u2190 Voltar a iniciar sess\xE3o</a>'
        : m == "login"
          ? 'Ainda n\xE3o tem conta? <a href="#" data-m="signup">Criar conta</a>'
          : m == "signup"
            ? 'J\xE1 tem conta? <a href="#" data-m="login">Iniciar sess\xE3o</a>'
            : "";
    G("lgDemo").style.display = live ? "none" : "block";
    G("auG").style.display = live && (m == "login" || m == "signup") ? "" : "none";
    msg();
    meter();
    setTimeout(() => G(m == "signup" ? "auName" : m == "reset" ? "auPass" : "auEmail").focus(), 60);
  }
  const loginMode = setMode;
  function fail(x) {
    const t = ((x && x.message) || "").toLowerCase();
    if (/invalid login/.test(t)) return "Email ou palavra-passe incorretos.";
    if (/already registered|already been registered/.test(t))
      return "J\xE1 existe uma conta com este email. Inicie sess\xE3o.";
    if (/rate limit|too many|after \d+ seconds/.test(t))
      return "Demasiadas tentativas. Aguarde um momento e tente de novo.";
    if (/signups? not allowed|disabled/.test(t))
      return "O registo de novas contas est\xE1 desativado.";
    if (/weak|at least/.test(t)) return "A palavra-passe \xE9 demasiado fraca ou curta.";
    if (/fetch|network/.test(t)) return "Sem liga\xE7\xE3o. Verifique a internet e tente de novo.";
    return "Ocorreu um erro: " + ((x && x.message) || "tente novamente");
  }
  function showDone(kind, email) {
    pending = email;
    G("auForm").hidden = true;
    G("auTabs").style.display = "none";
    G("auH").textContent = "Verifique o seu email";
    G("auP").textContent = "";
    G("auAlt").innerHTML = "";
    const d = G("auDone");
    d.hidden = false;
    d.dataset.kind = kind;
    d.innerHTML = `<div class="au-ic">\u2709</div><p>${kind == "confirm" ? "Envi\xE1mos uma liga\xE7\xE3o de confirma\xE7\xE3o para" : "Se existir uma conta com"} <b>${esc(email)}</b>${kind == "confirm" ? ". Abra-a para ativar a conta e depois inicie sess\xE3o." : ", envi\xE1mos uma liga\xE7\xE3o para definir uma nova palavra-passe."}</p><p class="s">N\xE3o a encontra? Veja tamb\xE9m a pasta de spam.</p><button class="au-btn ghost" id="auResend" type="button">Reenviar email</button><a class="au-back2" data-m="login">\u2190 Voltar a iniciar sess\xE3o</a>`;
    startCool();
  }
  function startCool() {
    const b = G("auResend");
    let n = 30;
    clearInterval(cool);
    b.disabled = true;
    const t = () => {
      b.textContent = n > 0 ? `Reenviar email (${n}s)` : "Reenviar email";
      if (n-- <= 0) {
        clearInterval(cool);
        b.disabled = false;
      }
    };
    t();
    cool = setInterval(t, 1e3);
  }
  const back = () => location.href.split("#")[0];
  document.addEventListener("click", async (e) => {
    const m = e.target.closest("#loginView [data-m]");
    if (m) {
      e.preventDefault();
      return setMode(m.dataset.m);
    }
    if (e.target.id == "auResend") {
      const k = G("auDone").dataset.kind;
      if (live) {
        const r =
          k == "confirm"
            ? await sb.auth.resend({
                type: "signup",
                email: pending,
                options: { emailRedirectTo: back() },
              })
            : await sb.auth.resetPasswordForEmail(pending, { redirectTo: back() });
        if (r.error) return alert(fail(r.error));
      }
      startCool();
    }
  });
  G("auPass").addEventListener("input", meter);
  G("auEye").onclick = () => {
    const h = G("auPass").type == "password";
    G("auPass").type = G("auPass2").type = h ? "text" : "password";
    G("auEye").textContent = h ? "Ocultar" : "Mostrar";
  };
  G("auForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    msg();
    const email = G("auEmail").value.trim().toLowerCase(),
      pw = G("auPass").value,
      pw2 = G("auPass2").value,
      nome = G("auName").value.trim();
    if (mode != "reset" && !/^\S+@\S+\.\S+$/.test(email))
      return msg("Introduza um email v\xE1lido.");
    if (mode == "signup" && nome.length < 2) return msg("Indique o seu nome.");
    if (mode != "forgot" && !pw) return msg("Introduza a palavra-passe.");
    if (mode == "signup" || mode == "reset") {
      if (pw.length < 8) return msg("A palavra-passe deve ter pelo menos 8 caracteres.");
      if (score(pw) < 2)
        return msg(
          "Escolha uma palavra-passe mais forte: misture mai\xFAsculas, n\xFAmeros ou s\xEDmbolos.",
        );
      if (pw !== pw2) return msg("As palavras-passe n\xE3o coincidem.");
    }
    if (mode == "signup" && !G("auTerms").checked)
      return msg("Tem de aceitar os termos para criar a conta.");
    busy(true);
    try {
      if (!live) {
        if (mode == "forgot") {
          busy(false);
          return showDone("forgot", email);
        }
        return await enter(
          { email, user_metadata: { nome: nome || email.split("@")[0] } },
          /^admin/i.test(email) ? "admin" : /^equipa/i.test(email) ? "equipa" : "cliente",
        );
      }
      if (mode == "login") {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) {
          if (/not confirmed/i.test(error.message)) {
            busy(false);
            return showDone("confirm", email);
          }
          throw error;
        }
        await enter(data.user);
      } else if (mode == "signup") {
        const { data, error } = await sb.auth.signUp({
          email,
          password: pw,
          options: { data: { nome }, emailRedirectTo: back() },
        });
        if (error) throw error;
        if (data.user && data.user.identities && !data.user.identities.length)
          throw { message: "already registered" };
        if (data.session) await enter(data.user);
        else {
          busy(false);
          showDone("confirm", email);
        }
      } else if (mode == "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: back() });
        if (error) throw error;
        busy(false);
        showDone("forgot", email);
      } else {
        const { data, error } = await sb.auth.updateUser({ password: pw });
        if (error) throw error;
        history.replaceState(null, "", location.pathname);
        await enter(data.user);
      }
    } catch (x) {
      msg(fail(x));
    }
    busy(false);
  });
  G("auGoogle").onclick = async () => {
    msg();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: back(), queryParams: { prompt: "select_account" } },
    });
    if (error)
      msg(
        /not enabled|unsupported/i.test(error.message)
          ? "O in\xEDcio de sess\xE3o com Google ainda n\xE3o est\xE1 ativado."
          : fail(error),
      );
  };
  window.AJ_OPEN = async (m) => {
    if (live) {
      const { data } = await sb.auth.getSession();
      if (data.session) return enter(data.session.user);
    } else if (me) return enter({ email: me.email, user_metadata: { nome: me.nome } }, me.role);
    setMode(m);
    show("loginView");
  };
  window.showSite = () => show("siteView");
  window.showAdmin = async () => {
    if (live) {
      const { data } = await sb.auth.getSession();
      if (data.session) return enter(data.session.user);
    }
    setMode("login");
    show("loginView");
  };
  async function logout() {
    try {
      ["aj_ui", "aj_pm_cache", "aj_prof"].forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    if (live) await sb.auth.signOut();
    location.href = location.pathname;
  }
  window.AJ_ENTER = (u, r) => enter(u, r);
  window.AJ_LOGOUT = logout;
  window.AJ_LOGOUT_ALL = async () => {
    try {
      ["aj_ui", "aj_pm_cache", "aj_prof"].forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    if (live) await sb.auth.signOut({ scope: "global" });
    location.href = location.pathname;
  };
  $("#cvOut").onclick = logout;
  (function () {
    const bk = document.querySelector("#adminView .sb-back");
    const o = bk.cloneNode(true);
    o.lastChild.textContent = "Terminar sess\xE3o";
    o.onclick = logout;
    o.style.marginTop = "10px";
    bk.after(o);
  })();
  async function enter(user, demoRole) {
    let role = demoRole || "cliente",
      nome = (user.user_metadata && user.user_metadata.nome) || user.email.split("@")[0];
    if (live) {
      let pc = null;
      try {
        pc = JSON.parse(localStorage.getItem("aj_prof"));
      } catch (e) {}
      const fp = () => sb.from("profiles").select("papel,nome").eq("id", user.id).maybeSingle();
      if (pc && pc.id == user.id) {
        role = pc.papel || "cliente";
        nome = pc.nome || nome;
        fp()
          .then(({ data }) => {
            if (data) {
              try {
                localStorage.setItem(
                  "aj_prof",
                  JSON.stringify({ id: user.id, papel: data.papel, nome: data.nome }),
                );
              } catch (e) {}
              if ((data.papel || "cliente") !== role) location.reload();
            }
          })
          .catch(() => {});
      } else {
        const { data, error } = await fp();
        if (error) {
          setMode("login");
          show("loginView");
          return msg(error.message);
        }
        role = (data && data.papel) || "cliente";
        nome = (data && data.nome) || nome;
        try {
          localStorage.setItem("aj_prof", JSON.stringify({ id: user.id, papel: role, nome }));
        } catch (e) {}
      }
    }
    me = { email: user.email, role, nome };
    window.AJ_ME = me;
    document.dispatchEvent(new CustomEvent("aj:login", { detail: me }));
    ["auPass", "auPass2"].forEach((i) => (G(i).value = ""));
    if (role == "equipa" || role == "admin") {
      document.querySelector("#adminView .sb-foot-text").innerHTML =
        `<div class="name">${esc(nome)}</div><div class="role">${role == "admin" ? "Administrador" : "Equipa AJ"}</div>`;
      document.querySelector("#adminView .avatar").textContent = nome
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      show("adminView");
      {
        const an = $("#sbnav-admin");
        if (an) an.style.display = role == "admin" ? "" : "none";
        if (role == "admin" && window.AJ_ADMIN_START) AJ_ADMIN_START(me);
      }
      let sub = AJ_UI_GET("sub") || "processos";
      if (sub == "admin" && role != "admin") sub = "processos";
      if (!$("#sbnav-" + sub)) sub = "processos";
      switchAdminView(sub, $("#sbnav-" + sub));
      await PM_start();
      if (sub != "processos") switchAdminView(sub, $("#sbnav-" + sub));
      if (live && !window.__rt) {
        window.__rt = 1;
        let t;
        const re = () => {
          clearTimeout(t);
          t = setTimeout(() => window.__pm && window.__pm.reload(), 600);
        };
        sb.channel("aj")
          .on("postgres_changes", { event: "*", schema: "public", table: "processos" }, re)
          .on("postgres_changes", { event: "*", schema: "public", table: "colunas" }, re)
          .subscribe();
      }
    } else {
      $("#cvWho").textContent = user.email;
      $("#cvHi").textContent = "Ol\xE1, " + nome.split(" ")[0];
      show("clientView");
      await loadClient();
    }
  }
  const DEMO_ROWS = [
    {
      num: "0417/26",
      cliente: "Cliente Demo",
      mercadoria: "Material de constru\xE7\xE3o",
      origem: "Dar es Salaam",
      destino: "Lichinga",
      prazo: new Date(Date.now() + 6 * 864e5).toISOString().slice(0, 10),
      estado: "Em an\xE1lise",
      estado_cor: "#3E5C8A",
      checklist: [
        { t: "Documenta\xE7\xE3o recebida e verificada", d: true },
        { t: "Declara\xE7\xE3o aduaneira submetida", d: true },
        { t: "An\xE1lise pela alf\xE2ndega", d: true },
        { t: "Pagamento de direitos", d: false },
        { t: "Liberta\xE7\xE3o e transporte", d: false },
      ],
      mensagem_cliente:
        "A sua carga est\xE1 em an\xE1lise, sem incid\xEAncias. Assim que o pagamento de direitos for confirmado, avisamos.",
      atualizado_em: new Date().toISOString(),
      historico: [
        { d: "Hoje 09:12", t: "Movido para Em alf\xE2ndega" },
        { d: "08 Ago", t: "Conclu\xEDdo: Declara\xE7\xE3o aduaneira submetida" },
        { d: "04 Ago", t: "Processo aberto" },
      ],
    },
  ];
  const fd = (d) =>
    d ? new Date(d + "T12:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "long" }) : "";
  const CV_ST = ["Em espera", "Em an\xE1lise", "Pago", "Conclu\xEDdo"];
  function cvStage(r) {
    const s = String(r.estado || "").toLowerCase();
    if (/conclu/.test(s)) return 3;
    if (/pago/.test(s)) return 2;
    if (/an.lise|alf.ndega/.test(s)) return 1;
    return 0;
  }
  function cvTrack(r, MT) {
    const my = MT && MT.f && MT.f.length > 1,
      N = my ? MT.f : CV_ST,
      m = N.length - 1,
      k = my ? Math.max(0, Math.min(m, MT.k | 0)) : cvStage(r),
      fill = k >= m ? 100 : ((k + 0.5) / m) * 100;
    return `<div class="trk${N.length > 4 ? " many" : ""}" style="--m:${m}" role="img" aria-label="Fase: ${esc(N[k])}"><div class="trk-line"><i style="width:${fill}%"></i></div>${N.map((n, i) => `<div class="trk-s ${i < k || k == m ? "ok" : i == k ? "cur" : ""}" style="left:${(i / m) * 100}%"><b>${i < k || k == m ? "\u2713" : ""}</b><span>${esc(n)}</span></div>`).join("")}</div>`;
  }
  function cvCard(r) {
    const MT = (r.checklist || []).find((c) => c && c.m),
      ck = (r.checklist || []).filter((c) => !(c && c.m)),
      ok = ck.filter((c) => c.d),
      pend = ck.filter((c) => !c.d),
      p = ck.length ? Math.round((ok.length / ck.length) * 100) : 0;
    const wa = AJ_CONTACTS.whatsapp[0] || "";
    const txt = encodeURIComponent(`Ol\xE1! Gostaria de saber do processo N\xBA ${r.num}.`);
    return `<div class="cv-card"><div class="cv-top"><div><b>Processo N\xBA ${esc(r.num)}</b><small>${esc(r.mercadoria)} \xB7 ${esc(r.origem)} \u2192 ${esc(r.destino)}${r.referencia ? " \xB7 " + esc(r.referencia) : ""}</small></div><span class="cv-st" style="background:${esc(r.estado_cor || "#0BA5C7")}">${esc((MT && MT.f && MT.f[MT.k | 0]) || r.estado)}</span></div>
 ${cvTrack(r, MT)}
 ${r.prazo ? `<p style="font-size:13px;color:var(--graphite);margin-top:10px">Previs\xE3o: <b style="color:var(--ink)">${fd(r.prazo)}</b></p>` : ""}
 ${r.mensagem_cliente ? `<div class="cv-msg"><small>MENSAGEM DA AJ SERVI\xC7OS LDA</small>${esc(r.mensagem_cliente)}</div>` : ""}
 <div class="cv-cols" style="margin-top:18px"><div><h4>Falta fazer</h4>${pend.map((c) => `<div class="cv-it"><i></i>${esc(c.t)}</div>`).join("") || '<div class="cv-it ok"><i></i>Tudo conclu\xEDdo</div>'}</div><div><h4>J\xE1 conclu\xEDdo</h4>${ok.map((c) => `<div class="cv-it ok"><i></i>${esc(c.t)}</div>`).join("") || '<div class="cv-it">Ainda nada</div>'}</div></div>
 ${
   (r.documentos || []).filter((d) => /^https?:\/\//i.test(d.u)).length
     ? `<div class="cv-tl"><h4 class="t">Documentos</h4>${r.documentos
         .filter((d) => /^https?:\/\//i.test(d.u))
         .map(
           (d) =>
             `<div><a href="${esc(d.u)}" target="_blank" rel="noopener" style="color:var(--amber)">${esc(d.n || "Documento")}</a></div>`,
         )
         .join("")}</div>`
     : ""
 }
 ${(r.historico || []).length ? `<div class="cv-tl"><h4 class="t">Hist\xF3rico</h4>${r.historico.map((h) => `<div><span>${esc(h.d)}</span>${esc(h.t)}</div>`).join("")}</div>` : ""}
 <div class="cv-foot"><a href="https://wa.me/${wa}?text=${txt}" target="_blank" rel="noopener">Falar connosco no WhatsApp</a></div></div>`;
  }
  async function loadClient() {
    const L = $("#cvList");
    let rows = DEMO_ROWS;
    if (live) {
      L.innerHTML = '<div class="cv-empty">A carregar\u2026</div>';
      const { data, error } = await sb
        .from("v_cliente_processos")
        .select("*")
        .order("atualizado_em", { ascending: false });
      if (error) {
        L.innerHTML = `<div class="cv-empty">Erro: ${esc(error.message)}</div>`;
        return;
      }
      rows = data;
    }
    L.innerHTML = rows.length
      ? rows.map(cvCard).join("")
      : '<div class="cv-empty">Ainda n\xE3o h\xE1 processos associados a esta conta.<br>Fale connosco se estava \xE0 espera de ver algum.</div>';
  }
  setInterval(() => {
    if (live && me && me.role == "cliente" && document.visibilityState == "visible") loadClient();
  }, 6e4);
  if (live) {
    sb.auth.onAuthStateChange((ev) => {
      if (ev == "PASSWORD_RECOVERY") {
        setMode("reset");
        show("loginView");
      }
    });
    if (/type=(invite|recovery)/.test(location.hash)) {
      setMode("reset");
      show("loginView");
    } else if (/type=signup|access_token=/.test(location.hash)) {
      sb.auth.getSession().then(({ data }) => {
        if (data.session) {
          history.replaceState(null, "", location.pathname);
          enter(data.session.user);
        }
      });
    }
  }
})();
