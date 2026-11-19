// ✉️ Send in the feedback form: straight to Formspree (22-tutorial.js), checked against a fake endpoint
const { open, noErrors, assert } = require('./helpers');
const EP = 'https://formspree.io/f/testform';
const show = async page => { await page.evaluate(ep => { FB_ENDPOINT = ep; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); feedbackOpen(); }, EP); };

module.exports = [
  { name: 'feedback send: no endpoint, no Send button (GitHub and Copy as before)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { FB_ENDPOINT = ''; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); feedbackOpen(); });
    assert.strictEqual(await page.$('#fbSend'), null); assert.ok(await page.$('#fbLink')); assert.ok(await page.$('.fb-copy'));
    noErrors(errors);
  } },
  { name: 'feedback send: ✉️ Send posts the note, the kind, the game summary and an optional email to Formspree', fn: async ctx => {
    let got = null;
    await ctx.context.route(EP, async r => { got = { method: r.request().method(), headers: r.request().headers(), body: JSON.parse(r.request().postData() || '{}') };
      await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }); });
    const { page, errors } = await open(ctx);
    await show(page);
    await page.click('#fbSend');
    assert.match(await page.textContent('#fbMsg'), /Write a sentence or two first/); assert.strictEqual(got, null, 'nothing sent without a note');
    await page.click('#mbg label.fb-type:has-text("Idea")');
    await page.fill('#fbText', 'More ferries on Sunday, please.');
    await page.fill('#fbEmail', 'not an email');
    await page.click('#fbSend');
    assert.match(await page.textContent('#fbMsg'), /doesn’t look right/); assert.strictEqual(got, null);
    await page.fill('#fbEmail', 'tester@example.com');
    await page.click('#fbSend');
    await page.waitForFunction(() => /Sent/.test(document.getElementById('fbMsg').textContent));
    assert.strictEqual(got.method, 'POST'); assert.match(got.headers['content-type'], /json/);
    assert.strictEqual(got.body.type, 'Idea'); assert.strictEqual(got.body.message, 'More ferries on Sunday, please.');
    assert.strictEqual(got.body.email, 'tester@example.com'); assert.match(got.body.report, /Version: /); assert.match(got.body._subject, /^\[Idea\] More ferries/);
    assert.ok(await page.$eval('#fbSend', b => b.disabled), 'sent once');
    noErrors(errors);
  } },
  { name: 'feedback send: when it can’t be sent, it says so and points to Copy report', fn: async ctx => {
    await ctx.context.route(EP, r => r.fulfill({ status: 403, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":"Form not found"}' }));
    const { page, errors } = await open(ctx);
    await show(page);
    await page.fill('#fbText', 'A bug.');
    await page.click('#fbSend');
    await page.waitForFunction(() => /Couldn’t send/.test(document.getElementById('fbMsg').textContent));
    assert.match(await page.textContent('#fbMsg'), /Form not found.*Copy report/);
    assert.ok(!(await page.$eval('#fbSend', b => b.disabled)), 'can try again');
    noErrors(errors.filter(e => !/403/.test(e)));
  } },
];
