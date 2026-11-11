// ---- ↩️ one-step Undo (53-undo.js) ----
// Before each tap on a main-screen action (ACT) the game state is copied. If the action turned out to be simple (only time, place, money,
// the car, the phone battery and the log changed) the copy is kept and an "↩️ Undo" button shows at the top of the Here tab.
// Not offered after a day ends, a modal or an event fired, a ferry crossing started, or once anything else has happened.
const UNDO={str:null,fp:null,label:'',rolls:null};
// Luck can't be undone: every Math.random() roll an action makes is recorded, and after an Undo the same rolls are replayed, in
// order, to whatever happens next. Retrying a hitchhike or a fishing cast gets the same result.
const UNDO_RNG={rec:null,replay:[]},_undoRand=Math.random;
Math.random=function(){if(UNDO_RNG.replay.length){const v=UNDO_RNG.replay.shift();if(UNDO_RNG.rec)UNDO_RNG.rec.push(v);return v}
  const v=_undoRand.call(Math);if(UNDO_RNG.rec)UNDO_RNG.rec.push(v);return v};
const UNDO_KEYS=new Set(['t','phoneT','phone','loc','cars','money','log','stress','health','stats','pantry','carried','cargo','ph','up','tips','home','homeGas','homeDiesel','lbWarn','fun','ateOut','ateOutAt','delivery','rx','nextHide','lastBoatNote','easyWarn','hh','eco','daily']);
const undoFp=()=>S?`${S.t}|${S.loc}|${Math.round(S.money*100)}|${S.log.length}|${S.phone}|${S.cur}|${S.over?1:0}`:'';
function undoAvail(){return !!(UNDO.str&&S&&!S.over&&UNDO.fp===undoFp())}
function undoClear(){UNDO.str=null;UNDO.fp=null}
{const _A=window.ACT;window.ACT=function(i){
  let str=null;try{if(S&&!S.over&&!prefs().noUndo)str=JSON.stringify(S)}catch(e){}
  const ev=window.event,btn=ev&&ev.target&&ev.target.closest?ev.target.closest('button'):null;
  const label=btn?btn.textContent.replace(/\s+/g,' ').trim().slice(0,44):'last action';
  const s0=S;UNDO_RNG.rec=[];
  try{return _A.apply(this,arguments)}finally{
    const rolls=UNDO_RNG.rec;UNDO_RNG.rec=null;
    try{
      UNDO.str=null;UNDO.fp=null;
      if(str&&S===s0&&!S.over&&!document.getElementById('mbg')&&!document.querySelector('.cross,.title,.end')&&(typeof MQ==='undefined'||!MQ.length)){
        const b=JSON.parse(str);let simple=b.cur===S.cur&&(b.ev&&b.ev.history&&S.ev&&S.ev.history?b.ev.history.length===S.ev.history.length:true);
        if(simple)for(const k of new Set([...Object.keys(b),...Object.keys(S)])){if(UNDO_KEYS.has(k))continue;if(JSON.stringify(b[k])!==JSON.stringify(S[k])){simple=false;break}}
        if(simple&&str!==JSON.stringify(S)){UNDO.str=str;UNDO.fp=undoFp();UNDO.label=label;UNDO.rolls=rolls;if(tab==='act'&&!document.getElementById('mbg')){const el=document.querySelector('.undoslot');if(el)el.innerHTML=undoBtn()}}
      }
    }catch(e){console.error(e)}
  }}}
// anything that is not a main-screen action invalidates it
{const _M=window.MBTN;window.MBTN=function(){undoClear();return _M.apply(this,arguments)}}
{const _P=window.PHA;window.PHA=function(){undoClear();return _P.apply(this,arguments)}}
const undoBtn=()=>undoAvail()?`<button class="undobtn" onclick="UNDO_GO()" aria-label="Undo the last action">↩️ Undo: ${esc(UNDO.label)}</button>`:'';
window.UNDO_GO=()=>{
  if(!undoAvail())return;
  const s=JSON.parse(UNDO.str),label=UNDO.label;UNDO_RNG.replay=(UNDO.rolls||[]).concat(UNDO_RNG.replay);undoClear();
  S=s;uiNarr=[];say(`↩️ Undid: ${label}.`);sfx('tap');tab='act';render();
};
{const _av=actView;actView=function(){const h=_av.apply(this,arguments);return `<div class="undoslot">${undoBtn()}</div>`+h}}
{const st=document.createElement('style');st.textContent=`.undoslot:empty{display:none}.undobtn{display:block;width:100%;text-align:left;margin:0 0 8px;padding:7px 12px;border:1.5px dashed var(--mute);background:#fff;color:var(--ink);border-radius:10px;font-size:13.5px;font-weight:700}.undobtn:active{background:#eee}`;document.head.appendChild(st)}
