import { readFileSync } from 'node:fs';
import { COINS, coinOzt } from './calc.js';
const e = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const credits = JSON.parse(readFileSync(new URL('../static/img/credits.json',import.meta.url)));
export const SERIES = [
 ['roosevelt','Roosevelt dime','1946–1964','d','silver-dime-value','1962 Denver example; portrait and torch reverse.'],
 ['mercury','Mercury dime','1916–1945','d','silver-dime-value','1943 Denver example; winged Liberty and fasces reverse.'],
 ['barber-dime','Barber dime','1892–1916','d','silver-dime-value','1892 example; Liberty and ONE DIME wreath reverse.'],
 ['washington','Washington quarter','1932–1964','q','silver-quarter-value','1944 San Francisco example; Washington and eagle reverse.'],
 ['barber-quarter','Barber quarter','1892–1916','q','silver-quarter-value','1903 proof example; Liberty and heraldic eagle reverse.'],
 ['standing-liberty','Standing Liberty quarter','1916–1930','q','silver-quarter-value','1926 example; standing Liberty and flying eagle reverse.'],
 ['kennedy-90','Kennedy half, 90%','1964','h','silver-half-dollar-value','1964 example; this date uses the 90% silver specification.'],
 ['kennedy-40','Kennedy half, 40%','1965–1970','k','silver-half-dollar-value','1967 example; the familiar design now uses 40% silver.'],
 ['franklin','Franklin half','1948–1963','h','silver-half-dollar-value','1963 Denver example; Franklin and Liberty Bell reverse.'],
 ['walking-liberty','Walking Liberty half','1916–1947','h','silver-half-dollar-value','1945 Denver example; walking Liberty and eagle reverse.'],
 ['barber-half','Barber half','1892–1915','h','silver-half-dollar-value','1907 Denver example; Liberty and heraldic eagle reverse.'],
 ['war-nickel','Jefferson war nickel','Late 1942–1945','n','silver-nickels','1945 Philadelphia example; large P above Monticello identifies the silver alloy.'],
 ['morgan','Morgan dollar','1878–1904; 1921','m','silver-dollar-melt-value','1889 example; Liberty and eagle with wreath reverse.'],
 ['peace','Peace dollar','1921–1928; 1934–1935','m','silver-dollar-melt-value','1921 example; radiate Liberty and resting eagle reverse.']
].map(([key,name,dates,id,guide,note])=>({key,name,dates,id,guide,note}));
export function photoCredits(key) {
 const rows=credits.filter(c=>c.id===key||c.id===key+'-obverse'||c.id===key+'-reverse');
 return rows.map(c=>`<a href="${e(c.filePage)}">${e(c.id.endsWith('-obverse')?'Obverse':c.id.endsWith('-reverse')?'Reverse':'Photo')}: ${e(c.author)}</a> · <a href="${e(c.licenseUrl)}">${e(c.license)}</a>`).join('; ');
}
export function picture(key,alt,width=960,height=480,small=false) {
 const sizes=small?'(max-width: 599px) calc(100vw - 64px), 360px':'(max-width: 700px) calc(100vw - 34px), 738px';
 return `<picture><source type="image/avif" srcset="/img/coins/${key}-480.avif 480w${small?'':`, /img/coins/${key}-960.avif 960w`}" sizes="${sizes}"><source type="image/webp" srcset="/img/coins/${key}-480.webp 480w${small?'':`, /img/coins/${key}-960.webp 960w`}" sizes="${sizes}"><img src="/img/coins/${key}-480.webp" alt="${e(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async"></picture>`;
}
export function coinFigure(key,small=false,link=false) {
 const s=SERIES.find(s=>s.key===key),c=COINS.find(c=>c.id===s.id);
 const media=picture(key,`${s.name}, obverse left and reverse right. ${s.note}`,960,480,small);
 return `<figure class="teaching-figure coin-figure">${link?`<a href="/guides/${s.guide}/" aria-label="Identify ${e(s.name)}">${media}</a>`:media}<figcaption><strong>${link?`<a href="/guides/${s.guide}/">${e(s.name)}</a>`:e(s.name)} · ${s.dates}.</strong> ${s.note} ${c.fine*100}% silver; ${coinOzt(c,1).toFixed(5)} troy oz at minted weight. <span class="image-credit">${photoCredits(key)}. Cropped and resized; backgrounds replaced.</span></figcaption></figure>`;
}
export function coinGrid(keys=SERIES.map(s=>s.key)) {return `<div class="coin-gallery">${keys.map(key=>coinFigure(key,true,true)).join('')}</div>`;}
export function dataFigure(name='silver-content') {
 const formula=name==='melt-formula';
 return `<figure class="teaching-figure data-figure"><img src="/img/${name}.svg" width="720" height="${formula?510:600}" alt="${formula?'Melt formula: coin count times gross grams times fineness, divided by 31.1034768 grams per troy ounce, times silver spot price.':'Minted silver per coin: dime '+coinOzt(COINS[0],1).toFixed(5)+', quarter '+coinOzt(COINS[1],1).toFixed(5)+', 90% half '+coinOzt(COINS[2],1).toFixed(5)+', dollar '+coinOzt(COINS[3],1).toFixed(5)+', 40% half '+coinOzt(COINS[4],1).toFixed(5)+', war nickel '+coinOzt(COINS[5],1).toFixed(5)+' troy ounces. Bars show silver fraction by weight.'}" loading="lazy" decoding="async"><figcaption>${formula?'Follow the units: gross grams become silver grams, then troy ounces, then melt value.':'Silver percentage is a fraction of weight; troy ounces also depend on coin weight. Bars show fineness, not ounces.'} Source: <a href="/how-we-calculate/">calculator specifications and NIST conversion</a>. Site diagram, <a href="https://opensource.org/license/mit">MIT</a>.</figcaption></figure>`;
}
export function mintmarkFigure(key) {
 const texts={
 'war-nickel':['The large P above Monticello marks this 1945 nickel as the 35% silver alloy.','https://www.ngccoin.com/news/article/999/'],
 'roosevelt':['On this silver-era Roosevelt dime, the D sits beside the bottom of the torch on the reverse.','https://www.ngccoin.com/news/article/12205/face-value-1982-dime/'],
 'washington':['On a 1932–1964 Washington quarter, look below the reverse wreath; this example shows S.','https://www.ngccoin.com/coin-explorer/united-states/quarters/washington-quarters-1932-1998/']
 };const [caption,source]=texts[key];
 return `<figure class="teaching-figure mintmark-figure"><img src="/img/${key}-mintmark.svg" width="720" height="540" alt="${e(caption)} A ring and arrow identify the mintmark." loading="lazy" decoding="async"><figcaption>${caption} Location: <a href="${source}">NGC text reference</a>. <span class="image-credit">${photoCredits(key)}. Cropped photograph with site annotation; original photo license retained.</span></figcaption></figure>`;
}
export function edgeFigure(){return `<figure class="teaching-figure">${picture('edge-test','Silver Walking Liberty half dollars on the left have light edges; clad half dollars on the right show brown copper stripes.',960,651)}<figcaption>Silver halves at left; copper-nickel clad halves at right show a copper stripe. Use edges as a clue, then confirm the date and issue; this does not establish purity for every coin. <span class="image-credit">${photoCredits('edge-test')}. Resized.</span></figcaption></figure>`;}
export const guideCoins = slug => SERIES.filter(s=>s.guide===slug).map(s=>s.key);
export const pageImage = path => `/img/og/${path==='/'?'home':path.replace(/^\/|\/$/g,'').replaceAll('/','-')}.png`;
