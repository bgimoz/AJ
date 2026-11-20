/* ============================================================
   admin/processos-kanban.js  (10 de 20)
   Gestor de processos (window.PM_start): quadro kanban, tabela, calendário, gaveta de detalhes, fases e exportação CSV.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

window.PM_start = async function () {
  if (window.__pm) {
    window.__pm.render();
    return;
  }
  const $ = (s) => document.querySelector(s);
  const COLORS = ["#0BA5C7", "#3E5C8A", "#4C6E5A", "#C8873C", "#8A5CB0", "#C83C3C", "#7A7F87"];
  const OWN = (window.AJ_OWN = window.AJ_OWN || ["JM", "AS"]);
  const IC = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    ok: '<path d="M20 6 9 17l-5-5"/>',
    open: '<path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7"/>',
  };
  const ic = (n) => `<svg class="i" viewBox="0 0 24 24">${IC[n]}</svg>`;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const uid = () => crypto.randomUUID();
  const today = () => new Date().toISOString().slice(0, 10);
  const fmt = (d) =>
    d
      ? new Date(d + "T12:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
      : "\u2014";
  const stamp = () =>
    new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) +
    " " +
    new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  const C = (t, d) => ({ t, d: !!d });
  function seed() {
    const cols = [
      ["Em espera", 6],
      ["Em an\xE1lise", 1],
      ["Pago", 3],
      ["Conclu\xEDdo", 2],
    ].map(([n, c]) => ({ id: uid(), name: n, color: COLORS[c] }));
    const mk = (ci, num, client, cargo, from, to, owner, prio, chk, notes) => ({
      id: uid(),
      num,
      client,
      cargo,
      from,
      to,
      owner,
      prio,
      due: "",
      col: cols[ci].id,
      check: chk.map((d, i) => C("Passo " + (i + 1), d)),
      notes: notes || "",
      log: [{ t: "Processo criado", d: stamp() }],
    });
    const L = "Lichinga";
    return {
      cols,
      items: [
        mk(
          0,
          "0392/26",
          "Nova Comercial, Lda",
          "Electr\xF3nica",
          "Dar es Salaam",
          L,
          "JM",
          "alta",
          [1, 1, 0, 0, 0],
        ),
        mk(0, "0401/26", "Casa Fortuna", "T\xEAxteis", "Mbeya", L, "AS", "media", [1, 0, 0, 0]),
        mk(
          1,
          "0417/26",
          "Comercial Etana, Lda",
          "Material de constru\xE7\xE3o",
          "Dar es Salaam",
          L,
          "JM",
          "media",
          [1, 1, 1, 0, 0],
          "Cliente pediu para ser avisado assim que a carga for libertada.",
        ),
        mk(1, "0388/26", "Grupo Vale", "Maquinaria", "Mtwara", L, "AS", "alta", [1, 1, 1, 1, 0, 0]),
        mk(
          1,
          "0409/26",
          "Farm\xE1cia Central",
          "Material m\xE9dico",
          "Dar es Salaam",
          L,
          "JM",
          "alta",
          [1, 1, 0, 0],
        ),
        mk(
          3,
          "0371/26",
          "Casa Muendo",
          "Mobili\xE1rio",
          "Nampula",
          L,
          "AS",
          "baixa",
          [1, 1, 1, 1, 1],
        ),
        mk(
          3,
          "0360/26",
          "Auto Pe\xE7as Rovuma",
          "Pe\xE7as autom\xF3vel",
          "Dar es Salaam",
          L,
          "JM",
          "baixa",
          [1, 1, 1, 1],
        ),
        mk(
          2,
          "0430/26",
          "Carlos Macu\xE1cua",
          "Viatura ligeira",
          "Jap\xE3o",
          L,
          "JM",
          "media",
          [1, 1, 1, 0, 0, 0],
        ),
        mk(
          2,
          "0433/26",
          "In\xEAs Variege",
          "Viatura pesada",
          "Jap\xE3o",
          L,
          "AS",
          "media",
          [1, 1, 1, 1, 1, 0],
        ),
      ],
    };
  }
  let S = null,
    UI = {
      view: AJ_UI_GET("pmview") || "board",
      q: "",
      own: "",
      sel: null,
      sort: "num",
      dir: 1,
      flt: "",
      cal: new Date(),
    },
    undo = null;
  try {
    S = await AJ_DB.load();
  } catch (e) {
    alert("N\xE3o foi poss\xEDvel carregar os dados: " + e.message);
    return;
  }
  if (!S) S = AJ_DB.demo ? seed() : { cols: [], items: [] };
  const save = () => AJ_DB.save(S);
  const STAGES = ["Em espera", "Em análise", "Pago", "Concluído"];
  function normalizeStages() {
    if (S.cols.length && !S.cols.some((x) => /pendente|alf.ndega|importa/i.test(x.name)))
      return false;
    const ST = [
      ["Em espera", /pendente|espera/i, "#7A7F87"],
      ["Em análise", /alf.ndega|an.lise/i, "#3E5C8A"],
      ["Pago", /pago/i, "#C8873C"],
      ["Concluído", /conclu/i, "#4C6E5A"],
    ];
    if (S.cols.length == 4 && ST.every((x, k) => S.cols[k].name == x[0])) return false;
    const used = new Set();
    const nc = ST.map(([n, re, c]) => {
      const ex = S.cols.find((x) => !used.has(x.id) && re.test(x.name));
      if (ex) {
        used.add(ex.id);
        ex.name = n;
        ex.color = c;
        return ex;
      }
      return { id: uid(), name: n, color: c };
    });
    S.items.forEach((i) => {
      if (!nc.some((c) => c.id === i.col)) {
        const p = i.check.length ? i.check.filter((c) => c.d).length / i.check.length : 0,
          to = p >= 1 ? nc[3] : nc[1];
        i.col = to.id;
        i.log.unshift({ t: "Movido para " + to.name, d: stamp(), p: true, ts: Date.now() });
      }
    });
    S.cols = nc;
    return true;
  }
  function syncStage(i) {
    const cc = S.cols.find((c) => c.id === i.col);
    if (!cc) return;
    const nm = cc.name.trim().toLowerCase();
    if (i.stages && i.stages.length) {
      const x = i.stages.findIndex((p) => p.trim().toLowerCase() === nm);
      if (x >= 0) i.stage = x;
    }
    const k = STAGES.findIndex((x) => x.toLowerCase() === nm);
    if (k < 0) return;
    i.check.forEach((c) => {
      const n = STAGES.findIndex((x) => x.toLowerCase() === String(c.t).trim().toLowerCase());
      if (n >= 0) c.d = k === 3 || n < k;
    });
  }
  function clientPicker(i) {
    const L = (window.AJ_CLIENTS && AJ_CLIENTS.list()) || [],
      em = (i.cemail || "").toLowerCase();
    return `<div class="pr cpick"><label>Cliente registado</label><select data-cpick><option value="">Escolher cliente\\u2026</option>${L.map((c) => `<option value="${esc(c.email)}" ${c.email === em ? "selected" : ""}>${esc(c.nome || c.email)}${c.nome ? " \\xB7 " + esc(c.email) : ""}</option>`).join("")}<option value="__new">Outro cliente (escrever o email)</option></select></div>`;
  }
  function colMenu(dot, id) {
    const old = document.getElementById("colMenu");
    if (old) {
      const same = old.dataset.c === id;
      old.remove();
      if (same) return;
    }
    const c = col(id),
      m = document.createElement("div");
    m.id = "colMenu";
    m.dataset.c = id;
    const PAL = [...new Set([...COLORS, "#2E9E5B", "#D6457A", "#1F2933"])];
    m.innerHTML = `<label>Nome da coluna<input value="${esc(c.name)}" data-cm="name"></label><div class="cm-sw">${PAL.map((x) => `<button type="button" data-cm="color" data-c="${x}" style="background:${x}" class="${x == c.color ? "on" : ""}" aria-label="Cor ${x}"></button>`).join("")}</div><button type="button" class="cm-del" data-cm="del">Eliminar coluna</button>`;
    document.body.appendChild(m);
    const r = dot.getBoundingClientRect();
    m.style.top = Math.max(8, Math.min(r.bottom + 8, innerHeight - m.offsetHeight - 8)) + "px";
    m.style.left = Math.max(8, Math.min(r.left, innerWidth - m.offsetWidth - 8)) + "px";
    const away = (e) => {
      if (!m.contains(e.target) && !e.target.closest("[data-a=color]")) close();
    };
    const close = () => {
      m.remove();
      document.removeEventListener("pointerdown", away, true);
    };
    setTimeout(() => document.addEventListener("pointerdown", away, true), 0);
    m.addEventListener("change", (e) => {
      if (e.target.dataset.cm == "name") {
        c.name = e.target.value.trim() || "Sem nome";
        save();
        render();
      }
    });
    m.addEventListener("keydown", (e) => {
      if (e.key == "Enter") e.target.blur();
      if (e.key == "Escape") close();
    });
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cm]");
      if (!b) return;
      if (b.dataset.cm == "color") {
        c.color = b.dataset.c;
        save();
        render();
        close();
      }
      if (b.dataset.cm == "del") {
        const its = S.items.filter((i) => i.col === c.id);
        if (
          its.length &&
          !confirm(`Eliminar a coluna "${c.name}" e os seus ${its.length} processo(s)?`)
        )
          return;
        const si = S.items.slice(),
          sc = S.cols.slice();
        S.items = S.items.filter((i) => i.col !== c.id);
        S.cols = S.cols.filter((x) => x !== c);
        save();
        render();
        close();
        toast("Coluna eliminada", () => {
          S.items = si;
          S.cols = sc;
        });
      }
    });
  }
  function phaseIdx(i) {
    if (i.stages && i.stages.length) return Math.max(0, Math.min(i.stages.length - 1, i.stage | 0));
    const cc = S.cols.find((c) => c.id === i.col),
      k = cc ? STAGES.findIndex((x) => x.toLowerCase() === cc.name.trim().toLowerCase()) : -1;
    return k < 0 ? 0 : k;
  }
  function phaseEditor(i) {
    const custom = !!(i.stages && i.stages.length),
      st = custom ? i.stages : STAGES,
      k = phaseIdx(i);
    return `<h4><span>Fases do cliente</span></h4><p class="phn">${custom ? "Fases personalizadas deste processo. O cliente v\u00ea esta linha." : "Fases padr\u00e3o. Edite, acrescente ou remova para personalizar s\u00f3 este processo."} Clique na bolinha para marcar a fase atual.</p><div id="pmPh">${st.map((n, x) => `<div class="ck ph ${x == k ? "cur" : x < k ? "ok" : ""}"><button type="button" class="phd" data-ph="cur" data-n="${x}" title="Marcar como fase atual" aria-label="Fase atual"></button><input type="text" data-ph="name" data-n="${x}" value="${esc(n)}"><button type="button" class="ib" data-ph="up" data-n="${x}" ${x == 0 ? "disabled" : ""} aria-label="Subir">\u2191</button><button type="button" class="ib" data-ph="down" data-n="${x}" ${x == st.length - 1 ? "disabled" : ""} aria-label="Descer">\u2193</button><button type="button" class="ib x" data-ph="del" data-n="${x}" ${st.length <= 2 ? "disabled" : ""} aria-label="Remover">${ic("x")}</button></div>`).join("")}</div><div class="ck ph add"><span style="width:20px"></span><input type="text" id="pmNewPh" placeholder="+ Adicionar fase e carregar Enter"></div>${custom ? '<button type="button" class="btn2" data-ph="reset" style="margin-top:6px">Repor fases padr\u00e3o</button>' : ""}`;
  }
  function phaseOp(i, op, n, v) {
    if (op != "reset" && !(i.stages && i.stages.length)) {
      const k = phaseIdx(i);
      i.stages = STAGES.slice();
      i.stage = k;
    }
    const st = i.stages;
    if (op == "cur") {
      i.stage = n;
      const c = S.cols.find(
        (c) => c.name.trim().toLowerCase() === String(st[n]).trim().toLowerCase(),
      );
      if (c && c.id !== i.col) {
        i.col = c.id;
        syncStage(i);
      }
      log(i, "Fase atual: " + st[n]);
    }
    if (op == "name") {
      const t = String(v).trim();
      if (!t) return drawer(i);
      st[n] = t;
    }
    if (op == "up" && n > 0) {
      [st[n - 1], st[n]] = [st[n], st[n - 1]];
      if (i.stage == n) i.stage = n - 1;
      else if (i.stage == n - 1) i.stage = n;
    }
    if (op == "down" && n < st.length - 1) {
      [st[n + 1], st[n]] = [st[n], st[n + 1]];
      if (i.stage == n) i.stage = n + 1;
      else if (i.stage == n + 1) i.stage = n;
    }
    if (op == "del" && st.length > 2) {
      st.splice(n, 1);
      if (n < i.stage) i.stage--;
      i.stage = Math.min(i.stage, st.length - 1);
    }
    if (op == "add") {
      const t = String(v).trim();
      if (!t) return;
      st.push(t);
    }
    if (op == "reset") {
      delete i.stages;
      delete i.stage;
    }
    save();
    render();
    drawer(i);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("#pmDr [data-ph]");
    if (!b || b.tagName == "INPUT") return;
    const i = S.items.find((x) => x.id === UI.sel);
    if (i) phaseOp(i, b.dataset.ph, +b.dataset.n);
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!el.matches || !el.matches("#pmDr input[data-ph=name]")) return;
    const i = S.items.find((x) => x.id === UI.sel);
    if (i) phaseOp(i, "name", +el.dataset.n, el.value);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key != "Enter" || e.target.id != "pmNewPh") return;
    e.preventDefault();
    const i = S.items.find((x) => x.id === UI.sel);
    if (i) phaseOp(i, "add", 0, e.target.value);
  });
  if (normalizeStages()) save();
  const col = (id) => S.cols.find((c) => c.id === id);
  const prog = (i) =>
    i.check.length ? Math.round((i.check.filter((c) => c.d).length / i.check.length) * 100) : 0;
  const done = (i) => /conclu/i.test(col(i.col) ? col(i.col).name : "");
  const vis = () =>
    S.items.filter(
      (i) =>
        (UI.flt == "arch" ? i.arch : !i.arch) &&
        (UI.flt != "late" || late(i)) &&
        (!UI.own || i.owner === UI.own) &&
        (!UI.q ||
          [i.client, i.num, i.cargo, i.from, i.to, i.ref, i.cemail, (i.tags || []).join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(UI.q)),
    );
  const nextNum = () =>
    String(Math.max(0, ...S.items.map((i) => parseInt(i.num) || 0)) + 1).padStart(4, "0") + "/26";
  const log = (i, t, p) => {
    i.log.unshift({ t, d: stamp(), p: !!p, ts: Date.now() });
  };
  const late = (i) => i.due && i.due < today() && col(i.col) && !/conclu/i.test(col(i.col).name);
  function card(i) {
    const p = prog(i);
    return `<div class="k" draggable="true" data-id="${i.id}"><div class="qa"><button class="ib" data-a="dup" title="Duplicar">${ic("copy")}</button><button class="ib" data-a="del" title="Eliminar">${ic("trash")}</button></div>
<b>${esc(i.client) || "Sem t\xEDtulo"}</b><small>${esc(i.cargo) || "\u2014"} \xB7 ${esc(i.from) || "?"} \u2192 ${esc(i.to) || "?"}</small>
${(i.tags || []).length ? `<div class="row" style="margin:-4px 0 8px">${i.tags.map((t) => `<span class="tag p-media">${esc(t)}</span>`).join("")}</div>` : ""}<div class="row"><span>N\xBA ${esc(i.num)}</span><span class="tag p-${i.prio}">${i.prio}</span>${i.due ? `<span class="${late(i) ? "late" : ""}">${ic("cal")} ${fmt(i.due)}</span>` : ""}<span class="av">${esc(i.owner) || "\u2014"}</span></div>
<div class="bar"><i style="width:${p}%"></i></div><select class="mv" data-a="mv" aria-label="Mover processo para outra coluna">${S.cols.map((c) => `<option value="${c.id}" ${c.id == i.col ? "selected" : ""}>Mover para: ${esc(c.name)}</option>`).join("")}</select></div>`;
  }
  function board() {
    const v = vis();
    return (
      `<div class="bd">` +
      S.cols
        .map((c) => {
          const its = v.filter((i) => i.col === c.id);
          return `<div class="cl" data-c="${c.id}"><div class="ch"><span class="dot" data-a="color" style="background:${c.color}" title="Op\xE7\xF5es da coluna"></span><input class="cn" value="${esc(c.name)}" data-a="ren"><span class="cc">${its.length}</span><button class="ib" data-a="delcol" title="Eliminar coluna">${ic("x")}</button></div><div class="cs">${its.map(card).join("") || '<div class="empty">Arraste um processo para aqui</div>'}</div><button class="add" data-a="add">${ic("plus")} Novo processo</button></div>`;
        })
        .join("") +
      `<div class="cl"><button class="ghost" data-a="addcol">${ic("plus")} Nova coluna</button></div></div>`
    );
  }
  function table() {
    const k = UI.sort,
      rows = vis()
        .slice()
        .sort((a, b) => {
          const g = (i) => (k === "col" ? col(i.col)?.name : k === "prog" ? prog(i) : i[k] || "");
          const x = g(a),
            y = g(b);
          return (x > y ? 1 : x < y ? -1 : 0) * UI.dir;
        });
    const h = (k2, t) =>
      `<th data-s="${k2}">${t}${UI.sort === k2 ? (UI.dir > 0 ? " \u2191" : " \u2193") : ""}</th>`;
    return (
      `<div class="tw"><table><tr>${h("num", "N\xBA")}${h("client", "Cliente")}${h("cargo", "Mercadoria")}${h("from", "Origem")}${h("col", "Estado")}${h("owner", "Resp.")}${h("prio", "Prioridade")}${h("due", "Prazo")}${h("prog", "Progresso")}${h("ref", "Refer\xEAncia")}${h("valor", "Honor\xE1rios")}</tr>` +
      rows
        .map(
          (i) =>
            `<tr class="r" data-id="${i.id}"><td class="mono">${esc(i.num)}</td><td><b>${esc(i.client)}</b></td><td>${esc(i.cargo)}</td><td>${esc(i.from)}</td><td><span class="dot" style="display:inline-block;background:${col(i.col)?.color};margin-right:6px"></span>${esc(col(i.col)?.name)}</td><td>${esc(i.owner)}</td><td><span class="tag p-${i.prio}">${i.prio}</span></td><td class="${late(i) ? "late" : ""}">${fmt(i.due)}</td><td>${prog(i)}%</td><td>${esc(i.ref)}</td><td>${mzn(i.valor)}</td></tr>`,
        )
        .join("") +
      `</table></div>` +
      (rows.length ? "" : '<div class="empty">Nenhum processo encontrado</div>')
    );
  }
  const mzn = (n) =>
    n === "" || n == null ? "\u2014" : new Intl.NumberFormat("pt-PT").format(n) + " MZN";
  const dl = (name, txt, type) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: type + ";charset=utf-8" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };
  function csv(all) {
    const q = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const H = [
      "N\xBA",
      "Cliente",
      "Email",
      "Telefone",
      "Mercadoria",
      "Refer\xEAncia",
      "Origem",
      "Destino",
      "Estado",
      "Respons\xE1vel",
      "Prioridade",
      "Prazo",
      "Honor\xE1rios (MZN)",
      "Progresso %",
      "Etiquetas",
      "Arquivado",
    ];
    const rows = (all === true ? S.items : vis()).map((i) => [
      i.num,
      i.client,
      i.cemail,
      i.tel,
      i.cargo,
      i.ref,
      i.from,
      i.to,
      col(i.col) && col(i.col).name,
      i.owner,
      i.prio,
      i.due,
      i.valor,
      prog(i),
      (i.tags || []).join(" | "),
      i.arch ? "sim" : "n\xE3o",
    ]);
    dl(
      "processos-" + today() + ".csv",
      "\uFEFF" + [H, ...rows].map((r) => r.map(q).join(";")).join("\r\n"),
      "text/csv",
    );
    toast("CSV exportado (" + rows.length + " processos)");
  }
  function notify(i) {
    const tel = (i.tel || "").replace(/\D/g, "");
    if (!tel) {
      alert("Indique primeiro o telefone do cliente, com indicativo (ex.: 258\u2026).");
      return;
    }
    const t = `Ol\xE1 ${i.client || ""}! Atualiza\xE7\xE3o do processo N\xBA ${i.num}${i.ref ? " (" + i.ref + ")" : ""}: estado "${col(i.col) ? col(i.col).name : ""}", ${prog(i)}% conclu\xEDdo.${i.cmsg ? " " + i.cmsg : ""} \u2014 AJ Servi\xE7os LDA`;
    log(i, "Cliente avisado por WhatsApp");
    save();
    window.open("https://wa.me/" + tel + "?text=" + encodeURIComponent(t), "_blank", "noopener");
    drawer(i);
  }
  function cal() {
    const d = UI.cal,
      y = d.getFullYear(),
      m = d.getMonth(),
      first = new Date(y, m, 1),
      off = (first.getDay() + 6) % 7,
      n = new Date(y, m + 1, 0).getDate(),
      v = vis().filter((i) => i.due);
    let c = "";
    for (let k = 0; k < off; k++) c += "<div></div>";
    for (let k = 1; k <= n; k++) {
      const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(k).padStart(2, "0")}`,
        ev = v.filter((i) => i.due == ds);
      c += `<div class="cd0 ${ds == today() ? "td" : ""}"><span>${k}</span>${ev.map((i) => `<div class="ev ${late(i) ? "lt" : ""}" data-id="${i.id}" style="border-left-color:${col(i.col) ? col(i.col).color : "#999"}">${esc(i.client || i.num)}</div>`).join("")}</div>`;
    }
    const nm = first.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    return (
      `<div class="tb"><button class="ib" data-cn="-1">\u2039</button><b style="min-width:150px;text-align:center;text-transform:capitalize">${nm}</b><button class="ib" data-cn="1">\u203A</button><button class="ghost" data-cn="t">Hoje</button></div><div class="cg">${["Seg", "Ter", "Qua", "Qui", "Sex", "S\xE1b", "Dom"].map((x) => `<div class="ch0">${x}</div>`).join("")}${c}</div>` +
      (v.length
        ? ""
        : '<div class="empty" style="margin-top:12px">Nenhum processo com prazo definido.</div>')
    );
  }
  function stats() {
    const A = S.items.filter((i) => !i.arch),
      cur = A.filter((i) => !done(i)),
      dn = A.filter(done),
      lt = cur.filter(late);
    const cl = new Set(A.map((i) => (i.cemail || i.client || "").toLowerCase()).filter(Boolean))
      .size;
    const avg = cur.length ? Math.round(cur.reduce((s, i) => s + prog(i), 0) / cur.length) : 0,
      val = cur.reduce((s, i) => s + (+i.valor || 0), 0);
    const K = (n, l) =>
      `<div class="stat-card"><div class="stat-num" style="font-size:${String(n).length > 9 ? "18px" : ""}">${n}</div><div class="stat-label">${l}</div></div>`;
    const bar = (l, n, mx2, c) =>
      `<div class="br"><span>${esc(l)}</span><em class="bx"><i style="width:${(n / mx2) * 100}%;${c ? "background:" + c : ""}"></i></em><b>${n}</b></div>`;
    const mx = Math.max(1, ...S.cols.map((c) => A.filter((i) => i.col === c.id).length));
    const bars =
      S.cols
        .map((c) => bar(c.name, A.filter((i) => i.col === c.id).length, mx, c.color))
        .join("") || '<div class="empty">Sem colunas.</div>';
    const owners = [...new Set(A.map((i) => i.owner || "\u2014"))],
      omx = Math.max(1, ...owners.map((o) => A.filter((i) => (i.owner || "\u2014") == o).length));
    const ow =
      owners.map((o) => bar(o, A.filter((i) => (i.owner || "\u2014") == o).length, omx)).join("") ||
      '<div class="empty">Sem processos.</div>';
    const lts =
      lt
        .sort((a, b) => (a.due > b.due ? 1 : -1))
        .slice(0, 8)
        .map(
          (i) =>
            `<div class="ev lt" data-id="${i.id}">${esc(i.client || i.num)} <small>\xB7 prazo ${fmt(i.due)}</small></div>`,
        )
        .join("") || '<div class="empty">Sem atrasos.</div>';
    const rec = S.items
      .flatMap((i) => (i.log || []).map((l) => ({ ...l, c: i.client || i.num, id: i.id })))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .slice(0, 8)
      .map(
        (l) =>
          `<div class="ev" data-id="${l.id}"><b>${esc(l.c)}</b> \u2014 ${esc(l.t)} <small>${esc(l.d)}</small></div>`,
      )
      .join("");
    return `<div class="stat-grid">${K(cur.length, "Em curso")}${K(lt.length, "Atrasados")}${K(dn.length, "Conclu\xEDdos")}${K(cl, "Clientes")}${K(avg + "%", "Progresso m\xE9dio")}${K(mzn(val), "Honor\xE1rios em curso")}</div><div class="grid-two st2"><div class="notes-card"><h4>Por estado</h4>${bars}</div><div class="notes-card"><h4>Por respons\xE1vel</h4>${ow}</div><div class="notes-card"><h4>Prazos ultrapassados</h4>${lts}</div><div class="notes-card"><h4>Atividade recente</h4>${rec || '<div class="empty">Sem atividade.</div>'}</div></div>`;
  }
  function clientsOld() {
    const m = new Map();
    S.items
      .filter((i) => !i.arch)
      .forEach((i) => {
        const k = (i.cemail || i.client || "?").toLowerCase(),
          o = m.get(k) || { n: i.client || "Sem nome", e: "", t: "", all: 0, cur: 0 };
        o.all++;
        if (!done(i)) o.cur++;
        o.t = o.t || i.tel;
        o.e = o.e || i.cemail;
        m.set(k, o);
      });
    const ini = (s) =>
      (s || "?")
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return (
      `<div class="notes-card"><div class="divider-note" style="margin-top:0"><span class="label">Base de clientes \xB7 ${m.size}</span><div class="line"></div></div><div class="client-row client-row-head"><span>Cliente</span><span>Contacto</span><span>Processos</span><span>Em curso</span></div>` +
      ([...m.values()]
        .sort((a, b) => b.cur - a.cur)
        .map(
          (o) =>
            `<div class="client-row cr" data-q="${esc(o.n)}" style="cursor:pointer"><span class="cn"><span class="mini-avatar">${esc(ini(o.n))}</span>${esc(o.n)}</span><span>${esc(o.e || o.t || "\u2014")}</span><span>${o.all}</span><span>${o.cur}</span></div>`,
        )
        .join("") ||
        '<div class="empty">Ainda n\xE3o h\xE1 clientes. Crie um processo para come\xE7ar.</div>') +
      "</div>"
    );
  }
  function clients() {
    const reg = (window.AJ_CLIENTS && AJ_CLIENTS.list()) || [],
      m = new Map();
    reg.forEach((c) =>
      m.set(c.email, {
        n: c.nome,
        e: c.email,
        t: c.tel,
        r: c.criado,
        all: 0,
        cur: 0,
        inc: !c.nome || !c.tel,
      }),
    );
    S.items
      .filter((i) => !i.arch)
      .forEach((i) => {
        const em = (i.cemail || "").toLowerCase(),
          k = em || "n:" + (i.client || "?").toLowerCase();
        let o = m.get(k);
        if (!o) {
          o = { n: i.client || "", e: em, t: i.tel || "", r: "", all: 0, cur: 0, inc: false };
          m.set(k, o);
        }
        if (!o.n) o.n = i.client || "";
        o.all++;
        if (!done(i)) o.cur++;
        o.t = o.t || i.tel;
      });
    const ini = (s) =>
      (s || "?")
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const rows = [...m.values()].sort(
      (a, b) => (b.r || "").localeCompare(a.r || "") || b.cur - a.cur,
    );
    return (
      `<div class="notes-card"><div class="divider-note" style="margin-top:0"><span class="label">Base de clientes \xB7 ${rows.length}</span><div class="line"></div></div><div class="client-row client-row-head"><span>Cliente</span><span>Contacto</span><span>Processos</span><span>Em curso</span></div>` +
      (rows
        .map((o) => {
          const nm = o.n || (o.e ? o.e.split("@")[0] : "Sem nome");
          return `<div class="client-row cr" data-q="${esc(o.n || o.e)}" style="cursor:pointer"><span class="cn"><span class="mini-avatar">${esc(ini(nm))}</span><span>${esc(nm)}${o.inc ? '<em class="inc">Perfil incompleto</em>' : ""}</span></span><span>${esc(o.e || "\u2014")}${o.t ? "<small>" + esc(o.t) + "</small>" : ""}</span><span>${o.all}</span><span>${o.cur}</span></div>`;
        })
        .join("") || '<div class="empty">Ainda n\xE3o h\xE1 clientes.</div>') +
      "</div>"
    );
  }
  function render() {
    const _b = $("#pm .bd"),
      _x = _b ? _b.scrollLeft : 0;
    $("#pm").innerHTML =
      `<div class="tb"><div class="tabs"><button data-v="board" class="${UI.view == "board" ? "on" : ""}">Quadro</button><button data-v="table" class="${UI.view == "table" ? "on" : ""}">Tabela</button><button data-v="cal" class="${UI.view == "cal" ? "on" : ""}">Calend\xE1rio</button></div>
 <button class="chip ${!UI.own ? "on" : ""}" data-o="">Todos</button>${OWN.map((o) => `<button class="chip ${UI.own == o ? "on" : ""}" data-o="${o}">${o}</button>`).join("")}<button class="chip ${UI.flt == "late" ? "on" : ""}" data-f="late">Atrasados</button><button class="chip ${UI.flt == "arch" ? "on" : ""}" data-f="arch">Arquivados</button><span class="sp"></span><button class="ghost" data-a="csv">Exportar CSV</button>${AJ_DB.demo ? '<button class="ghost" data-a="reset">Repor dados de exemplo</button>' : ""}</div>` +
      (UI.view == "board" ? board() : UI.view == "cal" ? cal() : table());
    {
      const b = $("#pm .bd");
      if (b) b.scrollLeft = _x;
    }
    const n = S.items.length;
    $("#topbarSub").textContent =
      `${n} processo${n == 1 ? "" : "s"} \xB7 ${S.items.filter((i) => !/conclu/i.test(col(i.col)?.name || "")).length} em curso`;
  }
  function toast(msg, fn) {
    const t = $("#pmToast");
    t.innerHTML = `<span>${msg}</span>${fn ? "<button>Anular</button>" : ""}`;
    t.style.display = "flex";
    undo = fn;
    clearTimeout(t._t);
    t._t = setTimeout(() => {
      t.style.display = "none";
      undo = null;
    }, 6e3);
    if (fn)
      t.querySelector("button").onclick = () => {
        fn();
        t.style.display = "none";
        render();
        save();
      };
  }
  function create(c, pre) {
    const i = {
      id: uid(),
      num: nextNum(),
      client: "",
      cargo: "",
      from: "",
      to: "Lichinga",
      owner: "JM",
      prio: "media",
      due: "",
      col: c || S.cols[0]?.id,
      check: STAGES.map((t) => C(t)),
      notes: "",
      log: [],
      cemail: "",
      cmsg: "",
      tel: "",
      ref: "",
      valor: "",
      tags: [],
      arch: false,
      docs: [],
    };
    if (pre) Object.assign(i, pre);
    syncStage(i);
    log(i, "Processo aberto", 1);
    S.items.push(i);
    save();
    render();
    openDr(i.id, !pre);
    return i;
  }
  function del(id) {
    const i = S.items.find((x) => x.id === id),
      ix = S.items.indexOf(i);
    S.items.splice(ix, 1);
    if (UI.sel === id) closeDr();
    save();
    render();
    toast("Processo eliminado", () => S.items.splice(ix, 0, i));
  }
  function dup(id) {
    const o = S.items.find((x) => x.id === id),
      i = JSON.parse(JSON.stringify(o));
    i.id = uid();
    i.num = nextNum();
    i.client += " (c\xF3pia)";
    i.log = [];
    log(i, "Duplicado de N\xBA " + o.num);
    S.items.splice(S.items.indexOf(o) + 1, 0, i);
    save();
    render();
  }
  function openDr(id, focus) {
    if (window.AJ_CLIENTS) AJ_CLIENTS.load();
    const i = S.items.find((x) => x.id === id);
    if (!i) return;
    UI.sel = id;
    drawer(i);
    $("#pmShade").style.display = "block";
    requestAnimationFrame(() => {
      $("#pmDr").classList.add("open");
      if (focus) $("#pmDr .ti").focus();
    });
  }
  function closeDr() {
    UI.sel = null;
    $("#pmDr").classList.remove("open");
    $("#pmShade").style.display = "none";
    render();
  }
  function drawer(i) {
    const f = (l, k, t = "text", x = "") =>
      `<div class="pr"><label>${l}</label><input type="${t}" data-f="${k}" value="${esc(i[k])}" ${x}></div>`;
    $("#pmDr").innerHTML =
      `<div style="display:flex;justify-content:space-between"><span class="cc">N\xBA ${esc(i.num)}</span><button class="ib" data-a="close">${ic("x")}</button></div>
 ${clientPicker(i)}<input class="ti" data-f="client" placeholder="Nome do cliente" value="${esc(i.client)}">
 <div class="pr"><label>Estado</label><select data-f="col">${S.cols.map((c) => `<option value="${c.id}" ${c.id == i.col ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
 ${f("N\xBA processo", "num")}${f("Mercadoria", "cargo")}${f("Origem", "from")}${f("Destino", "to")}
 <div class="pr"><label>Respons\xE1vel</label><select data-f="owner">${[...new Set([...OWN, i.owner])].map((o) => `<option ${o == i.owner ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div>
 <div class="pr"><label>Prioridade</label><select data-f="prio">${["alta", "media", "baixa"].map((p) => `<option ${p == i.prio ? "selected" : ""}>${p}</option>`).join("")}</select></div>
 ${f("Prazo", "due", "date")}${f("Email do cliente", "cemail", "email")}${f("Telefone do cliente", "tel", "tel")}${f("Refer\xEAncia (BL / contentor)", "ref")}${f("Honor\xE1rios (MZN)", "valor", "number", 'min="0" step="any"')}<div class="pr"><label>Etiquetas</label><input data-f="tags" value="${esc((i.tags || []).join(", "))}" placeholder="urgente, viatura, refrigerado"></div>
 ${phaseEditor(i)}<h4><span>Checklist \xB7 ${prog(i)}%</span></h4><div id="pmCk">${ck(i)}</div>
 <div class="ck"><span style="width:17px"></span><input type="text" id="pmNewCk" placeholder="+ Adicionar passo e carregar Enter"></div>
 <h4><span>Documentos</span></h4>${(i.docs || []).map((d, n) => `<div class="ck"><input type="checkbox" data-dv="${n}" ${d.v ? "checked" : ""} title="Vis\xEDvel ao cliente"><a href="${esc(d.u)}" target="_blank" rel="noopener" style="flex:1;font-size:13.5px;color:var(--amber);word-break:break-all">${esc(d.n || d.u)}</a><button class="ib x" data-a="deldoc" data-n="${n}">${ic("x")}</button></div>`).join("")}<div class="ck"><span style="width:17px"></span><input type="text" id="pmDocN" placeholder="Nome (ex.: Fatura)" style="flex:1"><input type="text" id="pmDocU" placeholder="Liga\xE7\xE3o https://\u2026" style="flex:2"><button class="ib" data-a="adddoc">${ic("plus")}</button></div><p style="font-size:11.5px;color:var(--graphite);margin-top:4px">Marque a caixa para o cliente ver o documento. Cole a liga\xE7\xE3o (Drive, Dropbox\u2026).</p><h4>Mensagem vis\xEDvel ao cliente</h4><textarea data-f="cmsg" style="min-height:70px" placeholder="Ex.: Documentos recebidos. A aguardar pagamento dos direitos.">${esc(i.cmsg)}</textarea><h4>Notas internas (o cliente n\xE3o v\xEA)</h4><textarea data-f="notes" placeholder="Escreva notas, refer\xEAncias, n\xFAmeros de contentor\u2026">${esc(i.notes)}</textarea>
 <h4>Hist\xF3rico</h4>${i.log.map((l) => `<div class="lg">${esc(l.d)} \u2014 ${esc(l.t)}</div>`).join("")}
 <div class="acts"><button class="btn2" data-a="wa">Avisar cliente (WhatsApp)</button><button class="btn2" data-a="arch">${i.arch ? "Desarquivar" : "Arquivar"}</button><button class="btn2" data-a="dupd">Duplicar</button><button class="btn2 red" data-a="deld">Eliminar processo</button></div><div class="dr-foot"><button class="btn-ok" data-a="finish">${ic("ok")} Guardar processo</button><small>As altera\xE7\xF5es tamb\xE9m ficam guardadas automaticamente.</small></div>`;
  }
  const ck = (i) =>
    i.check
      .map(
        (c, n) =>
          `<div class="ck ${c.d ? "d" : ""}"><input type="checkbox" data-k="${n}" ${c.d ? "checked" : ""}><input type="text" data-kt="${n}" value="${esc(c.t)}"><button class="ib x" data-a="delck" data-n="${n}">${ic("x")}</button></div>`,
      )
      .join("");
  document.addEventListener("click", (e) => {
    const r = e.target.closest("#pm,#pmDr,#pmShade,.new-btn,#view-clientes,#view-relatorios");
    if (!r) return;
    const t = e.target.closest(
      "[data-a],[data-v],[data-o],[data-s],[data-f],[data-cn],.k,tr.r,.ev,.cr,#pmShade,.new-btn",
    );
    if (!t) return;
    const a = t.dataset.a,
      cl = t.closest(".cl"),
      k = t.closest(".k");
    if (t.classList.contains("new-btn")) return create(UI.view == "board" ? S.cols[0]?.id : void 0);
    if (t.id == "pmShade" || a == "close") return closeDr();
    if (t.dataset.v) {
      UI.view = t.dataset.v;
      AJ_UI_SET("pmview", UI.view);
      return render();
    }
    if (t.dataset.o !== void 0 && t.classList.contains("chip")) {
      UI.own = t.dataset.o;
      return render();
    }
    if (t.dataset.s) {
      UI.dir = UI.sort == t.dataset.s ? -UI.dir : 1;
      UI.sort = t.dataset.s;
      return render();
    }
    if (t.dataset.f) {
      UI.flt = UI.flt == t.dataset.f ? "" : t.dataset.f;
      return render();
    }
    if (t.dataset.cn !== void 0) {
      UI.cal =
        t.dataset.cn == "t"
          ? new Date()
          : new Date(UI.cal.getFullYear(), UI.cal.getMonth() + +t.dataset.cn, 1);
      return render();
    }
    if (t.classList.contains("cr")) {
      UI.q = t.dataset.q.toLowerCase();
      const si2 = $("#pmSearch");
      if (si2) si2.value = t.dataset.q;
      UI.view = "board";
      UI.flt = "";
      switchAdminView("processos", $("#sbnav-processos"));
      return;
    }
    if (a == "csv") return csv();
    if (a == "finish") {
      const i = S.items.find((x) => x.id === UI.sel),
        ti = document.querySelector("#pmDr .ti");
      if (!(i.client || "").trim()) {
        ti.focus();
        ti.style.boxShadow = "0 0 0 2px #C83C3C";
        return toast("Indique o nome do cliente para guardar");
      }
      t.disabled = true;
      t.textContent = "A guardar\u2026";
      save();
      AJ_DB.flushNow().then(() => {
        closeDr();
        toast("\u2713 Processo guardado");
      });
      return;
    }
    if (a == "wa") return notify(S.items.find((x) => x.id === UI.sel));
    if (a == "arch") {
      const i = S.items.find((x) => x.id === UI.sel);
      i.arch = !i.arch;
      log(i, i.arch ? "Processo arquivado" : "Processo desarquivado");
      save();
      closeDr();
      return toast(i.arch ? "Processo arquivado" : "Processo desarquivado");
    }
    if (a == "adddoc") {
      const i = S.items.find((x) => x.id === UI.sel),
        u = $("#pmDocU").value.trim(),
        n = $("#pmDocN").value.trim();
      if (!/^https?:\/\//i.test(u)) return alert("Cole uma liga\xE7\xE3o que comece por https://");
      (i.docs = i.docs || []).push({ n: n || "Documento", u, v: false });
      log(i, "Documento adicionado: " + (n || u));
      save();
      return drawer(i);
    }
    if (a == "deldoc") {
      const i = S.items.find((x) => x.id === UI.sel);
      i.docs.splice(+t.dataset.n, 1);
      save();
      return drawer(i);
    }
    if (a == "add") return create(cl.dataset.c);
    if (a == "addcol") {
      S.cols.push({ id: uid(), name: "Nova coluna", color: COLORS[S.cols.length % COLORS.length] });
      save();
      render();
      const n = document.querySelectorAll("#pm .cn");
      n[n.length - 1].select();
      return;
    }
    if (a == "color") return colMenu(t, cl.dataset.c);
    if (a == "delcol") {
      const c = col(cl.dataset.c),
        its = S.items.filter((i) => i.col === c.id);
      if (
        its.length &&
        !confirm(`Eliminar a coluna "${c.name}" e os seus ${its.length} processo(s)?`)
      )
        return;
      const si2 = S.items.slice(),
        sc = S.cols.slice();
      S.items = S.items.filter((i) => i.col !== c.id);
      S.cols = S.cols.filter((x) => x !== c);
      save();
      render();
      return toast("Coluna eliminada", () => {
        S.items = si2;
        S.cols = sc;
      });
    }
    if (a == "reset") {
      if (confirm("Repor os dados de exemplo? Isto apaga as suas altera\xE7\xF5es.")) {
        S = seed();
        save();
        closeDr();
      }
      return;
    }
    if (a == "dup") return dup(k.dataset.id);
    if (a == "del") return del(k.dataset.id);
    if (a == "dupd") {
      dup(UI.sel);
      return closeDr();
    }
    if (a == "deld") return del(UI.sel);
    if (a == "delck") {
      const i = S.items.find((x) => x.id === UI.sel);
      i.check.splice(+t.dataset.n, 1);
      save();
      return drawer(i);
    }
    if (t.matches(".k,tr.r,.ev")) openDr(t.dataset.id);
  });
  document.addEventListener("change", (e) => {
    const el = e.target,
      i = S.items.find((x) => x.id === UI.sel);
    if (el.dataset.a == "mv") {
      const m = S.items.find((x) => x.id === el.closest(".k").dataset.id);
      if (m && m.col !== el.value) {
        m.col = el.value;
        syncStage(m);
        log(m, "Movido para " + col(el.value).name, 1);
        save();
        render();
        toast("Movido para " + col(el.value).name);
      }
      return;
    }
    if (el.dataset.a == "ren") {
      const c = col(el.closest(".cl").dataset.c);
      c.name = el.value.trim() || "Sem nome";
      save();
      return render();
    }
    if (!i || !el.closest("#pmDr")) return;
    if (el.dataset.cpick !== void 0) {
      const v = el.value;
      if (v == "__new") {
        i.client = "";
        i.cemail = "";
        i.tel = "";
        save();
        drawer(i);
        const em = document.querySelector("#pmDr [data-f=cemail]");
        if (em) em.focus();
        return;
      }
      if (!v) return;
      const cc = (AJ_CLIENTS.list() || []).find((x) => x.email === v);
      if (cc) {
        i.client = cc.nome || cc.email.split("@")[0];
        i.cemail = cc.email;
        if (cc.tel) i.tel = cc.tel;
        log(i, "Cliente associado: " + i.client);
        save();
        render();
        drawer(i);
      }
      return;
    }
    if (el.dataset.k !== void 0) {
      const c = i.check[+el.dataset.k];
      c.d = el.checked;
      log(i, (c.d ? "Conclu\xEDdo: " : "Reaberto: ") + c.t, 1);
      save();
      return drawer(i);
    }
    if (el.dataset.dv !== void 0) {
      i.docs[+el.dataset.dv].v = el.checked;
      log(
        i,
        (el.checked ? "Documento partilhado com o cliente: " : "Documento ocultado: ") +
          i.docs[+el.dataset.dv].n,
      );
      return save();
    }
    if (el.dataset.kt !== void 0) {
      i.check[+el.dataset.kt].t = el.value;
      return save();
    }
    const f = el.dataset.f;
    if (!f) return;
    if (f == "col") {
      log(i, "Movido para " + col(el.value).name, 1);
    } else if (["prio", "owner", "due"].includes(f))
      log(
        i,
        `${{ prio: "Prioridade", owner: "Respons\xE1vel", due: "Prazo" }[f]}: ${el.value || "\u2014"}`,
      );
    i[f] =
      f == "tags"
        ? el.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : f == "valor"
          ? el.value === ""
            ? ""
            : +el.value
          : el.value;
    if (f == "col") syncStage(i);
    save();
    render();
    if (f == "col" || f == "prio" || f == "owner" || f == "due") drawer(i);
  });
  document.addEventListener("input", (e) => {
    const el = e.target,
      i = S.items.find((x) => x.id === UI.sel);
    if (el.id == "pmSearch") {
      UI.q = el.value.toLowerCase().trim();
      return render();
    }
    if (
      i &&
      el.closest("#pmDr") &&
      (el.dataset.f == "client" || el.dataset.f == "notes" || el.dataset.f == "cmsg")
    ) {
      i[el.dataset.f] = el.value;
      save();
      if (el.dataset.f == "client") render();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.id == "pmNewCk" && e.key == "Enter" && e.target.value.trim()) {
      const i = S.items.find((x) => x.id === UI.sel);
      i.check.push(C(e.target.value.trim()));
      save();
      drawer(i);
      $("#pmNewCk").focus();
    }
    if (e.key == "Escape" && UI.sel) closeDr();
    if (e.target.classList?.contains("cn") && e.key == "Enter") e.target.blur();
  });
  let dragId = null;
  document.addEventListener("dragstart", (e) => {
    const k = e.target.closest?.("#pm .k");
    if (k) {
      dragId = k.dataset.id;
      k.classList.add("drag");
      e.dataTransfer.effectAllowed = "move";
    }
  });
  document.addEventListener("dragend", () => {
    dragId = null;
    document.querySelectorAll(".drag,.over").forEach((x) => x.classList.remove("drag", "over"));
  });
  document.addEventListener("dragover", (e) => {
    const c = e.target.closest?.("#pm .cl[data-c]");
    if (c && dragId) {
      e.preventDefault();
      document.querySelectorAll(".over").forEach((x) => x !== c && x.classList.remove("over"));
      c.classList.add("over");
    }
  });
  document.addEventListener("drop", (e) => {
    const c = e.target.closest?.("#pm .cl[data-c]");
    if (!c || !dragId) return;
    e.preventDefault();
    const i = S.items.find((x) => x.id === dragId),
      before = e.target.closest(".k");
    if (i.col !== c.dataset.c) log(i, "Movido para " + col(c.dataset.c).name, 1);
    i.col = c.dataset.c;
    syncStage(i);
    S.items.splice(S.items.indexOf(i), 1);
    const b =
      before && before.dataset.id !== dragId
        ? S.items.find((x) => x.id === before.dataset.id)
        : null;
    b ? S.items.splice(S.items.indexOf(b), 0, i) : S.items.push(i);
    save();
    render();
  });
  if (window.AJ_CLIENTS)
    AJ_CLIENTS.load().then(() => {
      const i = S.items.find((x) => x.id === UI.sel);
      if (i) drawer(i);
    });
  const host = $("#view-processos");
  host.innerHTML = '<div id="pm"></div>';
  document.body.insertAdjacentHTML(
    "beforeend",
    '<div id="pmShade"></div><div id="pmDr"></div><div id="pmToast"></div>',
  );
  const si = document.querySelector("#adminView .search input");
  si.id = "pmSearch";
  const _sw = window.switchAdminView;
  window.switchAdminView = function (n, el) {
    _sw(n, el);
    if (n == "processos") render();
    if (n == "relatorios") $("#view-relatorios").innerHTML = stats();
    if (n == "clientes") {
      $("#view-clientes").innerHTML = clients();
      if (window.AJ_CLIENTS)
        AJ_CLIENTS.load(true).then(() => {
          if ($("#view-clientes").style.display != "none")
            $("#view-clientes").innerHTML = clients();
        });
    }
  };
  render();
  window.__pm = {
    render,
    createFrom: (pre) => {
      UI.view = "board";
      UI.q = "";
      UI.flt = "";
      return create(S.cols[0] && S.cols[0].id, pre);
    },
    getS: () => S,
    csv,
    json: () =>
      dl("aj-backup-" + today() + ".json", JSON.stringify(S, null, 1), "application/json"),
    reload: async () => {
      if (UI.sel || Date.now() - AJ_DB.lastSave < 4e3) return;
      try {
        const n = await (AJ_DB.fresh ? AJ_DB.fresh() : AJ_DB.load());
        if (n) {
          S = n;
          render();
        }
      } catch (e) {}
    },
  };
};
