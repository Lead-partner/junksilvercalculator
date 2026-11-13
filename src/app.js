import { COINS, decodeState, encodeState, nonnegative, rowCount, countToFace, totals, offerSentence } from './calc.js';
const $ = id => document.getElementById(id);
const root = $('calculator');
let state = decodeState(location.search);
let liveSpot = null;
let lastTotal = { melt: 0, ozt: 0 };
let urlTimer, announceTimer, undoTimer, snapshot;
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
const oz = n => n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const short = n => String(Number(n.toFixed(10)));
const readStore = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
function validSpot(data) {
  return data && Number.isFinite(data.usd_per_ozt) && data.usd_per_ozt > 5 && data.usd_per_ozt < 500 && Number.isFinite(Date.parse(data.fetched_at)) && Date.parse(data.fetched_at) <= Date.now() + 300000;
}
const spotTime = data => data?.source_time && Number.isFinite(Date.parse(data.source_time)) ? Date.parse(data.source_time) : Date.parse(data?.fetched_at);
const stale = data => Date.now() - spotTime(data) > 7200000;
const baked = JSON.parse(root.dataset.spot || 'null');
const saved = readStore('jsc-spot');
const available = [baked, saved].filter(validSpot).sort((a,b)=>spotTime(b)-spotTime(a));
liveSpot = available[0] || null;
function activeSpot() { return state.spot ?? liveSpot?.usd_per_ozt ?? 0; }
function writeURL() { clearTimeout(urlTimer); history.replaceState(null, '', `${location.pathname}?${encodeState(state)}${location.hash}`); }
function scheduleURL() { clearTimeout(urlTimer); urlTimer = setTimeout(writeURL, 250); }
function fitHero() {
  const hero = $('total-melt');
  const max = document.body.classList.contains('embed-page') ? 40 : innerWidth <= 700 ? 52 : innerWidth <= 1040 ? 52 : 72;
  hero.style.fontSize = `${Math.min(max, (hero.clientWidth - 2) / (hero.textContent.length * .61))}px`;
}
function renderPrice() {
  const manual = state.spot !== null;
  $('spot-figure').innerHTML = `${money(activeSpot())}<i>/oz</i>`;
  $('spot-label').textContent = manual ? 'Manual spot price' : 'Spot price';
  $('spot-time').textContent = manual ? 'Your price override' : liveSpot ? `updated ${new Date(spotTime(liveSpot)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Price unavailable';
  $('spot-time').title = manual ? 'Reset in Advanced to use the live price.' : liveSpot ? `${liveSpot.source} · ${new Date(spotTime(liveSpot)).toLocaleString()}` : 'Enter a manual price in Advanced.';
  $('stale').hidden = manual || !liveSpot || !stale(liveSpot);
  if ($('live-reset')) $('live-reset').disabled = !manual && !$('manual-spot').value;
}
function render(announce = true) {
  lastTotal = totals(state, activeSpot());
  for (const row of lastTotal.rows) $('melt-'+row.id).textContent = money(row.melt);
  $('total-melt').textContent = money(lastTotal.melt);
  $('total-oz').textContent = oz(lastTotal.ozt);
  if ($('dealer-value')) $('dealer-value').textContent = money(lastTotal.dealer);
  if ($('offer-result')) $('offer-result').textContent = offerSentence(state.offer, lastTotal.melt, state.pct);
  if ($('sticky-melt')) {
    $('sticky-melt').textContent = money(lastTotal.melt);
    $('sticky-oz').textContent = `${oz(lastTotal.ozt)} ozt`;
  }
  $('clear').disabled = !COINS.some(c => nonnegative(state.amounts[c.id]));
  if ($('pct-minus')) {
    $('pct-minus').disabled = state.pct <= 50;
    $('pct-plus').disabled = state.pct >= 110;
  }
  for (const c of COINS) {
    const row = root.querySelector(`[data-coin="${c.id}"]`);
    row.querySelector('[data-step="-1"]').disabled = nonnegative(state.amounts[c.id]) === 0;
    row.querySelector('[data-step="1"]').disabled = nonnegative(state.amounts[c.id]) >= 1e9;
  }
  renderPrice(); fitHero(); scheduleURL();
  if (announce) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { $('total-announcement').textContent = `Total melt ${money(lastTotal.melt)}, ${oz(lastTotal.ozt)} troy ounces.`; }, 600);
  }
}
function rowNote(c, message, error = false) {
  const input = $('coin-'+c.id), note = $('note-'+c.id);
  note.textContent = message; note.hidden = !message; note.classList.toggle('error', error);
  input.setAttribute('aria-invalid', String(error)); input.parentElement.classList.toggle('invalid', error);
}
function checkRow(c) {
  const raw = $('coin-'+c.id).value.trim();
  const face = state.face.includes(c.id);
  const valid = raw === '' || (face ? /^\d*\.?\d+$/.test(raw) || /^\d+\.$/.test(raw) : /^\d+$/.test(raw)) && Number(raw) <= 1e9;
  if (!valid) {
    state.amounts[c.id] = 0;
    rowNote(c, face ? 'Enter a face value from $0 to $1,000,000,000.' : 'Enter a whole coin count from 0 to 1,000,000,000.', true);
    return;
  }
  state.amounts[c.id] = nonnegative(raw, 1e9);
  const count = rowCount(state, c);
  rowNote(c, face && Math.abs(count - Math.round(count)) > 1e-7 ? `${money(Number(raw))} isn’t a multiple of ${money(c.face)}. Calculated as ${short(count)} coins.` : '');
}
function syncRows() {
  for (const c of COINS) {
    const input = $('coin-'+c.id), row = input.closest('.coin-row'), face = state.face.includes(c.id);
    input.value = short(state.amounts[c.id]); input.inputMode = face ? 'decimal' : 'numeric';
    input.setAttribute('aria-label', `${c.name} ${face ? 'face value in dollars' : 'count'}`);
    row.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.mode === 'face') === face)));
    row.querySelectorAll('[data-step]').forEach(b => b.setAttribute('aria-label', `${Number(b.dataset.step) > 0 ? 'Add' : 'Remove'} ${face ? money(c.face)+' face value in '+c.name : 'one '+c.singular}`));
    checkRow(c);
  }
}
for (const c of COINS) {
  const input = $('coin-'+c.id), row = input.closest('.coin-row');
  input.addEventListener('input', () => { checkRow(c); render(); });
  row.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
    const step = state.face.includes(c.id) ? c.face : 1;
    state.amounts[c.id] = Math.min(1e9, Math.max(0, Number((nonnegative(state.amounts[c.id]) + Number(button.dataset.step)*step).toFixed(10))));
    syncRows(); render();
  }));
  row.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    const toFace = button.dataset.mode === 'face';
    if (toFace === state.face.includes(c.id)) return;
    const count = rowCount(state, c);
    state.amounts[c.id] = toFace ? countToFace(count, c) : Math.round(count);
    state.face = toFace ? [...state.face, c.id] : state.face.filter(id => id !== c.id);
    syncRows(); render();
  }));
}
function setMore(open) {
  $('more-coins').hidden = !open;
  $('more-button').setAttribute('aria-expanded', String(open));
  $('more-button').querySelector('.sign').textContent = open ? '−' : '+';
}
$('more-button').addEventListener('click', () => setMore($('more-coins').hidden));
$('clear').addEventListener('click', event => {
  snapshot = { ...state.amounts };
  for (const c of COINS) state.amounts[c.id] = 0;
  syncRows(); render();
  $('toast').hidden = false; clearTimeout(undoTimer);
  if (event.detail === 0) $('undo').focus();
  undoTimer = setTimeout(() => {
    if (document.activeElement === $('undo')) $('more-button').focus();
    $('toast').hidden = true; snapshot = null;
  }, 5000);
});
$('undo').addEventListener('click', () => {
  if (!snapshot) return;
  state.amounts = snapshot; snapshot = null; clearTimeout(undoTimer);
  $('toast').hidden = true; syncRows(); render(); $('clear').focus();
});
if ($('pct')) {
  $('pct').value = state.pct;
  const updatePct = n => { state.pct = Math.max(50, Math.min(110, Math.round(Number(n) || 50))); };
  $('pct').addEventListener('input', () => {
    const raw = $('pct').value;
    updatePct(raw);
    const error = !/^\d+$/.test(raw) || Number(raw) < 50 || Number(raw) > 110;
    $('pct-error').hidden = !error; $('pct').setAttribute('aria-invalid', String(error)); $('pct').parentElement.classList.toggle('invalid', error);
    render();
  });
  for (const [id, step] of [['pct-minus',-1],['pct-plus',1]]) $(id).addEventListener('click', () => {
    updatePct(state.pct+step); $('pct').value = state.pct; $('pct-error').hidden = true;
    $('pct').setAttribute('aria-invalid','false'); $('pct').parentElement.classList.remove('invalid'); render();
  });
  $('offer').value = state.offer;
  $('offer').addEventListener('input', () => {
    const raw = $('offer').value.trim();
    const valid = raw === '' || /^\d*\.?\d+$/.test(raw) && Number(raw) <= 1e12;
    state.offer = raw === '' ? '' : valid ? nonnegative(raw) : '';
    $('offer-error').hidden = valid; $('offer').setAttribute('aria-invalid', String(!valid)); $('offer').parentElement.classList.toggle('invalid', !valid); render(false);
  });
  if (state.offer !== '') $('offer-details').open = true;
  $('worn').checked = state.worn;
  $('worn').addEventListener('change', () => { state.worn = $('worn').checked; render(); });
  $('manual-spot').value = state.spot ?? '';
  if (state.spot !== null || state.worn) $('advanced').open = true;
  $('manual-spot').addEventListener('input', () => {
    const raw = $('manual-spot').value.trim();
    const valid = raw === '' || /^\d*\.?\d+$/.test(raw) && Number(raw) > 0 && Number(raw) <= 1e6;
    $('spot-error').hidden = valid; $('manual-spot').setAttribute('aria-invalid',String(!valid)); $('manual-spot').parentElement.classList.toggle('invalid', !valid);
    if (valid) state.spot = raw === '' ? null : Number(raw);
    render();
  });
  $('live-reset').addEventListener('click', () => {
    state.spot = null; $('manual-spot').value = ''; $('spot-error').hidden = true;
    $('manual-spot').setAttribute('aria-invalid','false'); $('manual-spot').parentElement.classList.remove('invalid'); render(); refreshSpot();
  });
}
async function copy(text, button) {
  const original = button.textContent;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const area = document.createElement('textarea'); area.value = text; area.className = 'sr-only'; document.body.append(area); area.select();
      const ok = document.execCommand('copy'); area.remove(); button.focus(); if (!ok) throw Error('Copy unavailable');
    }
    button.textContent = 'Copied';
  } catch { button.textContent = 'Copy unavailable'; }
  setTimeout(() => { button.textContent = original; }, 2000);
}
$('copy-link')?.addEventListener('click', () => { writeURL(); copy(location.href, $('copy-link')); });
$('copy-embed')?.addEventListener('click', () => copy($('embed-code').value, $('copy-embed')));
async function getJSON(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000), cache: 'no-cache' });
  if (!response.ok) throw Error('Price unavailable');
  return response.json();
}
let refreshing = false;
async function refreshSpot() {
  if (refreshing) return;
  refreshing = true;
  let file = null;
  try {
    try {
      const candidate = await getJSON('/live/spot.json');
      if (validSpot(candidate)) file = candidate;
    } catch { /* Try the direct provider next. */ }
    if (!file || stale(file)) {
      try {
        const gold = await getJSON('https://api.gold-api.com/price/XAG');
        const candidate = { usd_per_ozt: Number(gold.price), source: 'gold-api.com', fetched_at: new Date().toISOString(), source_time: gold.updatedAt && Number.isFinite(Date.parse(gold.updatedAt)) ? new Date(gold.updatedAt).toISOString() : null };
        if (validSpot(candidate) && !stale(candidate)) file = candidate;
      } catch { /* The baked snapshot and last stored price still work offline. */ }
    }
    if (file && !stale(file)) liveSpot = file;
    else liveSpot = [file, baked, saved, liveSpot].filter(validSpot).sort((a,b) => spotTime(b)-spotTime(a))[0] || null;
    if (liveSpot) { try { localStorage.setItem('jsc-spot', JSON.stringify(liveSpot)); } catch { /* Storage may be disabled. */ } }
    render(false);
  } finally { refreshing = false; }
}
syncRows();
setMore(COINS.slice(4).some(c => state.amounts[c.id] > 0));
render(false);
root.dataset.ready = 'true';
new ResizeObserver(fitHero).observe($('total-melt'));
if ($('sticky-total')) {
  new IntersectionObserver(([entry]) => { $('sticky-total').hidden = entry.isIntersecting || entry.boundingClientRect.bottom > 0; }).observe($('result-card'));
}
window.addEventListener('pagehide', writeURL);
window.addEventListener('popstate', () => location.reload());
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshSpot(); });
setInterval(() => { if (!document.hidden) refreshSpot(); }, 300000);
refreshSpot();
