const { open, newGame, noErrors, assert } = require('./helpers');

// a game with a few friends, at home, Tuesday 11 AM
async function setup(page) {
  await newGame(page);
  await page.evaluate(() => {
    S.cur = 1; S.t = 1 * 1440 + 660; S.phoneT = S.t; S.loc = 'home'; S.phone = 100; S.stress = 50;
    S.friends.sam = { name: 'Sam, your new neighbor', lvl: 1, pts: 0, day: 0 };
    S.friends.fred = { name: 'Pajama Fred', lvl: 1, pts: 0, day: 0 };
    S.friends.walt = { name: 'Walt from the American Legion', lvl: 1, pts: 0, day: 0 };
    PH().calls = { log: [], vm: {}, next: S.t + 99999 };   // no surprise incoming calls
    render();
  });
}
const phoneText = page => page.textContent('#phoneUI');
// notification tiles sit above the phone (as on a real one); clear them so they don't catch the tap
const tap = async (page, text) => { await page.evaluate(() => { const b = document.getElementById('tiles'); if (b) b.innerHTML = ''; }); await page.locator('#phoneUI button', { hasText: text }).first().click(); };

module.exports = [
  { name: 'contacts render; night call rings out to voicemail', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => phoneOpen('phone'));
    const t = await phoneText(page);
    assert.match(t, /Contacts/); assert.match(t, /Island numbers/); assert.match(t, /Recents/);
    assert.match(t, /Sam/); assert.match(t, /Fred/); assert.match(t, /Walt/);
    await page.evaluate(() => { S.t = 1 * 1440 + 1400; S.phoneT = S.t; phoneRender(); });   // 11:20 PM
    await tap(page, 'Sam');
    assert.match(await phoneText(page), /Calling Sam/);
    assert.match(await phoneText(page), /Leave a voicemail/);
    const pts = await page.evaluate(() => S.friends.sam.pts);
    await tap(page, 'Leave a voicemail');
    const r = await page.evaluate(() => ({ pts: S.friends.sam.pts, social: (PH().social || {}).sam }));
    assert.ok(r.pts > pts && r.pts < pts + 1, 'small nudge');
    assert.strictEqual(r.social, undefined, 'voicemail does not use phoneSocial');
    await tap(page, 'Hang up');
    assert.match(await phoneText(page), /Contacts/);
    noErrors(errors);
  } },
  { name: 'daytime call connects; catching up lowers stress, points once per day', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => { window.phoneFriendAvail = () => 'ok'; phoneOpen('phone'); });
    await tap(page, 'Sam');
    assert.match(await phoneText(page), /picks up/);
    const t0 = await page.evaluate(() => S.t);
    await tap(page, 'Just catching up');
    let r = await page.evaluate(() => ({ stress: S.stress, pts: S.friends.sam.pts, t: S.t }));
    assert.strictEqual(r.stress, 45); assert.strictEqual(r.pts, 1); assert.ok(r.t - t0 >= 15);
    await tap(page, 'Hang up');
    await tap(page, 'Sam');
    await tap(page, 'Just catching up');
    r = await page.evaluate(() => ({ stress: S.stress, pts: S.friends.sam.pts }));
    assert.strictEqual(r.pts, 1, 'friend points only once per day');
    assert.ok(r.stress < 45);
    noErrors(errors);
  } },
  { name: 'Sam ride via call; Fred lvl 2 names the outage', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => { window.phoneFriendAvail = () => 'ok'; S.t = 1 * 1440 + 420; S.phoneT = S.t; S.friends.sam.lvl = 3; Math.random = () => 0.01; phoneOpen('phone'); });
    await tap(page, 'Sam');
    await tap(page, 'Ride to the ferry');
    assert.match(await phoneText(page), /Holler when you’re ready/);
    const ride = await page.evaluate(() => travelOpts('aiDock').some(o => /Ride with Sam/.test(o.l)));
    assert.ok(ride, 'Ride with Sam offered');
    await tap(page, 'Hang up');
    await page.evaluate(() => { S.friends.fred.lvl = 2; S.week.b = [{ start: S.t + 300, end: S.t + 600, cause: 'a cracked car ramp (repairs)' }]; phoneRender(); });
    await tap(page, 'Fred');
    await tap(page, 'Any word on the boat');
    assert.match(await phoneText(page), /a cracked car ramp/);
    assert.match(await phoneText(page), /Today, from about/);
    noErrors(errors);
  } },
  { name: 'incoming call: answer, or miss it and get a voicemail + badge', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => { window.phoneFriendAvail = () => 'ok'; Math.random = () => 0.1; PH().calls.next = S.t - 1; processTimed(); render(); });
    let r = await page.evaluate(() => ({ ring: !!PH().calls.ring, badge: phoneBadgeTotal() }));
    assert.ok(r.ring && r.badge >= 1, 'ringing with a badge');
    await page.evaluate(() => phoneOpen('phone'));
    assert.match(await phoneText(page), /is calling/);
    await tap(page, 'Answer');
    assert.match(await phoneText(page), /Just catching up/);
    await tap(page, 'Just catching up');
    assert.ok(await page.evaluate(() => Object.values(S.friends).some(f => f.pts >= 1)), 'chat gives points');
    await tap(page, 'Hang up');
    await page.evaluate(() => phoneClose());
    // a second call nobody answers
    await page.evaluate(() => { PH().calls.next = S.t - 1; processTimed(); S.t += 45; processTimed(); render(); });
    r = await page.evaluate(() => ({ ring: PH().calls.ring, log: PH().calls.log[0], badge: phoneBadgeTotal() }));
    assert.ok(!r.ring);
    assert.strictEqual(r.log.dir, 'missed'); assert.ok(r.log.vm, 'voicemail left'); assert.ok(r.badge >= 1);
    assert.match(await page.textContent('.phbtn'), /\d/);
    await page.evaluate(() => phoneOpen('phone'));
    await tap(page, 'Recents');
    assert.match(await phoneText(page), /Missed call/);
    await tap(page, 'Play voicemail');
    assert.strictEqual(await page.evaluate(() => phoneBadgeTotal()), 0);
    noErrors(errors);
  } },
  { name: 'island numbers: Gus opens his modal, the Riv reserves bingo on Wednesday; old actions gone', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    // the yard action is now a hint
    await page.evaluate(() => setTab('act'));
    const gusAct = page.locator('button.act', { hasText: 'Call Gus from your 📱 phone' });
    assert.ok(await gusAct.count(), 'hint shown'); assert.ok(await gusAct.first().isDisabled());
    await page.evaluate(() => phoneOpen('phone'));
    await tap(page, 'Island numbers');
    await tap(page, 'Gus, island handyman');
    await page.waitForSelector('.modal-bg');
    assert.match(await page.textContent('.modal-bg'), /Call Gus, the island handyman/);
    assert.strictEqual(await page.$('#phoneUI'), null, 'phone put away for the modal');
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); S.cur = 2; S.t = 2 * 1440 + 600; S.phoneT = S.t; render(); });
    assert.ok(!/Call the Riv/.test(await page.textContent('.content')), 'old Riv action gone');
    await page.evaluate(() => phoneOpen('phone'));
    await tap(page, 'Island numbers');
    await tap(page, 'The Riv');
    const r = await page.evaluate(() => ({ res: S.bingo.reserved, log: S.log.slice(-3).map(l => l.s).join(' ') }));
    assert.strictEqual(r.res, 2); assert.match(r.log, /You got it, hon/);
    assert.match(await phoneText(page), /reserved for tonight/);
    noErrors(errors);
  } },
];
