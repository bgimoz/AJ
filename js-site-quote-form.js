/* ============================================================
   site/quote-form.js  (4 de 20)
   Formulário de cotação por passos: navegação entre passos, resumo e envio por email/WhatsApp.
   Ordem de carga: ver README.md (os ficheiros partilham o mesmo
   âmbito global; não reordenar nem converter em módulos ES sem testar).
   ============================================================ */

const stepLabels = {
  1: "Passo 1 de 3 \u2014 Os seus dados",
  2: "Passo 2 de 3 \u2014 A sua carga",
  3: "Passo 3 de 3 \u2014 Detalhes",
};
function goToStep(n) {
  document.querySelectorAll(".form-step").forEach((s) => s.classList.remove("active"));
  document.getElementById("formStep" + n).classList.add("active");
  [1, 2, 3].forEach((i) => document.getElementById("dot" + i).classList.toggle("active", i <= n));
  const label = document.getElementById("stepLabel");
  if (label) label.textContent = stepLabels[n];
}
function nextStep(from) {
  goToStep(from + 1);
}
function prevStep(from) {
  goToStep(from - 1);
}
function submitQuote() {
  const nome = (document.getElementById("nome").value || "N\xE3o indicado").trim();
  const tel = (document.getElementById("tel").value || "N\xE3o indicado").trim();
  const carga = document.getElementById("carga").value || "N\xE3o indicado";
  const rota = document.getElementById("rota2").value || "N\xE3o indicado";
  const msg = (document.getElementById("msg").value || "Sem informa\xE7\xE3o adicional").trim();
  const corpo = `Novo pedido de cota\xE7\xE3o \u2014 site AJ Servi\xE7os LDA

Nome/Empresa: ${nome}
Contacto: ${tel}
Tipo de carga: ${carga}
Origem -> Destino: ${rota}
Detalhes adicionais: ${msg}`;
  const assunto = `Pedido de cota\xE7\xE3o \u2014 ${nome}`;
  const mailtoLink = `mailto:${AJ_CONTACTS.emails.join(",")}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  const waText = encodeURIComponent(corpo);
  AJ_CONTACTS.whatsapp.forEach((num, i) => {
    const btn = document.getElementById("waBtn" + (i + 1));
    if (btn) btn.href = `https://wa.me/${num}?text=${waText}`;
  });
  document.querySelectorAll(".form-step").forEach((s) => s.classList.remove("active"));
  document.getElementById("formStepDone").classList.add("active");
  const mb = document.getElementById("mailBtn");
  if (mb) mb.href = mailtoLink;
}
function resetForm() {
  document.getElementById("quoteForm").reset();
  goToStep(1);
}
