# BIOTROP V2 — Plano de implantação Azure

## Objetivo

A primeira implantação corporativa pode manter o Supabase como banco enquanto a aplicação Node/Express roda em uma VM Azure. O repositório GitHub permanece como fonte de código e a VM recebe as versões publicadas.

## Arquitetura prevista

```text
Usuário externo / corporativo
        |
        v
 DNS / domínio Biotrop
        |
        v
 Azure VM
   |-- Node.js / Express
   |-- frontend estático
   |-- HTTPS / reverse proxy
   '-- rotina de backup
        |
        +------> Supabase (PostgreSQL/Auth/Storage)
        |
        '---> Microsoft Graph (e-mail)
```

## Variáveis de produção

Nunca coloque segredos no GitHub ou no frontend.

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=CHAVE_PUBLICA
SUPABASE_SERVICE_ROLE_KEY=SEGREDO_SERVER_ONLY
CORS_ORIGINS=https://SEU-DOMINIO

AUTH_PROVIDER=supabase
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=https://SEU-DOMINIO/auth/microsoft/callback

GRAPH_SENDER_EMAIL=manutencao@biotrop.com.br
```

O Microsoft Entra exige que o `clientId`, autoridade e `redirectUri` estejam alinhados com o registro do aplicativo. A URI usada em produção também precisa estar registrada exatamente no Entra. Para SPA com MSAL Browser, a aplicação deve ser registrada como SPA; a migração deve ser feita sem remover o login Supabase até a validação corporativa. Consulte a documentação oficial antes de habilitar a troca. 

## Estratégia de autenticação

1. Manter Supabase Auth durante a transição.
2. Adicionar Microsoft Entra como provedor/ponte corporativa.
3. Validar e-mail/tenant corporativo.
4. Mapear o usuário existente para `profiles`.
5. Manter o RBAC atual no Supabase.
6. Só depois desativar o fluxo anterior, com rollback disponível.

## E-mail Microsoft Graph

A implementação deve sair do Inkbox no ambiente corporativo e usar um remetente corporativo dedicado. O aplicativo de servidor/daemon deve usar `Mail.Send` com consentimento administrativo e restringir a identidade de envio por política corporativa. Não deve haver token Graph no browser.

## Backup

No mínimo:

- backup diário do banco em arquivo externo à VM;
- retenção de 7/14/30 dias conforme política interna;
- backup separado da aplicação/configuração sem segredos;
- teste periódico de restauração;
- backup do Storage/evidências em separado, pois um dump do banco não contém os objetos do Storage.

Supabase recomenda `db dump` para backup lógico próprio, especialmente quando é necessário manter cópia fora da plataforma. Backups da plataforma também dependem do plano contratado.

## Atualização da VM

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
npm ci
npm run build
npm start
```

Em produção, usar um gerenciador de processo (por exemplo, systemd) e um reverse proxy HTTPS. Nunca executar a aplicação de produção com credenciais de desenvolvimento.

## Checklist para o chamado de implantação

- Nome/domínio desejado
- VM Azure disponível
- Sistema operacional e versão
- Node.js LTS aprovado
- acesso GitHub ao repositório
- regra de firewall/NSG
- certificado/HTTPS
- variáveis de ambiente
- tenant Microsoft Entra
- App Registration / Client ID
- conta remetente do Graph
- consentimento `Mail.Send`
- estratégia de backup
- janela de atualização e rollback
