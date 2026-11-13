import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sources, normalizeSpot, fetchSpot, validPrice } from '../scripts/fetch-spot.mjs';
test('spot providers normalize to a consistent schema', () => {
  const date = new Date('2026-11-13T20:36:25Z');
  const data = [{ price:48.83,updatedAt:date.toISOString() }, { data:{ amount:'48.88' } }, [{ spreadProfilePrices:[{ bid:48.7,ask:48.9 }] }]];
  for (const [i, value] of data.entries()) {
    const result = normalizeSpot(sources[i],value,date);
    assert.equal(result.usd_per_ozt, [48.83,48.88,48.8][i]);
    assert.equal(result.fetched_at,date.toISOString());
    assert.equal(result.source_time,i===0?date.toISOString():null);
  }
  for (const price of [0,5,500,NaN,Infinity,-1]) assert.equal(validPrice(price),false);
  assert.throws(()=>normalizeSpot(sources[0],{ price:'bad' }));
});
test('fetch falls back in order and preserves the good file on complete failure', async () => {
  const dir = await mkdtemp(join(tmpdir(),'jsc-spot-'));
  const output = join(dir,'spot.json');
  const previous = '{"usd_per_ozt":48.83,"source":"gold-api.com","fetched_at":"2026-11-13T20:36:25Z","source_time":null}\n';
  try {
    await writeFile(output, previous);
    const calls = [];
    await fetchSpot({ output, warn:()=>{}, fetcher:async url => {
      calls.push(url);
      return { ok:true, json:async()=>url===sources[0].url ? { price:0 } : { data:{ amount:'49.25' } } };
    } });
    assert.deepEqual(calls, sources.slice(0,2).map(s=>s.url));
    const updated = await readFile(output,'utf8');
    assert.equal(JSON.parse(updated).usd_per_ozt,49.25);
    const warnings=[];
    await fetchSpot({ output, warn:msg=>warnings.push(msg), fetcher:async()=>{throw Error('offline');} });
    assert.equal(await readFile(output,'utf8'), updated);
    assert.equal(warnings.length,4);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
