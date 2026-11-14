import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { decodeState, COINS, coinOzt } from '../src/calc.js';
import { GUIDES } from '../src/guides.mjs';
import { SITE } from '../src/pages.mjs';

const readPage = path => readFile('public'+path+'index.html','utf8');
const text = html => html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim();
const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m=>JSON.parse(m[1]));
const hrefs = html => [...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1].replace(/&amp;/g,'&'));
const cases = {
  'silver-quarter-value':[['/?q=1',{q:1},[]],['/?q=10&f=q',{q:10},['q']]],
  'silver-dime-value':[['/?d=1',{d:1},[]]],
  'silver-half-dollar-value':[['/?h=1',{h:1},[]],['/?k=1',{k:1},[]]],
  'silver-nickels':[['/?n=1',{n:1},[]]],
  'silver-dollar-melt-value':[['/?m=1',{m:1},[]]]
};

test('every sitemap URL exists, is canonical and carries the required metadata and navigation', async () => {
  const xml = await readFile('public/sitemap.xml','utf8');
  const entries = [...xml.matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod><\/url>/g)];
  assert.equal(entries.length,11);
  for (const [,loc,date] of entries) {
    assert.equal(date,'2026-11-14');
    const path = new URL(loc).pathname;
    assert.ok(path.endsWith('/'));
    const html = await readPage(path);
    assert.ok(html.includes(`<link rel="canonical" href="${SITE}${path}">`),path);
    assert.ok(html.includes('<meta name="msvalidate.01" content="8797DFC86988AA536C562F2F5A70B8DC">'),path);
    const title = text(html.match(/<title>(.*?)<\/title>/s)[1]);
    const description = text(html.match(/<meta name="description" content="([^"]+)"/)[1]);
    assert.ok(title.length<=60,`${path} title length ${title.length}`);
    assert.ok(description.length<=155,`${path} description length ${description.length}`);
    const header = html.match(/<header\b.*?<\/header>/s)[0];
    assert.doesNotMatch(header,/href="(?:\/)?#(?:how|faq|embed)"/);
    for(const target of ['/guides/','/how-we-calculate/','/embed-code/']) assert.ok(hrefs(header).includes(target),path+target);
    assert.match(header,/<details class="menu">/);
    const footer = html.match(/<footer\b.*?<\/footer>/s)[0];
    for(const target of ['/guides/','/how-we-calculate/','/embed-code/','/about/','/contact/']) assert.ok(hrefs(footer).includes(target));
    // Verify every internal link, including scripts, anchors and calculator prefills.
    for (const href of hrefs(html).filter(h=>h.startsWith('/')&&!h.startsWith('//'))) {
      const target = new URL(href,SITE);
      const file = 'public'+target.pathname+(target.pathname.endsWith('/')?'index.html':'');
      await access(file);
      if(target.hash) assert.match(await readFile(file,'utf8'),new RegExp(`id="${target.hash.slice(1)}"`));
    }
  }
});

for(const guide of GUIDES) test(`${guide.slug}: static article metadata, content, sources and calculator state`, async () => {
  const path = `/guides/${guide.slug}/`;
  const html = await readPage(path);
  assert.equal([...html.matchAll(/<h1\b/g)].length,1);
  const article = html.match(/<article>(.*?)<\/article>/s)[1];
  const intro = text(article.match(/<h1>.*?<\/h1><p>(.*?)<\/p>/s)[1]);
  assert.ok(intro.split(/\s+/).length<=60,intro);
  const sentenceCounter = new Intl.Segmenter('en-US',{granularity:'sentence'});
  for(const paragraph of article.matchAll(/<p(?: [^>]*)?>(.*?)<\/p>/gs)) {
    assert.ok([...sentenceCounter.segment(text(paragraph[1]))].length<=3,text(paragraph[1]));
  }
  const visible = text(article.replace(/<details>.*?<\/details>/gs,''));
  const words = visible.split(/\s+/).length;
  assert.ok(words>=500&&words<=900,`${words} visible words`);
  assert.doesNotMatch(html,/<script[^>]*src=/);
  assert.doesNotMatch(article,/\$\d+[.,]\d{2}\b/,'No fixed market values');
  assert.doesNotMatch(article,/affiliate|search volume|\/mo\b/i);
  assert.match(article,/collector|numismatic/i);
  assert.match(article,/rare dates, mint marks and condition/i);
  assert.ok(hrefs(article).includes('https://www.ngccoin.com/price-guide/united-states/'));
  assert.ok(hrefs(article).includes('https://www.pcgs.com/prices'));
  const json = schemas(html);
  const articleSchema = json.find(s=>s['@type']==='Article');
  assert.ok(articleSchema);
  assert.equal(articleSchema.headline,guide.h1);
  assert.equal(articleSchema.datePublished,'2026-11-14');
  assert.equal(articleSchema.dateModified,'2026-11-14');
  for(const key of ['author','publisher']) assert.deepEqual(articleSchema[key],{'@type':'Organization',name:'Lead Partner AS'});
  assert.equal(articleSchema.mainEntityOfPage['@id'],SITE+path);
  const crumb = json.find(s=>s['@type']==='BreadcrumbList');
  assert.deepEqual(crumb.itemListElement.map(i=>i.name),['Home','Guides',guide.h1]);
  assert.deepEqual(crumb.itemListElement.map(i=>i.position),[1,2,3]);
  assert.equal(crumb.itemListElement[2].item,SITE+path);
  const sources = article.match(/<section class="article-sources".*?<\/section>/s)[0];
  assert.ok(text(sources).includes('Checked 14 Nov 2026'));
  assert.ok(hrefs(sources).length>=2);
  assert.ok(hrefs(html).includes('/guides/'));
  assert.ok(guide.siblings.length>=2);
  for(const sibling of guide.siblings) assert.ok(hrefs(article).includes(`/guides/${sibling}/`));
  for(const [href,amounts,face] of cases[guide.slug]) {
    assert.ok(hrefs(article).includes(href),href);
    const state = decodeState(new URL(href,SITE).search);
    assert.deepEqual(state.amounts,Object.fromEntries(COINS.map(c=>[c.id,amounts[c.id]||0])));
    assert.deepEqual(state.face,face);
    assert.equal(state.spot,null);
    assert.equal(state.worn,false);
    for(const id of Object.keys(amounts)) assert.ok(article.includes(coinOzt(COINS.find(c=>c.id===id),1).toFixed(5)));
  }
});

test('guides index has a breadcrumb and all five guides; informational pages mark current navigation', async () => {
  const html = await readPage('/guides/');
  assert.match(html,/<h1>Junk silver guides<\/h1>/);
  assert.deepEqual(schemas(html)[0].itemListElement.map(i=>i.name),['Home','Guides']);
  for(const guide of GUIDES) assert.ok(hrefs(html).includes(`/guides/${guide.slug}/`));
  for(const path of ['/guides/','/how-we-calculate/','/embed-code/','/about/','/contact/']) {
    assert.ok((await readPage(path)).includes(`<a href="${path}" aria-current="page">`));
  }
  const embed = await readPage('/embed/');
  assert.match(embed,/<meta name="robots" content="noindex,follow">/);
  assert.doesNotMatch(await readFile('public/sitemap.xml','utf8'),/<loc>[^<]*\/embed\//);
});
