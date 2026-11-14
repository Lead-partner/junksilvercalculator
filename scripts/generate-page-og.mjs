import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve,join } from 'node:path';
import { tmpdir } from 'node:os';
import { launchChrome } from './chrome.mjs';
import { GUIDES } from '../src/guides.mjs';
import { guideCoins, pageImage } from '../src/figures.mjs';
const scratch=await mkdtemp(join(tmpdir(),'jsc-page-og-'));
const font=(await readFile('static/fonts/barlow-600.woff2')).toString('base64');
const chrome=await launchChrome();
const cases=[['/','Junk Silver Calculator','Know the silver inside your U.S. coins','silver-content.svg'],['/guides/','Identify your silver coins','Check the design, date and alloy','coins/roosevelt-960.webp'],['/how-we-calculate/','How melt value is calculated','From minted weight to silver melt','melt-formula.svg'],['/embed-code/','Embed the silver melt tool','The same formula, on your website','melt-formula.svg'],...GUIDES.map(g=>[`/guides/${g.slug}/`,g.h1,'Identify first. Calculate silver melt.',`coins/${guideCoins(g.slug)[0]||'roosevelt'}-960.webp`])];
try{for(const [path,title,sub,file] of cases){
 const data=(await readFile('static/img/'+file)).toString('base64');const diagram=file.endsWith('svg');
 const body=`<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Barlow;src:url(data:font/woff2;base64,${font});font-weight:600}*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;background:#ECEEEC;color:#151A18;font-family:Barlow,sans-serif}.card{padding:40px 48px}.label{font-size:21px;color:#515A56;letter-spacing:1px}h1{font-size:56px;line-height:1.05;max-width:1080px;margin:16px 0 10px}p{font-size:27px;margin:0;color:#515A56}.figure{position:absolute;bottom:42px;right:48px;left:48px;height:300px;border:1px solid #78817D;background:#FBFBFA;display:flex;align-items:center;justify-content:center;overflow:hidden}.figure img{width:${diagram?'390px':'590px'};height:${diagram?'280px':'295px'};object-fit:contain}.note{position:absolute;left:28px;top:26px;font-size:23px;line-height:1.35;max-width:210px;color:#1E4A38}.url{position:absolute;bottom:13px;left:48px;font-size:17px;color:#515A56}</style><div class="card"><div class="label">JUNK SILVER CALCULATOR · REFERENCE GUIDE</div><h1>${title}</h1><p>${sub}</p><div class="figure"><div class="note">${diagram?'Calculation from<br>coin specifications':'Obverse + reverse<br>Real coin photos'}</div><img src="data:${diagram?'image/svg+xml':'image/webp'};base64,${data}"></div><div class="url">junksilvercalculator.net${path==='/'?'':path}</div></div>`;
 const local=join(scratch,'card.html');await writeFile(local,body);const page=await chrome.page(1200,630);await page.navigate('file://'+local,false);await page.evaluate('Promise.all([...document.images].map(i=>i.decode())).then(()=>true)');
 const output=resolve('static'+pageImage(path));await mkdir(resolve(output,'..'),{recursive:true});await page.screenshot(output);await page.close();console.log(output);
}}finally{await chrome.close();await rm(scratch,{recursive:true,force:true});}
