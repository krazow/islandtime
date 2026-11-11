// ---- 🥫 the Legion food pantry (Hard only: LV('pantry')) ----
// When you're broke (under PANTRY_BROKE) the American Legion Hall hands out a food box: PANTRY_DAYS days of food,
// once a week, 10 AM to 6 PM, plus this week's prescription from the Legion relief fund if you haven't picked it up.
// You can't starve or go without your meds on Hard any more, but asking costs a little pride (stress).
// State (lazy, so old saves load): S.pantryWk = the weekNo of the last box.
const PANTRY_BROKE=25, PANTRY_DAYS=5, PANTRY_OPEN=[600,1080];
const pantryOn=()=>!!S&&LV('pantry')>0;
const pantryBroke=()=>S.money<PANTRY_BROKE;
const pantryUsed=()=>S.pantryWk===(S.weekNo||0);
const pantryOpenNow=()=>{const m=tod();return m>=PANTRY_OPEN[0]&&m<PANTRY_OPEN[1]};
function pantryTake(){
  if(!pantryOn()||!pantryBroke()||pantryUsed())return;
  S.pantryWk=S.weekNo||0;S.carried=(S.carried||0)+PANTRY_DAYS;S.t+=20;S.stats.pantry=(S.stats.pantry||0)+1;adj('stress',3);
  const rx=!S.rx;if(rx){S.rx=true;S.stats.pantryRx=(S.stats.pantryRx||0)+1}
  say(`🥫 Walt carries a box out from the back room: canned chili, rice, peanut butter, a bag of apples from somebody’s tree. “Nobody here keeps score,” he says. +${PANTRY_DAYS} days of food (it goes in the pantry when you get home).${rx?' Taped to the lid: your prescription, picked up in Lakewood on the Legion relief fund’s account.':''}`);
  afterAction()}
{const _a=actions;actions=function(){const a=_a.apply(this,arguments);try{
  if(pantryOn()&&S.loc==='legion'&&pantryBroke()){
    if(pantryUsed())a.push({ic:'🥫',l:'Legion food pantry',s:'You already picked up this week’s box. Next box on Monday.',dis:true});
    else if(!pantryOpenNow())a.push({ic:'🥫',l:'Legion food pantry',s:'Open 10 AM to 6 PM.',dis:true});
    else a.push({ic:'🥫',l:`Pick up a food box: ${PANTRY_DAYS} days of food`,s:`Free, once a week, when you’re under ${$(PANTRY_BROKE)}.${S.rx?'':' Includes this week’s prescription.'} 20 min.`,cls:'primary',fn:pantryTake});
  }}catch(e){console.error(e)}return a}}
{const _t=todoItems;todoItems=function(){const it=_t.apply(this,arguments);try{
  if(pantryOn()&&pantryBroke()&&!pantryUsed()&&(S.pantry+(S.carried||0))<3)
    it.push({ok:false,fail:false,l:'Get food from the Legion pantry',s:`🥫 You’re nearly out of food and money. The Legion hands out a free ${PANTRY_DAYS}-day food box once a week, 10 AM to 6 PM${S.rx?'':', with your prescription'}.`,urgent:true});
  }catch(e){}return it}}
