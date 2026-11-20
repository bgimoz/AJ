# AJ Serviços LDA — site e portal

Site público da AJ Serviços (despacho aduaneiro, Lichinga, Niassa) com portal do cliente e painel interno da equipa.
Publicado no GitHub Pages em **https://ajservicos.co.mz**.

Não há compilação nem dependências: são ficheiros estáticos (HTML, CSS e JavaScript simples). O que está nesta pasta é exactamente o que o GitHub Pages serve.

## Estrutura

```
Todos os ficheiros ficam na mesma pasta (raiz do repositório), sem subpastas.
Os nomes dizem a que pasta "virtual" pertencem:

index.html                 Marcação de todas as vistas
404.html  CNAME  robots.txt  sitemap.xml  .nojekyll
logo-aj.png                Logótipo e favicon
hero-1.webp  hero-2.webp   Fundo do hero
aj_adn_vid.mp4             Vídeo da secção "Portal" (fica na raiz)
css-NN-nome.css            Estilos, numerados pela ordem de carga
js-config-*.js             Valores que se editam (contactos, Supabase)
js-core-*.js               Núcleo (vistas, autenticação, conta, sessão)
js-site-*.js               Página pública
js-admin-*.js              Painel interno
js-extras-*.js             Funcionalidades adicionais
js-vendor-supabase.js      Biblioteca de terceiros (não editar)
```

## Como as vistas funcionam

O `index.html` contém quatro vistas, mostradas ou escondidas por JavaScript: `#siteView` (site público), `#loginView`, `#clientView` (área do cliente) e `#adminView` (painel interno). Os dados (processos, clientes, configuração do site) ficam no Supabase; a lógica está em `js-core-auth-database.js` e `js/admin/`.

## Ordem de carga (importante)

Tanto o CSS como o JS **dependem da ordem**. O `index.html` carrega os ficheiros pela ordem das tabelas abaixo.

- **CSS:** os ficheiros mais abaixo podem substituir regras dos anteriores. Reordenar muda o aspecto do site. A divisão foi feita sem mudar a ordem original das regras.
- **JS:** são scripts clássicos que partilham o mesmo âmbito global (por exemplo `AJ_CONTACTS`, `switchAdminView`, `AJ_DB`). Os vários ficheiros não são módulos ES.

### CSS

| # | Ficheiro | O que cobre |
|---|----------|-------------|
| 1 | `css-01-base.css` | Variáveis de design (cores, tema escuro), reset, tipografia e utilitários (.wrap, .reveal, .glass, .blob). |
| 2 | `css-02-header-buttons.css` | Cabeçalho, logótipo, ligações de navegação, painel de definições e botões base. |
| 3 | `css-03-landing-sections.css` | Secções da página pública: hero, manifesto, confiança, serviços, porquê, processo, rota, portal, documentos, FAQ, contacto e rodapé. |
| 4 | `css-04-admin-panel.css` | Painel interno (#adminView): barra lateral, topo, cartões, tabelas e definições. |
| 5 | `css-05-landing-extras.css` | Skip-link, botão flutuante de WhatsApp, barra CTA, tabela comparativa e formulário de cotação por passos. |
| 6 | `css-06-processos-kanban.css` | Gestor de processos (.pm): quadro kanban, gaveta de detalhes (#pmDr) e avisos (#pmToast). |
| 7 | `css-07-login.css` | Ecrã de login e registo (#loginView). |
| 8 | `css-08-client-panel.css` | Área do cliente (#clientView), indicador de sincronização (#ajSync) e aviso global (#ajBanner). |
| 9 | `css-09-admin-tools.css` | Ferramentas de administração (.adm), logótipo personalizado, menu da conta e modo de manutenção. |
| 10 | `css-10-nav-auth-video.css` | Ajustes do kanban e do calendário, botões Entrar/Criar conta, login com Google e secção de vídeo (.vid-*). |
| 11 | `css-11-account-panel.css` | Painel lateral "A minha conta" (#acctPanel). |
| 12 | `css-12-layout-overrides.css` | Ajustes de layout (navegação, grelhas, cabeçalho, gaveta) aplicados por cima dos ficheiros anteriores. |
| 13 | `css-13-mobile-ux.css` | Camada de usabilidade móvel: menu em folha inferior, barra CTA móvel, tokens atualizados, barra de carregamento e movimento reduzido. |
| 14 | `css-14-documents.css` | Vista de documentos do painel (.dq*, .doc-row). |
| 15 | `css-15-navbar-v2.css` | Barra de navegação v2 (versão limpa) e menu hambúrguer. |
| 16 | `css-16-quote-form.css` | Formulário de cotação moderno (.qf-*). |
| 17 | `css-17-client-timeline.css` | Linha do tempo de fases na área do cliente (.trk). |
| 18 | `css-18-admin-panel-v2.css` | Painel interno v2: separadores, processos, perfil Google, menu de colunas, fases personalizáveis, definições e administração. |

### JavaScript

`js-core-boot.js` carrega no `<head>`; os restantes no fim do `<body>`.

| # | Ficheiro | O que faz |
|---|----------|-----------|
| 1 | `js-core-boot.js` | Corre no <head>, antes de tudo (bloqueante): AJ_UI_GET/AJ_UI_SET (preferências em localStorage), classe aj-restore e tema claro/escuro sem "flash". |
| 2 | `js-site-top-loader.js` | Barra de progresso no topo da página (#topBar) enquanto há pedidos de rede. |
| 3 | `js-config-contacts.js` | Contactos oficiais (WhatsApp e emails) usados pelo formulário de cotação e pelo resto do site. É AQUI que se mudam os contactos. |
| 4 | `js-site-quote-form.js` | Formulário de cotação por passos: navegação entre passos, resumo e envio por email/WhatsApp. |
| 5 | `js-core-views.js` | Alternância entre as vistas da aplicação (site público, painel interno): switchAdminView, showAdmin, showSite. |
| 6 | `js-site-animations.js` | Animações da página pública: revelar ao rolar, FAQ, contadores, rota, estados do portal e efeito de inclinação (tilt). |
| 7 | `js-site-navigation-theme.js` | Navegação e tema: botão claro/escuro, menu móvel (folha inferior), barra CTA móvel e validação do formulário. |
| 8 | `js-vendor-supabase.js` | Biblioteca de terceiros (supabase-js, versão agrupada). Não editar. Carregada como ficheiro normal, por isso não precisa de nenhum truque com document.currentScript. |
| 9 | `js-config-supabase.js` | URL do projeto Supabase e chave pública (anon/publishable). A chave é pública por desenho: a proteção dos dados depende das políticas RLS configuradas no Supabase. |
| 10 | `js-admin-processos-kanban.js` | Gestor de processos (window.PM_start): quadro kanban, tabela, calendário, gaveta de detalhes, fases e exportação CSV. |
| 11 | `js-core-auth-database.js` | Cliente Supabase (AJ_SB), camada de dados AJ_DB (carregar/guardar processos), login, registo, recuperação de palavra-passe e área do cliente. |
| 12 | `js-admin-site-settings.js` | Administração (AJ_SITE, AJ_ADMIN_START): membros e papéis, textos, cores e logótipo do site, aviso global e modo de manutenção. |
| 13 | `js-core-account-menu.js` | Botão e menu da conta (iniciais do utilizador, terminar sessão) e separador de administração. |
| 14 | `js-core-account-panel.js` | Painel lateral "A minha conta" (window.AJ_ACCOUNT_OPEN): perfil, telefone e palavra-passe. |
| 15 | `js-site-nav-auth.js` | Botões "Iniciar sessão" / "Criar conta" na navegação do site público e estado quando o utilizador já entrou. |
| 16 | `js-site-video.js` | Comportamento do cartão de vídeo (#vidCard / #ajVid). |
| 17 | `js-core-session-restore.js` | Restaura a sessão e o separador do painel ao recarregar a página e memoriza o separador atual. |
| 18 | `js-admin-documentos.js` | Vista "Documentos" do painel interno (#view-documentos). |
| 19 | `js-admin-admin-tabs.js` | Barra de separadores do painel interno em ecrãs pequenos. |
| 20 | `js-extras-quote-clients-profile.js` | Extras num único módulo: siglas dos responsáveis, clientes registados, pedidos de cotação, formulário de cotação (animação de escrita), completar perfil após login com Google e definições + administração. |

## Tarefas comuns

| Quero… | Onde |
|--------|------|
| Mudar os telefones ou emails que recebem cotações | `js-config-contacts.js` (e o telefone/email do bloco JSON-LD no `<head>` do `index.html`) |
| Mudar cores e tema escuro | variáveis `:root` e `[data-theme=dark]` em `css-01-base.css` (há uma atualização de tokens em `css-13-mobile-ux.css`) |
| Mudar textos da página pública | `index.html`, dentro de `#siteView` |
| Mudar o texto principal, cores ou logótipo pelo painel | Painel → Administração (gravado no Supabase) |
| Trocar o logótipo ou imagens | substituir `logo-aj.png`, `hero-1.webp` ou `hero-2.webp` mantendo o nome |
| Mudar o projeto Supabase | `js-config-supabase.js` |

## Testar localmente

Abrir o `index.html` com duplo clique não funciona bem (o navegador bloqueia algumas funções em `file://`). Na pasta do projeto:

```
python3 -m http.server 8000
```

e abrir `http://localhost:8000`.

## Publicar

1. Fazer commit de todos os ficheiros (incluindo `CNAME` e `.nojekyll`) na branch publicada.
2. Em Settings → Pages, o domínio personalizado deve ser `ajservicos.co.mz` com HTTPS ativo.
3. Depois de publicar, confirmar `https://ajservicos.co.mz/sitemap.xml` e `https://ajservicos.co.mz/robots.txt` e submeter o sitemap no Google Search Console.

## Notas

- O vídeo `aj_adn_vid.mp4` é grande: tem de estar na raiz, ao lado do `index.html`. Sem ele, a secção mostra apenas o cartão de reserva ("Portal do cliente").
- A chave do Supabase em `js-config-supabase.js` é pública por desenho (chave anon/publishable). A segurança depende das políticas de acesso (RLS) do Supabase; nunca colocar aí uma chave `service_role`.
- Imagem de partilha (`og:image`): usa o logótipo (192×192). Para um cartão grande em redes sociais, criar `og-image.png` (1200×630) e trocar as meta tags `og:image`/`twitter:image` no `index.html`.
