# Banco BIOTROP Gestão Industrial V2

## Instalação

Execute `BIOTROP_INSTALACAO_V2.sql` completo no SQL Editor do Supabase. O script cria ou complementa RBAC, unidades, medidores, leituras, auditoria, solicitações, treinamentos, views, RPCs, RLS e Storage.

Não execute seeds operacionais. Os únicos registros fixos do script são perfis, permissões, unidades e os 18 medidores oficiais.

## Conta principal

Crie a conta no Supabase Auth. Se ela ainda não existia durante a instalação, repita:

```sql
select public.bootstrap_biotrop_super_admin('felipe.vieira@biotrop.com.br');
```

A função não cria conta nem senha.
Novas contas entram como `viewer` bloqueado e precisam ser liberadas por um `super_admin`.

## Operação

- `get_my_access_context()`: contexto do usuário autenticado.
- `has_permission(text)`: valida permissão efetiva.
- `admin_set_user_access(uuid,text,boolean)`: atribui perfil e ativa/bloqueia.
- `admin_set_role_permissions(text,text[])`: altera a matriz de um perfil autorizado.
- `create_utility_reading(...)`: registra uma leitura.
- `v_utility_meter_status`: medidores e última medição.
- `v_utility_reading_history`: histórico limitado pelas políticas.

## Modelos de comandos

Os exemplos abaixo são modelos. Substitua todos os valores entre `<...>` e execute apenas quando representarem dados reais.

```sql
-- Modelo para atribuir perfil a uma conta existente:
-- select public.admin_set_user_access(
--   '<UUID_REAL_DO_USUARIO>'::uuid,
--   '<super_admin|administrador|pcm|almoxarife|tecnico|viewer>',
--   true
-- );

-- Modelo de cadastro administrativo de medidor adicional:
-- insert into public.utility_meters(
--   unit_id, code, name, utility_type, location, unit, active
-- )
-- select id, '<CODIGO_REAL>', '<NOME_REAL>', '<agua|gas|energia|horimetro>',
--        name, '<UNIDADE_DE_MEDIDA_REAL>', true
-- from public.industrial_units
-- where code = '<CAMM1|CAMM2|CAMM3|CLOG>';

-- Modelo de desativação sem apagar histórico:
-- update public.utility_meters
-- set active = false, deleted_at = now()
-- where id = '<UUID_REAL_DO_MEDIDOR>'::uuid;
```

Leituras não devem ser inseridas manualmente com valores calculados. Use o frontend ou `create_utility_reading`, autenticado como o usuário real. A primeira leitura estabelece a base; o banco define usuário, leitura anterior, consumo e horário.

## Auditoria

Alterações em medidores, leituras e acessos são registradas em `access_audit_log`. Somente usuários com `audit.view` podem consultar essa tabela.

## Backup

Antes de alterações estruturais futuras, gere backup lógico do banco e exporte separadamente os objetos do bucket privado `utility-evidence`, observando as políticas internas de retenção.
