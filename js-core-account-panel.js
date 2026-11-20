/* ============================================================
   core/account-panel.js  (14 de 20)
   Painel lateral "A minha conta" (window.AJ_ACCOUNT_OPEN): perfil, telefone e palavra-passe.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const live = window.AJ_LIVE,
    sb = window.AJ_SB;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const ini = (n) =>
    (n || "?")
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const P = document.createElement("div");
  P.id = "acctPanel";
  P.innerHTML =
    '<div class="ap-shade"></div><aside class="ap-box" role="dialog" aria-modal="true" aria-label="A minha conta"></aside>';
  document.body.appendChild(P);
  const box = P.querySelector(".ap-box"),
    ROLE = { admin: "Administrador", equipa: "Equipa AJ", cliente: "Cliente" };
  let ME = null,
    tel = "";
  const say = (id, t, er) => {
    const e = document.getElementById(id);
    if (e) {
      e.textContent = t;
      e.className = "ap-st" + (er ? " er" : "");
    }
  };
  async function open() {
    ME = window.AJ_ME;
    if (!ME) return;
    tel = "";
    if (live) {
      try {
        const {
          data: { user },
        } = await sb.auth.getUser();
        const { data } = await sb
          .from("profiles")
          .select("nome,telefone")
          .eq("id", user.id)
          .maybeSingle();
        if (data) {
          ME.nome = data.nome || ME.nome;
          tel = data.telefone || "";
        }
      } catch (e) {}
    } else tel = localStorage.getItem("aj_demo_tel") || "";
    render();
    P.classList.add("on");
    document.body.style.overflow = "hidden";
  }
  function close() {
    P.classList.remove("on");
    document.body.style.overflow = "";
  }
  function render() {
    box.innerHTML = `<div class="ap-top"><b>A minha conta</b><button class="ap-x" data-ap="close" aria-label="Fechar">\xD7</button></div>
 <div class="ap-id"><span class="ap-av">${esc(ini(ME.nome))}</span><div><b>${esc(ME.nome)}</b><small>${esc(ME.email)}</small><em>${ROLE[ME.role] || "Cliente"}</em></div></div>
 <section class="ap-sec"><h4>Dados pessoais</h4><label>Nome<input id="apNome" value="${esc(ME.nome)}" autocomplete="name"></label><label>Telefone / WhatsApp<input id="apTel" type="tel" value="${esc(tel)}" placeholder="+258 \u2026" autocomplete="tel"></label><label>Email<input value="${esc(ME.email)}" disabled></label><div class="ap-row"><button class="ap-b" data-ap="save">Guardar altera\xE7\xF5es</button><span id="apS1" class="ap-st"></span></div></section>
 <section class="ap-sec"><h4>Palavra-passe</h4><p class="ap-n">Se entrou com o Google, pode tamb\xE9m definir uma palavra-passe para entrar com o email.</p><label>Nova palavra-passe<input id="apP1" type="password" autocomplete="new-password" placeholder="M\xEDnimo 8 caracteres"></label><label>Confirmar<input id="apP2" type="password" autocomplete="new-password"></label><div class="ap-row"><button class="ap-b" data-ap="pass">Alterar palavra-passe</button><span id="apS2" class="ap-st"></span></div></section>
 <section class="ap-sec"><h4>Os meus dados</h4><p class="ap-n">Pode pedir \xE0 nossa equipa para corrigir ou eliminar os seus dados.</p><button class="ap-b ghost" data-ap="del">Pedir elimina\xE7\xE3o dos meus dados</button></section>
 <section class="ap-sec"><h4>Sess\xE3o</h4><button class="ap-b ghost" data-ap="all">Terminar sess\xE3o em todos os dispositivos</button><button class="ap-b red" data-ap="out">Terminar sess\xE3o</button></section>`;
  }
  function refreshName() {
    const n = ME.nome;
    window.AJ_ME.nome = n;
    document.dispatchEvent(new CustomEvent("aj:login", { detail: window.AJ_ME }));
    const f = document.querySelector("#adminView .sb-foot-text .name");
    if (f) f.textContent = n;
    const a = document.querySelector("#adminView .avatar");
    if (a) a.textContent = ini(n);
    const hi = document.getElementById("cvHi");
    if (hi && ME.role == "cliente") hi.textContent = "Ol\xE1, " + n.split(" ")[0];
  }
  box.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-ap]");
    if (!b) return;
    const k = b.dataset.ap;
    if (k == "close") return close();
    if (k == "save") {
      const nome = document.getElementById("apNome").value.trim(),
        t = document.getElementById("apTel").value.trim();
      if (nome.length < 2) return say("apS1", "Indique o seu nome.", 1);
      b.disabled = true;
      try {
        if (live) {
          const { error } = await sb.rpc("atualizar_perfil", { p_nome: nome, p_telefone: t });
          if (error) throw error;
        } else localStorage.setItem("aj_demo_tel", t);
        ME.nome = nome;
        tel = t;
        refreshName();
        say("apS1", "Guardado.");
      } catch (x) {
        say("apS1", "Erro: " + x.message, 1);
      }
      b.disabled = false;
      return;
    }
    if (k == "pass") {
      const p1 = document.getElementById("apP1").value,
        p2 = document.getElementById("apP2").value;
      if (p1.length < 8) return say("apS2", "M\xEDnimo 8 caracteres.", 1);
      if (p1 !== p2) return say("apS2", "As palavras-passe n\xE3o coincidem.", 1);
      b.disabled = true;
      try {
        if (live) {
          const { error } = await sb.auth.updateUser({ password: p1 });
          if (error) throw error;
        }
        document.getElementById("apP1").value = document.getElementById("apP2").value = "";
        say("apS2", "Palavra-passe alterada.");
      } catch (x) {
        say("apS2", "Erro: " + x.message, 1);
      }
      b.disabled = false;
      return;
    }
    if (k == "del") {
      const w = (window.AJ_CONTACTS && AJ_CONTACTS.whatsapp[0]) || "";
      window.open(
        "https://wa.me/" +
          w +
          "?text=" +
          encodeURIComponent(
            "Ol\xE1! Gostaria de pedir a corre\xE7\xE3o/elimina\xE7\xE3o dos meus dados na AJ Servi\xE7os LDA. Email da conta: " +
              ME.email,
          ),
        "_blank",
        "noopener",
      );
      return;
    }
    if (k == "all") {
      if (confirm("Terminar a sess\xE3o em todos os dispositivos?")) AJ_LOGOUT_ALL();
      return;
    }
    if (k == "out") {
      if (confirm("Terminar a sess\xE3o?")) AJ_LOGOUT();
    }
  });
  P.querySelector(".ap-shade").onclick = close;
  document.addEventListener("keydown", (e) => {
    if (e.key == "Escape" && P.classList.contains("on")) close();
  });
  window.AJ_ACCOUNT_OPEN = open;
})();
