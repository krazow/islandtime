// ---- 📅 Weekend regular: the goal, the endings, the move-in, the to-do list and the phone (see 44-regular.js) ----
// To move in you need ~$4,000 saved (money after rent and bills), island reputation 40+, and 3 island friends. When all three are met a house
// comes up in the Island Group: buying it ends the month early with "You moved to the island" and offers a resident game that carries over.
// Other endings, at the end of week 4: "A regular, not a resident yet" and "The island wasn’t for you". Losses: evicted, fired, medevac.
const regFriendsN=()=>Object.keys(S.friends||{}).length;
function regNet(){let n=S.money-regRentOwed();for(const k of regBillsUnpaid()){const b=RB(k);if(b.check<0)n-=regBillOwed(k)}return Math.round(n)}
function regGoal(){const V=VS(),net=regNet(),rep=V.rep,fr=regFriendsN(),G=REG_GOAL;
  const g={net,rep,fr,money:net>=G.money,repOk:rep>=G.rep,frOk:fr>=G.friends};g.all=g.money&&g.repOk&&g.frOk;
  g.p=(Math.min(1,Math.max(0,net)/G.money)+Math.min(1,Math.max(0,rep)/G.rep)+Math.min(1,fr/G.friends))/3;return g}
function regGoalCheck(){if(!regOn()||S.over)return;const R=REG(),g=regGoal();
  if(R.offered||!g.all)return;
  R.offered=true;R.goalAt=regDk();R.house={ask:REG_DOWN,at:regDk(),by:pick(['Marta','Walt','Bev','Rusty','the Hendersons'])};
  say('🏡 A house comes up in the Island Group.');
  modal('🏡 A house in the Island Group',`<p>The post is two lines long: <b>“Small cedar house, Lake Josephine side. Owners moving to Arizona. Down payment ${$(REG_DOWN)}, and we’d like it to go to somebody the island already knows.”</b></p><p>Under it, a dozen comments: ${R.house.by} has tagged you. “That’s ${currentName()}. They’re one of us.”</p>
    <p style="font-size:13px;color:var(--mute)">You have ${$(S.money)}. Buying ends the month: you’ve moved to the island.</p>`,
    [{l:`Buy it: ${$(REG_DOWN)} down`,s:'You move to Anderson Island.',dis:S.money<REG_DOWN,fn:regBuy},{l:'Not yet',s:'The post stays up. Buy it from 📱 any time.',fn:()=>{}}],true)}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);if(!regOn()||S.over)return a;
  try{const R=REG();if(R.offered&&R.house&&!R.bought)a.push({cat:'phone',ic:'🏡',l:`Buy the house in the Island Group: ${$(REG_DOWN)} down`,s:'The cedar house on the Lake Josephine side. Ends the month: you move to the island.',cls:'primary',dis:S.money<REG_DOWN||!phoneCan(),fn:regBuy})}catch(e){console.error(e)}return a}}
function regBuy(){const R=REG(),V=VS();if(S.money<REG_DOWN||S.over)return;money(-REG_DOWN);R.bought=true;
  regEnd('moved','{{name}}, you moved to the island',`A cedar house on the Lake Josephine side, a key on a loop of twine, and neighbors who already know your name. ${regFriendsN()} friends, a good name and one very long ferry commute behind you.`,false)}
function regEnd(kind,title,sub,lost){const V=VS();V.done=true;V.result=kind;V.endT=S.t;
  MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());clearTiles();S.over=true;endScreen(title,sub,!!lost)}
function regLose(kind,title,sub){return regEnd(kind,title,sub,true)}
// the end of week 4, Sunday night
function regFinish(){const R=REG(),V=VS();
  if(R.rent.evict)return regLose('evicted','Evicted',`Three Sundays without rent. ${regCity().lord.split(',')[0]} is apologetic, a friend helps you load the boxes, and the island will have to wait.`);
  const o=regRentOwed();if(o>0){money(-o);R.rent.owed=0;R.rent.wk=regWk();R.st.rent+=o}
  for(const k in REG_BILLS){const b=RB(k);if(!b.paid){if(b.check<0){money(-regBillOwed(k));R.st.bills+=regBillOwed(k)}b.paid=true}}
  const g=regGoal();
  if(g.all&&!R.bought&&S.money>=REG_DOWN){R.offered=true;R.house=R.house||{ask:REG_DOWN,at:regDk(),by:'Marta'};
    MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());
    return modal('🏡 One more thing',`<p>The month is over, and the house in the Island Group is still up. Everything you’d need is in the bank.</p>`,[{l:`Buy it: ${$(REG_DOWN)} down`,fn:regBuy},{l:'Not this time',fn:regEndMonth}],true)}
  regEndMonth()}
function regEndMonth(){const g=regGoal();
  if(g.p>=0.6)return regEnd('regular','A regular, not a resident yet',`Four weeks of Friday boats and Sunday nights, and the deckhands know your order. The island is nearly yours. One more month, maybe.`,false);
  return regEnd('notforyou','The island wasn’t for you',`A month of rent, I-5 and ferry lines, and the island never quite let you in. It’s a beautiful place to visit. Some people are visitors.`,false)}
{const _fin=finish;finish=function(){if(regOn())return regFinish();return _fin.apply(this,arguments)}}
function regScore(){const V=VS(),R=REG(),g=regGoal();let sc=Math.round(Math.max(0,g.net)/10+Math.max(0,V.rep)*4+regFriendsN()*60+R.weekends*50+S.health);
  if(V.result==='moved')sc+=1000;else if(V.result==='regular')sc+=250;else if(V.result==='notforyou')sc-=0;
  return Math.max(0,sc)}
const REG_RES={moved:'🏡 Moved to the island',regular:'📅 A regular',notforyou:'🧳 Not for you',evicted:'🏠 Evicted',fired:'💼 Fired',gameover:'🚑 Cut short',lost:'🚑 Cut short'};
{const _es=endScreen;endScreen=function(h1,sub,lost){if(!regOn())return _es.apply(this,arguments);try{return regEndScreen(h1,sub,lost)}catch(e){console.error(e);return _es.apply(this,arguments)}}}
function regEndScreen(h1,sub,lost){const V=VS(),R=REG();if(lost&&!V.result){V.result='gameover';V.done=true}
  achCheck({end:true,lost});const achNew=(S.achGame||[]).map(id=>ACH.find(a=>a.id===id)).filter(Boolean);
  const g=regGoal(),sc=regScore(),res=V.result,grade=lost?'F':res==='moved'?'A':res==='regular'?'B':'D',C=regCity(),H=VISIT_HOMES[V.home]||VISIT_HOMES.tacoma;
  S.ending={score:sc,grade,title:h1,lost:!!lost,visit:true,result:res,regular:true};saveGame();
  const row=(k,v)=>`<div class="kv"><span>${k}</span><b>${v}</b></div>`,mark=ok=>ok?'✓':'✗',st=R.st,s=S.stats;
  const names=Object.values(S.friends||{}).map(f=>f.name.split(',')[0].split(' from')[0]).join(', ')||'none';
  app.innerHTML=withName(`<div class="end visit-end"><div style="display:flex;justify-content:space-between;align-items:center"><div class="small-note" style="color:var(--mute)">${lost?'MONTH CUT SHORT':'MONTH COMPLETE'} · {{name}}</div><button class="gear" style="background:var(--sand);color:var(--ink)" onclick="openSettings()" aria-label="Settings">⚙️</button></div><h1>${h1}</h1><p>${sub}</p>
  <div style="display:flex;gap:16px;align-items:center;margin:16px 0"><div class="grade">${esc(grade)}</div><div><b style="font-family:Fraunces;font-size:20px">${REG_RES[res]||esc(String(res||''))}</b><div style="color:var(--mute);font-size:14px">📅 Weekend regular · from ${H.ic} ${H.n} · ${DF().ic} ${DF().n}</div></div></div>
  ${row('Score',sc)}
  ${row(`${mark(g.money)} Savings after rent and bills`,`${g.net<0?'−':''}${$(Math.abs(g.net))} of ${$(REG_GOAL.money)}`)}
  ${row(`${mark(g.repOk)} Island reputation`,`${V.rep>0?'+':''}${V.rep} of ${REG_GOAL.rep} · ${vTier()[1]}`)}
  ${row(`${mark(g.frOk)} Island friends`,`${g.fr} of ${REG_GOAL.friends}: ${esc(names)}`)}
  ${row('🌲 Weekends on the island',`${R.weekends} of ${REG_WEEKS}`)}
  ${row('💵 Cash at the end',`<span style="${S.money<0?'color:#ff8a70':''}">${S.money<0?'−':''}${$(Math.abs(Math.round(S.money)))}</span> (started with ${$(R.start)})`)}
  ${row('💼 Earned / rent paid',`${$(Math.round(st.earned))} / ${$(st.rent)}`)}
  ${row('🧾 Bills paid',$(st.bills))}${row('🛖 Cabin and rentals',$(st.cabin))}${row('🏡 Weekends with a friend hosting',st.hosted)}
  ${row('🏖️ Vacation days used',`${st.vacUsed} of ${REG_VAC}`)}${row('🍲 Dinners and events with friends',`${st.dinners}+${st.events}`)}${row('🤲 Times you helped out',st.help)}
  ${row('🌙 Nights stranded on the island',st.stranded)}${row('⛴️ Ferry crossings',s.crossings)}${row('Spent on fares',$(s.fares))}
  <div class="kv ach-end"><span>🏆 Achievements this game</span><b style="text-align:right">${achNew.length?achNew.map(a=>a.ic+' '+a.n).join(', '):'none new'}</b></div>
  ${res==='moved'?`<button class="big" style="width:100%;margin-top:22px" onclick="regStartResident()">Start life on the island 🏡</button>`:''}
  <button class="${res==='moved'?'act':'big'}" style="width:100%;margin-top:${res==='moved'?10:22}px${res==='moved'?';justify-content:center':''}" onclick="regAgain()">${res==='moved'?'<span class="tx" style="text-align:center"><b>Another month, another city</b></span>':'Another month 📅'}</button><button class="act" style="margin-top:10px;justify-content:center" onclick="titleScreen()"><span class="tx" style="text-align:center"><b>Back to title</b></span></button></div>`);
  try{const end=document.querySelector('.end');if(end&&typeof feedbackOpen==='function'){const p=document.createElement('p');p.className='fb-end';p.innerHTML='<button type="button" id="fbEnd" class="linkbtn" onclick="feedbackOpen()">💬 Send feedback</button>';end.appendChild(p)}}catch(e){}
  window.scrollTo(0,0)}
window.regAgain=()=>{const go=()=>visitHomeModal(home=>diffModal(k=>{S=null;visitorNew('regular',home,k);tab='act';render()}));go()};
// ======== the handoff: "Start life on the island" = a resident game with your money, friends and name ========
function regStartResident(){
  const V=VS(),carry={money:Math.max(250,Math.round(S.money)),friends:JSON.parse(JSON.stringify(S.friends||{})),rep:Math.min(100,15+Math.round(Math.max(0,V.rep)/2)),diff:S.diff,season:S.season,name:S.name};
  S=null;newGame(carry.diff,'month',carry.season);
  MQ=[];document.querySelectorAll('.modal-bg').forEach(e=>e.remove());clearTiles();
  S.name=carry.name||S.name;S.money=carry.money;S.friends=carry.friends;S.rep=carry.rep;
  uiNarr=[];S.log=[];
  say(`🏡 <b>You live here now.</b> The cedar house, the one-lane road and the 5:15 boat. ${Object.keys(S.friends).length} friends already know your name.`);
  tab='act';render();
  modal('🏡 Welcome home',`<p>You closed on the house. Now the commute is the other way: <b>the ferry, the job and the pantry are yours</b>. You brought ${$(S.money)}, ${Object.keys(S.friends).length} island friends and a good name (reputation +${S.rep}).</p>`,[{l:'Start the month',fn:()=>{}}]);
  saveGame()}
window.regStartResident=regStartResident;
// ======== the to-do list ========
function regTodo(it){const V=VS(),R=REG(),C=regCity(),g=regGoal(),d=day(),m=tod(),J=curJob(),out=[],Rn=vRental(),wk=regWk();
  out.push({ok:g.money,fail:false,l:`Save ${$(REG_GOAL.money)} after rent and bills`,s:`💰 ${g.net<0?'−':''}${$(Math.abs(g.net))} of ${$(REG_GOAL.money)} (cash ${$(S.money)} minus rent and bills still owed).`,urgent:false});
  out.push({ok:g.repOk,fail:false,l:`Island reputation ${REG_GOAL.rep}+`,s:`🤝 ${V.rep>0?'+':''}${V.rep} of ${REG_GOAL.rep} · ${vTier()[1]}. Help out around the island, eat with friends, leave no trace.`,urgent:false});
  out.push({ok:g.frOk,fail:false,l:`${REG_GOAL.friends} island friends`,s:`👥 ${g.fr} of ${REG_GOAL.friends}${g.fr?`: ${Object.values(S.friends).map(f=>f.name.split(',')[0].split(' from')[0]).join(', ')}`:'. Volunteer at the Legion, the Riv, the swap board, the farm or the lake.'}`,urgent:false});
  if(R.offered&&R.house&&!R.bought)out.push({ok:false,fail:false,l:'The house in the Island Group',s:`🏡 ${$(REG_DOWN)} down. Buy it from the 📱 or the ${C.n} to-do and you move to the island.`,urgent:true});
  if(J){J.days.slice().sort((a,b)=>a-b).forEach(i=>{if(!jobStarted(i))return;const vac=R.vacDays[wk*7+i];
    out.push({ok:!!S.worked[i],fail:(i<d&&!S.worked[i])||(i===d&&m>=J.start+240&&!S.worked[i]),l:`Work: ${DAYS[i]}`,s:S.worked[i]?(vac?'🏖️ Vacation day':R.sick[wk*7+i]?'🤒 Sick day':S.late[i]?`Done, ${S.late[i]} min late`:'Done, on time'):`${fmt(J.start)}–${fmt(J.end)}, ${C.n}. Commute ${C.commute}+ min.`,urgent:i===d&&!S.worked[i]&&m<J.start+240})})}
  else out.push({ok:false,fail:true,l:'Find a job',s:'💼 Look in the Gig Work app.',urgent:true});
  if(S.interview)out.push({ok:false,fail:false,l:`Interview: ${JOBS[S.interview.job].n}`,s:`${ivDay(S.interview)} ${fmt(S.interview.time)} at ${L[S.interview.loc].name}`,urgent:S.interview.day===d});
  out.push({ok:R.paidWk===wk,fail:false,l:'Friday paycheck',s:R.paidWk===wk?'💵 Deposited.':`💵 Friday 5:00 PM. ${$(Math.round(R.pend))} earned so far this week.`,urgent:false});
  const o=regRentOwed();out.push({ok:o===0,fail:false,l:`Pay rent: ${$(C.rent)} by Sunday`,s:o===0?'🏠 Paid for this week.':R.rent.owed?`🏠 ${$(o)} owed${R.rent.strikes>=2?'. ⚠️ One more missed Sunday and you’re evicted.':'.'}`:`🏠 ${$(o)} to ${C.lord.split(',')[0]}. Pay from the 📱 or at home. Late fee ${$(REG_RENT_LATE)}.`,urgent:o>0&&(d>=5||R.rent.owed>0)});
  const open=regBillsOpen();if(open.length)out.push({ok:false,fail:open.some(k=>regDk()>regBillDue(k)),l:`Bills: ${open.map(k=>REG_BILLS[k].n.toLowerCase()).join(', ')}`,s:`🧾 ${open.map(k=>`${$(regBillOwed(k))} ${regBillTxt(k)}`).join(' · ')}. Pay from the 💳 app or at home.`,urgent:open.some(k=>regDk()>=regBillDue(k))});
  else out.push({ok:true,fail:false,l:'Bills',s:'🧾 Nothing due right now.',urgent:false});
  out.push({ok:R.vac>0,fail:false,l:`Vacation days: ${R.vac} of ${REG_VAC} left`,s:'🏖️ Take a Friday or a Monday off: Thursday night for Friday, or that morning.',urgent:false});
  out.push({ok:S.pantry>=2||S.carried>=1,fail:false,l:'Keep food at home',s:`🍽️ ${R.swapped?R.cityFood:S.pantry} day${(R.swapped?R.cityFood:S.pantry)===1?'':'s'} in the ${C.n} pantry${S.carried?`, ${S.carried} in the car`:''}. The supermarket is close and cheap.`,urgent:!R.swapped&&S.pantry<1&&!S.carried});
  const car=S.cars.find(c=>c.id==='isl');if(car)out.push({ok:car.fuel>=4,fail:false,l:'Keep gas in the car',s:`⛽ ${car.fuel}/${car.tank} gal. Commute, ferry runs and the weekend add up. There’s no gas on the island.`,urgent:car.fuel<2});
  out.push({ok:S.rx,fail:false,l:'Pick up prescription refill',s:d<2?'💊 Ready Wednesday at the supermarket pharmacy.':'💊 Ready at the supermarket pharmacy. You run out Saturday night.',urgent:d>=2&&!S.rx&&d<=4});
  // the weekend
  if(Rn){const wkEnd=R.W.done;
    out.push({ok:wkEnd,fail:false,l:`Weekend ${wk+1} on the island`,s:Rn.hosted?`🏡 You’re staying with ${Rn.hosted.name.split(',')[0]} (free).`:Rn.checkedIn?'🔑 Checked in.':`🛖 Rental cabin from ${fmt(VCHECK_IN)} Friday (${$(V.nights*V.rate)}), or ask a friend to host you. Catch an evening boat.`,urgent:d===4&&m>=720&&!R.W.on});
    if(R.W.on&&!wkEnd)out.push({ok:false,fail:false,l:`Last boat home: ${DAYS[6]} ${fmt(vLastBoatAbs())}`,s:'⛴️ Check out of the cabin by 11 AM Sunday. Miss the boat and Monday’s work is at risk.',urgent:d>=6})}
  if(R.inv&&R.inv.dk===wk*7+5&&!R.inv.done)out.push({ok:false,fail:false,l:`${msgFirst(R.inv.id)} invited you`,s:`💬 “${R.inv.txt}”`,urgent:d===5});
  const keep=it.filter(x=>/^(Get your ankle treated|Replace the car battery)/.test(x.l||''));
  return out.concat(keep)}
const REG_GUIDE=[
  {id:'r_start',when:()=>day()===0&&L[S.loc].side==='M',t:()=>`📅 <b>Weekend regular.</b> Weekdays you work in ${regCity().n}; rent is due Sunday; the island is for weekends. The 📋 To-do list shows the three things you need to move in: savings, reputation and friends.`},
  {id:'r_work',when:()=>day()<5&&S.loc==='vhome'&&!S.worked[day()],t:()=>`💼 Drive to <b>${curJob()?curJob().n:'work'}</b> and clock in by ${curJob()?fmt(curJob().start):'9'}. Traffic adds up: leave early. Pay lands as a paycheck on Friday.`},
  {id:'r_boat',when:()=>day()===4,t:()=>'⛴️ Friday: pack food at home, drive to Steilacoom and catch an evening boat. The rental cabin opens at 3 PM. Or ask an island friend to host you.'},
  {id:'r_help',when:()=>L[S.loc].side==='I'&&S.loc!=='aiDock',t:()=>'🤝 <b>Help out</b> at the Legion, the Riv, the swap board, the farm or the lake. It earns reputation and friends, and friends host you, feed you and text you.'}];
// ======== the phone: bank, groceries to the city home, the Visit app ========
function regBankView(){const R=REG(),g=regGoal(),C=regCity();let h=apmShow('bank');
  h+=`<div class="icu-bal ${S.money<0?'neg':''}"><small>${S.money<0?'Card balance':'Checking'}</small><b>${S.money<0?'−':''}${$(Math.abs(S.money))}</b></div>`;
  h+=phCard(`🎯 <b>Savings toward the house:</b> ${g.net<0?'−':''}${$(Math.abs(g.net))} of ${$(REG_GOAL.money)} (after rent and bills).`,g.money?'ok':'');
  h+=phNote(`💵 Paycheck on Friday: ${$(Math.round(R.pend))} earned this week so far. Pay by job and day.`);
  const o=regRentOwed();h+=`<div class="ph-sub">Rent</div>`;
  h+=o?phBtn(`🏠 Pay rent: ${$(o)}`,regRentPay,{cls:regDk()%7>=5||R.rent.owed?'primary':'',sub:`${C.lord.split(',')[0]}. Due Sunday night.${R.rent.owed?' Includes late fees.':''}`,dis:!canEssential(o)}):phCard('✅ Rent is paid for this week.','ok');
  h+=`<div class="ph-sub">Bills</div>`;const open=regBillsOpen();
  if(!open.length)h+=phCard('✅ Nothing due right now.','ok');
  for(const k of open){const B=REG_BILLS[k],dd=regBillDue(k)-regDk();h+=`<div class="ph-li icu-bill ${dd<0?'late':dd<=1?'soon':''}"><b>${B.ic} ${B.n} · ${$(regBillOwed(k))}</b><span>${regBillTxt(k)}${RB(k).fees?' · incl. late fee':''}</span></div>`+phBtn(`Pay ${B.n.toLowerCase()}: ${$(regBillOwed(k))}`,()=>{regBillPay(k,'online');apmMsg('bank',`✅ Paid ${B.n.toLowerCase()}.`);afterAction()},{sub:`${B.who}. 5 min.`})}
  return h}
function regMarketView(){const R=REG(),o=R.mkt,win=tod()>=420&&tod()<1140;let h=apmShow('market');
  if(o)h+=phCard(`⏳ <b>On its way:</b> ${o.n} days of food to your ${REG_CITIES[VS().home].n} door, around ${fmt(o.at)}.`);
  h+=phNote(`City prices, delivered to your home. If you’re on the island when it arrives, it waits in the pantry for you.`);
  [[3,36],[5,58]].forEach(([n,c])=>{const cost=c+6,ok=canEssential(cost);
    h+=phBtn(`🛒 ${n} days of food: ${$(cost)}`,()=>{money(-cost);S.t+=5;phoneUse(1);S.stats.food+=n;R.mkt={n,at:S.t+120};say(`🛒 Ordered ${n} days of groceries to your door: ${$(cost)} with the delivery fee. Around ${fmt(S.t+120)}.`);apmMsg('market',`🛒 Order placed. Delivery around ${fmt(S.t+120)}.`);afterAction()},{dis:!!o||!win||!ok,sub:o?'One order at a time.':!win?'Orders 7:00 AM–7:00 PM.':`${$(c)} + $6 delivery.`})});
  return h}
phoneOnTime(()=>{if(!regOn()||S.over)return;const R=REG(),o=R.mkt;if(o&&S.t>=o.at){R.mkt=null;if(R.swapped)R.cityFood+=o.n;else S.pantry+=o.n;
  say(`📦 Your groceries were delivered to the ${REG_CITIES[VS().home].n} door: +${o.n} days of food.`);try{phoneNotify('📦','Groceries delivered',`+${o.n} days of food`)}catch(e){}}});
function regVisitView(){const V=VS(),R=REG(),g=regGoal(),C=regCity(),Rn=vRental(),wk=regWk(),bar=(p,ok)=>`<div class="meter"><i style="width:${Math.round(Math.min(1,Math.max(0,p))*100)}%;${ok?'background:var(--good,#4a9)':''}"></i></div>`;
  let h=`<div class="ph-card"><b>📅 Weekend regular · week ${wk+1} of ${REG_WEEKS}</b><br>${VISIT_HOMES[V.home].ic} ${C.n}: ${$(C.rent)} rent, ${R.vac} of ${REG_VAC} vacation days left.</div>`;
  h+=`<div class="ph-sect">The goal: move to the island</div>`;
  h+=`<div class="ph-card">${g.money?'✓':'☐'} 💰 Savings ${g.net<0?'−':''}${$(Math.abs(g.net))} / ${$(REG_GOAL.money)}${bar(g.net/REG_GOAL.money,g.money)}</div>`;
  h+=`<div class="ph-card">${g.repOk?'✓':'☐'} 🤝 Reputation ${V.rep>0?'+':''}${V.rep} / ${REG_GOAL.rep} · ${vTier()[1]}${bar(V.rep/REG_GOAL.rep,g.repOk)}</div>`;
  h+=`<div class="ph-card">${g.frOk?'✓':'☐'} 👥 Island friends ${g.fr} / ${REG_GOAL.friends}${bar(g.fr/REG_GOAL.friends,g.frOk)}</div>`;
  if(R.offered&&R.house&&!R.bought)h+=phBtn(`🏡 Buy the house: ${$(REG_DOWN)} down`,regBuy,{cls:'primary',dis:S.money<REG_DOWN,sub:'The cedar house in the Island Group. You move to the island.'});
  h+=`<div class="ph-sect">This weekend</div>`;
  h+=`<div class="ph-card">${Rn?(Rn.hosted?`🏡 Staying with <b>${esc(Rn.hosted.name.split(',')[0])}</b> (free)${Rn.checkedIn?' ✓':''}`:`🛖 Rental cabin · ${$(V.nights*V.rate)} · check-in ${fmt(VCHECK_IN)} Friday ${Rn.checkedIn?'✓':''}<br>Check-out ${fmt(VCHECK_OUT)} Sunday ${Rn.checkedOut?'✓':''}`):'No plan yet.'}</div>`;
  try{const d=deps('I',6),last=d[d.length-1];h+=`<div class="ph-card warn">⛴️ Last boat home Sunday: <b>${fmt(last)}</b> from the island. Miss it and Monday’s work is at risk.</div>`}catch(e){}
  if(R.inv&&!R.inv.done)h+=`<div class="ph-card">💬 ${esc(msgFirst(R.inv.id))}: “${esc(R.inv.txt)}”</div>`;
  h+=`<div class="ph-sect">Things to see · ${vSeenN()}/${VSIGHTS.length}</div>`;
  for(const s of VSIGHTS)h+=`<div class="ph-card">${V.seen[s.id]!=null?'✓':'☐'} ${s.ic} ${s.n}${V.photos[s.id]!=null?' 📸':''}</div>`;
  h+=phBtn('📸 Photos',()=>phoneGo('visit','photos'),{});
  return h}
{const a=PHONE_APPS.find(x=>x.id==='visit');if(a){const v=a.view;a.view=arg=>regOn()&&arg!=='photos'?regVisitView():v(arg)}
  const b=PHONE_APPS.find(x=>x.id==='bank');if(b){const v=b.view,bg=b.badge;b.view=arg=>regOn()?regBankView():v(arg);b.badge=()=>regOn()?regBillsOpen().filter(k=>regBillDue(k)-regDk()<=1).length+(regRentOwed()>0&&regDk()%7>=5?1:0):bg()}
  const m=PHONE_APPS.find(x=>x.id==='market');if(m){const v=m.view,bg=m.badge;m.view=arg=>regOn()?regMarketView():v(arg);m.badge=()=>regOn()?0:bg()}}
