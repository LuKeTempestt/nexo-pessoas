# Sistema visual — Nexo Pessoas

## 1. Direção

Nexo Pessoas é um produto operacional para pequenas equipes manterem cadastros
organizados. A interface coloca a lista de usuários no centro: localizar,
cadastrar, corrigir ou ocultar um registro deve exigir poucos segundos.

- Atmosfera: sóbria, precisa e confiável.
- Material: superfícies brancas nítidas sobre um canvas frio e silencioso.
- Densidade: média-alta no desktop e confortável no celular.
- Assinatura: um trilho cobalto de quatro pixels no topo da área de trabalho,
  repetido no símbolo da marca e nos estados de foco.
- Tema: claro, com cabeçalho grafite para dar identidade sem competir com os dados.
- Referência: disciplina operacional do Linear, adaptada a um cadastro brasileiro.

Não existem textos didáticos, rotas de API ou explicações técnicas na interface.
Esses conteúdos pertencem ao `README.md` e ao `GUIA_PASSO_A_PASSO.md`.

## 2. Cores

| Token | Valor | Uso |
|---|---|---|
| `--color-canvas` | `#f2f4f8` | Fundo da aplicação |
| `--color-surface` | `#ffffff` | Painéis, campos e diálogos |
| `--color-surface-muted` | `#f8f9fc` | Cabeçalhos, hover e estados vazios |
| `--color-topbar` | `#111827` | Barra superior |
| `--color-topbar-muted` | `#aeb8ca` | Texto auxiliar da barra superior |
| `--color-topbar-border` | `rgb(255 255 255 / 8%)` | Divisor da barra superior |
| `--color-ink` | `#172033` | Texto principal |
| `--color-ink-muted` | `#667085` | Texto auxiliar |
| `--color-border` | `#dfe3eb` | Bordas e divisores |
| `--color-border-strong` | `#c8ceda` | Hover de campos e botões |
| `--color-accent` | `#315efb` | Ação primária, trilho e foco |
| `--color-accent-hover` | `#2448c7` | Hover primário |
| `--color-accent-soft` | `#edf1ff` | Avatares e seleção suave |
| `--color-accent-border` | `rgb(49 94 251 / 14%)` | Contorno de avatar |
| `--color-danger` | `#c0362c` | Exclusão e erro |
| `--color-danger-hover` | `#982c24` | Hover destrutivo |
| `--color-danger-soft` | `#fff1f0` | Fundo de erro |
| `--color-success` | `#087a55` | Confirmação e disponibilidade |
| `--color-success-soft` | `#eaf8f2` | Fundo de sucesso |
| `--color-warning` | `#b54708` | Usuário desativado e ações reversíveis |
| `--color-warning-soft` | `#fff4e8` | Fundo de status desativado |
| `--color-focus` | `#9db4ff` | Anel de foco |
| `--color-backdrop` | `rgb(17 24 39 / 64%)` | Fundo dos diálogos |

Contraste mínimo: 4,5:1 para texto comum e 3:1 para texto grande e controles.
O cobalto é funcional; não aparece como decoração gratuita.

## 3. Tipografia

- Fonte principal: `Segoe UI Variable`, `Segoe UI`, `Arial`, `sans-serif`.
- Fonte de dados: `Cascadia Mono`, `Consolas`, `monospace`.
- Marca: `1rem`, peso 720, altura 1,2.
- H1: `1.75rem`, peso 720, altura 1,2.
- H2: `1.125rem`, peso 700, altura 1,35.
- Métrica: `1.375rem`, peso 720, altura 1,2.
- Corpo: `0.9375rem`, peso 400, altura 1,55.
- Controle: `0.875rem`, peso 680, altura 1,2.
- Pequeno: `0.8125rem`, peso 500, altura 1,45.
- Rótulo: `0.75rem`, peso 700, letras a `0.04em`.

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

- Conteúdo máximo: 1240px.
- Barra superior: 64px.
- Margem móvel: 16px.
- Desktop: cabeçalho da página, resumo horizontal e painel de dados.
- Formulário: diálogo de até 680px, duas colunas quando houver espaço.
- Breakpoints: 760px e 1024px.
- Raios: 6px para controles, 10px para painéis e 14px para diálogos.

## 5. Componentes

### Marca e barra superior

- Símbolo geométrico próprio com trilho cobalto e wordmark textual.
- Navegação operacional alterna entre “Usuários” e, para administradores,
  “Equipe e acessos”.
- A conta autenticada e a ação de sair permanecem visíveis sem inventar dados.

### Botão

- Variantes: primário, neutro, ícone e destrutivo.
- Estados: padrão, hover, active, focus-visible, disabled e loading.
- Altura mínima: 40px; alvo de toque preservado no celular.
- Movimento: `transform`, `opacity` e `filter`, 140ms.

### Campo e busca

- Estrutura: `label`, controle e mensagem contextual quando necessária.
- Estados: padrão, hover, focus, inválido e disabled.
- A busca possui ícone, rótulo acessível e filtra nome, e-mail, CPF e telefone.

### Faixa de resumo

- Um único painel dividido em três métricas reais: total, usuários ativos e
  disponibilidade do sistema.
- Sem cartões de vaidade, gráficos inventados ou números simulados.

### Painel de dados

- Trilho cobalto no topo, barra de ferramentas e tabela integrados.
- Abas “Ativos” e “Ocultos” tornam a exclusão lógica visível e reversível.
- Profundidade: borda mais sombra curta e difusa.
- Estados: carregando, vazio, sem resultados, preenchido e erro.

### Tabela responsiva

- Desktop: tabela com avatar de iniciais, ID, contato, CPF, telefone, nascimento,
  cadastro e ações.
- Status “Ativo” ou “Desativado” aparece junto ao ID; ativação, desativação e
  ocultação são ações diferentes.
- Móvel: cada linha vira um cartão rotulado; ações ocupam a largura disponível.
- Acessibilidade: `caption`, cabeçalhos `scope="col"` e ações nomeadas.

### Diálogo de usuário

- Usado para criação e edição; o produto nunca mantém o formulário ocupando a tela.
- Cabeçalho, campos, ação de cancelar e ação principal coerentes com o modo.
- Escape fecha; foco inicial vai ao nome; fechamento restaura o foco nativo.

### Toast e confirmação

- Toast fixo no canto superior direito para sucesso e erro, com região anunciável.
- Ocultação usa diálogo separado, explica a preservação e oferece restauração
  na aba de usuários ocultos.
- Entrada por opacidade e escala, respeitando movimento reduzido.

### Configuração inicial

- Usa a mesma superfície do login, com largura ampliada e ícone de segurança.
- Solicita nome, e-mail, senha e confirmação; em produção, também solicita o
  código secreto da instalação.
- Depois da criação do primeiro administrador, a tela deixa de estar disponível.

### Equipe e acessos

- Painel administrativo no mesmo padrão da base de usuários.
- Tabela responsiva com pessoa, perfil, status, data e ações de segurança.
- Permite criar contas individuais, trocar perfil, ativar, desativar, redefinir
  senha e revogar sessões.
- A própria conta não pode ser desativada nem rebaixada pela interface.

## 6. Movimento e interação

- Microinteração: 140ms `ease-out`.
- Entrada de diálogo e toast: 180ms `cubic-bezier(0.16, 1, 0.3, 1)`.
- Somente `transform`, `opacity` e `filter` são animados.
- `prefers-reduced-motion: reduce` elimina movimentos não essenciais.
- Teclado: Tab percorre controles; Escape fecha diálogos.

## 7. Profundidade e superfícies

- Painel principal: borda e sombra `0 12px 32px rgb(23 32 51 / 8%)`.
- Resumo: borda, sem sombra; divisores internos organizam as métricas.
- Campos: borda, sem sombra em repouso.
- Foco: anel de 3px com `--color-focus`.
- Diálogo: sombra `0 24px 64px rgb(17 24 39 / 24%)`.
- Barra superior: preenchimento sólido; nada de vidro ou gradiente genérico.
