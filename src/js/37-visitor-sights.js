// ---- 🧳 visitor mode: sights, scoring and visitor reputation (see 36-visitor.js for the shared contract) ----
// Everything here does nothing unless visitorOn(). New island places (farm, andys, jacobs) live in L all the time, but their
// `side` is a getter that is 'X' outside a visit, so the resident game never lists them as destinations.
// Extra visit state (lazy, on VS()): photoQ{id:1|2} · tips{id:true} · repDone{key:true} · repLog[]
L.farm={name:'Johnson Farm museum',ic:'🚜',desc:'Anderson Island Historical Society. The old Johnson farmstead: barns, tools, a century of island life. Weekends 1–4 PM',
  get side(){return visitorOn()?'I':'X'},hours:d=>d%7>=5?[780,960]:null};
L.andys={name:'Andy’s Wild Wood Park',ic:'🌳',desc:'Quiet forest trails, cedars and ferns. Open dawn to dusk',
  get side(){return visitorOn()?'I':'X'},hours:()=>[360,1230]};
L.jacobs={name:'Jacobs Point Park',ic:'🌊',desc:'A beach, a point, and a trail through the madronas. Open dawn to dusk',
  get side(){return visitorOn()?'I':'X'},hours:()=>[360,1230]};
DI.farm={home:6,aiDock:8,store:3,lake:5,school:2,legion:5,food:7,marina:6};
DI.andys={home:6,aiDock:11,store:4,lake:4,school:3,legion:6,food:8,marina:7,farm:4};
DI.jacobs={home:9,aiDock:8,store:8,lake:10,school:9,legion:6,food:7,marina:7,farm:9,andys:8};
if(typeof TILE_META!=='undefined')Object.assign(TILE_META,{v_wave:['👋','An island wave','info'],v_lane:['🚗','One-lane road','info'],v_landing:['🅿️','Ferry landing parking','info'],
  v_litter:['🗑️','Trash at the trailhead','info'],v_helper:['🤝','A neighbor helps out','good'],v_cold:['🫥','Cold shoulder','bad']});

// ---- visitor reputation, −100..100 (VS().rep) ----
const VREP_MIN=-100,VREP_MAX=100;
function vTier(r){r=r==null?(VS()?VS().rep:0):r;return r>=40?['🤝','Welcome back']:r>=10?['🙂','Friendly face']:r>-10?['🧳','Just visiting']:r>-40?['😒','That tourist']:['🚫','Don’t come back']}
function vrepAdd(n,why){if(!visitorOn()||!n)return 0;const v=VS(),r0=v.rep;v.rep=Math.max(VREP_MIN,Math.min(VREP_MAX,r0+n));const d=v.rep-r0;if(!d)return 0;
  (v.repLog=v.repLog||[]).unshift({d:day(),n:d,why});v.repLog=v.repLog.slice(0,8);
  say(`${d>0?'🤲':'🗣️'} Island reputation ${d>0?'+':''}${d}${why?`: ${why}`:''}.`);return d}
// a "buy local" style bonus, once per day per kind
function vrepOnce(key,n,why){const v=VS(),k=key+'@'+day();v.repDone=v.repDone||{};if(v.repDone[k])return 0;v.repDone[k]=true;return vrepAdd(n,why)}
const vSeenN=()=>{const v=VS();return v?VSIGHTS.filter(s=>v.seen[s.id]!==undefined).length:0};
function vSeen(id){const v=VS();if(v&&v.seen[id]===undefined){v.seen[id]=day();const s=VSIGHTS.find(x=>x.id===id);if(s)say(`✅ Sight seen: <b>${s.ic} ${s.n}</b> (${vSeenN()}/${VSIGHTS.length}).`)}}

// ---- sightseeing actions ----
const V_LOOK_BY_LOOKING={lake:1,farm:1,andys:1,jacobs:1}; // the others are "seen" by dinner / a Legion event
const V_PHOTO={ // when the light is best
  lake:{ok:m=>m>=360&&m<600,why:'an eagle on the dead snag over the water, in the early light',tip:'Eagles hunt the lake in the morning.'},
  jacobs:{ok:m=>m>=1020,why:'the sun going down behind the Olympics, the whole point glowing',tip:'Go out on the point near sunset.'},
  andys:{ok:m=>m>=540&&m<780,why:'sunbeams slanting down through the cedars',tip:'Late morning the light comes straight down through the firs.'},
  farm:{ok:()=>true,why:'the old barn in the afternoon sun',tip:''},
  riv:{ok:m=>m>=1020,why:'the marina lights coming on',tip:''},
  legion:{ok:()=>true,why:'the flagpole and the hall',tip:''}};
const V_LOOK={lake:'You sit on the dock. Ripples, firs, a kingfisher rattling past. Nothing needs you.',farm:'You wander the barns: hand tools, a cream separator, black-and-white photos of the first ferry. A volunteer tells you which cow was famous.',
  andys:'The trail is soft with needles and quiet as a church. A banana slug the size of a hot dog crosses in front of you.',jacobs:'You walk the beach to the end of the point. Seals on the rocks, Mount Rainier floating over the water.',
  food:'You read every license plate nailed to the Riv’s walls.',legion:'Flags, a wall of photos, a coffee maker the size of a small engine.'};
function vSightHere(){return VSIGHTS.find(s=>s.loc===S.loc)}
function vLook(s){const v=VS(),first=v.seen[s.id]===undefined||v.lookDay&&v.lookDay[s.id]!==day();v.lookDay=v.lookDay||{};v.lookDay[s.id]=day();
  S.t+=30;phoneTick();adj('stress',first?-5:-2);say(`${s.ic} ${V_LOOK[s.loc]||'You take it in.'}`);if(V_LOOK_BY_LOOKING[s.id])vSeen(s.id);afterAction()}
function vPhoto(s){const v=VS(),P=V_PHOTO[s.id],m=tod(),great=P.ok(m)||!!(v.tips&&v.tips[s.id]);
  S.t+=10;v.photos[s.id]=day();v.photoQ=v.photoQ||{};v.photoQ[s.id]=great?2:1;adj('stress',-2);
  say(great?`📸 You get it: ${P.why}. That one’s going on the fridge.`:`📸 A fine photo of ${s.n}. ${P.tip?'(Locals say: '+P.tip.toLowerCase()+')':'Not bad.'}`);
  if(V_LOOK_BY_LOOKING[s.id])vSeen(s.id);afterAction()}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);if(!visitorOn())return a;try{
  const v=VS(),loc=S.loc,s=vSightHere(),m=tod();
  if(s&&(!L[loc].hours||isOpen(loc))){
    a.push({ic:s.ic,l:'Look around',s:`30 min. Stress −5.${V_LOOK_BY_LOOKING[s.id]&&v.seen[s.id]===undefined?' Counts as a sight.':''}`,cat:'here',fn:()=>vLook(s)});
    const taken=v.photos[s.id]!==undefined,P=V_PHOTO[s.id];
    a.push({ic:'📸',l:taken?'Photo taken':'Take a photo',s:taken?'One photo per sight.':`10 min.${P.tip&&m>=0?' Light matters here.':''}`,cat:'here',dis:taken,fn:()=>vPhoto(s)});}
  if(loc==='food'){const t=a.find(x=>/^Takeout dinner/.test(x.l||''));
    if(t){t.l='Dinner at the Riv — $27';const f=t.fn;if(f)t.fn=()=>{vSeen('riv');vrepOnce('riv',2,'ate at the Riv');f()}}}
  if(loc==='legion'){const seen=v.seen.legion!==undefined;
    if(m>=540&&m<960)a.push({ic:'☕',l:'Coffee with the veterans — $3',s:seen?'Always room for one more.':'30 min. Counts as a sight. Stress −4.',cat:'here',dis:S.money<3,fn:()=>{money(-3);S.t+=30;phoneTick();adj('stress',-4);vSeen('legion');
      vrepOnce('legion',2,'chatted with the Legion regulars');say('☕ A man in a Legion cap pours you a cup and asks where you’re visiting from. You’re there forty minutes. The coffee is terrible and you’ll miss it.');afterAction()}});}
  if(loc==='store')a.push({ic:'🪧',l:'Buy something at the swap board — $6',s:'Honey, jam or a jar of pickled beans. 15 min. Buying local.',cat:'trade',dis:S.money<6,fn:()=>{money(-6);S.t+=15;adj('stress',-2);vrepOnce('swap',2,'bought from the swap board');say('🪧 You leave six dollars in the coffee can and take a jar of blackberry jam. The honor system works here.');afterAction()}});
  }catch(e){console.error(e)}return a}}
// Legion events (bazaar / Veterans Day, which already live in 05-island-events.js) count as the Legion sight and as buying local
{const _f=afterAction;afterAction=function(){try{if(visitorOn()){const v=VS(),C=S.cal||{},k=dayKey();
  if(C.bazaar===k&&v.seen.legion===undefined){vSeen('legion');vrepOnce('bazaar',2,'supported the Legion bazaar')}
  if(C.vet===k&&v.seen.legion===undefined){vSeen('legion');vrepOnce('vet',2,'stood with the Legion')}}}catch(e){console.error(e)}return _f.apply(this,arguments)}}
{const _b=playBingo;playBingo=function(){if(visitorOn()){try{vSeen('legion');vrepOnce('bingo',2,'played Legion bingo')}catch(e){}}return _b.apply(this,arguments)}}

// ---- random visit events (all deliberate-choice reputation; bad luck never costs reputation) ----
const vNeighbor=()=>{try{const n=npcPick({notJailed:true});return n&&n.name?n.name:'A neighbor'}catch(e){return 'A neighbor'}};
const vOn=(extra)=>ctx=>visitorOn()&&!(S.over)&&(!extra||extra(ctx));
defEvent({id:'v_wave',hook:'arrive',priority:1,max:4,cooldown:1,chance:0.12,cond:vOn(ctx=>!!carHere()&&ctx.at!=='aiDock'),
  run(){modal('👋 The island wave','<p>A pickup comes the other way on the narrow road. The driver lifts two fingers off the wheel. Everybody out here does it.</p>',[
    {l:'Wave back',s:'Reputation +1.',fn:()=>{vrepAdd(1,'waved back like a local');say('👋 You lift two fingers. The driver nods. You feel unreasonably accepted.')}},
    {l:'Just keep driving',fn:()=>say('You keep your eyes on the road. The pickup disappears in the mirror.')}])}});
defEvent({id:'v_lane',hook:'arrive',priority:1,max:3,cooldown:1,chance:0.1,cond:vOn(ctx=>!!carHere()&&ctx.at!=='aiDock'),
  run(){modal('🚗 One-lane stretch','<p>Gravel road, ditch on both sides, and a delivery truck coming the other way. There’s a wide spot right behind you.</p>',[
    {l:'Back up and let them pass',s:'2 min. Reputation +2.',fn:()=>{S.t+=2;vrepAdd(2,'let the truck by');say('🚚 The driver gives you the wave and a thumbs-up.')}},
    {l:'Hold your ground',s:'Reputation −2.',fn:()=>{vrepAdd(-2,'blocked a delivery truck');say('🚚 The truck driver backs up forty yards without a word. You’ll hear about it at the Riv.')}}])}});
defEvent({id:'v_landing',hook:'arrive',priority:2,max:2,cooldown:1,chance:0.25,cond:vOn(ctx=>ctx.at==='aiDock'&&!!carHere()),
  run(){modal('🅿️ At the ferry landing','<p>The loading lane is empty for the moment, and the lot is a few steps farther. A deckhand is watching the lane.</p>',[
    {l:'Park in the lot',s:'Reputation +1.',fn:()=>{S.t+=4;vrepAdd(1,'parked in the lot');say('You park in the lot and walk down. The deckhand nods.')}},
    {l:'Leave it in the ferry lane while you run to the restroom',s:'Saves 4 minutes. Reputation −4.',fn:()=>{vrepAdd(-4,'blocked the ferry lane');say('📣 The deckhand’s voice over the speaker, by plate number. Fifty people are now looking at your car.')}}])}});
defEvent({id:'v_litter',hook:'arrive',priority:1,max:3,cooldown:1,chance:0.2,cond:vOn(ctx=>['lake','andys','jacobs'].includes(ctx.at)),
  run(){modal('🗑️ Trash','<p>You’re done with your snack. There is no bin here: it’s a pack-it-out kind of place. A paper bag sits in your hand. A few old wrappers lie by the trailhead sign.</p>',[
    {l:'Pack it out (and the old wrappers)',s:'5 min. Reputation +2.',fn:()=>{S.t+=5;vrepAdd(2,'packed out trash');say('🗑️ You carry a stranger’s wrapper and your own bag back to the cabin. The trail looks better for it.')}},
    {l:'Leave the bag behind a log',s:'Reputation −3.',fn:()=>{vrepAdd(-3,'littered at the trailhead');say('🗑️ The bag is behind the log. You can feel it behind you all the way back to the car.')}}])}});
// good rep: islanders help (a tip about a sight, or a ride). Bad rep: they look away.
defEvent({id:'v_helper',hook:'arrive',priority:2,max:3,cooldown:1,cond:vOn(()=>VS().rep>=10),chance:()=>Math.min(0.4,0.05+VS().rep/100*0.4),
  run(){const v=VS(),who=vNeighbor(),cand=['lake','jacobs','andys'].filter(id=>!(v.tips&&v.tips[id])&&v.photos[id]===undefined);
    const tip=cand.length?pick(cand):null,btns=[];
    if(S.loc!=='aiDock'&&S.cars&&!carHere())btns.push({l:'Accept a ride to the ferry landing',s:`About ${Math.max(3,Math.ceil((dist(S.loc,'aiDock')||8)/2))} minutes.`,fn:()=>{S.t+=Math.max(3,Math.ceil((dist(S.loc,'aiDock')||8)/2));S.loc='aiDock';say(`🚙 ${who} drops you at the ferry landing and refuses gas money.`)}});
    if(tip)btns.unshift({l:'Ask what not to miss',fn:()=>{v.tips=v.tips||{};v.tips[tip]=true;say(`🗣️ ${who}: “${V_PHOTO[tip].tip||'Worth a look.'}” You write it on your hand. (A better photo there.)`)}});
    btns.push({l:'Thanks, just looking around',fn:()=>{}});
    modal('🤝 A neighbor stops',`<p>${who} slows down and rolls the window down. “You’re the one staying at the rental? You need anything?”</p>`,btns)}});
defEvent({id:'v_cold',hook:'arrive',priority:1,max:2,cooldown:2,chance:0.25,cond:vOn(()=>VS().rep<=-30),
  run(){adj('stress',3);say('🫥 A woman at the pullout sees your plates and looks at the trees. Nobody offers directions today. Word travels fast on an island of 1,000 people.')}});

// ---- scoring: the end screen calls visitScore() ----
function visitorGrade(sc){
  if(sc>=1300)return ['A','Honorary Islander','You saw the island, made the boat, and left it nicer. Somebody at the Riv will remember your name.'];
  if(sc>=1000)return ['B','Welcome Back Anytime','A good visit. The deckhands recognize you now.'];
  if(sc>=700)return ['C','Pleasant Day Out','You saw some of it. The island will be here next time.'];
  if(sc>=400)return ['D','Mostly Ferry Line','You spent a lot of the visit waiting for something.'];
  return ['F','Never Again (Until Summer)','The island is beautiful. You’ll be back. On a weekday.'];}
function visitScore(){
  const v=VS();if(!v)return {score:0,grade:'F',title:'',lines:[]};
  const seen=vSeenN(),photos=VSIGHTS.filter(s=>v.photos[s.id]!==undefined).length,great=VSIGHTS.filter(s=>v.photoQ&&v.photoQ[s.id]===2&&v.photos[s.id]!==undefined).length;
  const pSeen=seen*100,pPhoto=photos*40+great*30,pMoney=Math.round(Math.max(-200,Math.min(400,S.money))*0.75),pRep=Math.round(v.rep*3);
  const pBoat=v.result==='home'?400:v.result==='missed'?-250:0;
  const score=pSeen+pPhoto+pMoney+pRep+pBoat,g=visitorGrade(score),t=vTier(v.rep),sg=n=>(n>=0?'+':'−')+Math.abs(n);
  const lines=[`🗺️ Sights seen: ${seen}/${VSIGHTS.length} (${sg(pSeen)})`,`📸 Photos: ${photos}, ${great} at the right moment (${sg(pPhoto)})`,
    `💵 Money left: ${S.money<0?'−':''}$${Math.abs(Math.round(S.money))} (${sg(pMoney)})`,`${t[0]} Island reputation: ${t[1]}, ${v.rep>0?'+':''}${v.rep} (${sg(pRep)})`];
  lines.push(v.result==='home'?`⛴️ Made the last boat home (${sg(pBoat)})`:v.result==='missed'?`⛴️ Missed the last boat (${sg(pBoat)})`:'⛴️ Ferry: no result yet (+0)');
  return {score,grade:g[0],title:g[1],blurb:g[2],lines,parts:{seen:pSeen,photos:pPhoto,money:pMoney,rep:pRep,boat:pBoat}};
}
