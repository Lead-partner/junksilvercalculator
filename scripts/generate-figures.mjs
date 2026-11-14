import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { COINS, TROY_GRAMS, coinOzt } from '../src/calc.js';
await mkdir('static/img',{recursive:true});
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>text{font-family:Arial,sans-serif;fill:#151A18}.muted{fill:#515A56}.bold{font-weight:700}</style><rect width="100%" height="100%" fill="#FBFBFA"/>${body}</svg>`;
const text=(x,y,s,cl='',size=24)=>`<text x="${x}" y="${y}" font-size="${size}" class="${cl}">${s}</text>`;
const names=['90% dime','90% quarter','90% half','Morgan / Peace','40% Kennedy','35% war nickel'];
await writeFile('static/img/silver-content.svg',svg(720,600,text(28,45,'Silver fraction ≠ silver weight','bold',30)+text(28,78,'Bar = percentage of gross weight · ozt = silver per coin','muted',21)+COINS.map((c,i)=>{
 const y=110+i*75;return text(28,y+24,names[i],'bold',24)+text(478,y+24,coinOzt(c,1).toFixed(5)+' ozt','',24)+`<rect x="28" y="${y+37}" width="360" height="14" fill="#E1EAE5"/><rect x="28" y="${y+37}" width="${360*c.fine}" height="14" fill="#1E4A38"/>`+text(402,y+51,`${c.fine*100}%`,'muted',20);
}).join('')+text(28,587,'Minted specifications; ounces rounded to 5 decimals.','muted',20)));
const steps=[['Coin count × gross weight','number of coins × grams per coin'],['× silver fineness','0.900, 0.400 or 0.350'],[`÷ ${TROY_GRAMS}`,'grams per troy ounce → silver ozt'],['× spot price per troy ounce','silver ozt × USD/ozt → melt in USD']];
await writeFile('static/img/melt-formula.svg',svg(720,510,text(28,43,'From a coin count to melt value','bold',30)+steps.map(([a,b],i)=>{
 const y=66+i*103;return `<rect x="28" y="${y}" width="664" height="80" fill="${i===3?'#E1EAE5':'#FBFBFA'}" stroke="#78817D"/>`+text(46,y+33,a,'bold',28)+text(46,y+61,b,'muted',22)+(i<3?`<path d="M360 ${y+83}v16m-6-6 6 6 6-6" fill="none" stroke="#1E4A38" stroke-width="2"/>`:'');
}).join('')+text(28,501,'Sum the melt values for the separate coin groups.','muted',22)));
// Normalized 480px reverse photos retain real mintmarks; SVG supplies only annotation.
const marks={
 'war-nickel':{x:235,y:96,label:'Large P above Monticello',sub:'1945 Philadelphia · 35% silver'},
 'roosevelt':{x:215,y:344,label:'D beside the torch base',sub:'1962 Denver · 90% silver'},
 'washington':{x:243,y:393,label:'S below the wreath',sub:'1944 San Francisco · 90% silver'}
};
for(const [key,m] of Object.entries(marks)) {
 const data=(await readFile(`static/img/coins/${key}-reverse-480.webp`)).toString('base64');
 await writeFile(`static/img/${key}-mintmark.svg`,svg(720,540,`<image href="data:image/webp;base64,${data}" x="120" y="45" width="480" height="480"/>`+`<circle cx="${m.x+120}" cy="${m.y+45}" r="20" fill="none" stroke="#FBFBFA" stroke-width="8"/><circle cx="${m.x+120}" cy="${m.y+45}" r="20" fill="none" stroke="#1E4A38" stroke-width="4"/>`+`<path d="M44 96H104L${m.x+97} ${m.y+45}" fill="none" stroke="#1E4A38" stroke-width="3"/>`+text(24,28,m.label,'bold',26)+text(24,535,m.sub,'muted',23)));
}
