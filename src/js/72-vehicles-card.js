// ---- 🚗 Your vehicles (1.22 gaps): one card for every car and the boat; parked cars shown in travel; paid terminal parking ----
// The paid lot beside the Steilacoom ferry dock has been reported at $8 for 12 hours, cash only, with limited spaces: here it is a flat
// $8 for each car left at 'stDock' overnight (not the car you sleep in there). The Sunnyside launch lot is free, a game choice.
const PARK_FEE=8;
const VG=()=>{if(!S.vg)S.vg={tip:0,runs:[],paid:0,hint:0};return S.vg};
const vgShort=k=>L[k]?L[k].name.replace(' Ferry Terminal',' terminal').replace(' Ferry Landing',' landing').replace(/ \(Steilacoom\)/,''):'somewhere';
const vgIc=c=>c.diesel?'🛻':c.id==='isl'?'🚗':'🚙';
const vgBoatSide=()=>boatOwn()&&S.boat.at==='sunny'?'M':'I';
const vgBoatWhere=()=>{const a=S.boat.at;return a==='sunny'?'the Sunnyside launch':a==='home'?'home (on the trailer)':'the Riv marina'};
// is your boat waiting on the other side of the water from where you stand (a way home if you walk on)?
function boatWaitingFar(side){return boatOwn()&&!visitorOn()&&vgBoatSide()!==(side||L[S.loc].side)}
const vgCarsAt=k=>S.cars.filter(c=>c.loc===k);
// "🚙 your Corolla is here" for a destination
function parkedNote(k){
  const cs=vgCarsAt(k).filter(c=>k!==S.loc||c!==carHere());
  const t=cs.map(c=>`${vgIc(c)} your ${carShortName(c)} is here`);
  if(boatOwn()&&!visitorOn()&&((k==='sunny'&&S.boat.at==='sunny')||(k==='marina'&&S.boat.at==='marina')))t.push('🚤 your skiff is tied up here');
  if(k==='stDock'&&cs.length)t.push(`paid lot ${$(PARK_FEE)}/day`);
  return t.join(' · ');
}
// cars and the boat waiting on the far side (for the ferry: the other terminal; for the skiff: the other landing)
function farCars(side){return S.cars.filter(c=>L[c.loc]&&L[c.loc].side!==side&&(c.loc==='stDock'||c.loc==='aiDock'||c.loc==='sunny'||c.loc==='marina'))}
function vgDue(){
  const due=[];
  S.cars.forEach(c=>{const n=carShortName(c);
    if(carMech(c).spare==='on')due.push(`New tire for the ${n} ($${TIRE_PRICE})`);
    if(carBat(c)==='weak')due.push(`New battery for the ${n}`);
    if(c.fuel<1.5)due.push(`Gas for the ${n}`);
    if(c.loc==='stDock')due.push(`${n} in the paid lot: ${$(PARK_FEE)}/night`)});
  if(boatOwn()&&!visitorOn()){const B=S.boat;
    if(B.store==='slip'&&B.paidThru-dayKey()<=3)due.push(`Moorage ($${BOAT_SLIP}) ${B.paidThru-dayKey()<=0?'due now':'in '+(B.paidThru-dayKey())+' day'+(B.paidThru-dayKey()===1?'':'s')}`);
    if(B.cond<40)due.push('Service the outboard');if(B.fuel<1.3)due.push('Gas for the skiff')}
  return due;
}
function vehiclesHTML(){
  let h='<div class="vcards">';
  for(const c of S.cars){
    const m=carMech(c),here=c.loc===S.loc,pend=VG().runs.find(r=>r.id===c.id);
    const cls=c.fuel<1.5||m.bat==='weak'||m.spare==='on'?'bad':here?'good':'';
    h+=`<div class="vc ${cls}"><b>${vgIc(c)} ${esc(carShortName(c)==='car'?'Your car':c.name)}</b><div class="vcw">${pend?`🤝 on its way to the ${vgShort(pend.to)}`:here?'📍 here with you':'🅿️ '+esc(vgShort(c.loc))}${c.loc==='stDock'?` · paid lot ${$(PARK_FEE)}/night`:''}${garaged(c)?' · in the garage':''}</div>
      <div class="vct"><span>⛽ ${c.fuel}/${c.tank} gal ${c.diesel?'diesel':'gas'}</span><span class="${m.bat==='weak'?'bad':''}">🔋 ${m.bat==='weak'?'weak':'ok'}</span><span class="${m.spare==='on'?'bad':''}">🛞 ${m.spare==='on'?'on the spare':'good tires'}</span></div></div>`;
  }
  if(boatOwn()&&!visitorOn()){const B=S.boat;
    h+=`<div class="vc ${B.cond<40||B.fuel<1.3?'bad':''}"><b>🚤 Your skiff</b><div class="vcw">🅿️ ${esc(vgBoatWhere())} · ${B.store==='slip'?'in a slip':B.store==='trailer'?'on the trailer':'stored'}${B.store==='slip'?` · moorage paid through day ${B.paidThru-dayKey()<=0?'(due now)':'in '+(B.paidThru-dayKey())+' d'}`:''}</div>
      <div class="vct"><span>⛽ ${boatGal(B.fuel)}/${BOAT_TANK} gal</span><span>🔧 outboard ${B.cond>=70?'good':B.cond>=40?'rough':'ailing'} (${Math.round(B.cond)}%)</span></div></div>`}
  const due=vgDue();
  h+='</div>'+(due.length?`<div class="vdue"><b>Due:</b> ${due.map(esc).join(' · ')}</div>`:'<div class="vdue">Nothing due. Everything’s in order.</div>');
  h+=`<div class="vnote">🅿️ The paid lot at the Steilacoom terminal is ${$(PARK_FEE)} a night per car (cash, limited spaces). The Sunnyside launch lot is free.${boatOwn()&&!visitorOn()?' Boat commuters: park the beater at Sunnyside and skip the fee.':''}</div>`;
  return h;
}
window.VCARD=()=>{modal('🚗 Your vehicles',vehiclesHTML(),[{l:'OK',fn:()=>{}}])};
// the collapsible card in the Here tab, right under the car tags
{const _av=actView;actView=function(){
  const h=_av.apply(this,arguments);
  try{
    if(S.over)return h;
    const a=h.indexOf('<div><span class="tag');if(a<0)return h;
    const e=h.indexOf('</div>',a);if(e<0)return h;
    const n=vgDue().length,open=!!prefs().vcardOpen;
    const card=`<details class="go vcard" ${open?'open':''} ontoggle="setPref('vcardOpen',this.open)"><summary>🚗 Your vehicles (${S.cars.length+(boatOwn()&&!visitorOn()?1:0)})${n?` · <span class="upk-n">${n} to do</span>`:''}</summary>${vehiclesHTML()}</details>`;
    return h.slice(0,e+6)+card+h.slice(e+6);
  }catch(x){console.error(x);return h}
}}
// the map: a button for the card
{const _mv=mapView;mapView=function(){const h=_mv.apply(this,arguments);try{const i=h.lastIndexOf('</div>');return h.slice(0,i)+`<div class="chips" style="margin-top:6px"><button class="chip" onclick="VCARD()">🚗 Your vehicles</button></div>`+h.slice(i)}catch(e){return h}}}
// parked cars in the Go-somewhere list and the map's place card
{const _t=travelOpts;travelOpts=function(dest){const o=_t.apply(this,arguments);try{const n=parkedNote(dest);if(n&&o.length){const f=o.find(x=>x.s);if(f)f.s+=' · '+n;else o[0].s=n}}catch(e){}return o}}
{const _md=mapDetail;mapDetail=function(k){const h=_md.apply(this,arguments);try{const p=parkedNote(k);if(!p)return h;const i=h.lastIndexOf('</div>');return h.slice(0,i)+`<div class="small-note" style="flex-basis:100%;font-size:12.5px;color:var(--fir)">${esc(p)}</div>`+h.slice(i)}catch(e){return h}}}
// ferry and skiff options mention a car waiting at the far landing, and the terminal lot fee
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(S.over)return a;
  const side=L[S.loc].side,far=farCars(side).filter(c=>(c.loc==='stDock'||c.loc==='aiDock'));
  if(S.loc==='aiDock'||S.loc==='stDock'){
    const waits=far.length?` · your ${far.map(carShortName).join(' and ')} ${far.length>1?'are':'is'} waiting at the ${vgShort(far[0].loc)}${far.some(c=>c.loc==='stDock')?' ('+$(PARK_FEE)+'/night)':''}`:'';
    const lot=S.loc==='stDock'?` · overnight in the paid lot: ${$(PARK_FEE)} a car (cash)`:'';
    const bl=typeof backlogNext==='function'&&backlogNext(side)?' · ⚠️ boats are packed after the outage':'';
    a.forEach(x=>{if(!x.s||x.dis&&!/Walk|Drive/.test(x.l||''))return;
      if(/^Walk on the next sailing/.test(x.l))x.s+=(S.loc==='stDock'&&carHere()?lot:'')+(S.loc==='aiDock'?waits:'');
      else if(/^Drive on the next sailing/.test(x.l))x.s+=(S.loc==='aiDock'?` · the terminal lot is ${$(PARK_FEE)} a night if you leave it`:'')+bl;
      else if(/^Wait for the .* boat/.test(x.l)&&S.loc==='aiDock')x.s+=waits});
  }
  if(S.loc==='marina'||S.loc==='sunny'){
    a.forEach(x=>{if(!/^Take the skiff/.test(x.l||''))return;
      const dest=S.loc==='marina'?'sunny':'marina',cs=vgCarsAt(dest);
      if(cs.length)x.s+=` · your ${cs.map(carShortName).join(' and ')} ${cs.length>1?'are':'is'} parked at ${dest==='sunny'?'Sunnyside':'the marina'}`;
      else if(dest==='sunny'&&!S.cars.some(c=>c.loc==='sunny'))x.s+=' · Sunnyside parking is free'})
  }
}catch(e){console.error(e)}return a}}
// ---- tip for boat owners, once: the beater at the free Sunnyside lot ----
{const _r=render;render=function(){
  try{if(!S.over&&boatOwn()&&!visitorOn()&&!VG().tip&&L[S.loc].side==='M'){const b=S.cars.find(c=>c.id==='beat'&&c.loc==='stDock');
    if(b){VG().tip=1;say(`💡 Tip: you own a boat. Leave the beater at the free Sunnyside launch lot instead of the ${$(PARK_FEE)}-a-night terminal lot, then skiff across to the island.`)}}}catch(e){}
  return _r.apply(this,arguments)}}
// ---- paid parking: each car left at the terminal overnight ----
function parkFeeDue(where){
  if(S.over)return [];
  const sleeping=where==='terminal'&&S.loc==='stDock'?carHere():null;
  return S.cars.filter(c=>c.loc==='stDock'&&c!==sleeping);
}
{const _e=endDay;endDay=function(where){
  try{const cs=parkFeeDue(where);
    if(cs.length){const f=cs.length*PARK_FEE;money(-f);VG().paid=(VG().paid||0)+f;
      say(`🅿️ The terminal lot: ${$(PARK_FEE)} cash${cs.length>1?' each for '+cs.length+' cars':''} for the ${cs.map(carShortName).join(' and ')} left overnight (${$(f)}).`)}}catch(e){console.error(e)}
  return _e.apply(this,arguments)}}
// ---- 📈 the backlog after a ferry outage: the next 3 sailings are fuller ----
const BACKLOG_P=[0.75,0.6,0.45];
function backlogRank(side,abs){
  for(const b of S.week.b){
    if(abs<b.end)continue;let n=0;const d0=Math.floor(b.end/1440);
    for(let d=d0;d<=d0+2&&n<3;d++)for(const dep of deps(side,d)){
      const s=sailing(side,d,dep,'drive',false);if(s.abs<b.end||s.cancel||s.passenger)continue;
      if(s.abs===abs)return n;if(++n>=3)break}
  }
  return -1}
function backlogP(side,d,dep){const r=backlogRank(side,d*1440+dep);return r<0?0:BACKLOG_P[r]}
// the next sailing from this side, if it is one of the packed ones (only for outages you already know about)
function backlogNext(side){
  if(!S.week.b.some(b=>b.start<=S.t))return null;
  const k=findNext(side,'drive',true);if(!k)return null;
  const known=S.week.b.filter(b=>b.start<=S.t);
  for(const b of known){const r=backlogRank(side,k.abs);if(r>=0&&k.abs>=b.end)return {k,rank:r}}
  return null}
{const _fv=ferryView;ferryView=function(){
  const h=_fv.apply(this,arguments);
  try{
    const parts=['I','M'].map(s=>{const r=backlogNext(s);return r?`${s==='I'?'from the island':'from Steilacoom'}: the ${fmt(r.k.dep)}`:null}).filter(Boolean);
    if(!parts.length)return h;
    const note=`<p>📈 <b>Backlog after the outage:</b> the next 2–3 sailings run fuller (${parts.join('; ')} is the first). Cars are likelier to be left behind; walk-ons still fit.</p>`;
    const i=h.indexOf('<div class="sect">Fuel');return i<0?h:h.slice(0,i)+`<div class="rules">${note}</div>`+h.slice(i);
  }catch(e){console.error(e);return h}
}}
// ---- 👋 visitors at the terminal: drive on or walk on? (once per visit) ----
{const _r=render;render=function(){
  try{if(!S.over&&visitorOn()&&S.loc==='stDock'&&!VG().hint){const c=S.cars.find(c=>c.loc==='stDock'&&c.id==='isl');
    if(c){VG().hint=1;
      const walkers=Object.keys(L).filter(k=>L[k].side==='I'&&k!=='aiDock'&&k!=='vhome'&&!L[k].fun&&!destHidden(k)&&(dist('aiDock',k)||99)*4<=45).map(k=>L[k].name.replace(/^Anderson Island /,''));
      say(`💡 At the terminal: driving on costs ${$(fareCar())} each way with the car and the island is spread out (a few miles end to end). Walking on is ${$(typeof fareWalk==='function'?fareWalk():FARE_WALK)} and the car can wait in the paid lot (${$(PARK_FEE)} a night, cash, limited spaces). Without a car you can walk from the landing to ${walkers.length?walkers.slice(0,4).join(', '):'not much'}; the rest is too far to walk.`)}}}catch(e){}
  return _r.apply(this,arguments)}}
{const st=document.createElement('style');st.id='vgcss';st.textContent=`.vcards{display:grid;gap:8px;margin:6px 0}.vc{border:1.5px solid var(--line);border-radius:10px;background:#fff;padding:8px 10px;font-size:13px}.vc.bad{border-color:#c0562d}.vc.good{border-color:var(--fir)}.vc .vcw{color:var(--mute);margin:2px 0 4px}.vct{display:flex;flex-wrap:wrap;gap:4px 12px}.vct .bad{color:#c0562d;font-weight:700}.vdue,.vnote{font-size:12.5px;margin:6px 2px;color:var(--mute)}.vdue b{color:var(--ink,#222)}`;document.head.appendChild(st)}
