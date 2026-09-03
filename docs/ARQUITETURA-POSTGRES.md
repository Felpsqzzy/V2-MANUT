# BIOTROP — arquitetura PostgreSQL

## Objetivo
A aplicação passa a ter uma camada única e explícita:

`Frontend -> Express API -> PostgreSQL`

O frontend não recebe credenciais de banco e não conversa diretamente com PostgreSQL. Toda autenticação, autorização, validação e persistência passam pelo backend.

## Banco
O arquivo oficial é `database/BIOTROP_CORE_POSTGRES.sql`. Ele concentra:

- usuários, sessões e recuperação de senha;
- RBAC com roles, permissões e vínculo usuário/perfil;
- unidades industriais e medidores;
- leituras de água, gás, energia e horímetros;
- evidências de leitura;
- SCI/SCM e fluxo de aprovação;
- cursos, trilhas, quiz, progresso e certificados;
- famílias de materiais e especificações dinâmicas;
- auditoria de alterações sensíveis.

## Segurança
As regras críticas ficam no servidor e no banco. A API usa sessão opaca armazenada como hash, senha com bcrypt, cookie HTTP-only, CORS explícito, Helmet, rate limiting, limite de payload/upload, allowlist de recursos/colunas e SQL parametrizado.

O banco não deve receber senhas em texto puro. Não coloque `DATABASE_URL` no JavaScript do navegador.

## Migração
A migração do Supabase é separada da troca de código. Primeiro exporte os dados que precisam ser preservados; depois faça o carregamento no PostgreSQL. Usuários do Auth antigo podem exigir redefinição de senha caso não exista um hash compatível que possa ser importado legalmente.

Dados binários pequenos podem ser armazenados na tabela `file_objects`. Vídeos grandes de treinamento devem usar armazenamento de objetos dedicado, mantendo no PostgreSQL apenas metadados/referência.

## Desenvolvimento
Configure `DATABASE_URL`, execute o SQL de instalação e então:

```bash
npm install
npm run build
npm run dev
```

Em produção, as variáveis de ambiente devem ser configuradas no servidor/Vercel; nunca no frontend.
