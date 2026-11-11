// ---- 🗺️ an island map you can tap (50-map.js) ----
// A drawn map of Anderson Island and of the mainland, as an alternative to the "Go somewhere" list. It wraps actView(): the list stays
// (hidden) and the player's choice is remembered with setPref('mapView'). Tapping a place shows its travel options (travelOpts) and goes there.
// MAPI = island positions (400x340 map), mainland positions come from MP (≈ miles, Steilacoom terminal [0,0]).
const MAPI={aiDock:[326,78],store:[272,122],lake:[240,152],home:[186,102],school:[160,152],food:[100,156],marina:[78,202],legion:[236,204],
  dale:[150,238],farm:[292,222],andys:[214,264],jacobs:[96,272]};
const MAPW=400,MAPH={I:340,M:380};
let MAPSEL=null,MAPSIDE=null,MAPSIDE_FOR=null;
const mapSide=()=>{const cur=L[S.loc].side;if(MAPSIDE_FOR!==cur){MAPSIDE=null;MAPSIDE_FOR=cur}return MAPSIDE||cur};
const mpx=x=>20+(x+5.5)*19, mpy=y=>30+(9-y)*20;
function mapMainPos(k){
  if(MP[k])return [mpx(MP[k][0]),mpy(MP[k][1])];
  const city={seattle:[12.5,9],tacoma:[11,5.6],olympia:[-3,-6.6]};
  let h=[11,5.6];try{h=city[VS().home]||h}catch(e){}
  if(k==='vhome')return [mpx(h[0]),mpy(h[1])];
  if(k==='rwork')return [mpx(h[0]+1.2),mpy(h[1]-0.9)];
  if(k==='rmarket')return [mpx(h[0]-1.2),mpy(h[1]-0.9)];
  let n=0;for(const c of k)n=(n*31+c.charCodeAt(0))%97;return [mpx(2+n%9),mpy(-1-(n%5))];
}
function mapPlaces(side){
  return Object.keys(L).filter(k=>L[k].side===side&&(k!=='vhome'||visitorOn()));
}
// push overlapping markers apart (deterministic), keeping them near where they belong
function mapSpread(pts,min,w,h){
  const ks=Object.keys(pts),o={};ks.forEach(k=>o[k]=pts[k].slice());
  for(let it=0;it<260;it++){
    for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){
      const a=pts[ks[i]],b=pts[ks[j]];let dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);
      if(d>=min)continue;if(d<0.01){dx=(i%2?1:-1);dy=(j%3-1)||1;d=1.4}
      const p=(min-d)/2,ux=dx/d,uy=dy/d;a[0]-=ux*p;a[1]-=uy*p;b[0]+=ux*p;b[1]+=uy*p}
    ks.forEach(k=>{const p=pts[k];p[0]+=(o[k][0]-p[0])*0.02;p[1]+=(o[k][1]-p[1])*0.02;p[0]=Math.max(24,Math.min(w-24,p[0]));p[1]=Math.max(26,Math.min(h-26,p[1]))})}
  return pts;
}
function mapPositions(side){
  const pts={},ks=mapPlaces(side),extra=[[60,40],[110,70],[280,60],[190,40]];let e=0;
  ks.forEach(k=>{pts[k]=side==='I'?(MAPI[k]?MAPI[k].slice():extra[e++%extra.length].slice()):mapMainPos(k)});
  return mapSpread(pts,side==='I'?34:32,MAPW,MAPH[side]);
}
// the boat on the water right now, from the timetable: {side it left, f:0..1 across, dep}
function mapFerry(){
  const d=day();
  for(const side of ['I','M'])for(const dep of deps(side,d)){
    const s=sailing(side,d,dep,'walk',true);if(s.cancel)continue;
    const st=s.abs+(s.delay||0),dur=20+(s.ketron?10:0);
    if(S.t>=st&&S.t<st+dur)return {side,f:(S.t-st)/dur,dep};
  }
  return null;
}
function mapSVG(side,pts,fer,out){
  const H=MAPH[side],water='#2c5f6e',land='#d9d3bc',tree='#2f5d4a';
  let s=`<svg class="mapsvg" viewBox="0 0 ${MAPW} ${H}" role="group" aria-label="${side==='I'?'Map of Anderson Island':'Map of the mainland'}"><rect width="${MAPW}" height="${H}" fill="${water}"/><path d="M0 ${H*0.3} h${MAPW} M0 ${H*0.6} h${MAPW}" stroke="#fff" stroke-opacity=".07"/>`;
  let dock,edge;
  if(side==='I'){
    s+=`<path d="M120 40 C170 22 260 28 320 52 C345 70 340 100 330 125 C322 160 335 190 322 225 C312 255 285 285 240 298 C200 308 160 300 130 296 C90 290 60 262 55 230 C50 200 70 185 60 160 C50 130 70 100 85 78 C95 60 105 48 120 40 Z" fill="${tree}" stroke="#e8dcc0" stroke-width="3"/>`
     +`<path d="M150 70 C190 60 250 70 290 90 M120 120 C160 130 200 120 240 130 M110 230 C160 220 220 240 280 250" stroke="#e8dcc0" stroke-opacity=".28" stroke-width="2" fill="none" stroke-dasharray="5 4"/>`
     +`<ellipse cx="240" cy="152" rx="30" ry="19" fill="${water}" opacity=".9"/><ellipse cx="186" cy="212" rx="22" ry="13" fill="${water}" opacity=".9"/>`
     +`<g font-size="9" fill="#e8dcc0" font-family="DM Sans" opacity=".8" text-anchor="middle"><text x="240" y="178">Lake Josephine</text><text x="186" y="236">Florence Lake</text><text x="40" y="150" font-style="italic" fill="#9fc0c8">Amsterdam Bay</text><text x="352" y="118" font-style="italic" fill="#9fc0c8">Yoman Pt.</text></g>`;
    dock=pts.aiDock||[326,78];edge=[392,30];
  } else {
    const co=[[-0.5,9.5],[-1.2,6],[-0.9,2.5],[-0.6,0.4],[-0.8,-1],[-2,-2.2],[-5,-3.6],[-6,-4.2]];
    s+=`<polygon points="${co.concat([[-6,-8],[16,-8],[16,10]]).map(p=>mpx(p[0])+','+mpy(p[1])).join(' ')}" fill="${land}"/>`
      +`<path d="M${mpx(-0.6)} ${mpy(0.4)} C${mpx(2)} ${mpy(2)} ${mpx(5)} ${mpy(2)} ${mpx(8)} ${mpy(6.5)} L${mpx(13)} ${mpy(9.5)}" stroke="#b9b08f" stroke-width="3" fill="none"/>`
      +`<g font-size="9.5" fill="#6b7478" font-family="DM Sans" font-style="italic" text-anchor="middle" opacity=".9"><text x="${mpx(0.3)}" y="${mpy(-1.5)}">Steilacoom</text><text x="${mpx(-3.6)}" y="${mpy(-4.4)}">DuPont</text><text x="${mpx(8.4)}" y="${mpy(1.6)}">Lakewood</text><text x="${mpx(12)}" y="${mpy(7.4)}">Tacoma</text><text x="${mpx(-4)}" y="${mpy(3)}" fill="#9fc0c8">Puget Sound</text></g>`;
    dock=pts.stDock||[mpx(0),mpy(0)];edge=[20,mpy(1.2)];
  }
  // the ferry route across the water
  s+=`<line x1="${dock[0]}" y1="${dock[1]}" x2="${edge[0]}" y2="${edge[1]}" stroke="#f4f1ea" stroke-width="2" stroke-dasharray="6 5" opacity="${out?0.25:0.7}"/><text x="${(dock[0]+edge[0])/2}" y="${(dock[1]+edge[1])/2-6}" font-size="9.5" fill="#f4f1ea" font-family="DM Sans" text-anchor="middle">⛴️ ${side==='I'?'to Steilacoom':'to Anderson Is.'}</text>`;
  if(fer&&!out){ // the boat: the half of the trip nearest this panel
    let t=null;if(fer.side===side&&fer.f<0.5)t=fer.f*2;else if(fer.side!==side&&fer.f>=0.5)t=(1-fer.f)*2;
    if(t!=null){const x=dock[0]+(edge[0]-dock[0])*(0.25+t*0.7),y=dock[1]+(edge[1]-dock[1])*(0.25+t*0.7);
      s+=`<g class="mapferry" aria-label="The ferry"><rect x="${x-14}" y="${y-6}" width="28" height="12" rx="3" fill="#f4f1ea"/><rect x="${x-14}" y="${y+2}" width="28" height="4" fill="#2f5d4a"/><rect x="${x-5}" y="${y-12}" width="10" height="7" fill="#f4f1ea"/><rect x="${x-1.5}" y="${y-17}" width="3" height="6" fill="#e3642e"/></g>`}}
  // markers
  const here=S.loc;
  for(const k of Object.keys(pts)){
    const p=pts[k],sel=MAPSEL===k,open=(()=>{try{return isOpen(k)}catch(e){return true}})();
    s+=`<g class="mpin${sel?' sel':''}${open?'':' closed'}" tabindex="0" role="button" aria-label="${esc(L[k].name)}${k===here?' (you are here)':''}" onclick="MAPTAP('${k}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();MAPTAP('${k}')}">`
      +`<circle cx="${p[0]}" cy="${p[1]}" r="${sel?17:15}" fill="#fff" stroke="${sel?'#e3642e':'#2f5d4a'}" stroke-width="${sel?3:1.8}"/><text x="${p[0]}" y="${p[1]+6}" font-size="16" text-anchor="middle">${L[k].ic}</text></g>`;
  }
  const here2=pts[here];
  if(here2)s+=`<circle cx="${here2[0]}" cy="${here2[1]}" r="21" fill="none" stroke="#e3642e" stroke-width="3" stroke-dasharray="4 3" pointer-events="none"/><g pointer-events="none"><rect x="${here2[0]-14}" y="${here2[1]+22}" width="28" height="13" rx="6" fill="#e3642e"/><text x="${here2[0]}" y="${here2[1]+32}" font-size="9.5" font-weight="700" fill="#fff" text-anchor="middle" font-family="DM Sans">YOU</text></g>`;
  for(const c of S.cars){
    if(L[c.loc]&&L[c.loc].side!==side)continue;const p=pts[c.loc];if(!p)continue;
    s+=`<g pointer-events="none"><circle cx="${p[0]+13}" cy="${p[1]-13}" r="9" fill="#f3ecdc" stroke="#2f5d4a"/><text x="${p[0]+13}" y="${p[1]-9}" font-size="11" text-anchor="middle">${c.diesel?'🛻':c.id==='isl'?'🚗':'🚙'}</text></g>`;
  }
  return s+'</svg>';
}
window.MAPTAP=k=>{MAPSEL=MAPSEL===k?null:k;sfx('tap');render()};
window.MAPTAB=s=>{MAPSIDE=s;MAPSIDE_FOR=L[S.loc].side;MAPSEL=null;render()};
window.MAPPREF=v=>{setPref('mapView',!!v);render()};
function mapDetail(k){
  const cur=L[S.loc].side,here=k===S.loc;let h=`<div class="dest compact mapdet"><div class="dn"><b>${L[k].ic} ${L[k].name}</b><span>${L[k].hours?hoursTxt(k):''}</span></div>`;
  if(here)return h+`<div class="small-note" style="flex-basis:100%;color:var(--mute);font-size:12.5px">📍 You’re here. ${L[k].desc||''}</div></div>`;
  if(L[k].side!==cur){
    const dock=cur==='I'?'aiDock':'stDock',w=L[dock].name.replace(' Ferry Terminal',' terminal').replace(' Ferry Landing',' landing');
    return h+`<div class="small-note" style="flex-basis:100%;color:var(--mute);font-size:12.5px">${L[k].desc||''}<br>🌊 It’s across the water. Go to the ${w} and take the ferry first.</div>`
      +(S.loc!==dock?`<div class="chips">${travelOpts(dock).map(o=>{const i=ACTS.push(()=>{MAPSEL=null;go(dock,o)})-1;return `<button class="chip" ${o.dis||(o.cost&&o.m==='bus'&&S.money<o.cost)?'disabled':''} onclick="ACT(${i})">${esc(L[dock].ic)} ${o.l}</button>`}).join('')}</div>`:'')+'</div>';
  }
  const opts=travelOpts(k);
  return h+`<div class="chips">${opts.map(o=>{const i=ACTS.push(()=>{MAPSEL=null;go(k,o)})-1;return `<button class="chip" ${o.dis||(o.cost&&o.m==='bus'&&S.money<o.cost)?'disabled':''} onclick="ACT(${i})">${o.l}</button>`}).join('')}</div>`
    +`<div class="small-note" style="flex-basis:100%;color:var(--mute);font-size:12.5px">${L[k].desc||''}</div></div>`;
}
function mapView(){
  const cur=L[S.loc].side,side=mapSide(),pts=mapPositions(side),fer=mapFerry(),out=activeOutage();
  if(MAPSEL&&(!L[MAPSEL]||(L[MAPSEL].side!=='I'&&L[MAPSEL].side!=='M')))MAPSEL=null;
  if(MAPSEL&&!pts[MAPSEL])MAPSEL=null;
  let h=`<div class="mapwrap"><div class="maptabs" role="tablist">`
    +['I','M'].map(x=>`<button role="tab" aria-selected="${x===side}" class="${x===side?'on':''}" onclick="MAPTAB('${x}')">${x==='I'?'🏝️ Anderson Island':'🌆 Mainland'}${x===cur?' · you':''}</button>`).join('')+`</div>`;
  h+=mapSVG(side,pts,fer,out);
  h+=`<div class="mapcap">${out?'🚨 Ferry service suspended.':fer?`⛴️ The ${fmt(fer.dep)} boat is crossing now.`:'Tap a place to see how to get there.'}</div>`;
  h+=MAPSEL?mapDetail(MAPSEL):'';
  return h+'</div>';
}
// the toggle, and the map in place of the list
{const _av=actView;actView=function(){
  const h=_av.apply(this,arguments);
  try{
    const a=h.indexOf('<details class="go" ');if(a<0)return h;
    const sIdx=h.indexOf('<summary>🧭',a);if(sIdx<0)return h;
    const sEnd=h.indexOf('</summary>',sIdx)+10,end=h.lastIndexOf('</details>');if(end<sEnd)return h;
    const on=!!prefs().mapView;
    const tog=`<div class="maptog" role="group" aria-label="Show places as"><button class="${on?'':'on'}" onclick="MAPPREF(false)">📋 List</button><button class="${on?'on':''}" onclick="MAPPREF(true)">🗺️ Map</button></div>`;
    const list=h.slice(sEnd,end);
    return h.slice(0,sEnd)+tog+(on?mapView():'')+`<div class="golist" ${on?'hidden':''}>${list}</div>`+h.slice(end);
  }catch(e){console.error(e);return h}
}}
{const st=document.createElement('style');st.id='mapcss';st.textContent=`.maptog{display:flex;gap:6px;margin:2px 0 10px}.maptog button{flex:1;border:1.5px solid var(--fir);background:#fff;color:var(--fir);border-radius:999px;padding:7px 10px;font-size:13.5px;font-weight:700}.maptog button.on{background:var(--fir);color:#fff}
.mapwrap{margin-bottom:10px}.maptabs{display:flex;gap:6px;margin-bottom:6px}.maptabs button{flex:1;border:1.5px solid var(--line);background:#fff;border-radius:10px;padding:6px 4px;font-size:12.5px;font-weight:700;color:var(--mute)}.maptabs button.on{border-color:var(--fir);color:var(--fir);background:#e3eee5}
.mapsvg{display:block;width:100%;height:auto;border-radius:12px;border:1.5px solid var(--line);touch-action:manipulation}.mpin{cursor:pointer;outline:none}.mpin.closed{opacity:.6}.mpin:focus-visible circle{stroke:#e3642e;stroke-width:3}
.mapcap{font-size:12.5px;color:var(--mute);margin:6px 2px 8px}.mapdet{margin-top:2px}.golist[hidden]{display:none}`;document.head.appendChild(st)}
