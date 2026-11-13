import { mkdir, cp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fetchSpot } from './fetch-spot.mjs';
import { home, embed, about, contact, notFound, SITE } from '../src/pages.mjs';
await mkdir('public', { recursive: true });
for (const file of await readdir('public')) if (file !== 'spot.json') await rm('public/'+file, { recursive:true, force:true });
const spot = await fetchSpot();
await cp('static', 'public', { recursive:true });
for (const file of ['app.js', 'calc.js']) await cp('src/'+file, 'public/'+file);
for (const [path, content] of [['index.html',home(spot)],['embed/index.html',embed(spot)],['about/index.html',about()],['contact/index.html',contact()],['404.html',notFound()]]) {
  await mkdir('public/'+path.slice(0, Math.max(0,path.lastIndexOf('/'))), { recursive:true });
  await writeFile('public/'+path, content+'\n');
}
await writeFile('public/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
await writeFile('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/about/','/contact/'].map(path=>`<url><loc>${SITE}${path}</loc></url>`).join('')}</urlset>\n`);
let jsGzip = 0;
for (const file of ['app.js','calc.js']) jsGzip += gzipSync(await readFile('public/'+file)).length;
if (jsGzip >= 15000) throw Error(`JS budget exceeded: ${jsGzip} bytes gzip`);
console.log(`Built public/ · runtime JS ${jsGzip} bytes gzip (limit 15,000)`);
