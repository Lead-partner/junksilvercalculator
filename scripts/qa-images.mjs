import assert from 'node:assert/strict';
import {stat,writeFile} from 'node:fs/promises';
import {launchChrome} from './chrome.mjs';
import {startServer} from './serve.mjs';
import {GUIDES} from '../src/guides.mjs';
const {server,url}=await startServer();const chrome=await launchChrome();const results=[];
const paths=['/','/guides/','/how-we-calculate/','/embed-code/',...GUIDES.map(g=>`/guides/${g.slug}/`)];
try{for(const path of paths)for(const width of [390,1280]){const p=await chrome.page(width,width===390?844:900);await p.navigate(url+path,path==='/');
 await p.evaluate("Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()})).then(()=>true)");
 const info=await p.evaluate(`({figures:document.querySelectorAll('main figure').length,images:[...document.querySelectorAll('main img')].map(i=>({src:new URL(i.currentSrc).pathname,above:i.getBoundingClientRect().top<innerHeight,loaded:i.complete&&i.naturalWidth>0})),lastCoin:document.querySelector('[data-coin="m"]')?.getBoundingClientRect().bottom,words:document.querySelector('main').textContent.trim().split(/\\s+/).length})`);
 for(const i of info.images)assert.ok(i.loaded,path+i.src);
 const unique=[...new Set(info.images.map(i=>i.src))];let total=0,above=0;
 for(const src of unique){const bytes=(await stat('public'+src)).size;total+=bytes;if(info.images.some(i=>i.src===src&&i.above))above+=bytes;}
 assert.ok(total<250000,`${path}: total image bytes ${total}`);assert.ok(above<60000,`${path}: first view image bytes ${above}`);
 results.push({path,width,figures:info.figures,images:info.images.length,uniqueImages:unique.length,totalImageBytes:total,aboveFoldImageBytes:above,...(path==='/'?{fourthCoinBottom:info.lastCoin}:{})});await p.close();
}
await writeFile('/workspace/gold-ira/free-apps/qa/jsc-b4-images.json',JSON.stringify(results,null,2)+'\n');console.log(results);
}finally{await chrome.close();await new Promise(ok=>server.close(ok));}
