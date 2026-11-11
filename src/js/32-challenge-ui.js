// ---------------- weekly challenge UI: title button, share codes, local leaderboard (no server) ----------------
// Uses the seeded-week API from 31-challenge.js (challengeWeekId/Spec/Start/On/Result) only behind typeof guards.
// Share code: "IT1-" + base64url(UTF-8 JSON [1,id,name,score,money,grade,workdays,stranded,rep]) + "-" + 4-char base36 checksum.
const CH_KEY='islandtime.challenge',CH_LINK='https://krazow.github.io/islandtime/?c=';
const chHas=n=>typeof window[n]==='function';
function chuiHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(36).padStart(4,'0').slice(-4)}
function chB64u(str){const b=new TextEncoder().encode(str);let s='';b.forEach(c=>s+=String.fromCharCode(c));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function chUnb64u(t){let s=atob(t.replace(/-/g,'+').replace(/_/g,'/'));const b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return new TextDecoder('utf-8',{fatal:true}).decode(b)}
function chClean(n){return String(n==null?'':n).replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,20)||'Islander'}
function chEncode(r){const a=[1,String(r.id),chClean(r.name),Math.round(r.score)|0,Math.round(r.money)|0,String(r.grade||'').slice(0,3),(r.workdays|0),(r.stranded|0),Math.round(r.rep||0)|0];
  const p=chB64u(JSON.stringify(a));return 'IT1-'+p+'-'+chuiHash(p)}
// returns {ok:true,r} or {ok:false,err}
function chDecode(code){
  code=String(code||'').trim().replace(/^.*[?&]c=/,'').replace(/\s+/g,'');
  if(!code)return {ok:false,err:'Paste a code first.'};
  const m=/^IT1-([A-Za-z0-9_-]+)-([0-9a-z]{4})$/.exec(code);
  if(!m)return {ok:false,err:'That doesn’t look like an Island Time challenge code. Check that you copied the whole thing.'};
  if(chuiHash(m[1])!==m[2])return {ok:false,err:'That code has a typo or got cut off (the checksum doesn’t match). Try copying it again.'};
  try{const a=JSON.parse(chUnb64u(m[1]));
    if(!Array.isArray(a)||a[0]!==1||a.length<9||typeof a[1]!=='string'||!/^[\w-]{3,16}$/.test(a[1])||typeof a[2]!=='string'||a.slice(3,5).concat(a.slice(6)).some(x=>typeof x!=='number'||!isFinite(x)))throw 0;
    return {ok:true,r:{id:a[1],name:chClean(a[2]),score:a[3],money:a[4],grade:String(a[5]).slice(0,3),workdays:a[6],stranded:a[7],rep:a[8]}}
  }catch(e){return {ok:false,err:'That code can’t be read. It may be from a newer version of the game.'}}}
function chLoad(){try{const d=JSON.parse(store().getItem(CH_KEY));if(d&&typeof d==='object')return {mine:d.mine||{},boards:d.boards||{}}}catch(e){}return {mine:{},boards:{}}}
function chSave(d){try{store().setItem(CH_KEY,JSON.stringify(d))}catch(e){}}
function chSaveMine(r){const d=chLoad();d.mine[r.id]=r;chSave(d)}
// add a friend's result to the board for its week; false when already there (same name + score)
function chAdd(r){const d=chLoad(),b=d.boards[r.id]=d.boards[r.id]||[];
  if(b.some(e=>e.name===r.name&&e.score===r.score)||(d.mine[r.id]&&d.mine[r.id].name===r.name&&d.mine[r.id].score===r.score))return false;
  b.push(r);chSave(d);return true}
function chBoard(id){const d=chLoad(),m=d.mine[id],b=(d.boards[id]||[]).map(e=>({...e,me:false}));
  if(m)b.push({...m,me:true});return b.sort((x,y)=>y.score-x.score||y.money-x.money||(x.name<y.name?-1:1))}
function chRemove(id,name,score){const d=chLoad();if(d.boards[id])d.boards[id]=d.boards[id].filter(e=>!(e.name===name&&e.score===score));chSave(d)}
function chuiMonday(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d}
function chMondayText(){return chuiMonday().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function chThisWeek(){try{return chHas('challengeWeekId')?challengeWeekId(new Date()):null}catch(e){return null}}
function chCopy(text,btn){
  const done=ok=>{if(btn){const b=btn.querySelector('b')||btn;b.dataset.o=b.dataset.o||b.textContent;b.textContent=ok?'✅ Copied':'Selected: press Ctrl+C / Copy';setTimeout(()=>{b.textContent=b.dataset.o},2500)}};
  const fb=()=>{const t=document.getElementById('chcode');if(t){t.value=text;t.select();try{done(document.execCommand('copy'))}catch(e){done(false)}}else done(false)};
  try{navigator.clipboard.writeText(text).then(()=>done(true),fb)}catch(e){fb()}}
window.chCopyCode=b=>chCopy(document.getElementById('chcode').dataset.code,b);
window.chCopyLink=b=>chCopy(CH_LINK+document.getElementById('chcode').dataset.code,b);

// ---- title screen ----
function chStartModal(){
  const can=chHas('challengeStart'),id=chThisWeek();
  modal('🏆 Weekly challenge',`<p>Everyone gets the same week this week: same weather, outages and prices. Normal difficulty, one week.</p><p><b>Week of ${chMondayText()}</b></p>${can?'':'<p><i>The weekly challenge isn’t available in this version yet.</i></p>'}`,
   [{l:'Start',dis:!can,fn:()=>{if(chHas('challengeStart')){S=null;challengeStart(id)}}},{l:'Compare scores',fn:()=>chCompare()},{l:'Never mind',fn:()=>{}}])}
window.chStartModal=chStartModal;
function chTitleButton(){const t=document.querySelector('.title .body');if(!t||t.querySelector('#chBtn'))return;
  const b=document.createElement('button');b.id='chBtn';b.className='ghost';b.setAttribute('onclick','chStartModal()');
  b.textContent='🏆 Weekly challenge · Week of '+chMondayText();
  const ref=[...t.querySelectorAll('button.ghost')].find(x=>/Save slots/.test(x.textContent));ref?t.insertBefore(b,ref):t.appendChild(b)}
if(typeof titleScreen==='function'){const _ts=titleScreen;titleScreen=function(){_ts.apply(this,arguments);chTitleButton()}}

// ---- end screen share box ----
function chEndBox(){
  if(!chHas('challengeOn')||!challengeOn()||!chHas('challengeResult'))return;
  const end=document.querySelector('.end');if(!end||end.querySelector('#chbox'))return;
  let r;try{r=challengeResult()}catch(e){return}if(!r||!r.id)return;
  r={...r,name:chClean((S&&S.name)||currentName())};chSaveMine(r);const code=chEncode(r);
  const box=document.createElement('div');box.id='chbox';box.style.cssText='margin:18px 0;padding:14px;border:1.5px solid var(--line);border-radius:12px';
  box.innerHTML=`<b style="font-family:Fraunces;font-size:18px">🏆 Weekly challenge ${esc(r.id)}</b><div style="margin:6px 0">${esc(r.name)}: score <b>${r.score}</b> · $${Math.round(r.money)} · grade <b>${esc(r.grade)}</b></div>
   <div style="font-size:13px;color:var(--mute)">Share this code so friends can compare scores:</div>
   <input id="chcode" readonly data-code="${code}" value="${code}" onfocus="this.select()" style="width:100%;margin:6px 0;font-size:12px;border-radius:8px;border:1.5px solid var(--line);padding:6px">
   <button class="act" onclick="chCopyCode(this)"><span class="tx"><b>Copy code</b></span></button><button class="act" style="margin-top:6px" onclick="chCopyLink(this)"><span class="tx"><b>Copy link</b></span></button>
   <button class="act" style="margin-top:6px" onclick="chCompare('${esc(r.id)}')"><span class="tx"><b>Compare scores</b></span></button>`;
  const big=end.querySelector('button.big');big?end.insertBefore(box,big):end.appendChild(box)}
if(typeof endScreen==='function'){const _es=endScreen;endScreen=function(){_es.apply(this,arguments);try{chEndBox()}catch(e){}}}

// ---- compare scores ----
let chSel=null,chMsg='';
function chCompare(week,prefill){
  const d=chLoad(),weeks=[...new Set([...Object.keys(d.mine),...Object.keys(d.boards)])].sort().reverse(),tw=chThisWeek();
  if(tw&&!weeks.includes(tw))weeks.unshift(tw);
  chSel=week&&weeks.includes(week)?week:(weeks.includes(chSel)?chSel:weeks[0]);
  if(week&&!weeks.includes(week)){weeks.unshift(week);chSel=week}
  const rows=chSel?chBoard(chSel):[];
  const msg=chMsg;chMsg='';
  modal('📊 Compare scores',`<p>Paste a friend’s share code to add them to the leaderboard. Codes are stored only on this device.</p>
   ${weeks.length?`<label style="font-size:13px">Week <select id="chwk" onchange="chPick(this.value)" style="font-size:14px;padding:4px;border-radius:6px">${weeks.map(w=>`<option value="${esc(w)}"${w===chSel?' selected':''}>${esc(w)}${w===tw?' (this week)':''}</option>`).join('')}</select></label>`:''}
   ${rows.length?`<table class="chtab" style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px"><tr style="text-align:left"><th>#</th><th>Name</th><th>Score</th><th>Cash</th><th>Grade</th><th></th></tr>${rows.map((e,i)=>`<tr class="${e.me?'chme':''}" style="${e.me?'background:var(--sand);font-weight:700':''}"><td>${i+1}</td><td>${esc(e.name)}${e.me?' (you)':''}</td><td>${e.score}</td><td>$${e.money}</td><td>${esc(e.grade)}</td><td>${e.me?'':`<button class="chrm" style="font-size:12px" onclick="chDel(${i})" aria-label="Remove ${esc(e.name)}">Remove</button>`}</td></tr>`).join('')}</table>`:'<p><i>No scores for this week yet.</i></p>'}
   <textarea id="chin" placeholder="IT1-…" style="width:100%;height:60px;font-size:12px;border-radius:8px;border:1.5px solid var(--line);padding:6px" oninput="window.CHV=this.value">${esc(prefill||'')}</textarea>
   <div id="cherr" role="status" style="font-size:13px;color:${/^✅/.test(msg)?'var(--ok,#2f5d4a)':'var(--bad)'}">${esc(msg)}</div>`,
   [{l:'Add code',fn:()=>chAddCode(document.getElementById('chin')?window.CHV:window.CHV)},{l:'Close',fn:()=>{if(!S||S.over)titleScreen()}}])}
window.chCompare=chCompare;
function chRerender(){document.getElementById('mbg')?.remove();chCompare(chSel)}
window.chPick=w=>{chSel=w;chMsg='';const t=(document.getElementById('chin')||{}).value;document.getElementById('mbg')?.remove();chCompare(w,t)};
window.chDel=i=>{const e=chBoard(chSel)[i];if(e&&!e.me)chRemove(chSel,e.name,e.score);chMsg='';const t=(document.getElementById('chin')||{}).value;document.getElementById('mbg')?.remove();chCompare(chSel,t)};
function chAddCode(txt){const r=chDecode(txt);window.CHV='';
  if(!r.ok)chMsg=r.err;
  else{chSel=r.r.id;chMsg=chAdd(r.r)?'✅ Added '+r.r.name+' ('+r.r.score+').':r.r.name+' is already on the board.'}
  setTimeout(()=>chCompare(chSel),0)}
// ?c=CODE deep link (also in the offline build): open Compare and add the code
(function(){try{const c=new URLSearchParams(location.search).get('c');if(!c)return;
  const r=chDecode(c);if(r.ok){chSel=r.r.id;chMsg=chAdd(r.r)?'✅ Added '+r.r.name+' ('+r.r.score+').':r.r.name+' is already on the board.'}else chMsg=r.err;
  try{history.replaceState(null,'',location.pathname)}catch(e){}
  chCompare(r.ok?r.r.id:null)}catch(e){}})();
chTitleButton();
