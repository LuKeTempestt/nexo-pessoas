# Sistema visual — Cadastro Cívico

## 1. Direção

Interface operacional inspirada na precisão do Linear, escolhida após considerar
Linear, Notion e Sentry. O produto usa superfícies claras, linhas nítidas e um
azul cobalto reservado às ações. O elemento memorável é a faixa azul do cabeçalho
que conduz o olhar do resumo ao formulário, sem transformar um CRUD em carnaval.

- Atmosfera: clara, confiável e administrativa.
- Material: papel digital sobre um fundo azul-neblina.
- Densidade: média; leitura rápida sem espaços desperdiçados.
- Tema: claro apenas, adequado ao escopo acadêmico.

## 2. Cores

| Token | Valor | Uso |
|---|---|---|
| `--color-canvas` | `#edf2f7` | Fundo da página |
| `--color-surface` | `#ffffff` | Cartões e diálogos |
| `--color-surface-muted` | `#f7f9fc` | Cabeçalhos e estados vazios |
| `--color-ink` | `#172033` | Texto principal |
| `--color-ink-muted` | `#5c667a` | Texto auxiliar |
| `--color-border` | `#d8dee9` | Bordas e divisores |
| `--color-accent` | `#2457d6` | Ação primária e foco |
| `--color-accent-hover` | `#1c45ad` | Hover primário |
| `--color-danger` | `#b42318` | Exclusão e erro |
| `--color-danger-hover` | `#8f1c13` | Hover destrutivo |
| `--color-success` | `#067647` | Confirmação |
| `--color-warning` | `#b54708` | Aviso |
| `--color-focus` | `#84adff` | Anel de foco |

Contraste mínimo: 4,5:1 para texto comum e 3:1 para texto grande e controles.
O azul é funcional: botões, links, foco e indicadores ativos.

## 3. Tipografia

- Fonte principal: `Segoe UI`, `Arial`, `sans-serif`.
- Fonte monoespaçada: `Cascadia Mono`, `Consolas`, `monospace`.
- Display: `clamp(2rem, 5vw, 3.5rem)`, peso 750, altura 1,05.
- H1: `2rem`, peso 700, altura 1,15.
- H2: `1.25rem`, peso 700, altura 1,3.
- Corpo: `1rem`, peso 400, altura 1,55.
- Pequeno: `0.875rem`, peso 500, altura 1,45.
- Rótulo: `0.8125rem`, peso 700, letras a `0.02em`.

## 4. Espaçamento e layout

Unidade base: 4px.

| Token | Valor |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |

- Conteúdo máximo: 1184px.
- Margem móvel: 16px.
- Grid principal: formulário de 4 colunas; tabela abaixo.
- Breakpoints: 720px e 980px.
- Raio pequeno: 8px; raio grande: 16px.

## 5. Componentes

### Botão

- Variantes: primário, neutro e destrutivo.
- Estados: padrão, hover, active, focus-visible, disabled e loading.
- Acessibilidade: elemento `button`, rótulo textual e foco sempre visível.
- Movimento: `transform` e `opacity`, 140ms.

### Campo

- Estrutura: `label`, controle e mensagem contextual.
- Estados: padrão, focus, inválido e disabled.
- Acessibilidade: associação `for`/`id`, `aria-invalid` e mensagem anunciável.

### Painel

- Variantes: formulário, resumo e listagem.
- Profundidade: superfície branca, borda e sombra sutil.
- Estado de carregamento: conteúdo preservado e controles desabilitados.

### Tabela responsiva

- Desktop: tabela completa, cabeçalho fixo dentro do painel.
- Móvel: cada linha se torna um cartão rotulado.
- Estados: carregando, vazio, preenchido e erro.
- Acessibilidade: `caption`, cabeçalhos `scope="col"` e ações nomeadas.

### Mensagem e confirmação

- Variantes: sucesso, erro e aviso.
- Confirmação de exclusão: elemento `dialog`, foco contido e ação destrutiva explícita.
- Movimento: entrada por opacidade e escala, respeitando movimento reduzido.

## 6. Movimento e interação

- Microinteração: 140ms `ease-out`.
- Entrada de diálogo: 220ms `cubic-bezier(0.16, 1, 0.3, 1)`.
- Somente `transform`, `opacity` e `filter` são animados.
- `prefers-reduced-motion: reduce` elimina movimentos não essenciais.
- Teclado: Tab percorre controles; Escape fecha o diálogo.

## 7. Profundidade e superfícies

Estratégia mista e contida:

- Painéis: borda `--color-border` e sombra `0 12px 32px rgb(23 32 51 / 8%)`.
- Campos: borda, sem sombra em repouso.
- Foco: anel de 3px com `--color-focus`.
- Diálogo: sombra `0 24px 64px rgb(23 32 51 / 24%)`.
- O cabeçalho pode usar uma textura linear discreta; painéis não usam vidro,
  gradientes decorativos ou sombras gratuitas.

