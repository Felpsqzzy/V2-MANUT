(function(){'use strict';
function build(){
  let dock=document.querySelector('.bt-action-dock');
  if(!dock){dock=document.createElement('div');dock.className='bt-action-dock';document.body.appendChild(dock)}
  const selectors=['.hm-open','#utility-open','.utility-open','.bt-util-open','.bt-action-fab'];
  selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{if(el===dock||dock.contains(el))return;el.classList.add('bt-action-secondary');dock.appendChild(el)}));
  document.querySelectorAll('#br-approval-open').forEach(el=>{if(!dock.contains(el))return;el.classList.add('bt-action-secondary')});
}
window.addEventListener('load',()=>{build();setTimeout(build,700);setTimeout(build,1800)});
setInterval(build,2500);
})();