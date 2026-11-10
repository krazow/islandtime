// ---------------- 🔎 job listings that change over time, and seasonal jobs ----------------
// S.jobsx = {key, open:[jobKeys], tip:{jobKey:true}, tipBy:{jobKey:name}, seen, tipKey}. Regenerated (lazily, so old saves
// just work) whenever the key changes: a new week, a new season, or a new story chapter (S.story is optional).
// Nightly: a listing may fill, another may open, and once a week a friend may tip you off about one ("word in": +10% odds).
// Seasonal jobs (JOBS[k].season) are only listed in their season; temporary ones (temp) end with it: jobSeasonEnd(notes).
const JOBX_OPEN=0.6, JOBX_SEASONAL=0.85, JOBX_FILL=0.12, JOBX_NEW=0.12, JOBX_TIP=0.25, JOBX_TIP_REP=35;
function jobListKey(){return `${S.weekNo}|${seasonId()}|${S.story&&S.story.ch!=null?S.story.ch:''}`}
// can this job be listed at all right now? (season, co-op; not "is it open")
function jobEligible(k){const J=JOBS[k];if(!J)return false;
  if(J.season&&!J.season.includes(seasonId()))return false;
  if(J.coop&&!(S.coop&&S.coop.open))return false;return true}
// jobs that could be listed for you: eligible, not your current job, not fired from in the last week
const jobListPool=()=>Object.keys(JOBS).filter(k=>k!==S.emp&&jobEligible(k)&&!jobCooling(k));
const jobListSort=ks=>Object.keys(JOBS).filter(k=>ks.includes(k));
function jobListGen(key){
  const pool=jobListPool(),open=pool.filter(k=>Math.random()<(JOBS[k].season?JOBX_SEASONAL:JOBX_OPEN));
  while(open.length<Math.min(2,pool.length))open.push(pick(pool.filter(k=>!open.includes(k))));
  const iv=S.interview&&S.interview.job; // an interview carried over from last week keeps its listing
  if(iv&&iv!==S.emp&&jobEligible(iv)&&!open.includes(iv))open.push(iv);
  return {key,open:jobListSort(open),tip:{},tipBy:{},seen:false,tipKey:null};
}
function jobListings(){
  const key=jobListKey();let X=S.jobsx;
  if(!X||typeof X!=='object'||X.key!==key)X=S.jobsx=jobListGen(key);
  if(!Array.isArray(X.open))X.open=[];if(!X.tip||typeof X.tip!=='object')X.tip={};if(!X.tipBy||typeof X.tipBy!=='object')X.tipBy={};
  return X;
}
// who tips you off: a friend at level 2+, or (with a good island reputation) any friend, or a neighbor
function jobTipFrom(){
  const fs=Object.keys(S.friends||{}).filter(id=>S.friends[id]&&(S.friends[id].lvl||1)>=2);
  const nm=id=>String(S.friends[id].name||'A friend').split(',')[0];
  if(fs.length)return nm(pick(fs));
  if(repVal()>=JOBX_TIP_REP){const any=Object.keys(S.friends||{});return any.length?nm(pick(any)):'A neighbor'}
  return null;
}
function jobListNight(notes){
  const X=jobListings(),tell=!S.emp||X.seen,iv=S.interview&&S.interview.job;
  if(Math.random()<JOBX_FILL){const can=jobOpenings().filter(k=>k!==iv);
    if(can.length){const k=pick(can);X.open=X.open.filter(x=>x!==k);delete X.tip[k];delete X.tipBy[k];
      if(tell)notes.push(`🔎 The listing for ${JOBS[k].n} is gone. Somebody else got it.`)}}
  if(Math.random()<JOBX_NEW){const can=jobListPool().filter(k=>!X.open.includes(k));
    if(can.length){const k=pick(can);X.open=jobListSort(X.open.concat(k));
      if(tell)notes.push(`🔎 New job listing: <b>${JOBS[k].n}</b>, ${$(JOBS[k].pay)}/day.`)}}
  if(X.tipKey!==X.key){const who=jobTipFrom();
    if(who){X.tipKey=X.key; // one roll a week, once someone's in a position to tip you
      const can=jobListPool().filter(k=>!X.open.includes(k));
      if(can.length&&Math.random()<JOBX_TIP){const k=pick(can),J=JOBS[k];X.open=jobListSort(X.open.concat(k));X.tip[k]=true;X.tipBy[k]=who;
        notes.push(`🤝 ${who} tips you off: “${J.n} is hiring. They haven’t even posted it yet. I put in a word for you.” It’s in the job listings now, with better interview odds.`)}}}
}
// temporary jobs end with their season (a story mode calls this between chapters; in normal games the season never changes)
function jobSeasonEnd(notes){
  const out=m=>{if(Array.isArray(notes))notes.push(m);else say(m)};
  if(S.interview&&JOBS[S.interview.job]&&!jobEligible(S.interview.job)){out(`📝 The interview for ${JOBS[S.interview.job].n} is off. That job was for last season.`);S.interview=null}
  const J=curJob();
  if(!J||!J.temp||!J.season||J.season.includes(seasonId()))return false;
  out(`👋 The season’s over, and so is <b>${J.n}</b>. It was always a temporary job. Your boss shakes your hand and says to come back next year. Time to check the job listings.`);
  S.emp=null;S.job=0;S.stats.layoffs=(S.stats.layoffs||0)+1;
  return true;
}
{const _up=upkeepNight;upkeepNight=function(where,notes,d){const r=_up(where,notes,d);try{jobListNight(notes)}catch(e){console.error(e)}return r}}
