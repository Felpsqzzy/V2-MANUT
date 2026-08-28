# BIOTROP — Gestão Industrial V2

Versão de produção construída sobre a interface original. O Supabase passa a ser a fonte oficial para usuários, acessos, medidores, leituras, solicitações e treinamentos. A interface não cria administrador local, senha padrão, medidores ou atividade operacional demonstrativa.

## Principais mudanças

- RBAC normalizado com perfis e permissões granulares.
- 18 medidores oficiais organizados em CAMM 1, CAMM 2, CAMM 3 e C. LOG.
- Leitura anterior, consumo, usuário e timestamp calculados ou definidos no banco.
- Evidência fotográfica em bucket privado.
- Administração de usuários por RPC, sem criação de senha no navegador.
- Dashboard e gráficos derivados das consultas reais.
- Estados vazios quando não houver dados.
- Backend Express protegido por autenticação e permissões.

## 1. Instalar o banco

No SQL Editor do projeto Supabase, execute integralmente e uma única vez:

```text
database/BIOTROP_INSTALACAO_V2.sql
```

O arquivo é idempotente e pode ser repetido. Ele complementa a instalação existente sem apagar leituras, solicitações ou usuários.

## 2. Criar e liberar a conta principal

1. Crie `felipe.vieira@biotrop.com.br` em **Authentication > Users** ou pelo fluxo corporativo.
2. Não defina senha em SQL nem no frontend.
3. Se a conta já existia antes da instalação, o SQL atribui `super_admin`.
4. Se a conta foi criada depois, repita no SQL Editor:

```sql
select public.bootstrap_biotrop_super_admin('felipe.vieira@biotrop.com.br');
```

Novas contas entram como `viewer` bloqueado. O `super_admin` deve definir o perfil e liberar o acesso na tela **Administração > Usuários**.

## 3. Configurar o frontend

Edite `config.js` com a URL, a chave pública anon/publishable e a URL do backend. Use `config.example.js` como modelo. Nunca coloque `service_role` no frontend.

Na raiz do projeto, inicie o frontend e abra `http://localhost:5500`:

```bash
python -m http.server 5500
```

## 4. Iniciar o backend

Copie `.env.example` para `.env`, preencha as variáveis e, com as dependências já instaladas:

```bash
npm run dev
```

Para produção:

```bash
npm run build
npm start
```

## Cadastro de dados

Os medidores oficiais são cadastrados pelo SQL sem leitura inicial preenchida. A primeira leitura enviada pelo formulário “Novo apontamento” estabelece a base; solicitações e treinamentos começam vazios e só aparecem após cadastros reais.

## GitHub

```bash
git init
git add .
git commit -m "Implementa BIOTROP Gestão Industrial V2"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

## Limitação de validação

Sem credenciais administrativas e uma instância Supabase disponível, não foi possível executar o SQL, autenticar usuários, enviar fotos ou validar RLS em tempo real. A sintaxe JavaScript e a estrutura estática foram verificadas localmente.
