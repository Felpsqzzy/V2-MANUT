# BIOTROP Gestão Industrial V2 — Banco PostgreSQL

## Arquitetura oficial

A aplicação utiliza uma única cadeia de persistência:

`Frontend → Express API → PostgreSQL`

O navegador não possui credencial de banco, não usa SDK de Supabase e não acessa PostgreSQL diretamente.

## Instalação

Execute primeiro:

`database/BIOTROP_CORE_POSTGRES.sql`

Esse arquivo é o schema inicial oficial e cria usuários, sessões, RBAC, unidades, medidores, leituras, solicitações, treinamentos, materiais, arquivos, auditoria, views e funções SQL.

Depois, execute as migrações em `database/migrations/` na ordem numérica/nomenclatura indicada.

## Configuração da API

Defina no servidor:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/biotrop
DATABASE_SSL=true
DB_POOL_MAX=10
SESSION_DAYS=7
MAX_UPLOAD_BYTES=10485760
```

`DATABASE_URL` é segredo de servidor e nunca deve ser colocado em JavaScript do navegador.

## Usuários e acesso

Novos cadastros entram bloqueados e com perfil `viewer`. Um administrador deve liberar o usuário e atribuir um perfil com `admin_set_user_access(...)` pela API.

Perfis oficiais:

- `super_admin`
- `administrador`
- `pcm`
- `almoxarife`
- `tecnico`
- `viewer`

A autorização é feita no backend e reforçada pelas funções/regras do PostgreSQL. O frontend não é fonte de verdade para permissões.

## Utilidades e horímetros

A leitura deve registrar o medidor, valor, horário do servidor, usuário, GPS quando disponível e evidência fotográfica obrigatória. O banco calcula a leitura anterior e o consumo e impede que uma leitura registrada seja menor que a anterior.

## Arquivos

Arquivos pequenos podem ser persistidos em `file_objects` como `bytea`. As referências ficam nas tabelas de negócio. Para vídeos grandes, prefira armazenamento de objetos dedicado e mantenha no PostgreSQL apenas metadados/referências.

## Auditoria

Alterações sensíveis devem gerar registro em `audit_logs`/estruturas equivalentes. Não apagar histórico operacional para corrigir registros; utilize status, correção e trilha de auditoria.

## Migração do ambiente anterior

O código do projeto não depende mais do Supabase. A exportação dos dados antigos é um processo separado: extraia os dados do ambiente anterior, mapeie para o schema PostgreSQL e valide contagens, usuários, solicitações, leituras e treinamentos antes de considerar a migração concluída.

Usuários antigos do Auth podem precisar redefinir a senha caso o hash anterior não possa ser migrado com segurança para `bcrypt`.

## Desenvolvimento

```bash
npm install
npm run build
npm run dev
```

Em produção, configure as variáveis no ambiente do servidor/Vercel e nunca no frontend.
