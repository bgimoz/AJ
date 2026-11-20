/* ============================================================
   site/nav-auth.js  (15 de 20)
   Botões "Iniciar sessão" / "Criar conta" na navegação do site público e estado quando o utilizador já entrou.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const $ = (s) => document.querySelector(s),
    H = document.documentElement;
  const na = document.createElement("div");
  na.className = "nav-auth";
  na.dataset.auth = "out";
  na.innerHTML =
    '<button class="na-login" id="naLogin"><span class="l-long">Iniciar sess\xE3o</span><span class="l-short">Entrar</span></button><button class="btn btn-solid btn-round na-signup" id="naSignup">Criar conta</button>';
  const inn = document.createElement("div");
  inn.className = "nav-in";
  inn.innerHTML =
    '<button class="btn btn-solid btn-round na-area" id="naArea" data-auth="in">A minha \xE1rea</button><button class="acct" id="navAcct" data-auth="in" title="A minha conta" aria-label="A minha conta"></button>';
  const cta = document.querySelector(".nav-right > a.btn-glass"),
    nr = document.querySelector(".nav-right");
  if (cta) {
    cta.before(na);
    cta.before(inn);
  } else {
    nr.prepend(inn);
    nr.prepend(na);
  }
  const open = (m) => (window.AJ_OPEN ? AJ_OPEN(m) : showAdmin());
  const on = (id, m) => {
    const e = document.getElementById(id);
    if (e) e.onclick = () => open(m);
  };
  on("naLogin", "login");
  on("naSignup", "signup");
  on("ptLogin", "login");
  on("ptSignup", "signup");
  on("ptArea", "login");
  on("naArea", "login");
  on("vidCta", "signup");
  on("vidArea", "login");
  const logged = (v) => {
    if (v) H.dataset.logged = "1";
    else H.removeAttribute("data-logged");
  };
  document.addEventListener("aj:login", () => logged(true));
  async function loadMe() {
    if (!window.AJ_SB) return;
    await new Promise((r) => (window.requestIdleCallback || setTimeout)(r));
    const {
      data: { session },
    } = await AJ_SB.auth.getSession();
    if (!session) {
      logged(false);
      return;
    }
    const u = session.user,
      md = u.user_metadata || {};
    let nome = md.nome || md.full_name || md.name || u.email.split("@")[0],
      role = "cliente";
    const { data } = await AJ_SB.from("profiles").select("papel,nome").eq("id", u.id).maybeSingle();
    if (data) {
      role = data.papel || role;
      nome = data.nome || nome;
    }
    window.AJ_ME = { email: u.email, role, nome };
    logged(true);
    document.dispatchEvent(new CustomEvent("aj:login", { detail: window.AJ_ME }));
  }
  if (window.AJ_SB) {
    loadMe();
    AJ_SB.auth.onAuthStateChange((e, s) => {
      if (e == "SIGNED_OUT") logged(false);
      else if (s && !window.AJ_ME) loadMe();
    });
  }
})();
