// ---------------- 📱 phone: 💬 Messages ----------------
// Texting friends with choice buttons. Replies arrive on game time (phoneOnTime), friends text first now and then.
// State: PH().msg = {th:{id:{m:[{f,t,x}],u}}, q:[pending replies], inc:{id:dayKey of an unanswered text from them}, plan:{d,at:[]}}
const MSG_CAP=40;
function MSG(){const P=PH();const M=P.msg=P.msg||{};M.th=M.th||{};M.q=M.q||[];M.inc=M.inc||{};return M}
function msgThread(id){const M=MSG();return M.th[id]=M.th[id]||{m:[],u:0}}
function msgPush(id,f,x,t){const T=msgThread(id);T.m.push({f,t:t==null?S.t:t,x});if(T.m.length>MSG_CAP)T.m.splice(0,T.m.length-MSG_CAP);return T}
const msgFirst=id=>{const n=((S.friends[id]||{}).name||id).split(',')[0];return n[0].toUpperCase()+n.slice(1)};
const MSG_AV={sam:'🐔',walt:'🎖️',fred:'🩴',hendersons:'🥧',rusty:'🍺',gus:'🧰',bev:'🧶',marta:'🌻',ken:'🚜',lorraine:'📣',dev:'⚙️'};
const msgAv=id=>MSG_AV[id]||esc(msgFirst(id)[0]);
const msgUnread=()=>{if(!S||!S.ph||!S.ph.msg)return 0;const th=S.ph.msg.th||{};return Object.keys(th).reduce((n,id)=>n+(S.friends[id]?(th[id].u||0):0),0)};
const msgRnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const msgWed=()=>day()%7===2;

// ---- what friends say ----
const MSG_GEN={
  otw:['👍','Cool. Drive safe.','See you soon.','K.'],
  late:['Of course it is. Ferry gonna ferry.','Classic. No worries.','The boat giveth, the boat taketh away.'],
  thanks:['Anytime!','Of course. Island rules.','You’d do the same.'],
  how:['Not bad! Rained, stopped, rained. You?','Good! Quiet day. The good kind.','Fine. The power flickered twice, so, normal.'],
  inc:['Ha, yes.','👍','Right?'],
};
const MSG_P={
  sam:{otw:['Yay! The chickens will be thrilled. Well, indifferent. But I’ll be thrilled!','On my way too! Wait, where are we going?'],
    late:['Ugh, the boat! Want me to save you some eggs anyway? 🥚','No stress! The hens are running late too. They don’t lay on ferry days, I swear.'],
    thanks:['Anytime!! Seriously. I like having a neighbor who isn’t a raccoon.','Of course! Payment accepted in compliments to my chickens.'],
    how:['GREAT. Henrietta laid a double-yolker. Big day over here.','Good! A raccoon tested the coop door at 3 AM. The coop door won. 🐔','Busy! I’m building the chickens a little porch. Don’t ask why.'],
    inc:['Haha yes! 🐔','Knew you’d get it.','Love that. Talk later!']},
  walt:{otw:['Copy.','Roger. Don’t speed on Eckenstam-Johnson. Deputy’s bored today.'],
    late:['Ferry’s been running late since 1974. Sit tight.','Figures. Bring a book next time.'],
    thanks:['Don’t mention it. Really. I have a reputation.','Least I could do. The Legion takes care of its own. You count now.'],
    how:['Fine. Fixed the Legion hall’s toilet. Again.','Can’t complain. Do anyway. Knees.','Quiet. Too quiet. Somebody’s planning a potluck.'],
    inc:['Good.','Copy that.','Mm-hm.']},
  fred:{otw:['Cool cool. I’m in my pajamas, so I’m not.','👍 (sent from bed)'],
    late:['Yeah, my guy on the deck says the ramp was acting up. You didn’t hear it from me.','Boat’s slow cuz the new deckhand can’t throw a line. Heard it from Denny.'],
    thanks:['You’re a good egg.','Pay it forward. Or pay it toward a pack of smokes. Either.'],
    how:['Same pajamas as yesterday. Different socks. Growth.','Chillin at the landing. Deck crew says the captain’s in a mood.','Good! Found a dollar in my pajama pocket. From last week, I think.'],
    inc:['😎','Heard that.','Word.']},
  hendersons:{otw:['Wonderful! Don’s putting the kettle on. – Ruth','We’ll leave the porch light on, dear.'],
    late:['Oh, that ferry. Don wrote a letter about it in 1998. Nothing changed. – Ruth','Take your time, dear. The casserole keeps.'],
    thanks:['Oh, it was nothing! Come by for pie. – Ruth','You’re very welcome. Don says you’re “alright,” which is high praise. – Ruth'],
    how:['Lovely! Don made chili. There is so much chili. Do you want chili? – Ruth','Busy busy. Book club, then the casserole for the potluck, then a nap. – Ruth','Don found the remote. A good day. – Ruth'],
    inc:['😊 – Ruth','Wonderful! – Ruth','Ha! Don laughed out loud. – Ruth']},
  rusty:{otw:['Bar’s open. Your stool’s free. Nobody else wants it, it wobbles.','👍 First one’s on you.'],
    late:['Ferry. Shocking. I’ll keep the fryer hot.','The 4:40 always is. Grab a beer in Steilacoom, it’s tradition.'],
    thanks:['Yeah yeah. You’re buying next round.','No problem. Tell the kitchen I said you’re OK.'],
    how:['Slow night at the Riv. Two guys arguing about the 2019 ferry schedule.','Good. Fryer’s fixed. Mostly.','Fine. Some tourist asked if the island has an Uber. I laughed for an hour.'],
    inc:['Ha.','Yup.','You know it.']},
  gus:{otw:['Same. I’ll be there when I’m there.','👍 Bring coffee if you got it.'],
    late:['Ferry? Never touch the stuff. Island guy.','Island time. I’m an expert.'],
    thanks:['No sweat. Your gutters are still gonna clog though.','Anytime. Well, any time after 10.'],
    how:['Fixing a well pump in the rain. Living the dream.','Good. Found the 10 mm socket. It was in my pocket.','Slow. Which means somebody’s roof is about to leak.'],
    inc:['👍','Yep.','Ha, figures.']},
};
const msgLine=(id,k)=>pick(((MSG_P[id]||{})[k])||MSG_GEN[k]||MSG_GEN.inc);

// replies to requests: built when the reply arrives, so they use what’s true then
function msgReplyText(it){const id=it.id,lv=flv(id);
  if(it.k==='ride')return it.ride==='yes'?pick(['Yes! Leaving in 10. I’ll honk. The chickens send their regards. 🐔','Sure thing! Gotta be back for feeding anyway. Ready when you are.','Yep! Bring your coffee, my cup holder’s full of feed.']):
    pick(['Ah, sorry! I’m stuck here today. Hen emergency. Long story.','Can’t this morning, my truck’s doing the thing again. Sorry!!','Oh no, I already went over on the early boat. Next time!']);
  if(it.k==='boat'){
    if(lv>=2){const b=msgNextOutage();
      if(!b)return pick(['Deck crew says smooth sailing through tomorrow. Which means nothing, but still.','Nothing from my guy. Boat’s behaving. For now.','All quiet on the deck. Captain even smiled. Weird.']);
      if(b.start<=S.t)return `Boat’s down right now: ${b.cause}. My buddy figures back around ${fmtAbs(b.end)}. Maybe. 🩴`;
      return pick([`Heads up: deck crew says they’ll be pulling the boat around ${fmtAbs(b.start)}. ${b.cause[0].toUpperCase()+b.cause.slice(1)}. You didn’t hear it from me.`,`My guy on the deck says trouble around ${fmtAbs(b.start)}: ${b.cause}. Plan around it. 🩴`]);}
    return pick(['Something about the boat maybe? Or was it the bus. Ask me when we’re closer, I protect my sources.','Eh, heard a rumor. Can’t say. Buy me a coffee sometime.','I hear stuff. Not telling stuff. Yet. 🩴']);}
  if(it.k==='bingo')return id==='walt'?pick(['Six sharp. Legion’s calling. First card’s on me.','Wouldn’t miss it. Bring quarters.','Of course. Somebody has to keep Rusty honest.']):
    lv>=2?pick(['Saving you a seat at the bar. Don’t be late, the stool police are vicious.','Yep. Your seat’s saved. Don’t make me defend it again.']):pick(['Wouldn’t miss it. Come early, seats go fast.','Yeah. Walt’s calling, so it’ll be loud.']);
  if(it.k==='mainland')return pick(['Oh, would you? A rotisserie chicken from the store, if it’s no trouble. Don isn’t allowed to choose anymore. – Ruth','Aren’t you sweet. Don wants the good crackers. You’ll know them. They’re expensive. – Ruth','Just come home safe, dear. And maybe a lemon. One lemon. – Ruth']);
  return msgLine(id,it.k);
}
// the next ferry outage today or tomorrow (Pajama Fred’s deck-crew perk), including one going on now
function msgNextOutage(){const lim=(day()+2)*1440;return S.week.b.filter(b=>b.end>S.t&&b.start<lim).sort((a,b)=>a.start-b.start)[0]||null}

// when the reply comes: 3–25 min (close friends 2–10), next morning if asleep, later if busy
function msgDelay(id,k){const av=phoneFriendAvail(id),m=tod();
  if(av==='asleep'){const wake=msgRnd(390,480);return (m>=1350?1440-m+wake:wake-m)}
  let d=k==='ride'?msgRnd(2,8):flv(id)>=3?msgRnd(2,10):msgRnd(3,25);
  if(av==='busy'&&k!=='ride')d+=msgRnd(30,90);
  if(typeof repVal==='function'&&repVal()>=20)d=Math.max(1,Math.round(d*(repVal()>=60?0.4:0.6)));   // 🤲 Known: friends answer sooner
  return d}

// ---- sending ----
function msgSend(id,k,text){if(!phoneCan()||!S.friends[id])return;const M=MSG();phoneUse(1);msgPush(id,1,text);
  if(M.inc[id]===dayKey()){delete M.inc[id];phoneSocial(id,1)}         // answering their text the same day
  const it={id,k,at:S.t+msgDelay(id,k),d:dayKey(),soc:k==='how'||k==='mainland'};
  if(k==='ride'){it.ride=phoneAskRide();if(it.ride==='not-now')return;if(it.ride==='yes')delete S.ev.flags.samRide}  // the 🤝 option appears when Sam answers
  M.q.push(it)}
function msgDeliver(it){const M=MSG();
  if(it.k==='ride'&&it.ride==='yes'&&it.d===dayKey())S.ev.flags.samRide=day();
  if(it.soc)phoneSocial(it.id,1);
  const x=msgReplyText(it);const T=msgPush(it.id,0,x,Math.min(S.t,it.at));T.u++;
  phoneNotify('💬',msgFirst(it.id),x.length>70?x.slice(0,68)+'…':x)}

// ---- friends text first: about one text a day once you have friends ----
const MSG_INC=[
  {who:['sam'],x:()=>pick(['The chickens laid NINE eggs today. Nine! Want some? 🥚','Henrietta escaped again. If you see a judgmental chicken on your porch, she’s mine.','Made too much cornbread. Porch drop incoming.'])},
  {who:['walt'],x:()=>msgWed()?'Bingo tonight. Six sharp at the Riv. Don’t be late, the good dabbers go fast.':pick(['Legion pancake fund needs a volunteer flipper. Thought of you. Don’t thank me.','Saw your car. Tire’s low. Fix it before it’s a problem.'])},
  {who:['rusty'],x:()=>msgWed()?'Bingo tonight. I’ll save you a stool. The wobbly one.':pick(['Kitchen made too many fries. Come eat them before I do.','Some guy just tried to pay with a ferry ticket. Island economy.'])},
  {who:['fred'],x:()=>{const b=flv('fred')>=2&&msgNextOutage();return b&&b.start>S.t?`Psst. Deck crew says watch out around ${fmtAbs(b.start)}. Didn’t hear it from me. 🩴`:pick(['Ferry line’s past the store already. Leave early.','New deckhand dropped a rope in the water. Twice. Morale is high.','I’m at the landing in my pajamas. Just letting you know where I am in life.'])}},
  {who:['hendersons'],x:()=>pick(['Don made too much pot roast. Again. Come by, or we’re leaving it on your porch. – Ruth','Book club is reading a murder mystery set on a ferry. Don is furious. – Ruth','We have leftovers. We always have leftovers. Please help. – Ruth'])},
  {who:['gus'],x:()=>pick(['Drove past your place. Gutters. We should talk. No rush. Some rush.','Got a free afternoon Thursday. Ish. Holler if something breaks.'])},
  {who:null,x:()=>pick(['Eagle on the snag by Lake Josephine right now. Just thought you should know. 🦅','Ferry line’s long today. Pack a snack.','Power flickered over here. You OK?','Deer in my yard eating my one nice plant. Living the dream.','Saw an orca off the south end this morning! Or a log. Pretty sure orca.'])},
];
function msgIncoming(){const ids=Object.keys(S.friends);if(!ids.length)return;
  const w=ids.map(id=>flv(id)+(MSG_P[id]?1:0));let r=Math.random()*w.reduce((a,b)=>a+b,0),id=ids[0];
  for(let i=0;i<ids.length;i++){r-=w[i];if(r<0){id=ids[i];break}}
  const own=MSG_INC.filter(c=>c.who&&c.who.includes(id));const c=own.length&&Math.random()<0.75?pick(own):MSG_INC[MSG_INC.length-1];
  const x=c.x(),M=MSG();const T=msgPush(id,0,x);T.u++;M.inc[id]=dayKey();
  phoneNotify('💬',msgFirst(id),x.length>70?x.slice(0,68)+'…':x)}
function msgPlan(M){const r=Math.random(),n=r<0.3?0:r<0.78?1:2,from=Math.max(tod(),480)+20,at=[];
  for(let i=0;i<n&&from<1260;i++)at.push(day()*1440+msgRnd(from,1260));M.plan={d:dayKey(),at:at.sort((a,b)=>a-b)}}

phoneOnTime(()=>{if(!S||S.over)return;const M=MSG();
  for(const it of M.q.slice().sort((a,b)=>a.at-b.at)){if(it.at>S.t)break;M.q=M.q.filter(x=>x!==it);if(S.friends[it.id])msgDeliver(it)}
  if(!M.plan||M.plan.d!==dayKey()){if(!Object.keys(S.friends).length)return;msgPlan(M)}
  while(M.plan.at.length&&M.plan.at[0]<=S.t){M.plan.at.shift();msgIncoming()}
});

// ---- screens ----
function msgList(){const M=MSG(),ids=Object.keys(S.friends);
  if(!ids.length)return `<p style="color:var(--mute);text-align:center;margin-top:30px">No one to text yet.<br>Make friends on the island and they’ll show up here.</p>`;
  const last=id=>{const T=M.th[id];return T&&T.m.length?T.m[T.m.length-1]:null};
  ids.sort((a,b)=>((last(b)||{t:-1}).t)-((last(a)||{t:-1}).t));
  return ids.map(id=>{const l=last(id),u=(M.th[id]||{}).u||0;
    return `<button class="ph-row msg-row${u?' msg-unread':''}" onclick="phoneGo('msg','${id}')"><span class="ph-av">${msgAv(id)}</span><span class="msg-mid"><b>${esc(msgFirst(id))}</b><span>${l?(l.f?'You: ':'')+esc(l.x):'Say hi 👋'}</span></span><span class="msg-side">${l?`<small>${fmtAbs(l.t)}</small>`:''}${u?'<i class="msg-dot" aria-label="unread"></i>':''}</span></button>`}).join('')}
function msgView(id){const M=MSG(),f=S.friends[id];if(!f)return msgList();
  const T=msgThread(id);T.u=0;
  const pend=M.q.find(it=>it.id===id),av=phoneFriendAvail(id),first=msgFirst(id);
  let h=`<div class="msg-head"><span class="ph-av">${msgAv(id)}</span><div><b>${esc(first)}</b><span>${esc(f.name)} · ${LVL_NAME[flv(id)]||'Friend'}</span></div></div><div class="msg-thread">`;
  h+=T.m.length?T.m.map(m=>`<div class="ph-msg ${m.f?'me':'them'}">${esc(m.x)}<small>${fmtAbs(m.t)}</small></div>`).join(''):`<p class="msg-empty">No messages yet. Say hi.</p>`;
  if(pend)h+=`<div class="msg-status">${av==='asleep'?`Delivered. ${esc(first)} is probably asleep.`:'Delivered. Waiting for a reply…'}</div>`;
  h+='</div><div class="ph-sect">Write…</div>';
  const send=(k,txt,sub,dis)=>phBtn(txt,()=>msgSend(id,k,txt),{sub,dis:dis||!!pend});
  if(id==='sam'){const P=PH(),asked=P.rideAsk===dayKey();if(S.loc==='home'&&tod()<630)h+=send('ride','Any chance of a ride to the ferry?',asked?'You already asked today.':'Sam might drive you to the landing.',asked);}
  if(id==='fred')h+=send('boat','Hear anything about the boat today?',flv(id)>=2?'Fred’s deck-crew buddy knows things.':'Fred might not tell you much yet.');
  if((id==='walt'||id==='rusty')&&msgWed()&&tod()<1140)h+=send('bingo','Bingo tonight?','6:00 PM at the Riv.');
  if(id==='hendersons'&&L[S.loc].side==='M')h+=send('mainland','Need anything from the mainland?','They’re retirees. They always need something.');
  h+=send('how','How’s it going?',M.inc[id]===dayKey()?'Answer their text: good for the friendship.':'Keeping in touch is good for a friendship.');
  h+=send('otw','On my way!')+send('late','Running late. Ferry’s a mess.')+send('thanks','Thanks again!');
  h+=`<p class="msg-foot">Each text uses a little battery.${pend?' One text at a time: wait for the reply.':''}</p>`;
  setTimeout(()=>{const b=document.querySelector('#phoneUI .ph-body'),t=document.querySelector('#phoneUI .msg-thread');if(b&&t)b.scrollTop=Math.max(0,t.offsetTop+t.offsetHeight-b.offsetTop-b.clientHeight*0.6)},0);
  return h}
definePhoneApp({id:'msg',name:'Messages',ic:'💬',builtin:true,order:10,badge:msgUnread,view:arg=>arg?msgView(arg):msgList()});
