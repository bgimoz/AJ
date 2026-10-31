# AJ Aduaneira — site

```
index.html + servicos / como-funciona / portal / contacto .html   (páginas públicas)
css/                base, admin, site-extras, pm, auth, video, account, overrides, ux
js/                 ui-state, config (Supabase), site, pm (quadro), auth, admin-site, account-*, nav-auth, video, restore, ux
assets/img/         logo.png, hero-1.jpg, hero-2.jpg
```
Ordem dos ficheiros em index.html é importante — não a alterar.

**Coloque ao lado do index.html** (como antes): `aj_adn_vid.mp4` (ou .webm) e `checklist-desalfandegamento.pdf`.

## O que mudou (UX)
- Telemóvel: menu em folha + barra inferior fixa (Menu · Pedir cotação · WhatsApp); painel interno com abas inferiores.
- Tema claro/escuro/automático, guardado; o botão ⚙️ foi substituído por botões claros.
- Quadro: seletor "Mover para" em cada cartão (sem precisar de arrastar), ações visíveis ao toque, scroll mantido.
- Formulário: validação com mensagens, Enter avança, email deixou de abrir sozinho (botões WhatsApp/email no fim).
- Botão Voltar do telemóvel agora volta do login/painel para o site.
- Correções: texto do hero ilegível, formulário de login com estilo do de cotação, barra do painel no modo escuro, zoom do iOS nos campos, âncoras tapadas pelo cabeçalho, FAQ por teclado, animação do portal (pausa quando não visível).

## Páginas
Cada página inclui o mesmo login/painel (abre por cima), por isso o utilizador entra de qualquer uma. `?conta=login` ou `?conta=signup` no endereço abre direto o ecrã de entrada.
Cada página termina num cartão "Próximo passo". O Início tem "Por onde começar". Contacto tem WhatsApp/Ligar/Email em destaque.
