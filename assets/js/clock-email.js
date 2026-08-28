(function(){'use strict';
const sb=()=>{try{return (typeof SB!=='undefined'&&SB)||window.SB||null}catch(_){return null}};
function clock(){
  const card=document.querySelector('.industrial-status-card');
  if(!card) return;
  const time=card.querySelector('strong');
  const date=card.querySelector('.industrial-status-top')?.parentElement?.querySelector(':scope > span:not(.industrial-status-top)') || card.querySelectorAll(':scope > span')[1];
  const tick=()=>{const d=new Date(); if(time) time.textContent=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}); if(date) date.textContent=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});};
  tick();
  if(!window.__biotropLiveClock) window.__biotropLiveClock=setInterval(tick,1000);
}
async function notify(type, request){
  const api=sb(); if(!api || !request?.id) return {ok:false,error:'Supabase indisponível'};
  try{
    const r=await api.functions.invoke('send-approval-email',{body:{type,request}});
    if(r.error) throw r.error;
    return r.data||{ok:true};
  }catch(e){ console.warn('BIOTROP email',e); return {ok:false,error:String(e?.message||e)}; }
}
window.BiotropEmail={notify};
function observeNewRequests(){
  const api=sb(); if(!api || window.__biotropEmailChannel) return;
  try{
    const channel=api.channel('biotrop-approval-email')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'service_requests'},payload=>{const r=payload.new;if(['Pendente','pending','ENVIADA','pendente'].includes(r.status)) notify('SCI',r)})
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'purchase_requests'},payload=>{const r=payload.new;if(['Pendente','pending','ENVIADA','pendente_aprovacao_lider','pendente'].includes(r.status)) notify('SCM',r)})
      .subscribe();
    window.__biotropEmailChannel=channel;
  }catch(e){console.warn('Realtime email watcher',e)}
}
window.addEventListener('load',()=>{setTimeout(clock,700);setTimeout(observeNewRequests,1800)});
setInterval(clock,5000);
})();
