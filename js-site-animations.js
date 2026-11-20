/* ============================================================
   site/animations.js  (6 de 20)
   Animações da página pública: revelar ao rolar, FAQ, contadores, rota, estados do portal e efeito de inclinação (tilt).
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 },
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
document.querySelectorAll(".faq-item").forEach((item) => {
  item.querySelector(".faq-q").addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item.open").forEach((o) => o.classList.remove("open"));
    if (!isOpen) item.classList.add("open");
  });
});
const counters = document.querySelectorAll(".count");
const counterIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        counters.forEach((el) => {
          const target = parseInt(el.dataset.target, 10);
          const prefix = el.dataset.prefix || "";
          const suffix = el.dataset.suffix || "";
          const duration = 1200;
          const start = performance.now();
          function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = prefix + Math.round(eased * target) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
        counterIO.disconnect();
      }
    });
  },
  { threshold: 0.4 },
);
const trustStrip = document.querySelector(".trust-strip");
if (trustStrip) counterIO.observe(trustStrip);
const routeWrap = document.getElementById("routeWrap");
const routeIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        routeWrap.classList.add("in");
        routeIO.unobserve(routeWrap);
      }
    });
  },
  { threshold: 0.3 },
);
if (routeWrap) routeIO.observe(routeWrap);
const portalStates = [
  { cls: "pending", text: "Doc. pendente" },
  { cls: "progress", text: "Em alf\xE2ndega" },
  { cls: "progress", text: "Em tr\xE2nsito" },
  { cls: "done", text: "Conclu\xEDdo" },
];
const dataRows = document.querySelectorAll("#portalTable .portal-table-row:not(.head)");
setInterval(() => {
  if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const row = dataRows[Math.floor(Math.random() * dataRows.length)];
  const tag = row.querySelector(".tag");
  const next = portalStates[Math.floor(Math.random() * portalStates.length)];
  tag.className = "tag " + next.cls;
  tag.textContent = next.text;
}, 2600);
document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-4px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0) rotateY(0) translateY(0)";
  });
});
