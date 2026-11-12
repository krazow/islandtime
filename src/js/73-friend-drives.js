// ---- 🤝 a friend drives your second car across (1.22 gaps, optional) ----
// Text Sam or Walt (whichever is a friend): they take the car on the next sailing. You pay the car fare and owe them a favor.
// The car arrives at the far terminal. Only for a car parked at a ferry terminal on the other side of the water from you.
function vgFriend(){return ['sam','walt'].find(id=>S.friends&&S.friends[id])||null}
function vgCarRequest(c,id){
  const from=c.loc,to=from==='stDock'?'aiDock':'stDock',side=L[from].side,k=findNext(side,'drive',false),fare=fareCar();
  if(!k)return say('📱 No sailing in sight to put a car on.');
  money(-fare);S.stats.fares+=fare;friendPts(id,-1);
  const f=S.friends[id].name.split(',')[0];S.t+=5;phoneTick();
  VG().runs.push({id:c.id,from,to,abs:k.abs+(k.delay||0)+20,who:id,side,d:k.d,dep:k.dep});
  say(`📱 You text ${f}: “Any chance you could run the ${carShortName(c)} across?” ${f} sends a thumbs-up. It goes on the ${fmt(k.dep)} sailing. ${$(fare)} car fare, and you owe ${f} one.`);
  afterAction();
}
phoneOnTime(()=>{
  if(!S.vg||!S.vg.runs||!S.vg.runs.length)return;
  for(const r of S.vg.runs.slice()){
    if(S.t<r.abs)continue;
    if(r.d!=null){const sv=sailing(r.side,r.d,r.dep,'drive',false);   // that sailing got cancelled after they agreed: put it on the next one
      if(sv.cancel||sv.passenger){const k=findNext(r.side,'drive',false),f=S.friends[r.who]?S.friends[r.who].name.split(',')[0]:'Your friend';
        if(k){r.d=k.d;r.dep=k.dep;r.abs=k.abs+(k.delay||0)+20;say(`📱 ${f}: “The ${fmt(sv.dep)} didn’t run. I’ll bring the car on the ${fmt(k.dep)}.”`);continue}}}
    S.vg.runs=S.vg.runs.filter(x=>x!==r);
    const c=S.cars.find(c=>c.id===r.id);if(!c||c.loc!==r.from)continue;   // you moved it yourself
    c.loc=r.to;const f=S.friends[r.who]?S.friends[r.who].name.split(',')[0]:'Your friend';
    say(`🤝 ${f} parked your ${carShortName(c)} at the ${vgShort(r.to)} and texted: “Keys under the mat.”`)}
});
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(S.over||visitorOn())return a;
  const id=vgFriend();if(!id)return a;
  const side=L[S.loc].side,fare=fareCar(),fn=S.friends[id].name.split(',')[0];
  for(const c of S.cars){
    if(c===carHere()||(c.loc!=='stDock'&&c.loc!=='aiDock')||L[c.loc].side===side||VG().runs.some(r=>r.id===c.id))continue;
    const k=findNext(L[c.loc].side,'drive',true);
    a.push({cat:'ferry',ic:'📱',l:`Ask ${fn} to bring the ${carShortName(c)} across`,s:`${$(fare)} car fare plus a favor. ${k?'Goes on the '+fmt(k.dep)+' sailing':'No sailing in sight'}; it arrives at the ${vgShort(c.loc==='stDock'?'aiDock':'stDock')}.`,dis:!k||!phoneCan()||!canEssential(fare),fn:()=>vgCarRequest(c,id)})}
}catch(e){console.error(e)}return a}}
