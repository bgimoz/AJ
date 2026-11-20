/* ============================================================
   site/video.js  (16 de 20)
   Comportamento do cartão de vídeo (#vidCard / #ajVid).
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

(function () {
  const v = document.getElementById("ajVid"),
    card = document.getElementById("vidCard");
  if (!v) return;
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches,
    sd = navigator.connection && navigator.connection.saveData;
  v.preload = sd ? "metadata" : "auto";
  if (!sd) {
    try {
      v.load();
    } catch (e) {}
  }
  let manual = false,
    vis = false;
  const upd = () => card.classList.toggle("paused", v.paused);
  v.addEventListener("play", upd);
  v.addEventListener("pause", upd);
  upd();
  v.addEventListener(
    "error",
    () =>
      setTimeout(() => {
        if (v.networkState === 3 || v.error) card.classList.add("novid");
      }, 0),
    true,
  );
  const play = () => {
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };
  new IntersectionObserver(
    (es) =>
      es.forEach((en) => {
        vis = en.isIntersecting && en.intersectionRatio >= 0.35;
        if (vis && !manual && !rm) play();
        else if (!vis) v.pause();
      }),
    { threshold: [0, 0.35, 0.6] },
  ).observe(card);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) v.pause();
    else if (vis && !manual && !rm) play();
  });
  card.addEventListener("click", (e) => {
    if (e.target.closest(".vid-btn,.vid-mute")) return;
    if (v.paused) {
      manual = false;
      play();
    } else {
      manual = true;
      v.pause();
    }
  });
  const m = document.getElementById("vidMute");
  m.onclick = () => {
    v.muted = !v.muted;
    m.setAttribute("aria-label", v.muted ? "Ativar som" : "Silenciar");
    m.classList.toggle("on", !v.muted);
    if (!v.muted && v.paused) play();
  };
})();
