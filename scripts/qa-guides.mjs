import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { launchChrome } from './chrome.mjs';
import { startServer } from './serve.mjs';
import { GUIDES } from '../src/guides.mjs';
import { COINS, coinOzt } from '../src/calc.js';

const output = '/workspace/gold-ira/free-apps/qa';
await mkdir(output,{recursive:true});
const {server,url} = await startServer();
const chrome = await launchChrome();
const checks = [];
const check = (label,value) => { assert.ok(value,label); checks.push(label); console.log('PASS '+label); };
const pages = [['home','/'],['guides','/guides/'],...GUIDES.map(g=>[g.slug,`/guides/${g.slug}/`]),['how-we-calculate','/how-we-calculate/'],['embed-code','/embed-code/']];
try {
  for(const [name,path] of pages) {
    for(const width of [320,390,768,1280]) {
      const page = await chrome.page(width,width===1280?900:844);
      await page.navigate(url+path,path==='/');
      const sizes = await page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');
      check(`${name}: no overflow at ${width}px (${sizes.scroll} ≤ ${sizes.width})`,sizes.scroll<=sizes.width);
      check(`${name}: no browser exceptions at ${width}px`,!page.errors.length);
      if(name==='which-coins-are-silver') check(`Reference table: numeric cells stay on one line at ${width}px`,await page.evaluate("[...document.querySelectorAll('.coin-reference td.n')].every(cell=>{const range=document.createRange();range.selectNodeContents(cell);return range.getClientRects().length===1})"));
      if(width===390||width===1280) await page.screenshot(`${output}/jsc-b3-${name}-${width}.png`);
      if(width<600) {
        await page.evaluate("document.querySelector('.menu summary').click()");
        check(`${name}: mobile menu opens at ${width}px`,await page.evaluate("document.querySelector('.menu').open && [...document.querySelectorAll('.menu nav a')].every(a=>{const r=a.getBoundingClientRect();return r.height>=44&&r.width>=44&&r.left>=0&&r.right<=innerWidth})"));
        check(`${name}: open menu has no overflow at ${width}px`,await page.evaluate('document.documentElement.scrollWidth<=innerWidth'));
        if(name==='home'&&width===390) await page.screenshot(`${output}/jsc-b3-menu-open-390.png`);
      }
      if(path!=='/'&&width===390) {
        await page.evaluate("[...document.querySelectorAll('main details')].forEach(d=>d.open=true)");
        check(`${name}: open article details have no overflow`,await page.evaluate('document.documentElement.scrollWidth<=innerWidth'));
      }
      await page.close();
    }
  }
  const menu = await chrome.page(390,844);
  await menu.command('Emulation.setScriptExecutionDisabled',{value:true});
  for(const [href,label] of [['/guides/','Guides'],['/how-we-calculate/','How it works'],['/embed-code/','Embed']]) {
    await menu.navigate(url+'/',false);
    // Real pointer events exercise native details and anchor navigation without JavaScript.
    async function click(selector) {
      const point = await menu.evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await menu.command('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
      await menu.command('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
    }
    await click('.menu summary');
    await click(`.menu a[href="${href}"]`);
    await menu.until(`location.pathname===${JSON.stringify(href)} && document.readyState==='complete'`);
    check(`No-JS mobile menu navigates to ${label}`,await menu.evaluate(`!!document.querySelector('.menu a[href="${href}"][aria-current="page"]')`));
  }
  await menu.close();
  for(const guide of GUIDES) {
    const page = await chrome.page(390,844);
    await page.navigate(url+`/guides/${guide.slug}/`,false);
    await page.evaluate("document.querySelector('article .button').click()");
    await page.until("location.pathname==='/' && document.getElementById('calculator')?.dataset.ready==='true'");
    for(const [id,count] of Object.entries(guide.expected)) check(`${guide.slug}: prefill reaches calculator with ${id}=${count}`,await page.evaluate(`document.getElementById('coin-${id}').value===${JSON.stringify(String(count))}`));
    check(`${guide.slug}: calculator produces silver content`,await page.evaluate("Number(document.getElementById('total-oz').textContent)>0"));
    if(guide.expected.n) check('War nickel prefill reveals extra rows',await page.evaluate("!document.getElementById('more-coins').hidden"));
    await page.close();
  }
  for(const coin of COINS) {
    const page = await chrome.page(390,844);
    await page.navigate(url+'/guides/which-coins-are-silver/',false);
    await page.evaluate(`document.querySelector('.coin-reference a[href="/?${coin.id}=1"]').click()`);
    await page.until("location.pathname==='/' && document.getElementById('calculator')?.dataset.ready==='true'");
    check(`Reference table: ${coin.id}=1 reaches correct calculator row`,await page.evaluate(`document.getElementById('coin-${coin.id}').value==='1'`));
    check(`Reference table: ${coin.id} produces matching silver quantity`,await page.evaluate(`Number(document.getElementById('total-oz').textContent)===${Number(coinOzt(coin,1).toFixed(3))}`));
    if(['k','n'].includes(coin.id)) check(`Reference table: ${coin.id} extra row is visible`,await page.evaluate("!document.getElementById('more-coins').hidden"));
    await page.close();
  }
  const copy = await chrome.page(390,844);
  await copy.navigate(url+'/embed-code/',false);
  await copy.command('Browser.grantPermissions',{origin:url,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  await copy.evaluate("document.getElementById('copy-embed').click()");
  await copy.until("document.getElementById('copy-status').textContent==='Embed code copied.'");
  check('Embed copy button writes the exact snippet',await copy.evaluate("navigator.clipboard.readText().then(value=>value===document.getElementById('embed-code').value)"));
  await copy.close();
  const data = {passed:checks.length,checks,pages:pages.map(([,path])=>path),widths:[320,390,768,1280]};
  await writeFile(`${output}/jsc-b3-report.json`,JSON.stringify(data,null,2)+'\n');
  console.log(`${checks.length} guide/browser checks passed; screenshots: ${output}/jsc-b3-*.png`);
} finally {
  await chrome.close();
  await new Promise(ok=>server.close(ok));
}
