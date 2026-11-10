// ---- 📦 lost & found: mis-delivered packages, sorted out in the 📣 Island Group app ----
// Three ways a delivery goes wrong, and all three get fixed by posting in the community group:
//  A) 'foreign'  a package for someone else lands on your porch      → post "found a package for …" → they pick it up
//  B) 'nb'       a neighbor got yours and posts about it              → reply "that's mine!" → they drop it on your porch
//  C) 'quiet'    yours is just missing (tracking says delivered)      → post "missing package" → someone finds it
// B and C come from HH().missing (kind 'pkg', recorded by 17-household.js). A rolls once per delivery day.
const LF_FOREIGN_CHANCE=0.08, LF_NEIGHBOR_POSTS=0.5;
const LF_PEOPLE=['Sandy, over on the bay side','the Okafors, two driveways down','Pete with the blue truck','Janelle from the pancake breakfast','the couple with the llamas','Ruth, who runs the book swap','a guy named Arlo you’ve never met'];
const LF_ITEMS=['a box that rattles, from a farm supply store','a long box marked FRAGILE','a padded envelope from a pharmacy','a very heavy box of what is clearly cat litter','a box with a kayak paddle printed on the side','a soft package that is probably a sweater'];
function LF(){const H=HH();if(!H.lf)H.lf={foreign:[],roll:-1,n:0};return H.lf}
const lfApp=()=>phoneInstalled('group');
// someone on the island: a friend you already have, sometimes, or a stranger from down the road
function lfWho(){const ids=Object.keys(S.friends||{});if(ids.length&&Math.random()<0.4){const id=pick(ids);return {who:S.friends[id].name.split(',')[0].replace(/^the /,'The '),fid:id}}return {who:pick(LF_PEOPLE)}}
const lfName=x=>x.who.charAt(0).toUpperCase()+x.who.slice(1);
// a group-app line: logged, kept in the app's recent replies, badge lit
function lfPost(s){say('📣 '+s);if(!lfApp())return;const P=PH();P.grpNew=true;P.grpLog=(P.grpLog||[]).concat({d:day(),s}).slice(-GRP_LOG_MAX);
  try{phoneNotify('📣','Island Group',s.replace(/<[^>]+>/g,'').slice(0,70))}catch(e){}}
const lfPkgs=()=>hhMissing().filter(x=>x.kind==='pkg'&&!x.done);
const lfItem=x=>HH_SHOP[x.k]?HH_SHOP[x.k].n:'a package';
// the package comes home: onto your porch, like any delivery
function lfReturn(x){x.done=true;HH().pkgs.push({k:x.k,at:dayKey(),via:x.via||'usps',w:false,st:'porch'})}

phoneOnTime(function lfTimed(){
  if(!S||S.over)return;const L2=LF(),dk=dayKey(),m=tod();
  // A) once per delivery day (Mon–Sat), somebody else's package might land on your porch in the afternoon
  if(L2.roll!==dk&&day()!==6&&m>=900){L2.roll=dk;
    if(Math.random()<LF_FOREIGN_CHANCE&&L2.foreign.length<2){const w=lfWho();L2.n++;
      L2.foreign.push({id:L2.n,who:w.who,fid:w.fid,item:pick(LF_ITEMS),since:dk,posted:false,due:-1});
      if(S.loc==='home')say(`📦 The ${pick(['UPS','FedEx','USPS'])} truck stops, and leaves ${L2.foreign[L2.foreign.length-1].item} on your porch. It’s addressed to ${L2.foreign[L2.foreign.length-1].who}.`)}}
  for(const f of L2.foreign.slice()){if(f.posted&&S.t>=f.due){L2.foreign=L2.foreign.filter(x=>x!==f);
    repAdd(dayKey()-f.since<=1?10:5,`returned ${f.who}’s package`);adj('stress',-2);
    lfPost(`${lfName(f)} saw your post: “That’s mine! Thank you!!” ${S.loc==='home'?'They pull into the driveway twenty minutes later and grab it off your porch.':'By the time you’re home, it’s gone from the porch. There’s a sticky note on the door: THANK YOU.'}`);
    if(f.fid)friendPts(f.fid,2);else if(Math.random()<0.4)newNeighbor('you found their package and posted about it')}}
  // B/C) your packages that went to the wrong house
  for(const x of lfPkgs()){
    if(!x.mode){x.mode=Math.random()<LF_NEIGHBOR_POSTS?'nb':'quiet';const w=lfWho();x.who=w.who;x.fid=w.fid;
      x.nbAt=x.mode==='nb'?S.t+60+Math.floor(Math.random()*300):-1}
    if(x.mode==='nb'&&!x.seen&&x.nbAt>=0&&S.t>=x.nbAt){x.seen=true;
      lfPost(`${lfName(x)} posted: “Got a package for {{name}} on our porch: ${lfItem(x).toLowerCase()}. Anybody know them?”`)}
    if(x.due>=0&&S.t>=x.due){lfReturn(x);if(x.fid)friendPts(x.fid,1);
      lfPost(x.claimed?`${lfName(x)}: “Dropped it on your porch! Welcome to the island.”`:`${lfName(x)} replied to your post: “Is it ${lfItem(x).toLowerCase()}? It’s been on our porch since ${DAYS[x.at%7]}. I’ll leave it at yours on my way to the ferry.”`)}}
});

// ---- posting from the 📣 Island Group app ----
function lfPostMissing(x){if(!phoneCan())return;S.t+=10;phoneTick();phoneUse(2);x.posted=true;x.due=S.t+120+Math.floor(Math.random()*240);
  say(`📣 You post: “Missing a package: ${lfItem(x).toLowerCase()}, ${CARRIERS[x.via]?CARRIERS[x.via].sh:'the carrier'} says delivered ${DAYS[x.at%7]}. Did it end up at your place?”`);afterAction()}
function lfClaim(x){if(!phoneCan())return;S.t+=5;phoneTick();phoneUse(1);x.claimed=true;x.due=S.t+60+Math.floor(Math.random()*120);
  say(`📣 You reply to ${x.who}: “That’s mine! Thank you!”`);afterAction()}
function lfPostFound(f){if(!phoneCan())return;S.t+=10;phoneTick();phoneUse(2);f.posted=true;f.due=S.t+60+Math.floor(Math.random()*180);
  say(`📣 You post a photo of the label: “Found a package for ${f.who} on our porch. Come grab it anytime!”`);afterAction()}
function lfHtml(){const L2=LF(),mine=lfPkgs(),fr=L2.foreign;if(!mine.length&&!fr.length)return '';
  let h=`<div class="ph-sub">📦 Lost &amp; found</div>`;const can=phoneCan();
  for(const x of mine){const it=lfItem(x).toLowerCase(),w=x.who||'a neighbor';
    if(x.due>=0) h+=phCard(`⏳ <b>${it}</b>: ${x.claimed?w+' is dropping it off':'a neighbor has it'}. On your porch around ${fmtAbs(x.due)}.`);
    else if(x.mode==='nb'&&x.seen) h+=phCard(`📬 <b>${lfName(x)}</b> posted: “Got a package for {{name}}: ${it}.”`,'ok')+phBtn('🙋 Reply: “That’s mine!”',()=>lfClaim(x),{cls:'primary',dis:!can,sub:'5 min. They’ll drop it on your porch.'});
    else if(x.posted) h+=phCard(`⏳ You posted about your missing ${it}. Waiting for someone to check their porch.`);
    else h+=phCard(`❓ <b>${it}</b>: tracking says delivered ${DAYS[x.at%7]}. It’s not on your porch.`)+phBtn('📣 Post: “Missing package”',()=>lfPostMissing(x),{cls:'primary',dis:!can,sub:'10 min. Somebody probably has it.'});}
  for(const f of fr){
    if(f.posted) h+=phCard(`⏳ You posted about the package for ${f.who}. They’ll come by for it.`);
    else h+=phCard(`📦 A package for <b>${f.who}</b> is on your porch: ${f.item}.`)+phBtn(`📣 Post: “Found a package for ${f.who}”`,()=>lfPostFound(f),{cls:'primary',dis:!can,sub:'10 min. A good deed: reputation +1.'});}
  return h}
{const g=phoneApp('group');if(g){const v=g.view;g.view=function(arg){const x=lfHtml(),body=v.call(this,arg);if(!x)return body;
  const k=body.indexOf('<div class="ph-rep">');return k<0?x+body:body.slice(0,k)+x+body.slice(k)}}
  if(g){const b=g.badge;g.badge=()=>(b()||0)||(lfPkgs().some(x=>x.mode==='nb'&&x.seen&&x.due<0)?1:0)}}

// ---- the main screen: the stray package on your porch, and the to-do list ----
{const _actions=actions;actions=function(){const a=_actions();try{
  if(S.loc==='home') for(const f of LF().foreign) a.push({cat:'here',ic:'📦',l:`A package for ${f.who} is on your porch`,s:f.posted?'You posted in the Island Group. They’ll come by for it.':`${f.item}. Post it in 📣 Island Group so they can come get it${lfApp()?'':' (install the app from the App Store)'}.`,dis:true});
}catch(e){}return a}}
{const _todo=todoItems;todoItems=function(){const it=_todo();try{const app=lfApp()?'in 📣 Island Group':'(get 📣 Island Group from the App Store)';
  for(const x of lfPkgs()){const n=lfItem(x).toLowerCase();
    it.push({ok:false,fail:false,l:`Find your ${n}`,s:x.due>=0?`📦 It’s coming to your porch around ${fmtAbs(x.due)}.`:x.mode==='nb'&&x.seen?`📣 ${lfName(x)} has it. Reply ${app}.`:x.posted?'📣 You posted. Waiting for replies.':`📦 Tracking says delivered, but it went to the wrong house. Post ${app}.`,urgent:false})}
  for(const f of LF().foreign) it.push({ok:f.posted,fail:false,l:`Return ${f.who.replace(/^the /,'the ')}’s package`,s:f.posted?'📣 Posted. They’ll come by.':`📦 It’s on your porch. Post ${app}.`,urgent:false});
}catch(e){}return it}}
