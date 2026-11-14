import { mkdir, cp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { contentPages } from '../src/content-pages.mjs';
import { fetchSpot } from './fetch-spot.mjs';
import { home, embed, about, contact, notFound, SITE } from '../src/pages.mjs';
await mkdir('public', { recursive: true });
for (const file of await readdir('public')) if (file !== 'spot.json') await rm('public/'+file, { recursive:true, force:true });
const spot = await fetchSpot();
await cp('static', 'public', { recursive:true });
for (const file of ['app.js', 'calc.js', 'embed-code.js']) await cp('src/'+file, 'public/'+file);
for (const [path, content] of [['index.html',home(spot)],['embed/index.html',embed(spot)],['about/index.html',about()],['contact/index.html',contact()],['404.html',notFound()],...contentPages.map(([path,render])=>[path.slice(1)+'index.html',render()])]) {
  await mkdir('public/'+path.slice(0, Math.max(0,path.lastIndexOf('/'))), { recursive:true });
  await writeFile('public/'+path, content+'\n');
}
await writeFile('public/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
await writeFile('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/about/','/contact/',...contentPages.map(([path])=>path)].map(path=>`<url><loc>${SITE}${path}</loc><lastmod>2026-11-14</lastmod></url>`).join('')}</urlset>\n`);
let jsGzip = 0;
for (const file of ['app.js','calc.js','embed-code.js']) jsGzip += gzipSync(await readFile('public/'+file)).length;
if (jsGzip >= 15000) throw Error(`JS budget exceeded: ${jsGzip} bytes gzip`);
console.log(`Built public/ · runtime JS ${jsGzip} bytes gzip (limit 15,000)`);
