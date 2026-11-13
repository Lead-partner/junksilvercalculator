import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COINS, coinOzt, nonnegative, faceToCount, countToFace, meltValue, dealerPays, offerPct, offerSentence, initialState, totals, encodeState, decodeState } from '../src/calc.js';
const near = (a, b, epsilon = 1e-10) => assert.ok(Math.abs(a - b) < epsilon, `${a} ≠ ${b}`);
for (const [i, expected] of [.0723, .1808, .3617, .7735, .1479, .0563].entries()) {
  test(`${COINS[i].name}: minted silver content to 4 dp`, () => assert.equal(Number(coinOzt(COINS[i], 1).toFixed(4)), expected));
}
test('$1 face of dimes is 0.7234 ozt', () => assert.equal(coinOzt(COINS[0], faceToCount(1, COINS[0])).toFixed(4), '0.7234'));
test('10 dimes at $30 are $21.70', () => assert.equal(meltValue(coinOzt(COINS[0], 10), 30).toFixed(2), '21.70'));
test('one Morgan at $48.83 is $37.77', () => assert.equal(meltValue(coinOzt(COINS[3], 1), 48.83).toFixed(2), '37.77'));
test('worn mode: $10 quarters are 7.15 ozt; other silver unaffected', () => {
  near(coinOzt(COINS[1], faceToCount(10, COINS[1]), true), 7.15);
  for (const c of COINS.slice(3)) near(coinOzt(c, 10, true), coinOzt(c, 10));
});
test('face/count round trip including partial coins in face mode', () => {
  for (const c of COINS) near(countToFace(faceToCount(1.15, c), c), 1.15);
  near(faceToCount(1.15, COINS[1]), 4.6);
  const state = initialState(); state.face = ['q']; state.amounts.q = 1.15;
  near(totals(state, 30).rows[1].count, 4.6);
});
test('dealer percentage and offer percentage', () => { near(dealerPays(100, 88), 88); near(offerPct(92, 100), 92); });
test('offer comparison wording', () => {
  assert.equal(offerSentence(92, 100), 'That offer is 92% of melt — above your 88% benchmark.');
  assert.equal(offerSentence(80, 100), 'That offer is 80% of melt — below your 88% benchmark.');
  assert.equal(offerSentence(88, 100), 'That offer is 88% of melt — equal to your 88% benchmark.');
  assert.equal(offerSentence(0, 0), 'Add coins first');
  assert.equal(offerSentence('', 10), 'Enter your offer to compare it with melt.');
});
test('empty, NaN, negative, infinite and malformed values never produce NaN', () => {
  for (const v of ['', undefined, null, NaN, -10, Infinity, 'oops']) {
    assert.equal(nonnegative(v), 0);
    assert.equal(coinOzt(COINS[0], v), 0);
    assert.equal(faceToCount(v, COINS[0]), 0);
    assert.equal(countToFace(v, COINS[0]), 0);
    assert.equal(meltValue(v, 30), 0);
    assert.equal(meltValue(10, v), 0);
    assert.equal(dealerPays(v, 88), 0);
    assert.equal(offerPct(88, v), 0);
    assert.equal(offerPct(v, 100), 0);
  }
});
test('URL state round trip and sanitization', () => {
  const state = initialState();
  Object.assign(state, { amounts: { d:120,q:1.15,h:14,m:6,k:2,n:0 }, face:['q','h'], pct:91, worn:true, spot:48.83, offer:123.45 });
  assert.deepEqual(decodeState(encodeState(state)), state);
  assert.deepEqual(decodeState(''), initialState());
  const bad = decodeState('?d=-3&q=oops&h=Infinity&f=x,q&pct=999&spot=NaN');
  assert.equal(bad.amounts.d + bad.amounts.q + bad.amounts.h, 0);
  assert.equal(bad.pct, 110); assert.deepEqual(bad.face, ['q']); assert.equal(bad.spot, null);
});
