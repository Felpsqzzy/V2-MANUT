/* BIOTROP — Plano de arquitetura v1, tela completa inspirada no HTML de referência */
(()=>{
'use strict';

const sections = [
  {n:'01', t:'Entendimento do produto', intro:'O sistema é uma plataforma interna única para o dia a dia da manutenção industrial. A experiência muda por perfil: o técnico opera principalmente no celular; PCM, liderança, almoxarifado e gestão trabalham com visão operacional ou gerencial.', bullets:[
    'Cinco domínios na base atual: acesso/RBAC; utilidades e medidores; SCI/SCM; treinamentos; horas e ordens de serviço.',
    'Acesso e RBAC são sólidos; utilidades é funcional; SCI/SCM é parcial e ambíguo; treinamentos são protótipo; horas e OS ainda não existem.',
    'Herança preservada: RBAC via has_permission(), triggers de workflow, protocolo imutável, histórico de leituras e identidade visual teal.'
  ], note:'Achado central: o banco/RBAC e a operação de utilidades são ativos a preservar; a camada de aplicação é o principal ponto de evolução.'},
  {n:'02', t:'Requisitos funcionais', intro:'Requisitos organizados por domínio, com foco no turno de trabalho e na segurança server-side.', bullets:[
    'M1 Identidade: SSO Microsoft Entra ID, primeiro acesso pendente, organização em árvore, perfis, permissões, equipes e auditoria.',
    'M2 SCI/SCM: SCI = Solicitação de Cadastro de Item; SCM = Solicitação de Compra de Material; histórico, comentários, anexos e devolutivas.',
    'M3 Horas: OS enxuta, apontamento com origem única, duração calculada no servidor e bloqueio de sobreposição.',
    'M4 Materiais: solicitar/consumir; saldo, inventário e custo ficam no ERP.',
    'M5 Treinamentos: trilhas, versões, aulas, progresso, quiz, validade, conclusão e evidência.',
    'M6 Notificações: app sempre; e-mail agrupado com idempotência.',
    'M7 Dashboards: por perfil, filtros, indicadores clicáveis e estados de carregamento/vazio/erro/sem permissão.'
  ]},
  {n:'03', t:'Requisitos não funcionais', intro:'Critérios verificáveis para impedir regressões e tornar o sistema utilizável em campo.', bullets:[
    'Responsividade a partir de 360 px, toque mínimo de 44 px e formulários curtos.',
    'Primeira tela útil em até 3 s em 4G, listas paginadas e consultas indexadas.',
    'Autorização validada no servidor, RLS ativa e testes esperando 403 quando necessário.',
    'Auditoria de alterações críticas, integridade por constraints, UTC no banco e America/Sao_Paulo na exibição.',
    'WCAG 2.1 AA, LGPD, backup diário, observabilidade e tolerância a rede instável.',
    'Offline completo fica fora do MVP; o formulário deve preservar dados e permitir reenvio idempotente.'
  ]},
  {n:'04', t:'Matriz de permissões', intro:'Permissões nomeadas por recurso.ação com escopos próprio, equipe e global. O RBAC é a fonte de verdade.', bullets:[
    'Papéis: super_admin, admin, gestor, pcm, lider, almoxarife, tecnico e pendente.',
    'Escopo próprio = somente o registro do usuário; equipe = equipe e descendentes; global = sem filtro.',
    'Exemplos: requests.create para todos; requests.fulfill para almoxarifado; hours.create para técnico/PCM/líder; training.manage para admin/líder; reports.view_all para admin/gestor/PCM.'
  ], table:[['Recurso','Admin','Gestor','PCM','Líder','Almox.','Técnico'],['users.manage','✓','—','—','—','—','—'],['requests.create','✓','✓','✓','✓','✓','✓'],['requests.fulfill','✓','—','—','—','✓','—'],['hours.create','✓','—','✓','✓','—','✓'],['training.consume','✓','✓','✓','✓','✓','✓'],['reports.view_all','✓','✓','✓','—','—','—']]},
  {n:'05', t:'Perguntas e lacunas', intro:'As decisões de maior impacto devem ser fechadas antes de consolidar o backend.', bullets:[
    'SCI/SCM já decidido: SCI é cadastro de item e SCM é compra de material; a SCI pode ser pré-requisito opcional da SCM.',
    'Estoque fora do escopo: a plataforma registra solicitação e consumo; o ERP permanece como mestre de saldo, inventário e custo.',
    'Hospedagem decidida em Azure; banco ainda precisa ser confirmado entre Supabase e Azure Database for PostgreSQL.',
    'SSO Entra ID para todos; confirmar lista de técnicos no diretório.',
    'Ainda validar: uso das horas, aprovador e substituto, origem da OS, vídeos e cobertura de rede.'
  ], note:'Recomendação operacional: quando uma decisão demorar, aplicar a premissa reversível registrada no plano e continuar o desenvolvimento.'},
  {n:'06', t:'Arquitetura', intro:'Recomendação: nova camada de aplicação tipada sobre o banco existente, sem reescrever o que já funciona.', bullets:[
    'Next.js 15 App Router + TypeScript strict + Tailwind + componentes acessíveis.',
    'Azure Container Apps ou App Service para hospedagem; Microsoft Graph para e-mail.',
    'authorize(user, permission, scope) como serviço único; RLS permanece como segunda linha.',
    'Storage privado com URL assinada; jobs diários idempotentes; testes unitários, integração e E2E.',
    'Três ambientes: desenvolvimento, homologação e produção.'
  ], diagram:'V2 atual + banco existente → nova aplicação Next.js → authorize() → serviços de domínio → banco/storage → Microsoft 365'},
  {n:'07', t:'Modelo de dados', intro:'Modelo orientado a histórico, integridade e evolução sem apagar dados operacionais.', bullets:[
    'profiles, roles, permissions, role_permissions, user_roles e teams em árvore.',
    'requests + request_types + request_field_values unificam SCI e SCM; tabelas antigas permanecem como views de compatibilidade durante a transição.',
    'work_orders + time_entries vinculam horas a uma única origem; sobreposição é bloqueada no banco.',
    'material_requests + items + material_movements registram solicitação, aprovação, entrega e consumo.',
    'trainings → versions → lessons → assets; assignments materializam enrollments; completions preservam a versão concluída.',
    'notifications e email_outbox são separados para permitir retry e idempotência; audit_log é append-only.'
  ]},
  {n:'08', t:'Fluxos principais', intro:'Quatro fluxos críticos tratados como máquinas de estado e regras server-side.', flows:[
    ['SCI','ENVIADA → EM_ANALISE → CORRECAO_SOLICITADA / REPROVADA / APROVADA → CADASTRADA ou CANCELADA'],
    ['SCM','abertura → aprovador derivado da equipe → aprovação/reprovação/revisão → tratamento → concluída'],
    ['Horas','origem única → validação de escopo → duração válida → bloqueio de sobreposição → gravado → aprovação opcional'],
    ['Treinamento','matrícula → aulas obrigatórias → tempo mínimo/declaração → quiz → conclusão por versão → validade/reciclagem']
  ], note:'Nenhuma regra crítica fica somente no botão ou no navegador.'},
  {n:'09', t:'Mapa de telas', intro:'O técnico abre o que precisa fazer agora; os demais perfis abrem o que precisam decidir.', bullets:[
    'Técnico: início com quatro ações grandes — apontar hora, pedir material, abrir solicitação e treinamentos.',
    'Operação: atividades/OS, horas, SCI/SCM, minhas solicitações e materiais.',
    'Almoxarife: fila, atendimento, catálogo/famílias e consumo.',
    'Líder: painel da equipe, aprovações e conformidade de treinamentos.',
    'PCM: painel operacional, ordens em aberto, tempo e consumo.',
    'Administração: usuários, perfis, equipes, configurações e auditoria.'
  ], note:'Toda tela segue quatro estados: carregando, vazio, erro e sem permissão.'},
  {n:'10', t:'Escopo do MVP', intro:'O MVP termina quando o técnico consegue operar um turno sem planilha ao lado.', phases:[
    ['Fase 0','Fundação','SSO, autorização unificada, equipes, auditoria, segurança, CI e Azure.'],
    ['Fase 1','Solicitações','SCI/SCM, fila do almoxarifado, devolutivas, compatibilidade e notificações.'],
    ['Fase 2','Horas','OS enxuta, apontamento, duração server-side e bloqueio de sobreposição.'],
    ['Depois','Materiais / LMS / Painéis / Consolidação','Evolução pós-MVP e migração final das utilidades.']
  ]},
  {n:'11', t:'Backlog priorizado', intro:'Prioridade por dependência e risco.', backlog:[
    ['P0','Decidir banco / congelar SQL / unificar autorização / projeto tipado / SSO / segurança de arquivos'],
    ['P1','Equipes / usuários / auditoria / requests / fila do almoxarifado / OS / horas / experiência do técnico / testes'],
    ['P2','Materiais / catálogo / consumo / LMS / conformidade / painéis / consolidação'],
    ['P3','ERP / offline / MTTR / MTBF / disponibilidade']
  ]},
  {n:'12', t:'Critérios de aceite', intro:'O MVP só é considerado pronto quando outra pessoa consegue verificar os critérios.', bullets:[
    'Usuário novo entra como pendente e não acessa módulos até liberação.',
    'Toda mutação sem permissão devolve 403 fora do navegador.',
    'Técnico não consegue acessar dado de outro usuário por nenhuma rota autorizada.',
    'SCI e SCM mantêm protocolo imutável e histórico completo; reprovação exige devolutiva.',
    'Horas sem origem, com duração inválida ou sobreposição são recusadas.',
    'Em 360 px não existe rolagem horizontal; envio falho preserva o formulário e o retry não duplica.',
    'Anexos exigem permissão e URL assinada; CI passa em lint, type check e testes.'
  ]},
  {n:'13', t:'Riscos', intro:'Riscos mais relevantes e mitigação.', risks:[
    ['Crítico','Duas fontes de autorização / RLS divergente','Unificar fonte, revisar RLS e criar testes por papel.'],
    ['Crítico','Anexos acessíveis sem autorização','Storage privado + URL assinada + checagem de permissão.'],
    ['Alto','.env ou segredo comitado','Corrigir .gitignore e rotacionar segredos se houver exposição.'],
    ['Alto','Aprovador global único','Derivar aprovador da equipe e permitir substituto/escalonamento.'],
    ['Médio','Migração e coexistência V2','Views de compatibilidade, ensaio em homologação e plano de reversão.']
  ]},
  {n:'14', t:'Próximo passo', intro:'O desenho está pronto para sair do plano e entrar em execução.', steps:[
    '1. Confirmar com TI onde fica o banco: Supabase atual ou Azure Database for PostgreSQL.',
    '2. Fechar Tenant ID, Client ID, Redirect URI, consentimento e Mail.Send do Microsoft Graph.',
    '3. Validar as regras de negócio com Plinio: horas, aprovação, OS e vídeos.',
    '4. Executar P0 de segurança e fundação antes de expandir módulos.',
    '5. Fazer homologação com dados fictícios, testes de permissão e validação em 360 px.'
  ], note:'Status do plano: aguardando validação. Data-base: 03/09/2026. Solicitante: Felipe Vieira.'}
];

const nav = sections.map(s=>`<a href="#pl-${s.n}" data-plan-nav="${s.n}"><i>${s.n}</i><span>${s.t}</span></a>`).join('');
const renderBullets = a => a ? `<ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul>` : '';
const renderTable = t => t ? `<div class="plan-table-wrap"><table>${t.map((r,i)=>`<tr>${r.map(c=>i===0?`<th>${c}</th>`:`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>` : '';
const renderFlows = f => f ? `<div class="plan-flow-grid">${f.map(x=>`<div class="flow-row"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>` : '';
const renderPhases = p => p ? `<div class="phase-grid">${p.map(x=>`<article><small>${x[0]}</small><b>${x[1]}</b><p>${x[2]}</p></article>`).join('')}</div>` : '';
const renderBacklog = b => b ? `<div class="backlog-grid">${b.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>` : '';
const renderRisks = r => r ? `<div class="risk-table"><div class="risk-head"><span>Grau</span><span>Risco</span><span>Mitigação</span></div>${r.map(x=>`<div class="risk-row"><span>${x[0]}</span><span>${x[1]}</span><span>${x[2]}</span></div>`).join('')}</div>` : '';
const renderSteps = s => s ? `<ol class="step-list">${s.map(x=>`<li>${x}</li>`).join('')}</ol>` : '';
const card = s => `<section id="pl-${s.n}" class="plan-doc-section"><div class="section-kicker">${s.n}</div><h2>${s.t}</h2><p class="section-intro">${s.intro}</p>${renderBullets(s.bullets)}${renderTable(s.table)}${renderFlows(s.flows)}${renderPhases(s.phases)}${renderBacklog(s.backlog)}${renderRisks(s.risks)}${renderSteps(s.steps)}${s.diagram?`<pre class="diagram">${s.diagram}</pre>`:''}${s.note?`<div class="plan-note">${s.note}</div>`:''}</section>`;

function openPlan(){
  let root=document.getElementById('bt-plan-document');
  if(root){root.hidden=false; syncActive(); return;}
  root=document.createElement('div');
  root.id='bt-plan-document'; root.className='bt-plan-document';
  root.innerHTML=`<div class="plan-doc-layout"><aside class="plan-doc-toc"><div class="toc-mark">BIOTROP · MANUTENÇÃO</div><strong>Plano · 03 set 2026</strong><div class="toc-group">Diagnóstico</div>${nav.slice(0,5)}<div class="toc-group">Solução</div>${nav.slice(nav.indexOf('<a href="#pl-06"'), nav.indexOf('<a href="#pl-10"'))}<div class="toc-group">Execução</div>${nav.slice(nav.indexOf('<a href="#pl-10"'))}<button id="bt-plan-doc-close" class="plan-close">Voltar para a plataforma</button></aside><main class="plan-doc-content"><header class="plan-doc-mast"><div class="eyebrow">Biotrop · Manutenção industrial · Plano de arquitetura v1</div><h1>Plataforma de Manutenção Biotrop</h1><p>Planejamento de uma plataforma interna para manutenção, solicitações SCI/SCM, materiais, apontamento de horas e treinamentos obrigatórios — construído sobre o que já existe, não a partir do zero.</p><div class="mast-meta"><span><b>Data</b>03/09/2026</span><span><b>Solicitante</b>Felipe Vieira</span><span><b>Base</b>V2-MANUT · index.html V3 · biotropplataforma_7</span><span><b>Status</b>Aguardando validação</span></div></header>${sections.map(card).join('')}</main></div>`;
  document.body.appendChild(root); root.hidden=false;
  document.getElementById('bt-plan-doc-close').onclick=()=>{root.hidden=true;};
  root.addEventListener('click',e=>{const a=e.target.closest('a[data-plan-nav]');if(a){e.preventDefault();document.getElementById(`pl-${a.dataset.planNav}`)?.scrollIntoView({behavior:'smooth',block:'start'});}});
  syncActive();
}
function syncActive(){
 const root=document.getElementById('bt-plan-document'); if(!root||root.hidden) return;
 const links=[...root.querySelectorAll('[data-plan-nav]')]; const secs=sections.map(s=>document.getElementById(`pl-${s.n}`));
 const obs=new IntersectionObserver(es=>{const on=es.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!on)return;links.forEach(l=>l.classList.toggle('active',l.dataset.planNav===on.target.id.slice(3)));},{root:root,rootMargin:'-20% 0px -70% 0px',threshold:[0,.2,.5]});secs.forEach(s=>s&&obs.observe(s));
}
function mount(){
 const navEl=document.getElementById('sidebar-nav'); if(!navEl||document.getElementById('bt-plan-trigger-v2')) return;
 const btn=document.createElement('button'); btn.id='bt-plan-trigger-v2'; btn.className='nav-item'; btn.type='button'; btn.innerHTML='<span class="side__icon">▦</span><span>Plano de arquitetura</span>'; navEl.appendChild(btn); btn.addEventListener('click',openPlan);
}
function boot(){document.body.classList.add('bt-plan-ui-v2');mount();const obs=new MutationObserver(mount);obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>obs.disconnect(),18000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();