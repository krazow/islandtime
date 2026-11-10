// ---- 🕶️ drug trade: only what gets noticed counts ----
// A deal itself costs no reputation. Each unlicensed deal (buy or sell) rolls "does anyone notice?":
//   p = 0.07 · tier weight · (1 + 0.18·heat) · (1 + 0.12·(units in hand − 1)) · crowd at this hour · daylight   (max 0.6)
// heat: per market, +1 per deal, halves every two days. If noticed, one witness is rolled from the market's mix:
//   cop      → the player gets the drug arrest (tier bail/hours) and the other party (an NPC on the island) is npcArrest'd with the tier's days
//   resident → ONLY the two people in the deal lose 15 reputation (player repAdd, NPC npcRepAdd public); the witness may post in the Island Group
//   stranger → nothing.  Legal weed at the licensed shop (MARKETS.dispensary.legal) never rolls.
const drugAbs=()=>dayKey()*1440+tod();
function heatNow(loc){const H=S.heat&&S.heat[loc];return H?H.h*Math.pow(0.5,Math.max(0,drugAbs()-H.at)/2880):0}
function heatAdd(loc,n){S.heat=S.heat||{};S.heat[loc]={h:heatNow(loc)+n,at:drugAbs()}}
function crowdF(loc){const m=tod(),sea=seasonId(),eve=m>=1020&&m<1320;let c;
  if(loc==='marina') c=0.7+(sea==='summer'?0.6:sea==='winter'?-0.2:0.15)+(eve?0.3:0)+(day()>=5?0.2:0);
  else if(loc==='school') c=0.45;else if(loc==='dale') c=0.6;
  else c=(MARKETS[loc].crowd||({ponders:0.9,hilltop:1}[loc]||0.8))*(m>=1320?0.8:1);
  return Math.max(0.3,c)}
function dayF(){const set={summer:1290,spring:1170,fall:1050,winter:990}[seasonId()]||1050;return tod()<set?1:0.6}
function noticeP(loc,g,dir){const G=GOODS[g],q=Math.min(6,Math.max(1,(S.cargo[g]||0)+(dir==='buy'?1:0)));
  return Math.min(0.6,0.07*G.w*(1+0.18*heatNow(loc))*(1+0.12*(q-1))*crowdF(loc)*dayF())}
const noticeHint=p=>p<0.08?'low':p<0.16?'medium':'high';
function drugHeatLine(loc){const h=heatNow(loc),mk=MARKETS[loc],c=crowdF(loc);
  return `<div style="font-size:12px;color:var(--mute);margin:0 2px 6px">📍 ${mk.spot}. Heat here: <b>${h<0.5?'cold':h<2?'warm':h<4?'hot':'burning'}</b> (${h.toFixed(1)}) · ${c>=1.1?'busy':c>=0.65?'some people around':'quiet'} · ${dayF()===1?'daylight':'after dark'}. A deal costs nothing by itself; being seen does.</div>`}
function drugDeal(g,dir,pr,p){
  const loc=S.loc,mk=MARKETS[loc],G=GOODS[g],island=L[loc].side==='I',spot=mk.spot,tx=`${G.ic} ${dir==='buy'?'Bought':'Sold'} 1 ${G.n.toLowerCase()} for ${$(dir==='buy'?pr.buy:pr.sell)} at ${spot}.`;
  heatAdd(loc,1);S.drugLast={loc,g,dir,p,kind:'none',cp:null};
  if(!(Math.random()<p)){say(tx+' Nobody seems to notice.');return afterAction()}
  const w=mk.cop+mk.res,r=Math.random()*(w+Math.max(0,1-w)),kind=r<mk.cop?'cop':r<w?'res':'str';S.drugLast.kind=kind;
  if(kind==='str'){say(tx+' Somebody glances over, shrugs and walks on.');return afterAction()}
  const cp=loc==='dale'?'dale':island?(npcPick({notJailed:true,not:['dale']})||{}).id||null:null;S.drugLast.cp=cp;
  const who=cp?npcName(cp):'the other party';
  if(kind==='res'){
    const post=Math.random()<0.6;repAdd(-15,`an islander saw you making a deal at ${spot}`);
    if(cp)npcRepAdd(cp,-15,`was seen making a deal at ${spot}`,{public:post});
    else if(post){S.npcg=S.npcg||[];S.npcg.unshift({d:dayKey(),id:'you',n:-15,txt:`Someone says they saw a deal at ${spot}. No names. Everybody has a guess.`});S.npcg=S.npcg.slice(0,12)}
    say(tx+` An islander you know by sight is standing right there. Nobody says anything. It will get around${post?', and somebody posts about it in the Island Group':''}.`);S.drugLast.post=post;return afterAction()}
  const pen=G.pen;if(cp)npcArrest(cp,`was arrested after a drug deal at ${spot}`,pen.days);
  return arrest(`at ${spot}`,false,{pen,txt:island?'A sheriff’s deputy on patrol turns into the lot with the lights already on.':'A patrol officer steps out of the dark and says the word everyone dreads: “Hands.”',cp:cp?`${npcCap(who)} is cuffed next to you and gets the same charge, the same bail and the same night in the same cell block.`:'The other party is cuffed next to you and gets the same charge.'});
}
