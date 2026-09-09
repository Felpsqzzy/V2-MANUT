/* BIOTROP — Plano de arquitetura navegável, sem substituir os módulos existentes */
(()=>{
'use strict';
const sections=[
['01','Entendimento do produto','Plataforma interna única para manutenção industrial. Técnico no celular; PCM, liderança, almoxarifado e gestão com experiências por perfil.','Base existente preservada'],
['02','Requisitos funcionais','Solicitações SCI/SCM, ordens e horas, materiais, utilidades, treinamentos, notificações e indicadores.','MVP orientado ao turno'],
['03','Requisitos não funcionais','Segurança no servidor, auditoria, estados de carregamento/vazio/erro/sem permissão, responsividade e tolerância a falhas.','Obrigatório'],
['04','Matriz de permissões','RBAC por recurso.ação com escopos próprio, equipe e global. Técnico, líder, PCM, almoxarife, gestor e admin.','Fonte de verdade no RBAC'],
['05','Perguntas e lacunas','Banco, regras de aprovação, OS, uso das horas, vídeos e cobertura de rede ainda precisam de validação.','6 perguntas abertas'],
['06','Arquitetura','Evolução gradual: nova camada tipada sobre o banco existente, autorização centralizada e deploy em contêiner.','Recomendação: Next.js + TypeScript'],
['07','Modelo de dados','Equipes em árvore, requests unificadas, OS, time_entries, materiais, LMS versionado, notificações e auditoria append-only.','Migração sem apagar histórico'],
['08','Fluxos principais','SCI, SCM, apontamento de horas e conclusão de treinamento tratados como máquinas de estado.','Servidor + banco garantem regras'],
['09','Mapa de telas','Início por perfil, solicitações, materiais, horas, treinamentos, filas, painéis, administração e auditoria.','Mobile-first para técnico'],
['10','Escopo do MVP','Fundação + solicitações + horas. Utilidades permanece estável até a consolidação final.','Fases 0, 1 e 2'],
['11','Backlog priorizado','P0 segurança/fundação; P1 operação do MVP; P2 materiais, LMS e painéis; P3 integrações e offline.','Dependência e risco'],
['12','Critérios de aceite','403 real, RLS, sobreposição de horas bloqueada, protocolos imutáveis, envio idempotente e experiência em 360 px.','Verificável por terceiros'],
['13','Riscos','Autorização divergente, anexos, segredos, aprovador único, migração, privacidade, ERP e coexistência de front-ends.','Mitigação registrada'],
['14','Próximo passo','Validar banco com TI, Entra ID, Graph, vídeos e regras de negócio; depois iniciar fundação P0.','Aguardando validação']
];
function card([n,t,p,s]){return `<article class="plan-card"><div class="num">${n}</div><h3>${t}</h3><p>${p}</p><span class="state">${s}</span></article>`}
function mount(){
 const nav=document.getElementById('sidebar-nav'); if(!nav||document.getElementById('bt-plan-trigger')) return;
 const btn=document.createElement('button');btn.id='bt-plan-trigger';btn.className='nav-item';btn.type='button';btn.innerHTML='<span style="font-weight:800;letter-spacing:.08em">01—14</span><span>Plano de arquitetura</span>';nav.appendChild(btn);
 btn.addEventListener('click',openPlan);
}
function openPlan(){
 let el=document.getElementById('bt-plan-panel');
 if(el){el.hidden=false;return}
 el=document.createElement('section');el.id='bt-plan-panel';el.className='bt-plan-panel';el.innerHTML=`
 <div class="bt-plan-inner">
  <header class="plan-context"><div><div class="eyebrow">Biotrop · Manutenção industrial · Plano de arquitetura v1</div><h2>Plataforma de Manutenção Biotrop</h2><p>Planejamento aplicado ao sistema atual: preserva utilidades, dados e RBAC enquanto organiza a evolução para solicitações, horas, materiais, treinamentos e indicadores.</p></div><button class="ghost-btn" id="bt-plan-close">Fechar plano</button></header>
  <div class="plan-meta"><div><small>Data</small><strong>03/09/2026</strong></div><div><small>Base</small><strong>V2-MANUT</strong></div><div><small>Status</small><strong>Aguardando validação</strong></div><div><small>MVP</small><strong>Fases 0 · 1 · 2</strong></div></div>
  <div class="plan-index-bar">${sections.map(x=>`<span>${x[0]}</span>`).join('')}</div>
  <div class="plan-grid">${sections.map(card).join('')}</div>
  <div class="plan-section"><h3>Decisões já fechadas</h3><div class="plan-flow"><span>SCI = Cadastro de Item</span><b>→</b><span>SCM = Compra de Material</span><b>·</b><span>SSO Entra ID</span><b>·</b><span>Azure</span><b>·</b><span>Solicitação + consumo</span></div></div>
  <div class="plan-section"><h3>MVP operacional</h3><div class="plan-flow"><span>Fundação</span><b>→</b><span>SCI / SCM</span><b>→</b><span>OS + horas</span><b>→</b><span>Almoxarifado</span><b>→</b><span>PCM</span></div></div>
 </div>`;
 document.body.appendChild(el);el.hidden=false;document.getElementById('bt-plan-close').onclick=()=>el.hidden=true;
}
function boot(){document.body.classList.add('bt-plan-ui');mount();const obs=new MutationObserver(()=>mount());obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>obs.disconnect(),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
