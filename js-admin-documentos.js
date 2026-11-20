/* ============================================================
   admin/documentos.js  (18 de 20)
   Vista "Documentos" do painel interno (#view-documentos).
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const v = document.getElementById("view-documentos");
  if (!v) return;
  const K = "aj_docs",
    ST = ["Pendente", "Em an\xE1lise", "Verificado"],
    CL = { Pendente: "pending", "Em an\xE1lise": "progress", Verificado: "done" };
  const IC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
  const seed = [
    ["Factura Comercial", "Comercial Etana, Lda", "0417/26", "Verificado"],
    ["Guia de Remessa", "Nova Comercial, Lda", "0392/26", "Pendente"],
    ["Bill of Lading (B/L)", "Grupo Vale", "0388/26", "Verificado"],
    ["Certificado de Origem", "Farm\xE1cia Central", "0409/26", "Pendente"],
    ["Comprovativo de Compra \u2014 BeForward", "Carlos Macu\xE1cua", "0430/26", "Verificado"],
    ["Registo INATER", "In\xEAs Variege", "0433/26", "Em an\xE1lise"],
  ];
  let D;
  try {
    D = JSON.parse(localStorage.getItem(K));
  } catch (e) {}
  if (!Array.isArray(D))
    D = seed.map((a, i) => ({ id: "d" + i, n: a[0], c: a[1], r: a[2], s: a[3], t: "" }));
  let q = "",
    f = "",
    cur = null;
  const sv = () => {
    try {
      localStorage.setItem(K, JSON.stringify(D));
    } catch (e) {}
  };
  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  v.innerHTML = `<div class="notes-card"><div class="dq"><input id="dqS" type="search" placeholder="Procurar documento, cliente ou n\xFAmero" aria-label="Procurar documentos"><button class="btn btn-solid btn-round" id="dqN" type="button">+ Novo documento</button></div><div class="dq-f" id="dqF"></div><div id="dqL"></div><p class="dq-h">Toque num documento para o editar. Toque no estado para o mudar.</p></div>
<dialog id="dqD"><form id="dqFm"><h3 id="dqT"></h3><label>Tipo de documento<input id="dqn" list="dql" required maxlength="80"></label><datalist id="dql"><option value="Factura Comercial"><option value="Guia de Remessa"><option value="Bill of Lading (B/L)"><option value="Certificado de Origem"><option value="Packing List"><option value="Registo INATER"></datalist><label>Cliente<input id="dqc" maxlength="80"></label><label>N\xBA / refer\xEAncia<input id="dqr" maxlength="40"></label><label>Estado<select id="dqs">${ST.map((s) => `<option>${s}</option>`).join("")}</select></label><label>Notas<textarea id="dqt" rows="2" maxlength="300"></textarea></label><div class="dq-b"><button type="button" id="dqX" class="btn btn-glass btn-round">Eliminar</button><button type="button" id="dqC" class="btn btn-glass btn-round">Cancelar</button><button type="submit" class="btn btn-solid btn-round">Guardar</button></div></form></dialog>`;
  const $ = (s) => v.querySelector(s),
    L = $("#dqL"),
    F = $("#dqF"),
    dg = $("#dqD");
  function render() {
    const a = D.filter(
      (d) => (!f || d.s == f) && (!q || (d.n + d.c + d.r).toLowerCase().includes(q)),
    );
    L.innerHTML = a.length
      ? a
          .map(
            (d) =>
              `<div class="doc-row" data-id="${d.id}" role="button" tabindex="0"><span class="doc-name">${IC}${esc(d.n)}</span><span>${esc(d.c)}</span><span class="mono">${d.r ? "N\xBA " + esc(d.r) : ""}</span><span class="tag ${CL[d.s]}"><button type="button" class="dq-s" data-s="${d.id}" aria-label="Mudar estado: ${d.s}">${d.s}</button></span></div>`,
          )
          .join("")
      : '<p class="dq-e">Nenhum documento encontrado.</p>';
    F.innerHTML = ["", ...ST]
      .map(
        (s) =>
          `<button type="button" class="${s == f ? "on" : ""}" data-f="${s}">${s || "Todos"} ${s ? D.filter((d) => d.s == s).length : D.length}</button>`,
      )
      .join("");
  }
  function edit(id) {
    cur = D.find((d2) => d2.id == id) || null;
    const d = cur || { n: "", c: "", r: "", s: "Pendente", t: "" };
    $("#dqT").textContent = cur ? "Editar documento" : "Novo documento";
    $("#dqn").value = d.n;
    $("#dqc").value = d.c;
    $("#dqr").value = d.r;
    $("#dqs").value = d.s;
    $("#dqt").value = d.t || "";
    $("#dqX").style.display = cur ? "" : "none";
    dg.showModal ? dg.showModal() : dg.setAttribute("open", "");
  }
  const close = () => (dg.close ? dg.close() : dg.removeAttribute("open"));
  v.addEventListener("click", (e) => {
    const t = e.target;
    if (t.dataset.s) {
      e.stopPropagation();
      const d = D.find((x) => x.id == t.dataset.s);
      d.s = ST[(ST.indexOf(d.s) + 1) % 3];
      sv();
      render();
      return;
    }
    if (t.dataset.f !== void 0 && t.closest("#dqF")) {
      f = t.dataset.f;
      render();
      return;
    }
    if (t.closest("#dqN")) {
      edit();
      return;
    }
    const r = t.closest(".doc-row");
    if (r) edit(r.dataset.id);
  });
  v.addEventListener("keydown", (e) => {
    const r = e.target.closest && e.target.closest(".doc-row");
    if (r && e.target == r && (e.key == "Enter" || e.key == " ")) {
      e.preventDefault();
      edit(r.dataset.id);
    }
  });
  $("#dqS").addEventListener("input", (e) => {
    q = e.target.value.trim().toLowerCase();
    render();
  });
  $("#dqC").onclick = close;
  $("#dqX").onclick = () => {
    if (cur && confirm("Eliminar este documento?")) {
      D = D.filter((d) => d !== cur);
      sv();
      render();
      close();
    }
  };
  $("#dqFm").addEventListener("submit", (e) => {
    e.preventDefault();
    const o = {
      n: $("#dqn").value.trim(),
      c: $("#dqc").value.trim(),
      r: $("#dqr").value.trim(),
      s: $("#dqs").value,
      t: $("#dqt").value.trim(),
    };
    if (cur) Object.assign(cur, o);
    else D.unshift(Object.assign({ id: "d" + Date.now() }, o));
    sv();
    render();
    close();
  });
  render();
})();
