// ---------------- 🎱 a bingo card of your own (Wednesday bingo night at the Riv) ----------------
// A quick hand-played game next to the Legion's regular bingo: one 5×5 card ($5). Numbers are called one at a time;
// tap a number to daub it once it's been called, and call BINGO when you have a line. About ten other cards are in
// play, and one of them may win first. First line on the board wins $20. A false BINGO costs you three numbers and some dignity.
// Only the five most recent calls are shown, so keep up. State is in window.BC (a game is over in a minute or two).
const BC_PRICE=5, BC_PRIZE=20, BC_RIVALS=10, BC_MAX=3;
let BC=null;
const bcNums=()=>{const b=[...Array(75)].map((_,i)=>i+1);for(let i=74;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
function bcNew(){
  const order=bcNums(),others=[...Array(BC_RIVALS)].map(bingoCard),seen=new Set();let rivalAt=76;
  for(let i=0;i<75;i++){seen.add(order[i]);if(others.some(c=>hasLine(c,seen))){rivalAt=i+1;break}}
  return {card:bingoCard(),order,idx:0,called:new Set(),daub:new Set(),rivalAt,over:null,msg:'The caller spins the cage and lifts the first ball.',fin:false,wrong:0,false:0};
}
function bcOk(){return S.loc==='food'&&day()===2&&tod()>=1080&&tod()<1200&&S.bingo.playing!==day()}
function bcStart(){
  const T=TX(),G=T.bingo;if(G.dk!==dayKey()){G.dk=dayKey();G.n=0}
  if(G.n>=BC_MAX){say('🎱 Three games is plenty for one night. The Legion volunteer taps the empty chair: “Give somebody else a turn.”');return render()}
  if(S.money<BC_PRICE){say('🎱 You don’t have $5 for a card.');return render()}
  money(-BC_PRICE);G.n++;S.bingo.cards=(S.bingo.cards||0)+1;S.bingo.donated=(S.bingo.donated||0)+Math.round(BC_PRICE*0.5);
  if(G.n===1){if(S.friends.walt)friendPts('walt',1);if(S.friends.rusty)friendPts('rusty',1)}
  BC=bcNew();thxFun('bingo',2);
  modal('🎱 Bingo: your card',bcHTML(),[{l:'Leave the table',s:'Done playing this one.',fn:bcFinish}],true);
}
function bcBalls(){return BC.order.slice(Math.max(0,BC.idx-5),BC.idx).reverse()}
function bcHTML(){
  const B=BC,card=B.card;
  const cell=(n)=>{const d=n===0||B.daub.has(n),called=n!==0&&B.called.has(n);
    return `<button class="bcc${d?' on':''}" ${B.over||n===0?'disabled':''} onclick="bcDaub(${n})" aria-label="${n===0?'free space':ballName(n)}${d?', daubed':''}" style="width:52px;height:46px;margin:1px;border:1.5px solid ${called&&!d?'#e3642e':'var(--line)'};border-radius:${d?'50%':'8px'};font:700 16px 'DM Sans',sans-serif;font-variant-numeric:tabular-nums;${d?'background:#e3642e;color:#fff':'background:#fff;color:inherit'};padding:0;touch-action:manipulation">${n===0?'★':n}</button>`};
  let t='<div style="text-align:center;margin:6px 0"><div style="display:inline-block">'+[...'BINGO'].map(l=>`<span style="display:inline-block;width:54px;font:700 18px Fraunces,serif;color:#fff;background:var(--sound);border-radius:6px;margin:0;padding:2px 0">${l}</span>`).join('')+'</div>';
  for(let r=0;r<5;r++){t+='<div>';for(let c=0;c<5;c++)t+=cell(card[c][r]);t+='</div>'}t+='</div>';
  const rec=bcBalls();
  const head=`<p id="bc-last" style="text-align:center;margin:0 0 4px">${rec.length?`Last called: <b style="font-size:22px">${ballName(rec[0])}</b>`:'No numbers yet.'} · ${B.idx} called</p>${rec.length>1?`<p style="text-align:center;margin:0;font-size:13px;color:var(--mute)">Before that: ${rec.slice(1).map(ballName).join(' · ')}</p>`:''}`;
  const btn=(id,l,fn,pri)=>`<button id="${id}" class="act ${pri?'primary':''}" ${B.over?'disabled':''} onclick="${fn}" style="flex:1;min-height:46px;margin:0"><span class="tx"><b>${l}</b></span></button>`;
  return `${head}${t}<div style="display:flex;gap:8px;margin:6px 0">${btn('bc-next','Next number','bcCall()')}${btn('bc-bingo','BINGO!','bcBingo()',true)}</div><p id="bc-msg" style="text-align:center;margin:4px 0;min-height:2.6em">${B.msg}</p><p style="font-size:12px;color:var(--mute);text-align:center;margin:0">Tap a number to daub it once it’s called. About ${BC_RIVALS} other cards in play. First line wins $${BC_PRIZE}.</p>`;
}
function bcShow(){const b=document.querySelector('#mbg .mb');if(b)b.innerHTML=bcHTML()}
window.bcCall=()=>{const B=BC;if(!B||B.over)return;
  const n=B.order[B.idx++];B.called.add(n);sfx('ball');
  if(B.idx>=B.rivalAt){B.over='rival';const had=hasLine(B.card,B.daub);
    B.msg=`<b>${ballName(n)}.</b> “BINGO!” from the back of the room. ${had?'You had a line, too, a heartbeat too late.':'Not yours this time.'}`}
  else B.msg=`<b style="font-size:18px">${ballName(n)}</b>`;
  bcShow()};
window.bcDaub=n=>{const B=BC;if(!B||B.over||!n)return;
  if(!B.called.has(n)){B.wrong++;B.msg='That one hasn’t been called. Easy, eager hands.';bcShow();return}
  if(B.daub.has(n))B.daub.delete(n);else B.daub.add(n);bcShow()};
window.bcBingo=()=>{const B=BC;if(!B||B.over)return;
  if(hasLine(B.card,B.daub)){B.over='win';B.msg=`<b style="color:var(--good);font-size:20px">BINGO!</b> The caller checks your numbers against the board. Good. $${BC_PRIZE}.`;sfx('win');buzz([60,40,60,40,200]);bcShow();return}
  B.false++;B.msg='“Let’s see it…” The caller reads your numbers. No line. The room groans, and three more numbers go by.';
  for(let i=0;i<3&&!B.over;i++)window.bcCall();
  if(!B.over){B.msg='“Let’s see it…” No line. The room groans, and three more numbers go by while you’re being embarrassed.';bcShow()}
  };
function bcFinish(){
  const B=BC;if(!B||B.fin)return;B.fin=true;
  S.t+=10+Math.round(B.idx*0.8);phoneTick();
  let note;
  if(B.over==='win'){money(BC_PRIZE);S.bingo.won=(S.bingo.won||0)+BC_PRIZE;adj('stress',-8);note=`🎱 BINGO! You won <b>${$(BC_PRIZE)}</b> on a $${BC_PRICE} card. Walt claps once, firmly.`}
  else{adj('stress',-5+B.false*3);
    if(!B.over)note='🎱 You push back from the table with a half-daubed card.';else note='🎱 Somebody else took it. You were close enough to feel it.';
    if(Math.random()<0.2&&B.over){money(5);note+=' A Booster Club volunteer slips you a $5 door-prize raffle win anyway.'}}
  say(note);BC=null;afterAction();
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(S.loc==='food'&&day()===2&&bcOk()){const G=TX().bingo,n=G.dk===dayKey()?G.n:0;
    a.push({ic:'🎱',l:`Play one card yourself: $${BC_PRICE}`,s:n>=BC_MAX?'Three games is plenty for one night.':`Tap to daub as the numbers are called, then call BINGO. First line wins $${BC_PRIZE}. A few minutes.`,cat:'here',dis:S.money<BC_PRICE||n>=BC_MAX,fn:bcStart})}
}catch(e){console.error(e)}return a}}
