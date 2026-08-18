# Guia de estudo passo a passo

Este arquivo explica a ordem correta para estudar o projeto. Não comece decorando
o código. Primeiro entenda o caminho percorrido por uma requisição.

## 1. Veja o sistema funcionando

Inicie o banco e o servidor conforme o `README.md`. Abra
`http://localhost:3000`, cadastre um usuário e observe a tabela.

Fluxo do cadastro:

```text
Formulário
  -> POST /api/usuarios
  -> controller
  -> service
  -> validator
  -> repository
  -> PostgreSQL
  -> resposta 201
  -> tabela atualizada
```

## 2. Estude o banco primeiro

Abra `database/01_criar_tabela.sql`.

Perguntas para responder:

1. Por que `id` é chave primária?
2. Por que e-mail e CPF usam `UNIQUE`?
3. O que aconteceria se `nome` aceitasse `NULL`?
4. Por que `data_cadastro` possui valor padrão?

Execute no banco:

```sql
SELECT * FROM usuarios ORDER BY id;
```

## 3. Estude a conexão

Abra `backend/src/config/database.js`.

O `Pool` mantém conexões reutilizáveis. As credenciais vêm do `.env`, que não é
versionado porque contém senha.

## 4. Estude o repositório

Abra `backend/src/repositories/postgresUsuarioRepository.js`.

O repositório conhece SQL, mas não conhece HTTP. Repare nos parâmetros:

```sql
WHERE id = $1
```

O valor é enviado separadamente. Isso impede que texto fornecido pelo usuário
seja interpretado como comando SQL.

## 5. Estude a validação

Abra `backend/src/validation/usuarioValidator.js` e depois
`backend/test/usuarioValidator.test.js`.

Observe três operações diferentes:

- normalizar: remover espaços, pontuação e diferenças de maiúsculas;
- validar: recusar dados fora das regras;
- converter: transformar o ID recebido pela URL em número seguro.

Execute somente os testes:

```powershell
cd backend
npm test
```

## 6. Estude a regra de negócio

Abra `backend/src/services/usuarioService.js`.

O service coordena validação e persistência. Ele decide que buscar, editar ou
excluir um ID inexistente deve gerar `404`.

Compare com `backend/test/usuarioService.test.js`. Os testes usam um banco em
memória para provar a regra sem depender do PostgreSQL.

## 7. Estude o HTTP

Leia nesta ordem:

1. `backend/src/routes/usuarioRoutes.js`;
2. `backend/src/controllers/usuarioController.js`;
3. `backend/src/middlewares/tratadorErros.js`;
4. `backend/src/app.js`;
5. `backend/test/app.test.js`.

Correspondência importante:

| Operação | Método | Código de sucesso |
|---|---|---:|
| Listar | `GET` | `200` |
| Cadastrar | `POST` | `201` |
| Atualizar | `PUT` | `200` |
| Excluir | `DELETE` | `204` |

## 8. Estude o front-end

Leia nesta ordem:

1. `frontend/index.html`: estrutura e acessibilidade;
2. `frontend/css/style.css`: layout e responsividade;
3. `frontend/js/formatters.js`: máscaras visuais;
4. `frontend/js/api.js`: comunicação HTTP;
5. `frontend/js/ui.js`: manipulação da página;
6. `frontend/js/app.js`: estado e coordenação.

O front-end não monta linhas com HTML fornecido pelo usuário. Ele usa
`textContent`, evitando que nomes ou e-mails sejam interpretados como marcação.

## 9. Use o depurador do navegador

Abra as ferramentas de desenvolvedor com `F12`:

1. Vá à aba `Network`.
2. Cadastre um usuário.
3. Selecione `POST /api/usuarios`.
4. Observe `Request Payload`, `Status Code` e `Response`.

Repita com edição e exclusão. Essa aba mostra a conversa real entre tela e API.

## 10. Faça alterações pequenas

Exercícios recomendados:

1. Adicione busca por nome.
2. Mostre a data do cadastro na tabela.
3. Adicione paginação à rota de listagem.
4. Crie um campo opcional de endereço.
5. Adicione um teste antes de cada mudança.

## 11. Versione cada avanço

Exemplo:

```powershell
git add .
git commit -m "feat: adiciona busca de usuarios"
```

Um commit deve representar uma mudança compreensível. “Alterações finais 7” não
explica nada; é apenas um pedido de socorro disfarçado de histórico.

## 12. Prepare a entrega

Antes de enviar:

- troque o autor no `README.md`;
- publique o repositório na sua conta;
- adicione o link remoto ao README;
- execute `npm test`;
- teste criar, listar, editar e excluir;
- confira se `backend/.env` não aparece no `git status`.
