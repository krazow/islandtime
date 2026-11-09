// ---------------- 📱 phone: calls (contacts, island numbers, recents, incoming calls) ----------------
// State: PH().calls = {log:[], ring:null, next:abs time of the next incoming call, vm:{id:dayKey}, dinner:dayKey}
// Created lazily, so older saves just work. The live call screen is transient (CALL_NOW), not saved.
let CALL_TAB='contacts', CALL_NOW=null;
function CL(){const P=PH();P.calls=P.calls||{};const c=P.calls;c.log=c.log||[];c.vm=c.vm||{};return c}
const CALL_WHO={sam:'Sam',walt:'Walt',fred:'Fred',hendersons:'the Hendersons',rusty:'Rusty',gus:'Gus',bev:'Bev'};
const CALL_AV={sam:'🐔',walt:'🎖️',fred:'🩴',hendersons:'🥧',rusty:'🍺',gus:'🧰',bev:'🧶'};
function callWho(id,cap){const f=S.friends[id];let n=CALL_WHO[id]||(f?f.name.split(',')[0]:'Someone');return cap?n[0].toUpperCase()+n.slice(1):n}
// what they say when you catch up
const CALL_CHAT={
  sam:['“The hens are on strike again. Henrietta looked me dead in the eye and laid nothing.”','“I named the new rooster Ferry. He’s loud, he’s late, and he breaks down when it rains.”','“Swing by for eggs. I have thirty-one. I have a problem.”'],
  walt:['“Legion meeting ran long. Somebody moved to amend the minutes about the coffee again.”','“Back in ’79 the ferry ran on time once. We had a parade.”','“You keeping out of trouble? Good. Somebody on this island should.”'],
  fred:['“I’m in my good pajamas today. The flannel ones. Big day.”','“Deck crew says the new guy parked a truck on the ramp crooked and they had to re-board half the line.”','“Heard a guy tried to bring a goat on as a passenger. They let him. Island rules.”'],
  hendersons:['Mrs. Henderson tells you about her tomatoes while Mr. Henderson corrects the dates in the background.','“We’ve been retired eleven years and we have never been busier.” Mr. Henderson: “Twelve.”','They put you on speaker. You can hear the pot roast. Somehow.'],
  rusty:['“Riv’s quiet tonight. Just me, the jukebox and a guy who swears he’s from Ketron.”','“Bingo Wednesday. I’ll save you a stool if the Legion doesn’t take them all.”','“Somebody left a single boot at the bar. Not a pair. One boot. Mystery of the week.”'],
  gus:['“Three furnaces and a goat fence today. The goat was not helpful.”','“Island time isn’t a schedule, it’s a philosophy.”','“If you hear a drip, call me. If you hear a hiss, call me faster.”'],
  bev:['“I’m knitting a ferry. Don’t ask why. It’s for the bazaar.”','“Zucchini update: there is too much zucchini.”'],
};
const CALL_CHAT_ANY=['You talk about the weather, the ferry and the weather again. It helps more than you’d think.'];
// their outgoing voicemail greeting
const CALL_GREET={sam:'“You’ve reached Sam. I’m probably out with the chickens. Leave a message, or an egg.”',walt:'“This is Walt. Leave it after the beep. Speak up.”',fred:'“Fred here. If I didn’t pick up, I’m asleep or on the boat. Probably both.”',
  hendersons:'“You’ve reached the Hendersons.” (Two voices, slightly out of sync.) “Please leave a message.”',rusty:'“It’s Rusty. If it’s about your tab, I’m not here.”',gus:'“Gus. Leave your address and what’s broken. I’ll get there.” (Island time.)'};
// what they say when they call you, and what they leave if you miss them
const CALL_IN={sam:['“Hey! Quick chicken update—no, wait, it’s a long chicken update.”','“You need eggs? Say yes. Please say yes.”'],walt:['“Just checking in. Legion’s doing a pancake breakfast. You’re coming.”'],
  fred:['“Morning, neighbor. Or afternoon. Pajamas don’t have a clock.”'],hendersons:['“We were just talking about you! Nice things. Mostly.”'],rusty:['“Riv’s got a new pickle jar. Thought you should know.”'],gus:['“Your gutters still holding? Just asking. Professional curiosity.”'],bev:['“I made too many scarves. Do you have a neck?”']};
const CALL_VM={sam:'“It’s Sam. Henrietta laid an egg. Big news. Call me back.”',walt:'“Walt here. Nothing urgent. Call when you can. Speak up when you do.”',fred:'“Fred. Heard some boat stuff. Might be nothing. Probably nothing. Call me.”',
  hendersons:'“Hi, it’s the Hendersons, just saying hello!” Mr. Henderson: “Is it recording?”',rusty:'“Rusty. Your table at the Riv misses you. That’s all.”',gus:'“Gus. Just making sure the house is still standing. Bye.”',bev:'“It’s Bev. About the zucchini. Call me.”'};
const callPick=(m,id,any)=>pick((m[id]&&m[id].length?m[id]:any));

function callLog(e){const c=CL();c.log.unshift(Object.assign({t:S.t},e));if(c.log.length>20)c.log.length=20}
function callBadge(){if(!S)return 0;const c=CL();return (callRinging()?1:0)+c.log.filter(e=>(e.dir==='missed'&&!e.seen)||(e.vm&&!e.heard)).length}
function callRinging(){const c=CL();return c.ring&&S.t<=c.ring.until&&phoneCan()?c.ring:null}
// a call takes time and battery: 1% per 5 minutes on top of the usual drain
function callTime(min){S.t+=min;phoneUse(Math.max(1,Math.round(min/5)));processTimed()}

function callStart(id){
  const av=phoneFriendAvail(id),w=callWho(id,1);
  callTime(1);
  CALL_NOW={id,t:S.t,lines:[],done:{}};
  if(av==='asleep'||av==='busy'){CALL_NOW.st='out';CALL_NOW.lines.push(`It rings and rings. ${av==='asleep'?'It’s late.':`${w} must be busy.`}`,CALL_GREET[id]||'“Leave a message after the beep.”');callLog({id,dir:'out',ans:false})}
  else {CALL_NOW.st='on';CALL_NOW.lines.push(`${w} picks up. “Hey, {{name}}!”`);callLog({id,dir:'out',ans:true})}
}
function callSay(s){CALL_NOW.lines.push(s)}
function callEnd(){CALL_NOW=null}
// friend-specific asks: [label, sub, show?, fn]
function callAsks(id){
  const w=callWho(id,1),d=day(),out=[];
  if(id==='sam'&&S.loc==='home'&&tod()<630) out.push(['🚗 Ride to the ferry?','Sam’s headed that way some mornings.',()=>{const r=phoneAskRide();callTime(2);
    if(r==='yes'){callSay('“Sure thing. Holler when you’re ready and I’ll pull the truck around. Mind the egg cartons.”');say('📞 Sam will drive you to the ferry landing today. Look for 🤝 <b>Ride with Sam</b>.')}
    else if(r==='no')callSay('“Ah, not today. I’ve got a chicken situation. Long story. Next time!”');
    else callSay('“Bit late for that, isn’t it?”')}]);
  if(id==='fred') out.push(['⛴️ Any word on the boat?','Fred hears things from the deck crew.',()=>{callTime(3);
    const b=S.week.b.filter(b=>b.end>S.t&&Math.floor(b.start/1440)<=d+1).sort((x,y)=>x.start-y.start)[0];
    if(b&&flv('fred')>=2){const cause=b.cause.split(' (')[0],when=b.start<=S.t?`It’s down right now. Back maybe around ${fmtAbs(b.end)}.`:`${Math.floor(b.start/1440)===d?'Today':'Tomorrow'}, from about ${fmt(b.start)}.`;
      callSay(`“Okay, you didn’t hear this from me. My buddy on the deck crew says ${cause}. ${when} Plan around it.”`);say(`📞 Fred’s deck-crew tip: <b>${cause}</b>. ${when}`)}
    else if(b)callSay('“Something’s brewing with the boat. Couldn’t get details. My buddy clams up unless he knows you. Get to know me better and I’ll get to know him better.”');
    else callSay('“Quiet on the wire. Which, honestly, makes me nervous. But quiet.” He yawns. You hear flannel.')}]);
  if(id==='walt'&&!S.emp) out.push(['💼 Any work going?','Walt knows everybody.',()=>{callTime(5);adj('stress',-3);phoneSocial('walt',1);
    callSay(flv('walt')>=2?`“I’ll make some calls. Get an interview lined up and I’ll put in a good word. People listen to the Legion.”`:'“Check the listings and the bulletin board by the old store. And stand up straight in the interview. That’s free advice.”')}]);
  if(id==='hendersons'&&d%7>=4&&CL().dinner!==dayKey()) out.push(['🍲 Dinner this weekend?','They love company. Stress −4.',()=>{callTime(5);CL().dinner=dayKey();adj('stress',-4);
    if(S.ateOut!==d){S.ateOut=d;callSay('“Tonight! Pot roast. We’ll bring a plate if you can’t make it over.” Mr. Henderson: “Two plates.” Dinner tonight is handled.');say('🍲 The Hendersons have tonight’s dinner covered: pot roast.')}
    else{S.pantry+=1;callSay('“You’ve eaten? Then we’ll drop leftovers on your porch. Don’t argue.” +1 day of food.');say('🍲 The Hendersons drop pot roast leftovers on your porch: +1 day of food.')}}]);
  return out.map(([l,s,fn])=>({l,s,fn}));
}
function callScreen(){
  const C=CALL_NOW,id=C.id,f=S.friends[id];
  let h=`<div class="ph-call"><div class="ph-call-av">${CALL_AV[id]||'🙂'}</div><b>${C.st==='out'?'Calling':C.st==='vm'?'Voicemail':'On a call with'} ${esc(callWho(id,1))}${C.st==='out'?'…':''}</b><span>${f?esc(f.name):''}</span></div>`;
  h+=`<div class="ph-call-log">${C.lines.map(s=>`<p>${s}</p>`).join('')}</div>`;
  if(!phoneCan()) return h+`<p>Your phone dies mid-sentence.</p>`+phBtn('OK',()=>{callEnd()});
  if(C.st==='out'){
    h+=phBtn('🎙️ Leave a voicemail',()=>{callTime(2);const c=CL();if(c.vm[id]!==dayKey()){c.vm[id]=dayKey();friendPts(id,0.5)}
      C.st='vm';callSay('You leave a message: “Hey, it’s {{name}}. Just calling to say hi. Call me back.” Beep.')},{cls:'primary',sub:'Two minutes. They’ll like hearing from you.'});
    h+=phBtn('📵 Hang up',callEnd);
  } else if(C.st==='vm') h+=phBtn('📵 Hang up',callEnd,{cls:'primary'});
  else {
    if(!C.done.chat) h+=phBtn('💬 Just catching up',()=>{callTime(15);C.done.chat=1;const first=phoneSocial(id,1);adj('stress',first?-5:-2);callSay(callPick(CALL_CHAT,id,CALL_CHAT_ANY))},{cls:'primary',sub:'15 minutes. Stress −5.'});
    for(const a of callAsks(id)) if(!C.done[a.l]) h+=phBtn(a.l,()=>{C.done[a.l]=1;a.fn()},{sub:a.s});
    h+=phBtn(C.lines.length>1?'📵 Hang up':'📵 Never mind',callEnd);
  }
  return h;
}
function callIncoming(r){
  const w=callWho(r.id,1);
  return `<div class="ph-call ph-ringing"><div class="ph-call-av">${CALL_AV[r.id]||'🙂'}</div><b>${esc(w)} ${/^the /i.test(w)?'are':'is'} calling…</b><span>Incoming call</span></div>`+
    phBtn('📞 Answer',()=>{const c=CL();c.ring=null;callLog({id:r.id,dir:'in',ans:true});callTime(1);CALL_NOW={id:r.id,t:S.t,st:'on',lines:[`${w}: ${callPick(CALL_IN,r.id,['“Hey, {{name}}! Just calling to say hi.”'])}`],done:{}}},{cls:'primary'})+
    phBtn('📵 Decline',()=>{const c=CL();c.ring=null;callLog({id:r.id,dir:'missed',seen:true})});
}
function callRow(ic,title,sub,fn,extra){const i=PH_ACTS.push(fn)-1;return `<button class="ph-row" onclick="PHA(${i})"><span class="ph-av">${ic}</span><span style="flex:1"><b>${title}</b><span>${sub}</span></span>${extra||''}</button>`}
function callTabs(){const c=CL(),n=c.log.filter(e=>(e.dir==='missed'&&!e.seen)||(e.vm&&!e.heard)).length;
  const t=(k,l)=>{const i=PH_ACTS.push(()=>{CALL_TAB=k})-1;return `<button class="ph-tab${CALL_TAB===k?' on':''}" onclick="PHA(${i})">${l}</button>`};
  return `<div class="ph-tabs">${t('contacts','Contacts')}${t('services','Island numbers')}${t('recents','Recents'+(n?` (${n})`:''))}</div>`}
function callView(){
  const c=CL();
  if(CALL_NOW&&(S.t-CALL_NOW.t>180||!S.friends[CALL_NOW.id]))CALL_NOW=null;   // a call left hanging when you put the phone away
  if(CALL_NOW) return callScreen();
  const r=callRinging();if(r) return callIncoming(r);
  let h=callTabs();
  if(CALL_TAB==='contacts'){
    const ids=Object.keys(S.friends);
    if(!ids.length) return h+'<p style="color:var(--mute)">No contacts yet. Island friends you make will show up here.</p>';
    h+=ids.map(id=>{const f=S.friends[id],av=phoneFriendAvail(id);return callRow(CALL_AV[id]||'🙂',esc(callWho(id,1)),`${esc(f.name)} · ${LVL_NAME[flv(id)]||'Friend'}${av==='asleep'?' · 💤 probably asleep':''}`,()=>callStart(id),'<span class="ph-dial">📞</span>')}).join('');
  } else if(CALL_TAB==='services'){
    const gj=upJob('gus');
    h+=`<div class="ph-sect" style="opacity:.6">Anderson Island</div>`;
    h+=callRow('🧰','Gus, island handyman',gj?`Booked: he said ${fmtAbs(gj.due)}. Ish.`:`Fixes the 3 most pressing jobs. $${gusRate()} cash, 5 gal of gas, or 2 days of groceries.`,()=>{if(gj){callTime(2);say('📞 Gus: “Yep, still coming. Island time. Don’t worry about it.”');return}phoneClose();gusModal()},'<span class="ph-dial">📞</span>');
    const d=day(),m=tod(),res=S.bingo.reserved===d;
    h+=callRow('🍺','The Riv',d===2&&res?'Your bingo table is reserved for tonight.':d===2&&m<1080?'Reserve a bingo table for tonight. 5 minutes.':'Bar & grill. Bingo reservations on Wednesdays before 6 PM.',()=>{
      if(d===2&&m<1080&&!res){S.bingo.reserved=d;S.t+=5;phoneUse(1);processTimed();say('📞 “Table for {{name}}, bingo tonight? You got it, hon.” Reserved.')}
      else {callTime(1);say(d===2&&res?'📞 “Yes, hon, you’re on the list. RESERVED tent and everything.”':'📞 “Riv. Bingo’s Wednesday, hon. Call that day before six and we’ll hold you a table.”')}},'<span class="ph-dial">📞</span>');
  } else {
    c.log.forEach(e=>{if(e.dir==='missed')e.seen=true});
    if(!c.log.length) return h+'<p style="color:var(--mute)">No calls yet.</p>';
    h+=c.log.map(e=>{const w=esc(callWho(e.id,1)),when=`${DAYS[((Math.floor(e.t/1440)%7)+7)%7].slice(0,3)} ${fmt(e.t)}`;
      const sub=e.dir==='missed'?`Missed call · ${when}`:e.dir==='in'?`Incoming · ${when}`:`Outgoing${e.ans?'':' · no answer'} · ${when}`;
      let row=callRow(CALL_AV[e.id]||'🙂',e.dir==='missed'?`<span style="color:#c0392b">${w}</span>`:w,sub,()=>{if(S.friends[e.id])callStart(e.id)},'<span class="ph-dial">📞</span>');
      if(e.vm) row+=`<div class="ph-vm">${e.heard?`<p>🎙️ ${e.vm}</p>`:phBtn('▶️ Play voicemail',()=>{e.heard=true;phoneUse(1)},{sub:'New voicemail'})}</div>`;
      return row}).join('');
  }
  return h;
}
definePhoneApp({id:'phone',name:'Phone',ic:'📞',builtin:true,order:20,badge:callBadge,view:callView});

// Friends call you sometimes: every few days, during waking hours, only when the phone has battery.
function callSchedule(c,from){let t=from+Math.floor((1.5+Math.random()*2.5)*1440);const m=((t%1440)+1440)%1440;if(m<540||m>1200)t=Math.floor(t/1440)*1440+540+Math.floor(Math.random()*600);c.next=t}
phoneOnTime(()=>{
  if(!S||!S.friends)return;const c=CL();
  if(c.ring&&S.t>c.ring.until){const r=c.ring;c.ring=null;const vm=Math.random()<0.7&&CALL_VM[r.id];callLog({id:r.id,t:r.t,dir:'missed',seen:false,vm:vm||null,heard:false});
    if(phoneCan())phoneNotify('📞',`Missed call: ${callWho(r.id,1)}`,vm?'New voicemail · Phone → Recents':'Phone → Recents')}
  if(c.next==null){callSchedule(c,S.t);return}
  if(S.t<c.next||c.ring||CALL_NOW)return;
  const m=tod();if(m<540||m>1230){c.next=(day()+(m<540?0:1))*1440+540+Math.floor(Math.random()*600);return}   // too early or late: later
  const ids=Object.keys(S.friends).filter(id=>phoneFriendAvail(id)==='ok');
  callSchedule(c,S.t);
  if(!ids.length||!phoneCan())return;
  const id=pick(ids);c.ring={id,t:S.t,until:S.t+30};
  phoneNotify('📞',`${callWho(id,1)} ${/^the /i.test(callWho(id,1))?'are':'is'} calling`,'Open your 📱 phone to answer');
});
