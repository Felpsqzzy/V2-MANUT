# BIOTROP — Gestão Industrial V2

Plataforma de gestão industrial e manutenção com arquitetura modular, API Express e PostgreSQL.

## Arquitetura oficial

`Frontend → Express API → PostgreSQL`

O navegador não acessa o banco diretamente e a aplicação não depende de SDK de Supabase em runtime.

## Módulos

- Início / Control Room
- Utilidades e Horímetros
- SCI / SCM e solicitações
- Treinamentos
- Administração e RBAC
- Perfil do usuário
- Auditoria e rastreabilidade

## Segurança

A autenticação usa sessão própria em cookie HTTP-only e senhas com hash bcrypt. As permissões são verificadas no backend por RBAC. A API aplica limite de requisições, Helmet, CORS controlado, validação de entrada, limites de payload/upload e queries parametrizadas.

## Banco

O schema oficial está em:

`database/BIOTROP_CORE_POSTGRES.sql`

A compatibilidade dos módulos está em:

`database/migrations/001_runtime_compatibility.sql`

Outras migrações em `database/migrations/` devem ser aplicadas somente depois de revisar se pertencem ao novo runtime PostgreSQL.

## Configuração

Crie as variáveis de ambiente do servidor a partir de `.env.example`:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/biotrop
DATABASE_SSL=true
DB_POOL_MAX=10
SESSION_DAYS=7
MAX_UPLOAD_BYTES=10485760
```

Nunca coloque `DATABASE_URL` no JavaScript do navegador e nunca publique credenciais do banco no GitHub.

## Desenvolvimento

```bash
npm install
npm run build
npm run dev
```

Para produção:

```bash
npm run build
npm start
```

## GitHub / Vercel

O repositório é a fonte do código. O deploy deve apontar para `main` e possuir `DATABASE_URL` configurada como variável de ambiente do projeto Vercel.

O backend Vercel está em `api/[...path].ts` e encaminha as rotas `/api/*` para `server/index.ts`.

## Migração do ambiente anterior

Os dados antigos não devem ser apagados automaticamente. Primeiro exporte e valide os dados que ainda precisam ser preservados; depois faça o mapeamento para as tabelas PostgreSQL. Usuários do sistema anterior podem precisar de redefinição de senha caso os hashes antigos não sejam compatíveis com bcrypt.
