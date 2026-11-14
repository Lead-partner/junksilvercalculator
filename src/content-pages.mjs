import { SITE, head, header, footer, escape, how, snippet } from './pages.mjs';
import { coinFigure, coinGrid, dataFigure, mintmarkFigure, guideCoins } from './figures.mjs';
import { GUIDES, guideList, sourceList, DATE } from './guides.mjs';

export function breadcrumbs(items) {
  return { '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement:[['Home','/'],...items].map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:SITE+path})) };
}
const trail = label => `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/guides/">Guides</a> / <span aria-current="page">${label}</span></nav>`;
function page(title,description,path,body,schema = [],scripts = '') {
  return head(title,description,path,false,false,schema)+`<body>${header(path)}<main id="main" class="page wrap">${body}</main>${footer(path)}${scripts}</body></html>`;
}
export function guidesIndex() {
  return page('Junk silver guides','Identify US silver coins, check their silver content, and calculate melt value with guides to quarters, dimes, half dollars, war nickels and dollars.','/guides/',`<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <span aria-current="page">Guides</span></nav><h1>Junk silver guides</h1><p>Check coin dates and silver content, then open a prefilled melt calculation.</p>${guideList()}<h2>Compare the designs, then check the date</h2>${coinGrid(['roosevelt','washington','kennedy-90','kennedy-40','war-nickel','morgan'])}`,[breadcrumbs([['Guides','/guides/']])]);
}
export function guidePage(guide) {
  const path = `/guides/${guide.slug}/`;
  const organization = {'@type':'Organization',name:'Lead Partner AS'};
  const schema = [
    {'@context':'https://schema.org','@type':'Article',headline:guide.h1,datePublished:DATE,dateModified:DATE,author:organization,publisher:organization,mainEntityOfPage:{'@type':'WebPage','@id':SITE+path}},
    breadcrumbs([['Guides','/guides/'],[guide.h1,path]])
  ];
  const keys=guideCoins(guide.slug);
  const lead=coinFigure(keys[0]||'roosevelt');
  const mintmark={ 'silver-dime-value':'roosevelt','silver-quarter-value':'washington','silver-nickels':'war-nickel' }[guide.slug];
  const teaching=mintmark?mintmarkFigure(mintmark):dataFigure(guide.slug==='silver-dollar-melt-value'?'melt-formula':'silver-content');
  const extra=guide.slug==='which-coins-are-silver'?`<h2>A photo reference for the silver series</h2><p>Obverse is at left and reverse at right in each pair. Match the dates as well as the design; photographs are shown at a consistent display size, not at relative physical scale.</p>${coinGrid()}`:keys.length>1?`<h2>Recognize the other designs</h2>${coinGrid(keys.slice(1))}`:'';
  const body=guide.body.replace('</table>',`</table>${teaching}`);
  return page(guide.title,guide.description,path,`${trail(guide.h1)}<article><h1>${guide.h1}</h1><p>${guide.intro}</p><p><a class="button" href="${escape(guide.prefill)}">Open the calculator with this pre-filled</a></p>${lead}${body}${extra}<section class="related" aria-labelledby="related-title"><h2 id="related-title">Related guides</h2>${guideList(false,guide.siblings)}<p><a href="/guides/">All junk silver guides</a> · <a href="/">Open the calculator</a></p></section>${sourceList(guide.sources)}</article>`,schema);
}
export function calculationPage() {
  return page('How We Calculate Silver Melt Value','Our silver melt formulas, coin specifications, rounding, optional wear allowance and spot-price sources.','/how-we-calculate/',`<h1>How we calculate silver melt value</h1><p>We calculate silver content from each coin’s minted weight and fineness, then multiply that content by the displayed silver spot price. Melt is a metal reference; it does not include collectible premiums or promise a dealer offer.</p>${dataFigure('melt-formula')}${how()}${dataFigure()}<h2>Coin specifications</h2><p>Coin weights and fineness are cross-checked against <a href="https://www.ngccoin.com/price-guide/coin-melt-values.aspx">NGC’s silver coin table</a>. The <a href="https://www.govinfo.gov/content/pkg/STATUTE-79/pdf/STATUTE-79-Pg254.pdf">Coinage Act of 1965</a> specifies the clad dime and quarter and the reduced-silver half dollar.</p><p>We use 31.1034768 grams per troy ounce, as listed in <a href="https://nvlpubs.nist.gov/nistpubs/Legacy/MP/nbsmiscellaneouspub286.pdf">NIST’s weight conversion tables</a>. The calculator keeps the unrounded silver quantities until display.</p><h2>Silver price sources</h2><p>The build and scheduled price collection try <a href="https://gold-api.com/">gold-api.com</a>, then <a href="https://api.coinbase.com/v2/prices/XAG-USD/spot">Coinbase</a> and <a href="https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAG/USD">Swissquote</a> as fallbacks. The price file refresh is scheduled every 15 minutes.</p><p>While visible, the calculator checks for a refreshed price every 5 minutes. It tries gold-api.com directly if the price file is unavailable or more than 2 hours old. Old prices are marked “may be stale”; a manual spot price can be entered in Advanced.</p><h2>Dealer estimates and offers</h2><p>The dealer percentage is your assumption. “Got an offer? Check it” compares your entered offer against melt and your chosen percentage; neither feature supplies a dealer quote.</p><h2>Check collector value separately</h2><p>Rare dates, mint marks and condition can make collector or numismatic value much higher than melt. Consult the <a href="https://www.ngccoin.com/price-guide/united-states/">NGC price guide</a> or <a href="https://www.pcgs.com/prices">PCGS price guide</a> before selling.</p><p><a class="button" href="/">Open the calculator</a></p><p><a href="/guides/">Find a guide for your coin</a>.</p>${sourceList(['melt','act','units','wear','guide'])}`,[breadcrumbs([['How it works','/how-we-calculate/']])]);
}
export function embedCodePage() {
  return page('Embed the Silver Melt Tool','Copy the iframe snippet to add our compact silver melt tool to your website, and preview the embedded version.','/embed-code/',`<h1>Embed the silver melt tool</h1><p>Copy this HTML into a page on your website to add the compact tool. The iframe uses the same silver-content calculation as the main calculator.</p><label class="label" for="embed-code">HTML snippet</label><textarea id="embed-code" rows="8" readonly spellcheck="false">${escape(snippet)}</textarea><p class="embed-actions"><button type="button" class="button secondary" id="copy-embed">Copy embed code</button></p><p id="copy-status" role="status"></p><h2>What the embedded tool calculates</h2>${dataFigure('melt-formula')}<h2>Preview before publishing</h2><p><a href="/embed/">Open the iframe preview</a> to check the compact layout. The snippet sets a maximum width of 480 pixels and a height of 560 pixels; adjust the height if your layout needs more room.</p><p>The preview opens as its own page. On your website it appears inside the iframe, with a link back to the full calculator.</p><p>Keep the attribution link with the snippet. The embedded version is excluded from indexing; this page is the shareable embed instructions page.</p><p><a href="/how-we-calculate/">Read how it works</a> or <a href="/">open the full calculator</a>.</p>`,[breadcrumbs([['Embed','/embed-code/']])],'<script type="module" src="/embed-code.js"></script>');
}
export const contentPages = [
  ['/guides/',guidesIndex], ['/how-we-calculate/',calculationPage], ['/embed-code/',embedCodePage],
  ...GUIDES.map(guide=>[`/guides/${guide.slug}/`,()=>guidePage(guide)])
];
