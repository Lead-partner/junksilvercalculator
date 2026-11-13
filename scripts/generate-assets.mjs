import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { launchChrome } from './chrome.mjs';
const chrome = await launchChrome();
const scratch = await mkdtemp(join(tmpdir(),'jsc-assets-'));
const fonts = await Promise.all(['barlow-600','plex-500'].map(async name => `data:font/woff2;base64,${(await readFile(`static/fonts/${name}.woff2`)).toString('base64')}`));
const css = `@font-face{font-family:Barlow;src:url(${fonts[0]});font-weight:600}@font-face{font-family:Plex;src:url(${fonts[1]});font-weight:500}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{background:#ECEEEC;color:#151A18;font-family:Barlow,sans-serif}`;
async function png(name, width, height, body) {
  const file = join(scratch,name+'.html');
  await writeFile(file,`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${body}</body></html>`);
  const output = resolve('static/'+name+'.png');
  const page = await chrome.page(width,height);
  await page.navigate('file://'+file,false);
  await page.screenshot(output);
  await page.close();
  const buffer=await readFile(output);
  if (buffer.readUInt32BE(16)!==width || buffer.readUInt32BE(20)!==height) throw Error('Incorrect PNG dimensions');
  console.log(`Generated ${name}.png · ${width}×${height}`);
}
try {
  await png('og',1200,630,`<div style="padding:48px 56px;height:100%"><div style="display:flex;align-items:center;gap:16px;font-size:24px;letter-spacing:1px;text-transform:uppercase"><span style="display:grid;place-items:center;border:2px solid #151A18;border-radius:2px;width:44px;height:44px;font:500 20px Plex;text-transform:none">Ag</span>Junk Silver Calculator</div><div style="display:flex;gap:36px;align-items:center;margin-top:44px"><div style="width:530px"><h1 style="font-size:64px;line-height:1.05;margin:0 0 24px;letter-spacing:-1px">Count your coins.<br>See their silver value.</h1><p style="font-size:25px;line-height:1.4;margin:0;color:#515A56">Dimes · Quarters · Half dollars<br>Morgan &amp; Peace dollars</p><div style="width:64px;height:4px;background:#1E4A38;margin-top:28px"></div></div><div style="width:510px;padding:30px 32px 34px;background:#141A17;color:#EEF2EE;border:1px solid #141A17;border-radius:4px;box-shadow:inset 0 0 0 4px #141A17,inset 0 0 0 5px #3A443F"><div style="font-size:16px;letter-spacing:2px;color:#A7B2AC">SILVER MELT VALUE</div><div style="font:500 72px/1.4 Plex;letter-spacing:-3px">$1,281.09</div><div style="height:18px;margin:14px 0 24px;border-bottom:1px solid #A7B2AC;background:repeating-linear-gradient(90deg,#A7B2AC 0 1px,transparent 1px 10px) left bottom/100% 8px no-repeat"></div><div style="display:flex;justify-content:space-between;font-size:18px;color:#A7B2AC"><span>COIN SHEET → MELT</span><span>EXAMPLE · USD</span></div></div></div><p style="margin-top:48px;font:500 17px Plex;color:#515A56">junksilvercalculator.net</p></div>`);
  for (const [name,size] of [['favicon-32',32],['apple-touch-icon',180]]) {
    await png(name,size,size,`<div style="display:grid;place-items:center;height:100%;background:#1E4A38;color:#EEF2EE;font:500 ${size*.48}px Plex;border:${size*.07}px solid #1E4A38;box-shadow:inset 0 0 0 ${Math.max(1,size*.012)}px #A7B2AC">Ag</div>`);
  }
  await writeFile('static/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="2" fill="#1E4A38"/><rect x="2.5" y="2.5" width="27" height="27" rx="1" fill="none" stroke="#A7B2AC"/><text x="16" y="21" text-anchor="middle" font-family="monospace" font-size="16" font-weight="500" fill="#EEF2EE">Ag</text></svg>\n');
} finally { await chrome.close(); await rm(scratch,{recursive:true,force:true}); }
