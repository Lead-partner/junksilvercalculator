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
  'which-coins-are-silver':COINS.map(c=>[`/?${c.id}=1`,{[c.id]:1},[]]),
  'silver-quarter-value':[['/?q=1',{q:1},[]],['/?q=10&f=q',{q:10},['q']]],
  'silver-dime-value':[['/?d=1',{d:1},[]]],
  'silver-half-dollar-value':[['/?h=1',{h:1},[]],['/?k=1',{k:1},[]]],
  'silver-nickels':[['/?n=1',{n:1},[]]],
  'silver-dollar-melt-value':[['/?m=1',{m:1},[]]]
};

test('every sitemap URL exists, is canonical and carries the required metadata and navigation', async () => {
  const xml = await readFile('public/sitemap.xml','utf8');
  const entries = [...xml.matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod><\/url>/g)];
  assert.equal(entries.length,GUIDES.length+6);
  const titles = new Set(), descriptions = new Set();
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
    assert.ok(!titles.has(title),`${path} unique title`);
    assert.ok(!descriptions.has(description),`${path} unique description`);
    titles.add(title); descriptions.add(description);
    for(const [property,value] of [['title',title],['description',description],['url',loc]]) {
      const og = html.match(new RegExp(`<meta property="og:${property}" content="([^"]+)"`));
      assert.ok(og,`${path} og:${property}`);
      assert.equal(text(og[1]),value);
    }
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
  const withoutTable = text(article.replace(/<details>.*?<\/details>/gs,'').replace(/<table\b.*?<\/table>/gs,'')).split(/\s+/).length;
  assert.ok(words>=500&&(words<=900||(guide.slug==='which-coins-are-silver'&&withoutTable<=900)),`${words} visible words (${withoutTable} outside table)`);
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

test('guides index has a breadcrumb and every guide; informational pages mark current navigation', async () => {
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

test('silver identification reference lists sourced series and derives every specification from calculator coins', async () => {
  const html = await readPage('/guides/which-coins-are-silver/');
  const article = html.match(/<article>(.*?)<\/article>/s)[1];
  assert.equal([...article.matchAll(/<table\b/g)].length,1);
  assert.match(article,/<h2>What is junk silver\?<\/h2>/);
  assert.match(article,/<h2>Silver content of coins:/);
  assert.match(article,/<h2>Clad coins dated 1965 and later<\/h2>/);
  assert.match(article,/not every 1942 nickel is silver/i);
  assert.match(article,/regular circulating issues became copper-nickel clad in 1971/);
  const title = text(html.match(/<title>(.*?)<\/title>/s)[1]);
  assert.match(title,/what coins are silver/i);
  assert.doesNotMatch(title+' '+text(article.match(/<h1>(.*?)<\/h1>/)[1]),/junk silver calculator/i);
  const table = article.match(/<table\b.*?<\/table>/s)[0];
  const rows = [...table.matchAll(/<tr>(.*?)<\/tr>/gs)].slice(1).map(m=>m[1]);
  const expected = [
    ['Dime: Barber','1892–1916','d','silver-dime-value'],
    ['Dime: Mercury','1916–1945','d','silver-dime-value'],
    ['Dime: Roosevelt','1946–1964','d','silver-dime-value'],
    ['Quarter: Barber','1892–1916','q','silver-quarter-value'],
    ['Quarter: Standing Liberty','1916–1930','q','silver-quarter-value'],
    ['Quarter: Washington','1932–1964','q','silver-quarter-value'],
    ['Half dollar: Barber','1892–1915','h','silver-half-dollar-value'],
    ['Half dollar: Walking Liberty','1916–1947','h','silver-half-dollar-value'],
    ['Half dollar: Franklin','1948–1963','h','silver-half-dollar-value'],
    ['Half dollar: Kennedy','1964','h','silver-half-dollar-value'],
    ['Half dollar: Kennedy','1965–1970','k','silver-half-dollar-value'],
    ['Dollar: Morgan','1878–1904; 1921','m','silver-dollar-melt-value'],
    ['Dollar: Peace','1921–1928; 1934–1935','m','silver-dollar-melt-value'],
    ['Nickel: Jefferson wartime','Late 1942–1945','n','silver-nickels']
  ];
  assert.equal(rows.length,expected.length);
  for(const [index,[name,dates,id,slug]] of expected.entries()) {
    const cells = [...rows[index].matchAll(/<t[hd]\b[^>]*>(.*?)<\/t[hd]>/gs)].map(m=>text(m[1]));
    const coin = COINS.find(c=>c.id===id);
    assert.deepEqual(cells,[name+' Calculate',dates,coin.fine.toFixed(3),String(coin.weight),coinOzt(coin,1).toFixed(5)]);
    assert.ok(hrefs(rows[index]).includes(`/guides/${slug}/`));
    assert.ok(hrefs(rows[index]).includes(`/?${id}=1`));
  }
  for(const guide of GUIDES.filter(g=>g.slug!=='which-coins-are-silver')) {
    assert.ok(hrefs(await readPage(`/guides/${guide.slug}/`)).includes('/guides/which-coins-are-silver/'));
  }
});

test('war nickel targeting and dime/quarter wording preserve existing guide URLs and titles', async () => {
  const nickels = GUIDES.find(g=>g.slug==='silver-nickels');
  assert.match(nickels.title,/war nickels/i);
  assert.match(nickels.h1,/war nickels/i);
  assert.match(nickels.intro,/war nickels/i);
  for(const [slug,phrase,title] of [
    ['silver-dime-value','junk silver dimes','Silver Dime Value: Silver Years & Melt Content'],
    ['silver-quarter-value','junk silver quarters','Silver Quarter Value: Years, Content & Melt']
  ]) {
    assert.equal(GUIDES.find(g=>g.slug===slug).title,title);
    const article = (await readPage(`/guides/${slug}/`)).match(/<article>(.*?)<\/article>/s)[1];
    assert.equal(text(article).split(phrase).length-1,1);
  }
});
