// ---------------- polish: share card, accessibility, ambient sound ----------------
// Everything here hooks existing functions by wrapping them (keep the original, call it, then add),
// so the game behaves exactly as before. Nothing here touches Math.random (tests seed it).

// ======== 1. shareable end-of-game card (1080×1350 PNG, drawn on a canvas) ========
const CARD_W=1080,CARD_H=1350,GAME_URL='https://krazow.github.io/islandtime/';
const CARD_C={deep:'#12313b',sound:'#1d4b5a',fir:'#2f5d4a',cream:'#f4f1ea',buoy:'#e3642e',ink:'#1b2326',mute:'#5f686c',line:'#ddd4c0'};
const CARD_SERIF='"Fraunces", Georgia, serif',CARD_SANS='"DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
let END_INFO=null;            // {h1,sub,lost} of the last end screen
let SHARE_LAST=null;          // {blob,url,file,name,w,h} of the last card made
// plain text from game HTML (with {{name}} filled in); DOMParser never runs scripts or handlers
function plainText(t){try{return (new DOMParser().parseFromString(withName(String(t==null?'':t)),'text/html').body.textContent||'').replace(/\s+/g,' ').trim()}catch(e){return String(t||'')}}
function cardSlug(n){return String(n||'').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'')||'islander'}
const SEASON_TXT={fall:'🍂 Fall',winter:'❄️ Winter',summer:'☀️ Summer'};
// everything the card shows, gathered from the finished game
function cardData(){
  const info=END_INFO||{lost:false},lost=!!info.lost,sc=scoreOf(),g=lost?['F',plainText(info.h1),plainText(info.sub)]:gradeOf(sc);
  const month=S.mode==='month',D=DF();
  const ach=(S.achGame||[]).map(id=>ACH.find(a=>a.id===id)).filter(Boolean);
  const friends=Object.values(S.friends||{}).map(f=>String(f.name||'').split(',')[0].split(' from')[0]).filter(Boolean);
  const season=typeof seasonId==='function'?seasonId():null;
  return {name:currentName(),season:season?(SEASON_TXT[season]||season):null,diff:`${D.ic} ${D.n}`,
    span:month?(lost?`A month · game over in week ${(S.weekNo||0)+1}`:'A whole month on the island'):(lost?`One week · game over on ${DAYS[S.cur]}`:'One week on the island'),
    grade:g[0],title:g[1],blurb:g[2],score:sc,lost,month,
    stats:[['💵 Cash',`${S.money<0?'−':''}$${Math.abs(Math.round(S.money)).toLocaleString('en-US')}`],['❤️ Health',String(S.health)],
      ['💼 Job',S.emp?`${JOBS[S.emp].n} · ${S.job}`:'Unemployed'],['😰 Stress',String(S.stress)],
      ['🏠 Home',String(S.home??70)],['🌙 Nights stranded',String(S.stats.stranded||0)],
      ['⛴️ Ferry crossings',String(S.stats.crossings||0)],['🤝 Friends made',String(friends.length)]],
    ach:ach.map(a=>`${a.ic}\u00a0${a.n}`),friends};
}
function cardWait(ms){return new Promise(r=>setTimeout(r,ms))}
// wait for the page's fonts (Fraunces, DM Sans) so the card matches the game; never hang if offline
async function cardFonts(){
  try{if(!document.fonts)return;
    await Promise.race([Promise.all([document.fonts.ready,document.fonts.load(`800 40px ${CARD_SERIF}`),document.fonts.load(`700 40px ${CARD_SANS}`),document.fonts.load(`400 40px ${CARD_SANS}`)]),cardWait(2500)]);
  }catch(e){}
}
// draw text that shrinks to fit maxW; returns the font size used
function cardFit(c,t,x,y,maxW,size,weight,family,min){let s=size;do{c.font=`${weight} ${s}px ${family}`;if(c.measureText(t).width<=maxW)break;s-=2}while(s>(min||14));
  let out=t;if(c.measureText(out).width>maxW){while(out.length>1&&c.measureText(out+'…').width>maxW)out=out.slice(0,-1);out+='…'}c.fillText(out,x,y);return s}
// word-wrap; returns the y after the last line
function cardWrap(c,t,x,y,maxW,lh,maxLines){const words=String(t).split(' ');let line='',n=0;
  for(let i=0;i<words.length;i++){const w=words[i],test=line?line+' '+w:w;
    if(c.measureText(test).width>maxW&&line){if(n===maxLines-1){let l=line;while(l.length>1&&c.measureText(l+' …').width>maxW)l=l.slice(0,-1);c.fillText(l+' …',x,y);return y+lh}
      c.fillText(line,x,y);y+=lh;n++;line=w}else line=test}
  if(line){c.fillText(line,x,y);y+=lh}return y}
function cardRound(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function drawCard(cv,d){
  cv.width=CARD_W;cv.height=CARD_H;const c=cv.getContext('2d');if(!c)return false;
  c.textBaseline='alphabetic';c.textAlign='left';
  // sky, Rainier, firs and water (like the title art)
  const sky=c.createLinearGradient(0,0,0,260);sky.addColorStop(0,'#9fbcc4');sky.addColorStop(1,'#e2e6dc');c.fillStyle=sky;c.fillRect(0,0,CARD_W,260);
  c.fillStyle='#e9eef0';c.beginPath();c.moveTo(560,166);c.lineTo(740,40);c.lineTo(770,62);c.lineTo(795,46);c.lineTo(990,166);c.fill();
  c.fillStyle=CARD_C.fir;for(let i=0;i<24;i++){const x=i*48-20,h=70+((i*29)%60);c.beginPath();c.moveTo(x,168);c.lineTo(x+24,168-h);c.lineTo(x+48,168);c.fill()}
  c.fillStyle=CARD_C.sound;c.fillRect(0,166,CARD_W,110);
  // the ferry
  c.fillStyle=CARD_C.cream;cardRound(c,660,206,280,38,8);c.fill();c.fillStyle=CARD_C.fir;c.fillRect(660,234,280,12);
  c.fillStyle=CARD_C.cream;c.fillRect(760,174,84,34);c.fillStyle='#2a3d45';c.fillRect(768,181,68,12);c.fillStyle=CARD_C.buoy;c.fillRect(794,150,15,26);
  c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=3;c.beginPath();c.moveTo(0,260);c.lineTo(CARD_W,260);c.stroke();
  c.fillStyle=CARD_C.deep;c.fillRect(0,276,CARD_W,CARD_H-276);
  // title on a teal plate over the art
  c.fillStyle='rgba(18,49,59,.88)';cardRound(c,48,34,540,140,22);c.fill();
  c.fillStyle=CARD_C.cream;c.font=`800 80px ${CARD_SERIF}`;c.fillText('Island Time',76,116);
  c.font=`500 27px ${CARD_SANS}`;c.fillStyle='#cfe0e6';c.fillText('Anderson Island, WA',80,156);
  // the cream card
  const X=60,W=CARD_W-120,Y=300,H=900,P=48;
  c.fillStyle=CARD_C.cream;cardRound(c,X,Y,W,H,30);c.fill();
  c.fillStyle=CARD_C.ink;cardFit(c,d.name,X+P,Y+80,W-2*P,58,800,CARD_SERIF,30);
  c.fillStyle=CARD_C.mute;cardFit(c,[d.season,d.diff,d.span].filter(Boolean).join('  ·  '),X+P,Y+124,W-2*P,28,500,CARD_SANS,18);
  // grade medal + title + score
  const gy=Y+232,R=76;c.fillStyle=d.lost?'#b8402a':CARD_C.buoy;c.beginPath();c.arc(X+P+R,gy,R,0,Math.PI*2);c.fill();
  c.fillStyle='#fff';c.font=`800 104px ${CARD_SERIF}`;c.textAlign='center';c.fillText(d.grade,X+P+R,gy+37);c.textAlign='left';
  const tx=X+P+2*R+36,tw=W-2*P-2*R-36;
  c.fillStyle=CARD_C.ink;c.font=`800 42px ${CARD_SERIF}`;const ty=cardWrap(c,d.title,tx,gy-22,tw,48,2);
  c.fillStyle=CARD_C.buoy;c.font=`700 34px ${CARD_SANS}`;c.fillText(`Score ${d.score.toLocaleString('en-US')}`,tx,ty+8);
  // stats: 2 columns × 4 rows
  let sy=Y+380;c.strokeStyle=CARD_C.line;c.lineWidth=2;c.beginPath();c.moveTo(X+P,sy-44);c.lineTo(X+W-P,sy-44);c.stroke();
  const cw=(W-2*P)/2,RH=86;
  d.stats.forEach(([k,v],i)=>{const cx=X+P+(i%2)*cw,cy=sy+Math.floor(i/2)*RH;
    c.fillStyle=CARD_C.mute;c.font=`500 24px ${CARD_SANS}`;c.fillText(k,cx,cy);
    c.fillStyle=CARD_C.ink;cardFit(c,v,cx,cy+42,cw-24,36,700,CARD_SANS,20)});
  sy+=4*RH-22;c.beginPath();c.moveTo(X+P,sy);c.lineTo(X+W-P,sy);c.stroke();
  // achievements (up to 2 lines) + friends (1 line)
  sy+=48;c.fillStyle=CARD_C.ink;c.font=`700 28px ${CARD_SANS}`;c.fillText(`🏆 Achievements this game${d.ach.length?` (${d.ach.length})`:''}`,X+P,sy);
  c.fillStyle=CARD_C.mute;c.font=`400 26px ${CARD_SANS}`;sy=cardWrap(c,d.ach.length?d.ach.join('  ·  '):'None new this time.',X+P,sy+40,W-2*P,34,2);
  sy+=22;c.fillStyle=CARD_C.ink;c.font=`700 28px ${CARD_SANS}`;const fl='🤝 Island friends: ';c.fillText(fl,X+P,sy);const fw=c.measureText(fl).width;
  c.fillStyle=CARD_C.mute;cardFit(c,d.friends.length?d.friends.join(', '):'nobody yet',X+P+fw,sy,W-2*P-fw,26,400,CARD_SANS,18);
  // footer: the link
  c.fillStyle=CARD_C.cream;c.font=`700 32px ${CARD_SANS}`;c.textAlign='center';c.fillText('Can you beat the ferry? Play free:',CARD_W/2,Y+H+62);
  c.fillStyle=CARD_C.buoy;c.font=`700 38px ${CARD_SANS}`;c.fillText(GAME_URL.replace(/^https:\/\//,'').replace(/\/$/,''),CARD_W/2,Y+H+112);c.textAlign='left';
  return true;
}
function cardBlob(cv){return new Promise(res=>{try{cv.toBlob(b=>res(b),'image/png')}catch(e){res(null)}})}
async function makeShareCard(){
  await cardFonts();
  const d=cardData(),cv=document.createElement('canvas');
  if(!drawCard(cv,d))throw new Error('no canvas');
  let blob=await cardBlob(cv);
  if(!blob){const u=cv.toDataURL('image/png'),b=atob(u.split(',')[1]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);blob=new Blob([a],{type:'image/png'})}
  const name=`island-time-${cardSlug(d.name)}.png`;let file=null;try{file=new File([blob],name,{type:'image/png'})}catch(e){}
  if(SHARE_LAST&&SHARE_LAST.url)try{URL.revokeObjectURL(SHARE_LAST.url)}catch(e){}
  SHARE_LAST={blob,file,name,url:URL.createObjectURL(blob),w:cv.width,h:cv.height,data:d};
  return SHARE_LAST;
}
function canShareCard(c){try{return !!(c&&c.file&&navigator.share&&navigator.canShare&&navigator.canShare({files:[c.file]}))}catch(e){return false}}
function downloadCard(c){const a=document.createElement('a');a.href=c.url;a.download=c.name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),0);a11yAnnounce('Saved '+c.name)}
async function shareOrDownload(c){
  if(canShareCard(c)){try{await navigator.share({files:[c.file],title:'Island Time',text:`${c.data.grade}: ${c.data.title} · ${c.data.score} points on Island Time. ${GAME_URL}`});return 'shared'}
    catch(e){if(e&&e.name==='AbortError')return 'aborted'}}
  downloadCard(c);return 'downloaded';
}
window.shareCard=async()=>{
  const b=document.getElementById('shareBtn');if(b){b.disabled=true;b.setAttribute('aria-busy','true')}
  let c=null;try{c=await makeShareCard()}catch(e){console.error(e)}
  if(b){b.disabled=false;b.removeAttribute('aria-busy')}
  if(!c){modal('📸 Couldn’t make the picture','<p>Your browser couldn’t draw the share card. Try a screenshot instead.</p>',[{l:'OK',fn:()=>{}}]);return}
  const share=canShareCard(c);
  modal(`📸 Your ${c.data.month?'month':'week'} on the island`,`<img class="share-prev" src="${c.url}" width="${c.w}" height="${c.h}" alt="Share card: ${esc(c.data.name)}, grade ${esc(c.data.grade)} (${esc(c.data.title)}), score ${c.data.score}.">
    <p style="font-size:13px;color:var(--mute);margin-top:8px">${share?'Share it to your messages or socials, or save the picture.':'Saves as '+esc(c.name)+'.'}</p>`,[
    ...(share?[{l:'📤 Share',fn:()=>{shareOrDownload(c)}}]:[]),
    {l:'⬇️ Save the picture',fn:()=>downloadCard(c)},
    {l:'Close',fn:()=>{}}]);
};
{const _endScreen=endScreen;
  endScreen=function(h1,sub,lost){
    END_INFO={h1,sub,lost:!!lost};
    const r=_endScreen.apply(this,arguments);
    try{const end=document.querySelector('.end'),again=end&&end.querySelector('button.big');
      if(end&&!document.getElementById('shareBtn')){const b=document.createElement('button');b.id='shareBtn';b.className='big share-btn';b.type='button';
        b.textContent=`📸 Share my ${S&&S.mode==='month'?'month':'week'}`;b.setAttribute('onclick','shareCard()');
        if(again)again.parentNode.insertBefore(b,again);else end.appendChild(b)}}catch(e){console.error(e)}
    ambUpdate();
    return r;
  };}

// ======== 2. accessibility ========
let A11Y_KB=false;                 // was the last input from the keyboard?
let A11Y_RET=null;                 // where focus goes back to when the modal stack closes
let A11Y_Q=[],A11Y_T=null,A11Y_N=0;
function a11yLive(){let el=document.getElementById('a11yLive');
  if(!el){el=document.createElement('div');el.id='a11yLive';el.className='sr-only';el.setAttribute('aria-live','polite');el.setAttribute('aria-atomic','false');el.setAttribute('role','log');document.body.appendChild(el)}return el}
// queue a line for screen readers; lines arriving together are announced together
function a11yAnnounce(t){const s=plainText(t);if(!s)return;A11Y_Q.push(s);if(A11Y_T)return;
  A11Y_T=setTimeout(()=>{A11Y_T=null;const el=a11yLive(),lines=A11Y_Q.splice(0);
    for(const l of lines){const p=document.createElement('p');p.textContent=l;el.appendChild(p)}
    while(el.children.length>12)el.firstChild.remove()},60)}
window.a11yAnnounce=a11yAnnounce;
// narration lines
{const _say=say;say=function(s){const r=_say.apply(this,arguments);try{a11yAnnounce(s)}catch(e){}return r}}
// tiles: announce the ones actually shown (queued tiles announce when they appear); our region does the talking
{const _showTile=showTile;
  showTile=function(ic,title,sub){const box=document.getElementById('tiles'),n0=box?box.children.length:0;
    const r=_showTile.apply(this,arguments);
    try{const b=document.getElementById('tiles');if(b){b.setAttribute('aria-live','off');b.setAttribute('role','region');b.setAttribute('aria-label','Notifications');
      if(b.children.length>n0)a11yAnnounce(`${title||''}${sub?'. '+sub:''}`)}}catch(e){}
    return r};
  window.showTile=showTile;}
// remember an element well enough to find its replacement after a re-render
function a11yKey(el){if(!el||el===document.body||!el.getAttribute)return null;return {el,id:el.id,on:el.getAttribute('onclick'),tx:(el.textContent||'').trim()}}
function a11yFind(k){if(!k)return null;if(k.el&&k.el.isConnected)return k.el;
  if(k.id){const e=document.getElementById(k.id);if(e)return e}
  if(k.on){const all=[...document.querySelectorAll('[onclick]')].filter(e=>e.getAttribute('onclick')===k.on&&!e.disabled);
    return all.find(e=>(e.textContent||'').trim()===k.tx)||null}
  return null}
function a11yFocusable(root){return [...root.querySelectorAll('button,[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter(e=>!e.disabled&&e.offsetParent!==null)}
function a11yRestore(){
  if(document.getElementById('mbg'))return;
  const k=A11Y_RET;A11Y_RET=null;
  let t=a11yFind(k);
  if(!t){const ph=document.getElementById('phoneUI');t=ph?a11yFocusable(ph)[0]:null}
  if(!t){const narr=document.querySelector('#app .narr,#app .end h1,#app .title h1');if(narr){narr.setAttribute('tabindex','-1');t=narr}}
  if(t)try{t.focus({preventScroll:true})}catch(e){}
}
let A11Y_MID=0;
{const _modal=modal;
  modal=function(title){
    const had=document.getElementById('mbg'),ae=document.activeElement;
    const r=_modal.apply(this,arguments);
    const el=document.getElementById('mbg');
    if(!el||el===had)return r;      // queued behind an open modal: decorated when it opens
    if(ae&&ae.isConnected&&ae!==document.body&&!ae.closest('#mbg'))A11Y_RET=a11yKey(ae);
    try{const m=el.querySelector('.modal'),h=m&&m.querySelector('h2');
      if(m){m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');if(h){h.id='mbgT'+(++A11Y_MID);m.setAttribute('aria-labelledby',h.id)}}
      a11yAnnounce(title);
      const first=m&&m.querySelector("button:not([disabled])");if(first)try{first.focus({preventScroll:true})}catch(e){}
    }catch(e){}
    return r};}
{const _MBTN=window.MBTN;window.MBTN=function(i){const r=_MBTN.apply(this,arguments);try{a11yRestore()}catch(e){}return r}}
// keep keyboard focus in place across re-renders (render() rebuilds #app)
{const _render=render;
  render=function(){
    const ae=document.activeElement,keep=A11Y_KB&&ae&&ae!==document.body&&app.contains(ae)&&!document.getElementById('mbg')?a11yKey(ae):null;
    const r=_render.apply(this,arguments);
    try{a11yFix(app)}catch(e){}
    if(keep&&!document.getElementById('mbg')&&!app.contains(keep.el)){let t=a11yFind(keep);
      if(!t){t=document.querySelector('#app .narr');if(t)t.setAttribute('tabindex','-1')}
      if(t&&!document.querySelector('.cross'))try{t.focus({preventScroll:true})}catch(e){}}
    try{ambUpdate()}catch(e){}
    return r};}
// ferry crossing overlay: a skippable "button", announced; plays the engine rumble
{const _crossing=crossing;
  crossing=function(side,cap,cap2,done,sail){
    ambFerry(true,!!sail);
    const r=_crossing.call(this,side,cap,cap2,function(){ambFerry(false);const d=done.apply(this,arguments);
      if(A11Y_KB&&(!document.activeElement||document.activeElement===document.body)&&!document.getElementById('mbg')){const n=document.querySelector('#app .narr');if(n){n.setAttribute('tabindex','-1');try{n.focus({preventScroll:true})}catch(e){}}}
      return d},sail);
    try{const els=document.querySelectorAll('.cross'),el=els[els.length-1];
      if(el){el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`${plainText(cap)}. ${plainText(cap2)}. Press Enter to skip.`);
        el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();el.click()}});
        el.focus({preventScroll:true})}
      a11yAnnounce(`${cap}. ${cap2}`)}catch(e){}
    return r};}
// names for icon-only buttons, and keyboard access for clickable non-buttons; runs on every DOM change
const A11Y_ICON={'✓':'Got it','✕':'Close','×':'Close','‹':'Back','▲':'Move up','▼':'Move down','✏️':'Edit','🗑️':'Delete','📌':'Add to my priorities','⚙️':'Settings','📱':'Open your phone','＋':'Add'};
const A11Y_NATIVE=/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL|OPTION|DETAILS)$/;
function a11yHasWords(t){return /[\p{L}\p{N}]/u.test(t||'')}
function a11yFix(root){
  root=root||document.body;if(!root||!root.querySelectorAll)return;
  for(const b of root.querySelectorAll('button:not([aria-label])')){
    const t=(b.textContent||'').trim();if(a11yHasWords(t))continue;
    const k=t.replace(/\d+\+?$/,'').trim();
    b.setAttribute('aria-label',b.getAttribute('title')||A11Y_ICON[k]||A11Y_ICON[t]||'Button')}
  for(const b of root.querySelectorAll('button[title]:not([aria-label])'))if(!a11yHasWords((b.textContent||'').replace(/\p{Extended_Pictographic}/gu,'')))b.setAttribute('aria-label',b.title);
  for(const e of root.querySelectorAll('[onclick]:not([role])')){
    if(A11Y_NATIVE.test(e.tagName)||e.closest('button'))continue;   // nested inside a real button: the button handles it
    e.setAttribute('role','button');if(!e.hasAttribute('tabindex'))e.setAttribute('tabindex','0')}
  for(const e of root.querySelectorAll('.prio .pt[role="button"]')){const done=!!e.closest('.prio.done');e.setAttribute('aria-pressed',done?'true':'false');
    if(!e.hasAttribute('aria-label'))e.setAttribute('aria-label',`${(e.textContent||'').trim()}: ${done?'done, tap to reopen':'tap to mark done'}`)}
  for(const t of root.querySelectorAll('nav.tabs button')){const i=t.querySelector('.ti');i&&i.setAttribute('aria-hidden','true');
    if(t.classList.contains('on'))t.setAttribute('aria-current','page');else t.removeAttribute('aria-current')}
  for(const p of root.querySelectorAll('#phoneUI .ph')){p.setAttribute('aria-modal','true')}
  for(const b of root.querySelectorAll('.ph-badge'))b.setAttribute('aria-hidden','true');
  for(const b of root.querySelectorAll('.phbtn')){const n=phoneBadgeTotal&&S&&!S.over?phoneBadgeTotal():0;b.setAttribute('aria-label',n?`Open your phone (${n} new)`:'Open your phone')}
}
window.a11yFix=a11yFix;
let A11Y_MO=null;
try{A11Y_MO=new MutationObserver(ms=>{for(const m of ms){if(m.addedNodes.length){a11yFix(document.body);break}}});A11Y_MO.observe(document.body,{childList:true,subtree:true})}catch(e){}
a11yFix(document.body);a11yLive();
document.addEventListener('keydown',e=>{
  A11Y_KB=true;
  const t=e.target;
  // Enter/Space on custom role="button" elements
  if((e.key==='Enter'||e.key===' ')&&t&&t.getAttribute&&t.getAttribute('role')==='button'&&!A11Y_NATIVE.test(t.tagName)){e.preventDefault();t.click();return}
  // keep Tab inside an open modal
  if(e.key==='Tab'){const mb=document.getElementById('mbg');if(!mb)return;const f=a11yFocusable(mb);if(!f.length)return;
    const i=f.indexOf(document.activeElement);
    if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus()}
    else if(!e.shiftKey&&(i===-1||i===f.length-1)){e.preventDefault();f[0].focus()}}
},true);
document.addEventListener('pointerdown',()=>{A11Y_KB=false},true);

// ======== 3. ambient sound (WebAudio, synthesized; shares sfx()'s AudioContext) ========
// prefs().amb: 'off' (default) | 'low' | 'med'. Silent when 🔊 Sound is off, when the page is hidden,
// and until the player has touched or typed something.
const AMB_LV={off:0,low:0.22,med:0.5},AMB_TXT={off:'Off',low:'Low',med:'Medium'},AMB_NEXT={off:'low',low:'med',med:'off'};
const AMB={gesture:false,on:false,ctx:null,master:null,rain:null,forest:null,gull:null,ferry:null,srcs:[],gullT:null,tick:null,noise:null,seed:0x9e3779b9,want:{rain:0,forest:0,gulls:false}};
function ambRnd(){let x=AMB.seed;x^=x<<13;x^=x>>>17;x^=x<<5;AMB.seed=x>>>0;return AMB.seed/4294967296}   // own PRNG: leaves Math.random alone
function ambPref(){const v=prefs().amb;return AMB_LV[v]!=null?v:'off'}
function ambWanted(){return AMB.gesture&&!!prefs().sound&&AMB_LV[ambPref()]>0&&!document.hidden}
function ambNoise(a){if(AMB.noise&&AMB.noise.sampleRate===a.sampleRate)return AMB.noise;
  const n=Math.floor(a.sampleRate*2),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);let last=0;
  for(let i=0;i<n;i++){const w=ambRnd()*2-1;last=(last+0.02*w)/1.02;d[i]=w*0.6+last*3}   // white + a little brown
  AMB.noise=b;return b}
function ambLoop(a,dest,rate){const s=a.createBufferSource();s.buffer=ambNoise(a);s.loop=true;if(rate)s.playbackRate.value=rate;s.connect(dest);s.start();AMB.srcs.push(s);return s}
function ambSet(p,v,tc){try{const a=AMB.ctx;p.cancelScheduledValues(a.currentTime);p.setTargetAtTime(v,a.currentTime,tc||0.8)}catch(e){try{p.value=v}catch(_){}}}
function ambStart(){
  const a=audio();if(!a)return false;
  try{
    AMB.ctx=a;AMB.srcs=[];
    const m=a.createGain();m.gain.value=0;m.connect(a.destination);AMB.master=m;
    // rain: filtered noise
    const rg=a.createGain();rg.gain.value=0;rg.connect(m);const rf=a.createBiquadFilter();rf.type='lowpass';rf.frequency.value=1500;rf.Q.value=0.4;rf.connect(rg);ambLoop(a,rf,1);AMB.rain=rg;
    // forest: a soft wind in the firs, slowly breathing
    const fg=a.createGain();fg.gain.value=0;fg.connect(m);const ff=a.createBiquadFilter();ff.type='bandpass';ff.frequency.value=420;ff.Q.value=0.8;ff.connect(fg);ambLoop(a,ff,0.5);
    const lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=0.07;lg.gain.value=40;lfo.connect(lg).connect(ff.frequency);lfo.start();AMB.srcs.push(lfo);AMB.forest=fg;
    // gulls: chirps go through this
    const gg=a.createGain();gg.gain.value=0.9;gg.connect(m);AMB.gull=gg;
    AMB.on=true;
    AMB.tick=setInterval(()=>{try{ambUpdate()}catch(e){}},4000);
    ambGullLoop();
    return true;
  }catch(e){console.error(e);ambStop();return false}
}
function ambStop(){
  clearTimeout(AMB.gullT);AMB.gullT=null;clearInterval(AMB.tick);AMB.tick=null;
  const a=AMB.ctx,m=AMB.master,srcs=AMB.srcs.splice(0);
  if(AMB.ferry)ambFerry(false);
  try{if(a&&m){m.gain.cancelScheduledValues(a.currentTime);m.gain.setValueAtTime(m.gain.value,a.currentTime);m.gain.linearRampToValueAtTime(0,a.currentTime+0.25)}}catch(e){}
  for(const s of srcs){try{s.stop(a?a.currentTime+0.3:0)}catch(e){}}
  const old=m;setTimeout(()=>{try{old&&old.disconnect()}catch(e){}},400);
  Object.assign(AMB,{on:false,master:null,rain:null,forest:null,gull:null});
}
function ambGullLoop(){clearTimeout(AMB.gullT);if(!AMB.on)return;
  AMB.gullT=setTimeout(()=>{if(!AMB.on)return;if(AMB.want.gulls)ambGull();ambGullLoop()},3000+ambRnd()*7000)}
function ambGull(){const a=AMB.ctx;if(!a||!AMB.gull)return;
  try{const n=1+Math.floor(ambRnd()*3);for(let k=0;k<n;k++){const t=a.currentTime+k*(0.28+ambRnd()*0.1),f=1400+ambRnd()*500;
    const o=a.createOscillator(),g=a.createGain();o.type='triangle';
    o.frequency.setValueAtTime(f,t);o.frequency.linearRampToValueAtTime(f*1.45,t+0.06);o.frequency.exponentialRampToValueAtTime(f*0.75,t+0.24);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.07,t+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t+0.26);
    o.connect(g).connect(AMB.gull);o.start(t);o.stop(t+0.3)}}catch(e){}}
// low diesel rumble while the boat crosses (a lighter slap of water for the sailboat)
function ambFerry(on,sail){
  if(!on){const f=AMB.ferry;AMB.ferry=null;if(!f)return;const a=f.a;
    try{f.g.gain.cancelScheduledValues(a.currentTime);f.g.gain.setValueAtTime(f.g.gain.value,a.currentTime);f.g.gain.linearRampToValueAtTime(0,a.currentTime+0.5)}catch(e){}
    for(const s of f.srcs){try{s.stop(a.currentTime+0.6)}catch(e){}}setTimeout(()=>{try{f.g.disconnect()}catch(e){}},800);return}
  if(!AMB.on||AMB.ferry||!AMB.master)return;
  const a=AMB.ctx;
  try{const g=a.createGain();g.gain.value=0;g.connect(AMB.master);const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=sail?600:220;lp.connect(g);const srcs=[];
    if(!sail){[[46,'sawtooth',0.5],[69,'square',0.15]].forEach(([fq,ty,v])=>{const o=a.createOscillator(),og=a.createGain();o.type=ty;o.frequency.value=fq;og.gain.value=v;o.connect(og).connect(lp);o.start();srcs.push(o)})}
    const n=a.createBufferSource();n.buffer=ambNoise(a);n.loop=true;n.playbackRate.value=sail?0.8:0.35;n.connect(lp);n.start();srcs.push(n);
    g.gain.setValueAtTime(0,a.currentTime);g.gain.linearRampToValueAtTime(sail?0.5:0.9,a.currentTime+0.6);
    AMB.ferry={a,g,srcs};}catch(e){console.error(e)}
}
// what should be playing right now
function ambScene(){
  const w={rain:0,forest:0,gulls:false};
  const inGame=S&&!S.over&&!document.querySelector('.title,.end')&&L[S.loc];
  if(!inGame)return w;
  let storm=false,rainy=false;
  try{const st=S.week.storm;storm=!!(st&&S.t>=st.start&&S.t<st.end)||(stormNight(day())&&tod()>=1080)}catch(e){}
  try{rainy=!!(S.up&&S.up.rain===dayKey())}catch(e){}
  const dry=typeof seasonId==='function'&&seasonId()==='summer';
  w.rain=storm?1:rainy?0.6:dry?0:0.12;
  w.forest=S.loc==='home'?0.5:0;
  w.gulls=S.loc==='aiDock'||S.loc==='stDock';
  return w;
}
function ambUpdate(){
  if(!ambWanted()){if(AMB.on)ambStop();return}
  if(!AMB.on&&!ambStart())return;
  const w=ambScene();AMB.want=w;
  ambSet(AMB.master.gain,AMB_LV[ambPref()],0.5);
  ambSet(AMB.rain.gain,w.rain*0.5);
  ambSet(AMB.forest.gain,w.forest*0.6);
}
function ambState(){return {on:AMB.on,gesture:AMB.gesture,level:ambPref(),sources:AMB.srcs.length,ferry:!!AMB.ferry,want:Object.assign({},AMB.want)}}
window.ambState=ambState;window.ambUpdate=ambUpdate;
function ambGestureOK(){if(AMB.gesture)return;AMB.gesture=true;try{ambUpdate()}catch(e){}}
['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,ambGestureOK,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{try{ambUpdate()}catch(e){}});
{const _setPref=setPref;setPref=function(){const r=_setPref.apply(this,arguments);try{ambUpdate()}catch(e){}return r}}
// the Settings row (01-core.js openSettings lists it right under 🔊 Sound)
function ambSettingBtn(){const v=ambPref(),on=prefs().sound;
  return {l:`🌧️ Ambient sound: ${AMB_TXT[v]}`,s:on?'Rain, gulls at the docks, the ferry engine, a quiet forest at home. Tap to cycle Off → Low → Medium.':'Turn 🔊 Sound on to hear it. Tap to cycle Off → Low → Medium.',
    fn:()=>{setPref('amb',AMB_NEXT[v]);openSettings()}}}
