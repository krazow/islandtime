// ---- ⌨️ keyboard shortcuts (desktop / the Windows version) ----
// 1–9 press the numbered buttons (in a pop-up, its buttons; otherwise the action buttons on screen),
// H/F/T/L switch tabs, P opens or puts away the phone, Esc closes, ? lists all of this.
// Number hints only show on a computer with a mouse (CSS: hover + fine pointer), and never while typing.
const KEY_TABS={h:'act',f:'ferry',t:'todo',l:'log'};
const KEY_CLOSE=/^(never mind|close|cancel|not now|ok|got it|back)\b/i;
const keyVisible=el=>!!el&&!el.disabled&&el.offsetParent!==null&&el.getClientRects().length>0;
function keyTargets(){
  const mb=document.getElementById('mbg');
  if(mb) return {where:'modal',list:[...mb.querySelectorAll('.modal > button.act')].filter(keyVisible)};
  if(document.getElementById('phoneUI')||document.querySelector('.cross'))return {where:'none',list:[]};
  if(typeof S==='undefined'||!S||S.over||typeof tab==='undefined'||!document.querySelector('#app .hud'))return {where:'none',list:[]};
  return {where:'main',list:tab==='act'?[...document.querySelectorAll('#app .content button.act')].filter(keyVisible):[]}}
// small number badges on the first nine buttons
function keyHints(){try{
  document.querySelectorAll('.kn').forEach(n=>n.remove());
  const {list}=keyTargets();list.slice(0,9).forEach((b,i)=>{const n=document.createElement('i');n.className='kn';n.setAttribute('aria-hidden','true');n.textContent=i+1;b.appendChild(n)})}catch(e){}}
function keysModal(back){
  const row=(k,t)=>`<div class="keys-row"><kbd>${k}</kbd><span>${t}</span></div>`;
  modal('⌨️ Keyboard shortcuts',`<div class="keys">${[
    row('1 – 9','Press the numbered button (the small number on its right)'),
    row('H F T L','Here, Ferry, To-do and Log tabs'),
    row('P','Open or put away your phone'),
    row('Backspace','Back, inside the phone'),
    row('Esc','Close the pop-up or the phone; skip the ferry crossing'),
    row('Enter','Press the highlighted button'),
    row('?','This list')].join('')}</div><p style="font-size:12px;color:var(--mute)">Shortcuts never fire while you’re typing a name or a priority.</p>`,
    (back?[{l:'Back to settings',fn:back}]:[]).concat([{l:'Close',fn:()=>{}}]))}
window.keysModal=keysModal;
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  const t=e.target;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;
  const k=e.key,lk=k.length===1?k.toLowerCase():k;
  if(k==='?'){e.preventDefault();if(!document.getElementById('mbg'))keysModal();return}
  // the phone
  if(document.getElementById('phoneUI')){
    if(k==='Escape'||lk==='p'){e.preventDefault();phoneClose();return}
    if(k==='Backspace'){e.preventDefault();phoneBack();return}
    return}
  const {where,list}=keyTargets();
  if(/^[1-9]$/.test(k)){const b=list[+k-1];if(b){e.preventDefault();b.click()}return}
  if(where==='modal'){
    if(k==='Escape'){const b=[...list].reverse().find(x=>KEY_CLOSE.test(((x.querySelector('.tx b')||x).textContent||'').trim()));if(b){e.preventDefault();b.click()}}
    return}
  if(where!=='main')return;
  if(KEY_TABS[lk]){e.preventDefault();setTab(KEY_TABS[lk]);return}
  if(lk==='p'&&typeof phoneOpen==='function'){e.preventDefault();phoneOpen();return}
});
// refresh the hints whenever the screen or a pop-up changes
{let q=false;const go=()=>{q=false;keyHints()};
  try{new MutationObserver(ms=>{if(q)return;if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&!n.classList.contains('kn'))||[...m.removedNodes].some(n=>n.nodeType===1&&n.id==='mbg'))){q=true;requestAnimationFrame(go)}})
    .observe(document.body,{childList:true,subtree:true})}catch(e){}}
