// Mint specifications. Keep full precision until display formatting.
export const TROY_GRAMS = 31.1034768;
export const COINS = Object.freeze([
  { id: 'd', name: '90% Dimes', singular: 'dime', hint: '1964 and older', weight: 2.5, fine: .9, face: .10, worn: true },
  { id: 'q', name: '90% Quarters', singular: 'quarter', hint: '1964 and older', weight: 6.25, fine: .9, face: .25, worn: true },
  { id: 'h', name: '90% Half dollars', singular: 'half dollar', hint: '1964 and older', weight: 12.5, fine: .9, face: .50, worn: true },
  { id: 'm', name: 'Morgan / Peace dollars', singular: 'Morgan or Peace dollar', hint: '1878–1935 · select years', weight: 26.73, fine: .9, face: 1, worn: false },
  { id: 'k', name: '40% Kennedy halves', singular: 'Kennedy half', hint: '1965–1970', weight: 11.5, fine: .4, face: .50, worn: false },
  { id: 'n', name: '35% War nickels', singular: 'war nickel', hint: '1942–1945 · large mintmark above Monticello', weight: 5, fine: .35, face: .05, worn: false }
]);
export function nonnegative(value, max = 1e12) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
}
export function faceToCount(face, coin) { return nonnegative(face, 1e9) / coin.face; }
export function countToFace(count, coin) { return nonnegative(count, 1e9) * coin.face; }
export function coinOzt(coin, count, worn = false) {
  return nonnegative(count, 2e10) * (worn && coin.worn ? .715 * coin.face : coin.weight * coin.fine / TROY_GRAMS);
}
export function meltValue(ozt, spot) { return nonnegative(ozt) * nonnegative(spot, 1e6); }
export function dealerPays(melt, pct) { return nonnegative(melt, 1e18) * nonnegative(pct, 110) / 100; }
export function offerPct(offer, melt) { return nonnegative(melt, 1e18) ? nonnegative(offer, 1e18) / nonnegative(melt, 1e18) * 100 : 0; }
export function offerSentence(offer, melt, pct = 88) {
  if (!nonnegative(melt, 1e18)) return 'Add coins first';
  if (offer === '' || offer == null) return 'Enter your offer to compare it with melt.';
  const value = offerPct(offer, melt);
  const relation = Math.abs(value - pct) < 1e-9 ? 'equal to' : value > pct ? 'above' : 'below';
  // One decimal only when whole-number rounding would hide the comparison.
  const rounded = Math.round(value);
  const display = rounded === pct && relation !== 'equal to' ? value.toFixed(1) : rounded.toLocaleString('en-US');
  return `That offer is ${display}% of melt — ${relation} your ${pct}% benchmark.`;
}
export function initialState() {
  return { amounts: Object.fromEntries(COINS.map(c => [c.id, 0])), face: [], pct: 88, worn: false, spot: null, offer: '' };
}
export function rowCount(state, coin) {
  const amount = nonnegative(state.amounts[coin.id], 1e9);
  return state.face.includes(coin.id) ? faceToCount(amount, coin) : Math.floor(amount);
}
export function totals(state, spot) {
  const rows = COINS.map(coin => {
    const count = rowCount(state, coin);
    const ozt = coinOzt(coin, count, state.worn);
    return { id: coin.id, count, face: countToFace(count, coin), ozt, melt: meltValue(ozt, spot) };
  });
  const ozt = rows.reduce((sum, row) => sum + row.ozt, 0);
  const melt = meltValue(ozt, spot);
  return { rows, ozt, melt, dealer: dealerPays(melt, state.pct) };
}
export function encodeState(state) {
  const p = new URLSearchParams();
  for (const coin of COINS) p.set(coin.id, String(nonnegative(state.amounts[coin.id], 1e9)));
  p.set('f', COINS.filter(c => state.face.includes(c.id)).map(c => c.id).join(','));
  p.set('pct', String(Math.max(50, Math.min(110, Math.round(Number(state.pct) || 88)))));
  p.set('worn', state.worn ? '1' : '0');
  if (nonnegative(state.spot, 1e6)) p.set('spot', String(nonnegative(state.spot, 1e6)));
  if (state.offer !== '') p.set('offer', String(nonnegative(state.offer)));
  return p.toString();
}
export function decodeState(query) {
  const p = new URLSearchParams(query);
  const state = initialState();
  for (const coin of COINS) state.amounts[coin.id] = nonnegative(p.get(coin.id), 1e9);
  state.face = COINS.filter(c => (p.get('f') || '').split(',').includes(c.id)).map(c => c.id);
  state.pct = p.has('pct') ? Math.max(50, Math.min(110, Math.round(Number(p.get('pct')) || 88))) : 88;
  state.worn = p.get('worn') === '1';
  state.spot = nonnegative(p.get('spot'), 1e6) || null;
  state.offer = p.has('offer') ? nonnegative(p.get('offer')) : '';
  return state;
}
