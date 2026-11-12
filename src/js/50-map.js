// ---- 🗺️ an island map you can tap (50-map.js) ----
// A drawn map of Anderson Island and of the mainland, as an alternative to the "Go somewhere" list. It wraps actView(): the list stays
// (hidden) and the player's choice is remembered with setPref('mapView'). Tapping a place shows its travel options (travelOpts) and goes there.
// Both panels are drawn from real shorelines (GEO, 49-geo.js) in a lon/lat box; every place sits at its real spot (MAPLL, lat/lon),
// except the fictional ones (home, Dale's), which sit where they plausibly could. MP (miles) still drives travel times; the map only draws.
const MAPLL={
  // Anderson Island (GNIS points where they exist)
  aiDock:[47.1783,-122.6778],store:[47.1652,-122.6999],school:[47.1569,-122.7052],lake:[47.1569,-122.6828],food:[47.1574,-122.6866],
  marina:[47.1445,-122.6905],legion:[47.1612,-122.6955],home:[47.1712,-122.7125],dale:[47.1420,-122.7085],farm:[47.1765,-122.7045],
  andys:[47.1500,-122.7095],jacobs:[47.1372,-122.6962],
  // Steilacoom
  stDock:[47.1716,-122.6030],gas:[47.1662,-122.5935],st_topside:[47.1676,-122.6008],st_bair:[47.1699,-122.6022],st_pub:[47.1706,-122.5988],
  st_museum:[47.1688,-122.5972],st_beach:[47.1795,-122.5890],sunny:[47.1787,-122.5898],
  // Lakewood
  lw_fsp:[47.1760,-122.5560],work:[47.1630,-122.5140],lw_playhouse:[47.1612,-122.5122],market:[47.1722,-122.5130],pharmacy:[47.1782,-122.5182],
  dispensary:[47.1688,-122.5232],lw_hess:[47.1578,-122.5182],depot:[47.1530,-122.5048],wholesale:[47.1478,-122.4978],ponders:[47.1380,-122.4950],
  motel:[47.1430,-122.5002],lw_yis:[47.1660,-122.4950],lw_lakewold:[47.1395,-122.5420],
  // Tacoma
  office:[47.2590,-122.4530],clinic:[47.2500,-122.4470],hilltop:[47.2520,-122.4560],warehouse:[47.2170,-122.4700],tc_dukes:[47.2905,-122.4850],
  tc_cactus:[47.2690,-122.4815],tc_zoo:[47.3050,-122.5200],tc_glass:[47.2460,-122.4340],tc_grand:[47.2560,-122.4410],
  // DuPont
  whse:[47.1080,-122.6400],urgent:[47.0990,-122.6310]};
const MAPCITY={tacoma:[47.2400,-122.4800],seattle:[47.6062,-122.3321],olympia:[47.0379,-122.9007]};
const MAPW=400,MAPH={I:GEO.I.h,M:GEO.M.h};
let MAPSEL=null,MAPSIDE=null,MAPSIDE_FOR=null;
const mapSide=()=>{const cur=L[S.loc].side;if(MAPSIDE_FOR!==cur){MAPSIDE=null;MAPSIDE_FOR=cur}return MAPSIDE||cur};
function mapXY(side,lat,lon){const [x0,x1,y0,y1]=GEO[side].bb;return [(lon-x0)/(x1-x0)*MAPW,(y1-lat)/(y1-y0)*MAPH[side]]}
const mapIn=(side,p)=>p[0]>=0&&p[0]<=MAPW&&p[1]>=0&&p[1]<=MAPH[side];
function mapMainPos(k){
  if(MAPLL[k])return mapXY('M',...MAPLL[k]);
  let home='tacoma';try{home=VS().home||home}catch(e){}
  const h=mapXY('M',...(MAPCITY[home]||MAPCITY.tacoma));
  const hp=[Math.max(24,Math.min(MAPW-24,h[0])),Math.max(26,Math.min(MAPH.M-26,h[1]))];   // Seattle and Olympia are off this map: pinned at its edge
  if(k==='vhome')return hp;
  if(k==='rwork')return [hp[0]+22,hp[1]+18];
  if(k==='rmarket')return [hp[0]-22,hp[1]+18];
  let n=0;for(const c of k)n=(n*31+c.charCodeAt(0))%97;return mapXY('M',47.15+(n%5)*0.006,-122.53+(n%9)*0.006);   // anything new: somewhere in Lakewood
}
function mapPlaces(side){
  return Object.keys(L).filter(k=>L[k].side===side&&(k!=='vhome'||visitorOn())&&!destHidden(k));
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
  const pts={},ks=mapPlaces(side),extra=[[47.170,-122.700],[47.150,-122.700],[47.160,-122.715],[47.165,-122.690]];let e=0;
  ks.forEach(k=>{pts[k]=side==='I'?mapXY('I',...(MAPLL[k]||extra[e++%extra.length])):mapMainPos(k)});
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
  let s=`<svg class="mapsvg" viewBox="0 0 ${MAPW} ${H}" role="group" aria-label="${side==='I'?'Map of Anderson Island':'Map of the mainland'}"><rect width="${MAPW}" height="${H}" fill="${water}"/>`;
  const G=GEO[side],lbl=(lat,lon,t,o)=>{const [x,y]=mapXY(side,lat,lon);return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}"${o||''}>${t}</text>`};
  for(const sh of G.shapes)s+=`<path d="${sh.d}" fill="${sh.k==='lake'?water:side==='I'&&sh.k==='ai'?tree:land}"${sh.k==='lake'?'':` stroke="${side==='I'&&sh.k==='ai'?'#e8dcc0':'#b9b08f'}" stroke-width="${side==='I'&&sh.k==='ai'?2.5:1}" stroke-linejoin="round"`}/>`;
  let dock,edge;
  if(side==='I'){
    const lake=(lat,lon,rx,ry,r)=>{const [x,y]=mapXY('I',lat,lon);return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${water}"/>`};
    s+=lake(47.1569,-122.6828,15,9,-30)+lake(47.1672,-122.6874,11,7,20)   // Lake Josephine, Florence Lake (GNIS)
     +`<g font-size="9" fill="#e8dcc0" font-family="DM Sans" opacity=".85" text-anchor="middle">${lbl(47.1528,-122.6828,'Lake Josephine')}${lbl(47.1700,-122.6874,'Florence Lake')}</g>`
     +`<g font-size="9.5" fill="#9fc0c8" font-family="DM Sans" font-style="italic" text-anchor="middle">${lbl(47.1585,-122.7385,'Amsterdam Bay')}${lbl(47.1292,-122.7030,'Oro Bay')}${lbl(47.1735,-122.6640,'Yoman Pt.')}${lbl(47.1935,-122.7270,'Balch Passage')}${lbl(47.1240,-122.7380,'Nisqually Reach')}</g>`
     +`<g font-size="9.5" fill="#6b7478" font-family="DM Sans" font-style="italic" text-anchor="middle">${lbl(47.1945,-122.6800,'McNeil Is.')}</g>`;
    dock=pts.aiDock||mapXY('I',...MAPLL.aiDock);
    const far=mapXY('I',...MAPLL.stDock),dx=far[0]-dock[0],dy=far[1]-dock[1],t=(MAPW-8-dock[0])/dx;edge=[MAPW-8,dock[1]+dy*t];   // toward Steilacoom, to the map's edge
  } else {
    s+=`<g font-size="9.5" fill="#6b7478" font-family="DM Sans" font-style="italic" text-anchor="middle" opacity=".95">${lbl(47.1600,-122.5880,'Steilacoom')}${lbl(47.1520,-122.5300,'Lakewood')}${lbl(47.2330,-122.4520,'Tacoma')}${lbl(47.2270,-122.5420,'University Place')}${lbl(47.0930,-122.6560,'DuPont')}</g>`
     +`<g font-size="9" fill="#6b7478" font-family="DM Sans" font-style="italic" text-anchor="middle" opacity=".8">${lbl(47.1600,-122.7060,'Anderson Is.')}${lbl(47.2120,-122.6880,'McNeil Is.')}${lbl(47.2500,-122.6250,'Fox Is.')}${lbl(47.1450,-122.6320,'Ketron Is.')}</g>`
     +`<g font-size="9.5" fill="#9fc0c8" font-family="DM Sans" font-style="italic" text-anchor="middle">${lbl(47.1900,-122.6400,'Puget Sound')}${lbl(47.2700,-122.5600,'Tacoma Narrows')}${lbl(47.2930,-122.4380,'Commencement Bay')}${lbl(47.1230,-122.5640,'American Lake')}</g>`;
    let home='tacoma';try{home=VS().home||home}catch(e){}
    if(visitorOn()&&home!=='tacoma'){const c=MAPCITY[home];if(c){const p=mapXY('M',...c),q=[Math.max(24,Math.min(MAPW-24,p[0])),Math.max(26,Math.min(MAPH.M-26,p[1]))];
      s+=`<text x="${(q[0]+(p[0]>MAPW/2?-26:26)).toFixed(1)}" y="${(q[1]+(p[1]<0?-6:18)).toFixed(1)}" font-size="9.5" font-weight="700" fill="#f4f1ea" font-family="DM Sans" text-anchor="${p[0]>MAPW/2?'end':'start'}">${home==='seattle'?'↑ Seattle, 30 mi':'↙ Olympia, 20 mi'}</text>`}}
    dock=pts.stDock||mapXY('M',...MAPLL.stDock);edge=mapXY('M',...MAPLL.aiDock);
  }
  s+=`<g font-size="8" fill="#f4f1ea" font-family="DM Sans" opacity=".55"><text x="${MAPW-6}" y="${MAPH[side]-6}" text-anchor="end">Shoreline: GSHHG</text><text x="10" y="18" font-size="11" font-weight="700">N ↑</text></g>`;
  // the ferry route across the water
  s+=`<line x1="${dock[0]}" y1="${dock[1]}" x2="${edge[0]}" y2="${edge[1]}" stroke="#f4f1ea" stroke-width="2" stroke-dasharray="6 5" opacity="${out?0.25:0.7}"/><text x="${(dock[0]+edge[0])/2}" y="${(dock[1]+edge[1])/2-6}" font-size="9.5" fill="#f4f1ea" font-family="DM Sans" text-anchor="middle">⛴️ ${side==='I'?'to Steilacoom':'to Anderson Is.'}</text>`;
  if(fer&&!out){ // the boat: on the island panel, while it's on the island half of the trip; on the mainland panel (both landings in view), all the way
    let t=null;
    if(side==='M')t=fer.side==='M'?fer.f:1-fer.f;
    else if(fer.side==='I'&&fer.f<0.5)t=fer.f*2;else if(fer.side==='M'&&fer.f>=0.5)t=(1-fer.f)*2;
    if(t!=null){const x=dock[0]+(edge[0]-dock[0])*t,y=dock[1]+(edge[1]-dock[1])*t;
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
  const nAt={},badge=(k,ic)=>{if(L[k]&&L[k].side!==side)return;const p=pts[k];if(!p)return;const i=nAt[k]=(nAt[k]||0)+1,x=p[0]+13+(i-1)*19;   // side by side when several vehicles share a spot
    s+=`<g pointer-events="none"><circle cx="${x}" cy="${p[1]-13}" r="9" fill="#f3ecdc" stroke="#2f5d4a"/><text x="${x}" y="${p[1]-9}" font-size="11" text-anchor="middle">${ic}</text></g>`};
  for(const c of S.cars)badge(c.loc,c.diesel?'🛻':c.id==='isl'?'🚗':'🚙');
  try{if(typeof boatOwn==='function'&&boatOwn()&&!visitorOn()){const B=S.boat,k=B.at==='road'&&typeof boatTrailerLoc==='function'?boatTrailerLoc():B.at;badge(k,'🚤')}}catch(e){}
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
