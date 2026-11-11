// ---------------- 🎣 boat extras, part 5: fishing, crabbing and friends from your own boat ----------------
// Your own boat gets you to the fish: better odds than the dock (crab pots set from the skiff come up fuller; the hook-set odds for
// salmon are better), and a day on the water with a friend. Two friend storyline beats use the skiff (via 60-friend-stories.js hooks):
// Sam's sailboat gets becalmed and needs a tow; the Hendersons want photos of the shoreline from the water.
const bxCalm=()=>{const c=boatConditions('sunny');return !c.refuse};
const bxDay=()=>seasonLite(tod())&&seasonLite(tod()+120);
function bxOutOk(gal){return bxOk()&&S.boat.at==='marina'&&S.loc==='marina'&&S.boat.fuel>=gal}
function bxBoatFish(){
  const T=TX(),F=T.fish;if(F.dk!==thxDay()){F.dk=thxDay();F.n=0}
  S.t+=90;phoneTick();money(-4);S.boat.fuel=boatGal(S.boat.fuel-0.4);F.n++;
  const calm=[8,5,2][Math.min(2,F.n-1)],done=()=>{adj('stress',-calm-2);thxFun('fish',3);afterAction()};
  if(Math.random()>0.92){say('🎣 You drift along the kelp edge with a herring rig for an hour and a half. A seal follows you the whole way, unimpressed. No bites.');return done()}
  modal('🎣 A hit off the kelp bed',`<p>The rod doubles over. You’re out where the fish actually are, a hundred yards from the dock.</p>`,[
    {l:'Set the hook now',s:'Steady. Better odds of landing it.',fn:()=>fishLand(3,false,done)},
    {l:'Let it run a moment first',s:'A bigger fish, maybe.',fn:()=>fishLand(3,true,done)}])}
function bxBoatCrab(){const T=TX();if(S.money<8)return;
  modal('🦀 Set a crab pot from the skiff',`<p>Out past the kelp where the dock crowd never reaches. Pots set from a boat come up fuller, and you’re less likely to lose one to a prop. Bait is a chicken carcass: $3. ${T.ownPot?'You have your own pot.':'The Riv rents pots for $8.'} Dungeness season: males 6¼ inches or bigger, five a day.</p>`,[
    {l:`Set the pot from the boat: $${T.ownPot?3:11}`,s:'25 min and 0.3 gal.',dis:S.money<(T.ownPot?3:11),fn:()=>{money(-(T.ownPot?3:11));S.t+=25;phoneTick();S.boat.fuel=boatGal(S.boat.fuel-0.3);T.pot={at:crabNow(),boat:true};adj('stress',-2);thxFun('crab',1);say('🦀 You motor out past the end of the kelp, drop the pot in forty feet of water and mark it with a bright float.');afterAction()}},
    {l:'Not now',fn:()=>{}}])}
// a pot from the skiff: the pull is lucky (a lost line is unlikely, and the crabs run bigger)
{const _p=crabPull;crabPull=function(){const T=TX();if(!(T.pot&&T.pot.boat))return _p.apply(this,arguments);
  const _r=Math.random;Math.random=()=>0.5+_r()*0.5;try{return _p.apply(this,arguments)}finally{Math.random=_r}}}
// ---- a friend on the water ----
function bxOuting(id){
  const X=BX();X.outDk=dayKey();S.t+=90;phoneTick();S.boat.fuel=boatGal(S.boat.fuel-0.5);S.boat.cond=Math.max(0,S.boat.cond-1);
  adj('stress',-8);friendPts(id,2);const n=thxName(id);
  say(pick([`🚤 ${n} sits in the bow with a thermos and a hat pulled low. Harbor seals, a bald eagle on a piling, and the whole island laid out low and green. “I never see it from this side,” ${n} says.`,`🚤 You and ${n} idle off Eagle Island with the engine off and two coffees. Neither of you says anything useful for forty minutes. It’s the best conversation you’ve had all week.`,`🚤 A pod of porpoises crosses the bow and ${n} grabs your sleeve like a kid. You’re both laughing when the dock comes back into view.`]));
  afterAction()}
function bxFunActions(a){
  if(!bxOutOk(0.3))return;
  const T=TX(),calm=bxCalm(),day2=bxDay(),ses=fishSessions();
  const why=!calm?'The water’s too rough.':!day2?seasonDark():null;
  a.push({cat:'boatx',ic:'🎣',l:'Fish from your skiff: $4',s:why||(!T.lic?'You’ll need the $20 fishing license first.':ses>=3?'The fish have stopped biting for today.':'90 min and 0.4 gal out at the kelp bed. Much better odds than the dock.'),dis:!!why||!T.lic||ses>=3||S.money<4||S.boat.fuel<0.4,fn:bxBoatFish});
  if(seasonId()==='summer'&&!T.pot)a.push({cat:'boatx',ic:'🦀',l:'Set a crab pot from the skiff',s:why||(!T.lic?'You’ll need the $20 fishing license first.':!crabSeason()?'Dungeness season: July, Thursday through Monday.':'25 min and 0.3 gal. A fuller pot, and less chance of losing it.'),dis:!!why||!T.lic||!crabSeason()||S.boat.fuel<0.3,fn:bxBoatCrab});
  const fr=thxFriends();
  if(fr.length)a.push({cat:'boatx',ic:'🧑‍🤝‍🧑',l:'Take a friend out on the water',s:why||(BX().outDk===dayKey()?'You’ve been out with a friend today.':S.boat.fuel<0.5?'You need at least half a gallon.':'90 min and 0.5 gal. Friendship +2, stress −8.'),dis:!!why||BX().outDk===dayKey()||S.boat.fuel<0.5,
    fn:()=>modal('🚤 Who comes along?',`<p>Two lifejackets, a thermos, and no particular destination.</p>`,fr.map(id=>({l:`Invite ${thxName(id)}`,s:'90 min, 0.5 gal.',fn:()=>bxOuting(id)})).concat([{l:'Not now',fn:()=>{}}]))});
}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{bxFunActions(a)}catch(e){console.error(e)}return a}}
// ---- two storyline beats that need a boat ----
function bxBeat(id,key){return bxOk()&&BX().beat[key]==null&&S.loc==='home'&&!!S.friends[id]&&flv(id)>=2&&S.boat.at==='marina'&&(FST()[id].b>=1||(S.weekNo||0)>=1)}
function bxBeatDone(id,key,pts,rep,why){BX().beat[key]=dayKey();FST()[id].h++;friendPts(id,pts);if(rep)fstRep(rep,why)}
defEvent({id:'bx_sam_tow',hook:'wake',priority:2,max:1,chance:0.25,cond:()=>bxBeat('sam','sam')&&bxCalm(),
  run(){fstText('sam','The Windfall is becalmed off the Riv. No wind, the tide’s taking me toward the Narrows, and the engine is, uh, a concept. Do you still have that skiff? ⛵',true);
    modal('⛵ Sam’s sailboat',`<p>Sam’s sailboat, the <i>Windfall</i>, is sitting dead in the water a half mile off the marina, sails slack and a figure in a yellow slicker waving a very small oar. “I did NOT plan this,” says the text.</p>`,[
      {l:'Tow Sam in with the skiff: 1 hour',s:'0.6 gal. Friendship +2, reputation +2.',dis:!bxOk()||S.boat.fuel<0.6,fn:()=>{S.t+=60;phoneTick();S.boat.fuel=boatGal(S.boat.fuel-0.6);bxBeatDone('sam','sam',2,2,'towed Sam’s sailboat in');adj('stress',-2);
        say('⛵ You motor out, toss Sam a line and tow the <i>Windfall</i> back to the Riv with Sam at the tiller, grinning like he planned it. He pays you in eggs and an exaggerated story.');fstText('sam','You towed a SAILBOAT. With a SKIFF. I’m telling everyone. ⛵',true);afterAction()}},
      {l:'Tell him the Riv has a tow service',s:'Friendship +0. He’ll manage.',fn:()=>{BX().beat.sam=dayKey();say('⛵ You text the number for the marina’s tow service. Sam gets in on the afternoon tide, mildly offended, mostly fine.')}}])}});
defEvent({id:'bx_hend_photos',hook:'wake',priority:2,max:1,chance:0.25,cond:()=>bxBeat('hendersons','hend')&&bxCalm()&&seasonLite(tod()+180),
  run(){fstText('hendersons','Ruth here. The museum wants photographs of the island’s shoreline FROM THE WATER, for the exhibit. Nobody has a boat. You have a boat. 🖼️',true);
    modal('🖼️ The shoreline from the water',`<p>Ruth Henderson has a list: the Riv dock, the lighthouse side of Eagle Island, the old ferry landing at Lyle Point. “We have a hundred photos from the land,” she says, “and none from where the island actually looks like an island.”</p>`,[
      {l:'Take the photos from the skiff: 2 hours',s:'0.6 gal. Friendship +2, reputation +2. A photo for your collection.',dis:!bxOk()||S.boat.fuel<0.6,fn:()=>{S.t+=120;phoneTick();S.boat.fuel=boatGal(S.boat.fuel-0.6);bxBeatDone('hendersons','hend',2,2,'photographed the island’s shoreline for the Henderson exhibit');adj('stress',-4);
        say('🖼️ You idle along the shore with your phone in a plastic bag: the dock, the madrona bluffs, a heron on a piling. Ruth prints your favorite at poster size.');
        try{if(typeof colPhotoAdd==='function')colPhotoAdd({k:'bx_shore',ic:'🖼️',t:'The island from the water',n:'For the Henderson exhibit',src:'story'})}catch(e){}
        fstText('hendersons','Framed. Yours is the best one. Don’t tell the others. 🖼️',true);afterAction()}},
      {l:'Not today',s:'She’ll find someone.',fn:()=>{BX().beat.hend=dayKey();say('🖼️ “Another time,” Ruth says, writing your name at the bottom of her list anyway.')}}])}});
Object.assign(TILE_META,{bx_sam_tow:['⛵','Sam needs a tow','info'],bx_hend_photos:['🖼️','Photos from the water','info']});
