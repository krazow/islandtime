// ---- 🧳 visitor phone: visit plan, photo gallery, and no work apps (does nothing unless visitorOn()) ----
// Resident-only apps hidden from a visitor's phone (home screen, App Store, shortcuts, notifications, timers):
//   bank (credit union, bills), gigs (Gig Work + job listings), market (grocery delivery), telehealth (prescriptions/refills),
//   rides (neighbors driving residents). Kept: Messages, Phone, Clock, App Store, Island Group, Ferry Pass, Tides & Weather.
const VPHONE_HIDDEN=['bank','gigs','market','telehealth','rides','jobs','landlord','pharmacy'];
const vphoneHidden=id=>visitorOn()&&((typeof regOn==='function'&&regOn())?['rides','telehealth','landlord','pharmacy'].includes(id):VPHONE_HIDDEN.includes(id));   // weekend regular: the work apps come back
{const _pa=phoneApp;phoneApp=function(id){if(id==='visit')return visitorOn()?_pa(id):undefined;if(vphoneHidden(id))return undefined;return _pa(id)}}
{const _ps=phoneStoreApps;phoneStoreApps=function(){return _ps().filter(a=>a.id!=='visit'&&!vphoneHidden(a.id))}}
{const _pg=window.phoneGo;window.phoneGo=function(app,arg){if(vphoneHidden(app)||(app==='visit'&&!visitorOn()))return;return _pg(app,arg)}}
{const _po=window.phoneOpen;window.phoneOpen=function(app,arg){if(vphoneHidden(app)||(app==='visit'&&!visitorOn()))app=null;return _po(app,arg)}}
{const _pi=phoneInstall;phoneInstall=function(id){if(vphoneHidden(id))return false;return _pi(id)}}
// a visitor's phone comes ready with the ferry app and the Island Group (once per visit)
{const _pr=phoneRender;phoneRender=function(){if(visitorOn()&&PH_OPEN){const P=PH();if(!P.vready){P.vready=1;for(const id of(typeof regOn==='function'&&regOn()?['ferrypass','group','bank','gigs']:['ferrypass','group']))if(_ppA(id)&&!P.apps.includes(id)&&P.apps.length<PHONE_SLOTS)P.apps.push(id)}}
  return _pr.apply(this,arguments)}}
function _ppA(id){return PHONE_APPS.find(a=>a.id===id)}
const VSIGHT_CAP={lake:'Bald eagles over the lake.',farm:'Old barns and a tractor at the Johnson Farm.',andys:'Tall trees at Andy’s Wild Wood Park.',jacobs:'The water from Jacobs Point.',riv:'A burger at the Riv.',legion:'Flags and folding chairs at the Legion.'};
const vsCap=s=>VSIGHT_CAP[s.id]||('A photo at '+s.n+'.');
function vphoneTimeTxt(v){if(v==null||v==='')return null;if(typeof v==='number'&&isFinite(v)){try{return fmt(v%1440)}catch(e){return String(v)}}return String(v)}
function vphonePlan(){
  const v=VS(),len=VISIT_LENS[v.len]||VISIT_LENS.weekend,home=VISIT_HOMES[v.home]||VISIT_HOMES.tacoma;
  let h=`<div class="ph-card"><b>${len.ic} ${len.n}</b><br>${len.d}</div>`;
  let dt='';try{dt=dateTxt(day())}catch(e){}
  h+=`<div class="ph-card">📅 Today: <b>${typeof DAYS!=='undefined'?DAYS[((day()%7)+7)%7]:''}</b>${dt?' · '+dt:''}<br>🏠 You live in <b>${home.ic} ${home.n}</b> (${home.mi} miles from the Steilacoom ferry).</div>`;
  const r=v.rental||{},ri=vphoneTimeTxt(r.in),ro=vphoneTimeTxt(r.out);
  if(len.nights>0||ri||ro)h+=`<div class="ph-card">🛏️ Rental cabin · ${len.nights} night${len.nights===1?'':'s'}<br>Check-in: <b>${ri||'3:00 PM'}</b> ${r.checkedIn?'✓':''}<br>Check-out: <b>${ro||'11:00 AM'}</b> ${r.checkedOut?'✓':''}</div>`;
  let boat='';try{const d=deps('I',day()),last=d[d.length-1],gone=last<S.t;boat=`⛴️ Last boat home today: <b>${fmt(last)}</b> from the island${gone?' (already gone)':''}.`}catch(e){}
  if(boat)h+=`<div class="ph-card ${'warn'}">${boat}</div>`;
  const n=VSIGHTS.filter(s=>v.seen[s.id]!=null).length;
  h+=`<div class="ph-sect">Things to see · ${n}/${VSIGHTS.length}</div>`;
  for(const s of VSIGHTS)h+=`<div class="ph-card">${v.seen[s.id]!=null?'✓':'☐'} ${s.ic} ${s.n}${v.photos[s.id]!=null?' 📸':''}</div>`;
  if(typeof visitScore==='function'){let sc='';try{const x=visitScore();sc=(x&&typeof x==='object')?(x.total??x.score??x.pts??JSON.stringify(x)):x}catch(e){}if(sc!=='')h+=`<div class="ph-card"><b>Score so far: ${sc}</b></div>`}
  h+=phBtn('📸 Photos',()=>phoneGo('visit','photos'),{cls:'primary'});
  return h}
function vphonePhotos(){
  const v=VS(),got=VSIGHTS.filter(s=>v.photos[s.id]!=null);
  let h=phBtn('‹ Visit plan',()=>phoneBack());
  if(!got.length)return h+`<p>No photos yet. Take one at a sight on the island.</p>`;
  h+=`<div class="ph-sect">${got.length} photo${got.length===1?'':'s'}</div>`;
  for(const s of got)h+=`<div class="ph-card"><div style="font-size:40px;text-align:center">${s.ic}</div><b>${s.n}</b><br><small>${vsCap(s)}</small></div>`;
  return h}
definePhoneApp({id:'visit',name:'Visit',ic:'🧳',order:5,desc:'Your visit plan.',view:arg=>arg==='photos'?vphonePhotos():vphonePlan()});
{const a=PHONE_APPS.find(x=>x.id==='visit');Object.defineProperty(a,'builtin',{get:()=>visitorOn(),configurable:true})}
