# BIOTROP V2 — Guia de desenvolvimento

## Estrutura relevante

- `app.html`: interface original preservada.
- `config.js`: configuração pública utilizada pela cópia entregue.
- `config.example.js`: modelo sem valores do projeto.
- `assets/js/biotrop-production-v2.js`: integração central de autenticação, RBAC, dashboard, medidores, leituras, usuários e treinamentos.
- `database/BIOTROP_INSTALACAO_V2.sql`: instalação principal autossuficiente.
- `server/`: API Express protegida.

## Ordem de implantação

1. Faça backup lógico do projeto Supabase.
2. Execute todo o arquivo `database/BIOTROP_INSTALACAO_V2.sql` no SQL Editor.
3. Crie os usuários reais no Supabase Auth ou no provedor corporativo.
   Novas contas entram como `viewer` bloqueado até a liberação pelo `super_admin`.
4. Para a conta principal criada após o SQL, execute:

   ```sql
   select public.bootstrap_biotrop_super_admin('felipe.vieira@biotrop.com.br');
   ```

5. Confirme em `profiles`, `user_roles`, `roles` e `role_permissions`.
6. Preencha `config.js` apenas com URL e chave pública.
7. Configure o backend usando `.env.example`.

## Segurança

- O frontend usa somente anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY` pertence exclusivamente ao backend.
- Rotas protegidas usam `requireAuth`.
- O usuário é derivado do token.
- `requirePermission` consulta `has_permission`.
- CORS aceita apenas `CORS_ORIGINS`.
- Medidores são desativados; o histórico não é apagado.
- Solicitantes não podem aprovar a própria solicitação nem alterar campos de aprovação.
- O trigger de leituras ignora `user_id`, `previous_reading`, `consumption` e timestamps enviados pelo cliente.

## Desenvolvimento local

Frontend:

```bash
python -m http.server 5500
```

Abra `http://localhost:5500`.

Backend, quando `node_modules` já estiver disponível:

```bash
npm run dev
```

Validação:

```bash
npm run build
node --check assets/js/biotrop-production-v2.js
```

## Dados reais e estados vazios

Não há seed de leitura inicial, solicitação, estoque, treinamento ou senha. A primeira leitura estabelece a base do medidor. Com tabelas vazias, a aplicação exibe zero apenas para contagens e usa “Sem leitura” ou mensagens de estado vazio para medições.

## Versionamento

Não versione `.env`, chaves privadas, exports de usuários ou evidências. `config.js` contém somente configuração pública; para outro projeto, substitua seus valores antes do commit.

## O que exige Supabase real

A execução das funções SQL, políticas RLS, Storage, autenticação, upload e chamadas RPC depende de um projeto Supabase compatível. Sem esse ambiente, a validação local limita-se a sintaxe, referências, TypeScript quando disponível e inspeção estática.
