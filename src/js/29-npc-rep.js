// ---- 🤲 island reputation for every character (named islanders and background neighbors) ----
// The player's rules apply to everyone: a score −100..+100 that only DROPS for deliberate bad acts (arrest −35, gas-can bust −20,
// Dale runs −5, storm gouging −10) and a neglected house (a week of slump −5), RISES with good deeds (+5), and a bad name heals +5 every 14 days.
// Grudges between islanders fade after 28 days. State: S.npc = {id: record} (lazy, old saves fine), S.npcg = public-deed gossip (last 12).
// record: {id,name,kind:'named'|'bg',rep,known:[{d,n,why}],enemies:[ids],es:{id:since},homeLow,healAt,jailUntil:-1,trait}
// ---- API (for later modules) ----
//  NPC()                        all records {id:rec}, created on first use
//  npcGet(id)                   one record (or null)
//  npcRepAdd(id,n,why,opt)      change rep (clamped); returns the real change. opt.notes (array) / opt.public (feeds the gossip) / opt.quiet
//  npcArrest(id,why,days=2)     rep −35, jailed until dayKey()+days, public. Dale jailed = Dale’s Place closed, no gas delivery
//  npcTier(id)                  the REP_TIERS entry for that islander;  npcIc(id) its icon;  npcName(id) display name
//  npcPick(filter)              random record. filter: {kind,trait,notJailed,minRep,maxRep,not:[ids],weighted:true (better-liked more likely)}
//  npcJailed(id)                true while jailUntil>=today;  npcJailTxt(id) “Dale’s in county jail until Thursday.”
//  npcEnemy(a,b)                make a grudge pair (fades after 28 days)
const NPC_ROSTER=[ // id,name,kind,trait,start rep
  ['marta','Marta','named','helper',25],['ken','Big Ken','named','helper',20],['lorraine','Lorraine','named','quiet',30],['dev','Dev','named','quiet',10],
  ['dale','Dale','named','dale',-20],['fred','Pajama Fred','named','fred',-5],['gus','Gus','named','rough',5],['corey','Corey the deckhand','named','quiet',10],
  ['walt','Walt','named','helper',50],['sam','Sam','named','quiet',15],['hendersons','the Hendersons','named','helper',50],['bev','Bev','named','helper',25],['rusty','Rusty','named','rough',0],
  ['bg1','Sandy, over on the bay side','bg','quiet',10],['bg2','the Okafors','bg','helper',20],['bg3','Pete with the blue truck','bg','rough',0],['bg4','Janelle from the pancake breakfast','bg','helper',25],
  ['bg5','the couple with the llamas','bg','quiet',10],['bg6','Ruth, who runs the book swap','bg','helper',30],['bg7','Arlo','bg','rough',-5],
  ['bg8','Barb, who gets tagged a lot','bg','quiet',5],['bg9','the Whitfields at the end of the road','bg','quiet',0],['bg10','Tom from the fire hall','bg','helper',35],['bg11','Dolores at the fruit stand','bg','quiet',15],['bg12','Nick from the ferry line','bg','rough',0]];
// per-night odds: g good deed, h neglect slump starts, run/bust/arr/gouge deliberate bad acts (shady only)
const NPC_TRAIT={helper:{g:.05,h:.004},quiet:{g:.022,h:.004},rough:{g:.02,h:.03},dale:{g:.012,h:.004,run:.08,bust:.006,arr:.002,gouge:.35},fred:{g:.012,h:.01,run:.03,bust:.001,arr:.0004,gouge:0}};
const NPC_GOOD=['helped a neighbor haul firewood','pitched in at the Lake Josephine cleanup','pledged to the co-op','dropped a casserole off at a neighbor’s','kept the book swap going all weekend','pulled a stranded car out of the ditch','ran the Legion bake sale table'];
function NPC(){if(!S.npc)S.npc={};const N=S.npc;
  for(const r of NPC_ROSTER)if(!N[r[0]])N[r[0]]={id:r[0],name:r[1],kind:r[2],rep:r[4],known:[],enemies:[],es:{},homeLow:0,healAt:dayKey(),jailUntil:-1,trait:r[3]};return N}
const npcGet=id=>NPC()[id]||null;
const npcName=id=>{const n=npcGet(id);return n?n.name:String(id)};
const npcCap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const npcTier=id=>repTier(npcGet(id)?npcGet(id).rep:0);
const npcIc=id=>{try{return npcGet(id)?npcTier(id).ic+' ':''}catch(e){return ''}};
const npcJailed=id=>{const n=npcGet(id);return !!n&&n.jailUntil>=0&&n.jailUntil>=dayKey()};
const npcJailTxt=id=>{const n=npcGet(id);return `${npcCap(n.name)}${n.name==='Dale'?'’s':' is'} in county jail until ${DAYS[n.jailUntil%7]}.`.replace('Dale’s in','Dale’s in')};
function npcRepAdd(id,n,why,opt){const r=npcGet(id);if(!r||!n)return 0;opt=opt||{};const r0=r.rep,t0=repTier(r0);
  r.rep=Math.max(REP_MIN,Math.min(REP_MAX,r0+n));const d=r.rep-r0;if(!d)return 0;
  if(why){r.known.unshift({d:dayKey(),n:d,why});r.known=r.known.slice(0,6)}
  if(opt.public&&why){if(!S.npcg)S.npcg=[];S.npcg.unshift({d:dayKey(),id,n:d,txt:`${npcCap(r.name)} ${why}`});S.npcg=S.npcg.slice(0,12)}
  const t1=repTier(r.rep);if(opt.notes&&!opt.quiet&&t1!==t0)opt.notes.push(`${t1.ic} ${npcCap(r.name)} is now ${t1.n.toLowerCase()} around the island.`);
  return d}
function npcEnemy(a,b){const A=npcGet(a),B=npcGet(b);if(!A||!B||a===b||A.enemies.length>=2||B.enemies.length>=2||A.enemies.includes(b))return false;
  A.enemies.push(b);B.enemies.push(a);A.es[b]=B.es[a]=dayKey();return true}
function npcArrest(id,why,days){const r=npcGet(id);if(!r)return 0;r.jailUntil=dayKey()+(days==null?2:days);r.homeLow=0;
  return npcRepAdd(id,-35,why||'got arrested',{public:true})}
function npcPick(f){f=f||{};const N=NPC();let a=Object.values(N).filter(r=>(!f.kind||r.kind===f.kind)&&(!f.trait||r.trait===f.trait)&&!(f.notJailed&&npcJailed(r.id))&&(f.minRep==null||r.rep>=f.minRep)&&(f.maxRep==null||r.rep<=f.maxRep)&&!(f.not&&f.not.includes(r.id)));
  if(!a.length)return null;if(!f.weighted)return pick(a);const w=a.map(r=>Math.max(1,r.rep+40));let x=Math.random()*w.reduce((s,v)=>s+v,0);for(let i=0;i<a.length;i++){x-=w[i];if(x<0)return a[i]}return a[a.length-1]}

// ---- nightly: the same rules for everyone ----
function npcNight(where,notes){const N=NPC(),dk=dayKey(),storm=typeof storyOn==='function'&&storyOn()&&S.week&&S.week.storm&&typeof stormNight==='function'&&stormNight(day());
  const bad=(r,n,why)=>{npcRepAdd(r.id,n,why,{public:true});if(Math.random()<0.2){const o=npcPick({notJailed:true,not:[r.id]});if(o&&npcEnemy(r.id,o.id)&&Math.random()<0.5)notes.push(`🗣️ Word is ${r.name} and ${o.name} aren’t speaking.`)}};
  for(const r of Object.values(N)){const T=NPC_TRAIT[r.trait]||NPC_TRAIT.quiet;
    if(r.jailUntil>=0&&r.jailUntil<dk){r.jailUntil=-1;if(r.id==='dale')notes.push('🛢️ Dale’s porch light is back on. He’s home from county jail, and not saying where he’s been.')}
    if(npcJailed(r.id))continue;
    if(r.rep<0){if(dk-r.healAt>=14){r.healAt=dk;npcRepAdd(r.id,5,'is slowly being forgiven')}}else r.healAt=dk;
    for(const o of r.enemies.slice())if(dk-(r.es[o]||0)>=28){r.enemies=r.enemies.filter(x=>x!==o);delete r.es[o]}
    // a slump: the house goes to seed for a week
    if(r.homeLow>0){if(++r.homeLow>7){r.homeLow=0;bad(r,-5,'let the house go and the neighbors are talking')}}else if(Math.random()<T.h)r.homeLow=1;
    // good deeds get rarer as a good name grows (nobody runs away to +100)
    if(Math.random()<T.g*(1-Math.max(0,r.rep)/90))npcRepAdd(r.id,5,pick(NPC_GOOD),{public:true});
    if(T.run){if(Math.random()<T.run)bad(r,-5,r.id==='dale'?'ran a load for Dale’s side business and got talked about':'was caught pocketing the tip jar at bingo');
      if(storm&&Math.random()<T.gouge)bad(r,-10,'sold gas at storm prices');
      if(Math.random()<T.bust)bad(r,-20,'was busted with a gas can at the ferry');
      if(Math.random()<T.arr){npcArrest(r.id,'was arrested: it’s in the sheriff’s blotter',2);notes.push(r.id==='dale'?`🚔 The sheriff’s boat came for Dale. ${npcJailTxt('dale')}`:`🚔 ${r.name} was arrested. It’s all over the group.`)}}}
}
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up(where,notes,d);try{npcNight(where,notes)}catch(e){console.error(e)}return r}}

// ---- what the player sees ----
// Dale’s Place is closed while he’s in jail
{const h=L.dale.hours;L.dale.hours=function(d){return npcJailed('dale')?null:h(d)}}
{const _a=actions;actions=function(){const a=_a();try{if(S.loc==='dale'&&npcJailed('dale')){const i=a.findIndex(x=>/Closed right now|porch light|isn’t answering/.test(x.l));const row={ic:'🚔',l:'Dale’s Place is closed',s:npcJailTxt('dale'),dis:true};if(i>=0)a[i]=row;else a.push(row)}}catch(e){console.error(e)}return a}}
// jailed islanders don’t answer texts
{const _fa=phoneFriendAvail;phoneFriendAvail=function(id){return npcJailed(id)?'busy':_fa(id)}}
// who shows up for a help post: better-liked islanders answer more, jailed ones can’t
const npcHelper=()=>npcPick({notJailed:true,weighted:true});
{const _pr=postReplies;postReplies=function(j){const n=S.log.length,r=_pr(j);try{const h=npcHelper();if(h){const ph=`A neighbor from ${COMM_NAME}`,nm=npcCap(h.name);
  for(let i=n;i<S.log.length;i++)if(S.log[i].s.includes(ph)){S.log[i].s=S.log[i].s.replace(ph,nm);npcRepAdd(h.id,5,'helped a neighbor who posted in the community group',{public:true})}}}catch(e){console.error(e)}return r}}
// porch gifts come from people who like you and are well liked
{const _g=repGiver;repGiver=function(){const h=Math.random()<0.7&&npcPick({notJailed:true,minRep:20,weighted:true});return h?h.name:_g()}}
// the group app: island gossip
{const g=phoneApp('group');if(g){const v=g.view;g.view=function(arg){let h=v.call(this,arg);try{const G=(S.npcg||[]).slice(0,6);
  if(G.length)h+=`<div class="ph-sub">Island gossip</div>`+G.map(x=>`<div class="ph-grp"><small>${x.n>0?'👍':'👎'}</small>${esc(x.txt)}</div>`).join('')}catch(e){console.error(e)}return h}}}

// ---- story mode: day stamps follow the chapters; the epilogue names the best and worst name on the island ----
function npcRebase(){if(!S.npc)return;const sh=storyShift;for(const r of Object.values(S.npc)){r.healAt=dayKey();r.homeLow=0;r.jailUntil=r.jailUntil>=0?Math.max(-1,sh(r.jailUntil)):-1;
  r.known.forEach(k=>{k.d=sh(k.d)});for(const o in r.es)r.es[o]=sh(r.es[o])}(S.npcg||[]).forEach(x=>{x.d=sh(x.d)})}
if(typeof storyHooks!=='undefined')storyHooks.push({id:'npcrep',chapterStart(){npcRebase()},
  ending(){const a=Object.values(NPC()).sort((x,y)=>y.rep-x.rep),b=a[0],w=a[a.length-1],l=[`${npcCap(b.name)} ended the year the best-liked person on the island (${npcTier(b.id).n}).`];
    if(w.rep<0)l[0]+=` ${npcCap(w.name)} ended it the least (${npcTier(w.id).n}); people still lower their voices about it at the Riv.`;return l}});
