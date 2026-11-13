import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export const sources = [
  { name: 'gold-api.com', url: 'https://api.gold-api.com/price/XAG', parse: data => ({ price: Number(data.price), time: data.updatedAt }) },
  { name: 'coinbase.com', url: 'https://api.coinbase.com/v2/prices/XAG-USD/spot', parse: data => ({ price: Number(data.data?.amount), time: null }) },
  { name: 'swissquote.com', url: 'https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAG/USD', parse: data => {
    const prices = data[0]?.spreadProfilePrices?.[0];
    return { price: (Number(prices?.bid) + Number(prices?.ask)) / 2, time: null };
  } }
];
export const validPrice = price => Number.isFinite(price) && price > 5 && price < 500;
export function normalizeSpot(source, data, now = new Date()) {
  const { price, time } = source.parse(data);
  if (!validPrice(price)) throw Error('Price outside sanity range (5–500 USD)');
  return { usd_per_ozt: price, source: source.name, fetched_at: now.toISOString(), source_time: time && Number.isFinite(Date.parse(time)) ? new Date(time).toISOString() : null };
}
export async function fetchSpot({ output = resolve('public/spot.json'), fetcher = fetch, warn = console.warn } = {}) {
  for (const source of sources) {
    try {
      const response = await fetcher(source.url, { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const spot = normalizeSpot(source, await response.json());
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output+'.tmp', JSON.stringify(spot, null, 2)+'\n');
      await rename(output+'.tmp', output);
      return spot;
    } catch (error) { warn(`Spot: ${source.name}: ${error.message}`); }
  }
  warn('Spot: all providers failed; keeping the existing price file unchanged.');
  try { return JSON.parse(await readFile(output, 'utf8')); } catch { return null; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const spot = await fetchSpot();
  if (spot) console.log(`Spot snapshot: $${spot.usd_per_ozt}/ozt (${spot.source})`);
}
