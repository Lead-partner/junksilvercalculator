import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { GUIDES } from '../src/guides.mjs';
import { SERIES } from '../src/figures.mjs';
const walk=async dir=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(dir+'/'+e.name):dir+'/'+e.name))).flat();
const attr=(tag,key)=>tag.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1];
const schemas=h=>[...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m=>JSON.parse(m[1]));
test('every built image/source resolves; images reserve dimensions and have descriptive alternatives',async()=>{
 for(const path of (await walk('public')).filter(p=>p.endsWith('.html'))){
  const h=await readFile(path,'utf8');
  for(const [tag] of h.matchAll(/<(?:img|source)\b[^>]*>/g)){
   for(const key of ['src','srcset']) for(const candidate of (attr(tag,key)||'').split(',').filter(Boolean)){
    const src=candidate.trim().split(/\s+/)[0];assert.ok(src.startsWith('/'),path+src);await access('public'+src);
   }
   if(tag.startsWith('<img')){assert.ok(attr(tag,'alt')?.trim(),path);for(const key of ['width','height'])assert.ok(Number(attr(tag,key))>0,path+key);}
  }
 }
});
test('guides have a lead real-photo pair and a separate in-body teaching figure',async()=>{
 for(const g of GUIDES){const h=await readFile(`public/guides/${g.slug}/index.html`,'utf8');
  assert.ok([...h.matchAll(/<figure\b/g)].length>=2,g.slug);
  assert.match(h,/<figure class="teaching-figure coin-figure">/);
  assert.match(h,/<figure class="teaching-figure (?:data|mintmark)-figure">/);
  assert.ok(h.indexOf('<figure')<h.indexOf('<h2>'),g.slug+' lead before body');
 }
 const grid=await readFile('public/guides/which-coins-are-silver/index.html','utf8');
 for(const s of SERIES)assert.ok(grid.includes(`/img/coins/${s.key}-480.webp`),s.key);
});
test('page-specific social images are 1200×630 and Article/WebApplication images are complete objects',async()=>{
 const paths=['/','/guides/','/how-we-calculate/','/embed-code/',...GUIDES.map(g=>`/guides/${g.slug}/`)];const used=new Set();
 for(const p of paths){const h=await readFile('public'+p+'index.html','utf8');const image=h.match(/property="og:image" content="([^"]+)"/)[1];assert.ok(!used.has(image),p+' unique OG');used.add(image);
  const file=await readFile('public'+new URL(image).pathname);assert.equal(file.readUInt32BE(16),1200);assert.equal(file.readUInt32BE(20),630);
  for(const key of ['width','height','alt']) assert.match(h,new RegExp(`property="og:image:${key}" content="[^"]+"`));
  assert.ok(h.includes(`name="twitter:image" content="${image}"`));
  assert.ok(schemas(h).some(s=>s.image?.['@type']==='ImageObject'),p+' structured image');
  for(const s of schemas(h).filter(s=>['Article','WebApplication'].includes(s['@type']))){assert.equal(s.image['@type'],'ImageObject');assert.equal(s.image.url,image);assert.equal(s.image.width,1200);assert.equal(s.image.height,630);assert.ok(s.image.caption);}
 }
});
test('sitemap image entries cover each content image and resolve to built files',async()=>{
 const xml=await readFile('public/sitemap.xml','utf8');assert.match(xml,/xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1.1"/);
 for(const [,entry] of xml.matchAll(/<url>(.*?)<\/url>/g)){
  const loc=entry.match(/<loc>(.*?)<\/loc>/)[1];const h=await readFile('public'+new URL(loc).pathname+'index.html','utf8');
  const images=[...entry.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(m=>new URL(m[1]).pathname);
  for(const [,src] of h.matchAll(/<img\b[^>]*src="([^"]+)"/g))assert.ok(images.includes(src),loc+src);
  for(const src of images)await access('public'+src);
 }
});
test('Commons metadata records approved licenses, both sides, attribution and visual review',async()=>{
 const credits=JSON.parse(await readFile('static/img/credits.json','utf8'));
 for(const s of SERIES){const rows=credits.filter(c=>c.id===s.key||c.id===s.key+'-obverse'||c.id===s.key+'-reverse');assert.equal(rows.length,['barber-dime','peace'].includes(s.key)?1:2,s.key);
  for(const c of rows){assert.match(c.license,/^(Public domain|CC0|CC BY(?:-SA)? \d)/);assert.match(c.filePage,/^https:\/\/commons.wikimedia.org\/wiki\/File:/);assert.ok(c.author&&c.licenseUrl&&c.changes&&c.visualQA);}
 }
});
test('home text expansion and visible FAQ match the structured data',async()=>{
 const h=await readFile('public/index.html','utf8');const main=h.match(/<main\b[^>]*>(.*?)<\/main>/s)[1];
 const words=main.replace(/<[^>]*>/g,' ').replace(/&[^;]+;/g,' ').trim().split(/\s+/).length;assert.ok(words>=1608&&words<=2108,`${words} words vs baseline 608`);
 const faq=schemas(h).find(s=>s['@type']==='FAQPage');const visible=[...main.match(/<section class="faq".*?<\/section>/s)[0].matchAll(/<summary>(.*?)<\/summary><p>(.*?)<\/p>/g)];assert.equal(faq.mainEntity.length,visible.length);
 faq.mainEntity.forEach((q,i)=>{assert.equal(q.name,visible[i][1]);assert.equal(q.acceptedAnswer.text,visible[i][2]);});
});
