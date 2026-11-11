// ---- 📒 collections: the screens (title button, Settings row, album, crossing log, island bingo) ----
// Data and wiring live in 62-collections.js. Nothing here touches a core file: the title screen and the Settings window are wrapped.
{const st=document.createElement('style');st.id='colcss';st.textContent=`
.colgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.colph{border:1.5px solid var(--line);border-radius:12px;background:#fff;padding:8px 10px;display:flex;flex-direction:column;gap:2px;min-width:0}
.colph .colic{font-size:30px;line-height:1.1}.colph b{font-size:13px;line-height:1.2}.colph small{font-size:11px;color:var(--mute);line-height:1.25;overflow-wrap:anywhere}
.colbg{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:6px 0 10px}
.colsq{border:1.5px solid var(--line);border-radius:10px;background:#fff;padding:5px 1px 4px;text-align:center;min-width:0;position:relative}
.colsq .colic{font-size:22px;line-height:1.1;filter:grayscale(1);opacity:.35}.colsq small{display:block;font-size:9.5px;line-height:1.15;color:var(--mute);overflow-wrap:anywhere;padding:0 1px}
.colsq.on{border-color:var(--good);background:#eef7ee}.colsq.on .colic{filter:none;opacity:1}.colsq.on small{color:var(--ink);font-weight:700}
.colsq.on::after{content:'✓';position:absolute;top:1px;right:4px;font-size:10px;color:var(--good);font-weight:800}
.colbar{height:10px;border-radius:6px;background:var(--line);overflow:hidden;margin:6px 0 4px}.colbar>i{display:block;height:100%;background:var(--buoy)}
.colrow{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid var(--line);font-size:14px}.colrow:last-child{border-bottom:0}
`;document.head.appendChild(st)}
const colEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function colModal(back){const c=colGet(),n=Object.keys(c.bingo).length;
  modal('📒 Collections',`<p style="font-size:13px;color:var(--mute);margin:0">Saved on this device. They carry over to every new game, save slot and week.</p>`,[
    {l:`📸 Photo album (${c.photos.length})`,s:'Every photo you’ve taken on the island.',fn:()=>colAlbum(back)},
    {l:`⛴️ Crossing log (${c.cross.n})`,s:c.cross.n?`${c.cross.n} ferry ride${c.cross.n===1?'':'s'} so far.`:'Your ferry rides, counted.',fn:()=>colCrossLog(back)},
    {l:`🎱 Island bingo (${n}/25)`,s:'25 things to see and do on Anderson Island.',fn:()=>colBingoView(back)},
    back?{l:'Back to settings',fn:()=>back()}:{l:'Close',fn:()=>{}}])}
window.colModal=colModal;
const colBack=back=>back?{l:'Back to Collections',fn:()=>colModal(back)}:{l:'Back to Collections',fn:()=>colModal(null)};
function colAlbum(back){const P=colPhotos().slice().reverse();
  modal(`📸 Photo album (${P.length})`,P.length?`<div class="colgrid">${P.map(p=>`<div class="colph"><span class="colic">${colEsc(p.ic)}</span><b>${colEsc(p.t)}</b>${p.n?`<small>${colEsc(p.n)}</small>`:''}<small>${colDate(p.at)}${p.sea?` · ${colEsc(p.sea)}`:''}${p.when?` · ${colEsc(p.when)}`:''}</small></div>`).join('')}</div>`
    :`<p>No photos yet. Take one at a sight on a visit, or when something beautiful happens on the ferry, the lake or the road.</p>`,[colBack(back),{l:'Close',fn:()=>{}}])}
function colCrossLog(back){const c=colGet(),X=c.cross,next=COL_MS.find(m=>m>X.n)||X.n,prev=[0,...COL_MS].filter(m=>m<=X.n).pop(),pct=X.n?Math.round((X.n-prev)/Math.max(1,next-prev)*100):0;
  const rec=X.recent.map(r=>`<div class="colrow"><span>${r.to==='I'?'⛴️ To Anderson Island':'⛴️ To Steilacoom'}</span><span>${colDate(r.at)}</span></div>`).join('');
  modal('⛴️ Crossing log',`<div class="colrow"><span>Ferry rides</span><b>${X.n}</b></div>
    <div class="colrow"><span>First crossing</span><b>${X.first?colDate(X.first):'not yet'}</b></div>
    <div class="colrow"><span>Most in one day</span><b>${X.best||0}</b></div>
    <div class="colrow"><span>Milestones</span><b>${X.ms.length?X.ms.map(m=>m>=100?'💯 '+m:m).join(' · '):'none yet'}</b></div>
    <div style="margin-top:8px;font-size:13px;color:var(--mute)">${X.n>=1000?'A thousand rides. The captain knows your name.':`Next milestone: ${next} rides (${Math.max(0,next-X.n)} to go)`}</div><div class="colbar"><i style="width:${pct}%"></i></div>
    ${rec?`<div style="margin-top:10px;font-weight:700;font-size:13px">Recent crossings</div>${rec}`:''}`,[colBack(back),{l:'Close',fn:()=>{}}])}
function colBingoView(back){const c=colGet(),lines=colLines(c),n=Object.keys(c.bingo).length;
  const five=COL_FIVE.filter(id=>c.met[id]).length;
  modal(`🎱 Island bingo (${n}/25)`,`<p style="font-size:13px;color:var(--mute);margin:0">${lines.length?`${lines.length} line${lines.length===1?'':'s'} complete. `:''}${n===25?'Blackout! You’ve done it all. ':''}It fills in as you play, in any game.</p>
    <div class="colbg">${COL_SQUARES.map(s=>`<div class="colsq${c.bingo[s.id]?' on':''}" title="${colEsc(s.d)}"><span class="colic">${s.ic}</span><small>${colEsc(s.t)}</small></div>`).join('')}</div>
    <details><summary style="cursor:pointer;font-size:13px;font-weight:700">What counts</summary>${COL_SQUARES.map(s=>`<div class="colrow"><span>${s.ic} ${colEsc(s.t)}${s.id==='five_friends'?` (${five}/5)`:s.id==='rides_10'||s.id==='rides_100'?` (${Math.min(c.cross.n,s.id==='rides_10'?10:100)}/${s.id==='rides_10'?10:100})`:''}</span><span style="flex:1.6;text-align:right;font-size:12px;color:${c.bingo[s.id]?'var(--good)':'var(--mute)'}">${c.bingo[s.id]?'✓ '+colDate(c.bingo[s.id].at):colEsc(s.d)}</span></div>`).join('')}</details>`,[colBack(back),{l:'Close',fn:()=>{}}])}
// title screen button
function colTitleButton(){const t=document.querySelector('.title .body');if(!t||t.querySelector('#colBtn'))return;
  const b=document.createElement('button');b.id='colBtn';b.className='ghost';b.setAttribute('onclick','colModal()');b.textContent='📒 Collections';
  const ref=[...t.querySelectorAll('button.ghost')].find(x=>/Save slots/.test(x.textContent));ref?t.insertBefore(b,ref):t.appendChild(b)}
{const _ts=titleScreen;titleScreen=function(){_ts.apply(this,arguments);try{colTitleButton()}catch(e){console.error(e)}}}
colTitleButton();
// Settings row, right after Achievements
{const _m=modal;modal=function(title,body,btns,noClose){try{if(title==='⚙️ Settings'&&Array.isArray(btns)&&!btns.some(b=>b&&/Collections/.test(b.l||''))){btns=btns.slice();const i=btns.findIndex(b=>b&&/Achievements/.test(b.l||''));const c=colStats();
  btns.splice(i<0?Math.max(0,btns.length-1):i+1,0,{l:`📒 Collections (${c.photos} photos · ${c.cross} rides · ${c.squares}/25)`,s:'Photo album, crossing log and island bingo, kept across all your games.',fn:()=>colModal(window.openSettings)})}}catch(e){console.error(e)}
  return _m.call(this,title,body,btns,noClose)}}
