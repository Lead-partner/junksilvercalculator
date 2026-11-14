import { mkdir, writeFile } from 'node:fs/promises';
import { launchChrome } from './chrome.mjs';
import { startServer } from './serve.mjs';
import { GUIDES } from '../src/guides.mjs';

// Run against built pages in real Chrome. Borders on controls use their local
// form/grid geometry; card frames must use the shared page/reading/hero columns.
// Unknown rules are findings even when their endpoints happen to align.
function inspectLines() {
  const tolerance = 1.1;
  const near = (a,b) => Math.abs(a-b) <= tolerance;
  const box = e => { const r=e.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}; };
  const contentBox = e => { const r=box(e),s=getComputedStyle(e); return {...r,left:r.left+parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth),right:r.right-parseFloat(s.paddingRight)-parseFloat(s.borderRightWidth)}; };
  const selector = e => {
    const parts=[];
    for(let node=e;node&&node!==document.body;node=node.parentElement) {
      if(node.id){parts.unshift('#'+node.id);break;}
      if(node.dataset.coin){parts.unshift(`[data-coin="${node.dataset.coin}"]`);break;}
      parts.unshift(node.tagName.toLowerCase()+[...node.classList].map(c=>'.'+c).join('')+`:nth-child(${[...node.parentElement.children].indexOf(node)+1})`);
    }
    return parts.join('>');
  };
  const visible = e => { for(const d of document.querySelectorAll('details:not([open])')) if(d!==e&&d.contains(e)&&!d.querySelector(':scope>summary')?.contains(e))return false; const s=getComputedStyle(e),r=e.getBoundingClientRect(); return s.visibility==='visible'&&s.display!=='none'&&Number(s.opacity)>0&&r.width>0&&r.height>0&&e.getClientRects().length>0; };
  const main=document.querySelector('main');
  const container=contentBox(document.querySelector('.wrap')||main);
  const issues=[];
  const columns=[{name:'container',...container}];
  const measure=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--measure'));
  columns.push({name:'reading',left:container.left,right:Math.min(container.right,container.left+measure)});
  for(const e of document.querySelectorAll('.tool,.coin-gallery')) {
    const r=contentBox(e),s=getComputedStyle(e);
    const tracks=s.display==='grid'?s.gridTemplateColumns.split(' ').map(Number.parseFloat):[r.right-r.left];
    let left=r.left;
    for(const [i,width] of tracks.entries()) {
      columns.push({name:selector(e)+':column-'+i,left,right:left+width});
      left+=width+(parseFloat(s.columnGap)||0);
    }
  }
  for(const e of document.querySelectorAll('.home-reading,.page.wrap>*')) {
    const r=box(e);
    if(visible(e)&&(!near(r.left,container.left)||r.right>Math.min(container.right,container.left+measure)+tolerance))issues.push({type:'reading-column-mismatch',selector:selector(e),...r});
  }
  const edges=[...new Set(columns.flatMap(c=>[c.left,c.right]))];
  // Use Range rects, which measure glyph runs rather than padded line boxes.
  const textRects=[];
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
    const node=walker.currentNode;
    if(!node.textContent.trim()||!visible(node.parentElement)||node.parentElement.closest('script,style,.sr-only,textarea')) continue;
    const range=document.createRange();range.selectNodeContents(node);
    for(const r of range.getClientRects()) if(r.width&&r.height) textRects.push({element:node.parentElement,selector:selector(node.parentElement),left:r.left,right:r.right,top:r.top,bottom:r.bottom});
  }
  const borders=[];
  const overlay = e => e.closest('.menu nav,.toast,.sticky-total');
  const frameSelector='.sheet,.display,.dealer,.controls,.how,.teaching-figure';
  const controlSelector='button,input,textarea,.button,.stepper,.money-field,.money-field>span,.toast';
  const tableSelector='table,thead,tbody,tr,th,td';
  function record(e,pseudo='') {
    const s=getComputedStyle(e,pseudo||null);
    if(pseudo && (s.content==='none'||s.content==='normal'))return;
    const sides={};
    for(const side of ['Top','Right','Bottom','Left']) {
      const color=s['border'+side+'Color'];
      if(parseFloat(s['border'+side+'Width'])>0 && !['none','hidden'].includes(s['border'+side+'Style']) && color!=='transparent'&&!/rgba\([^)]*,\s*0\)/.test(color)) sides[side.toLowerCase()]={width:parseFloat(s['border'+side+'Width']),color,style:s['border'+side+'Style']};
    }
    // Native checkboxes paint a UA frame even though computed border widths are 0.
    if(!pseudo&&e.matches('input[type="checkbox"],input[type="radio"]')&&s.appearance!=='none') {
      for(const side of ['top','right','bottom','left']) sides[side]={width:1,color:s.accentColor,style:'native-appearance'};
    }
    if(!Object.keys(sides).length && e.tagName!=='HR') return;
    let r=box(e);
    if(pseudo) {
      // The only current bordered pseudo is the positioned entry-unit choice.
      const base=box(e);
      r={left:base.left+parseFloat(s.left||0),right:base.right-parseFloat(s.right||0),top:base.top+parseFloat(s.top||0),bottom:base.bottom-parseFloat(s.bottom||0)};
      if(!Object.values(r).every(Number.isFinite)) { issues.push({type:'unmeasured-pseudo',selector:selector(e)+pseudo});return; }
    }
    const kind=e.matches(frameSelector)?'card':e.matches(tableSelector)?'table':e.matches(controlSelector)?'control':e.matches('.sticky-total')?'fixed-display':'rule';
    const localOwner=kind==='table'?e.closest('table'):kind==='control'?(e.closest('.stepper,.money-field')||e.parentElement):null;
    const local=localOwner?{selector:selector(localOwner),...box(localOwner)}:null;
    const entry={selector:selector(e)+pseudo,kind,...r,sides,containerDelta:{left:r.left-container.left,right:container.right-r.right},localColumn:local,edgeMatches:{left:edges.filter(x=>near(x,r.left)),right:edges.filter(x=>near(x,r.right))},minTextGap:null};
    if(kind==='card' && (!entry.edgeMatches.left.length||!entry.edgeMatches.right.length)) issues.push({type:'unaligned-border',selector:entry.selector,left:r.left,right:r.right});
    if(kind==='rule'||e.tagName==='HR') issues.push({type:'decorative-rule',selector:entry.selector,left:r.left,right:r.right});
    // Functional controls may sit within a column but may never escape it.
    if(local && (r.left<local.left-tolerance||r.right>local.right+tolerance)) issues.push({type:'border-outside-local-column',selector:entry.selector,local});
    let minGap=Infinity,nearest;
    for(const t of textRects) {
      if(overlay(e)!==overlay(t.element)) continue;
      for(const [side,b] of Object.entries(sides)) {
        let gap;
        if(side==='top'||side==='bottom') {
          if(t.right<=r.left||t.left>=r.right)continue;
          const y=side==='top'?r.top+b.width:r.bottom-b.width;
          gap=t.top>=y?t.top-y:t.bottom<=y?y-t.bottom:0;
        } else {
          if(t.bottom<=r.top||t.top>=r.bottom)continue;
          const x=side==='left'?r.left+b.width:r.right-b.width;
          gap=t.left>=x?t.left-x:t.right<=x?x-t.right:0;
        }
        if(gap<minGap){minGap=gap;nearest=t.selector;}
      }
    }
    if(Number.isFinite(minGap)) {entry.minTextGap=Math.round(minGap*100)/100;entry.nearestText=nearest;}
    // All text-facing borders, including functional frames, need 8px clearance.
    if(minGap<8-.1) issues.push({type:'line-near-text',selector:entry.selector,gap:minGap,text:nearest});
    borders.push(entry);
  }
  const elements=[...document.body.querySelectorAll('*')].filter(e=>visible(e)&&!e.matches('.sr-only,.skip'));
  for(const e of elements){record(e);record(e,'::before');record(e,'::after');}
  for(let i=0;i<borders.length;i++)for(let j=i+1;j<borders.length;j++) {
    const a=borders[i],b=borders[j];
    const horizontalOverlap=Math.min(a.right,b.right)-Math.max(a.left,b.left);
    const verticalOverlap=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    if(horizontalOverlap>2 && ((a.sides.bottom&&b.sides.top&&near(a.bottom,b.top))||(b.sides.bottom&&a.sides.top&&near(b.bottom,a.top)))) issues.push({type:'double-border',a:a.selector,b:b.selector,axis:'horizontal'});
    if(verticalOverlap>2 && ((a.sides.right&&b.sides.left&&near(a.right,b.left))||(b.sides.right&&a.sides.left&&near(b.right,a.left)))) {
      // Collapsed table borders are painted once by the browser.
      if(!(a.kind==='table'&&b.kind==='table')) issues.push({type:'double-border',a:a.selector,b:b.selector,axis:'vertical'});
    }
  }
  const overflow=[];
  for(const e of elements) {
    if(e.matches('script,style,source')||e.closest('.skip,.sr-only'))continue;
    const r=box(e);
    const owner=e.closest('.wrap')?contentBox(e.closest('.wrap')):container;
    if(e.matches('.wrap'))continue;
    if(r.left<owner.left-tolerance||r.right>owner.right+tolerance) overflow.push({selector:selector(e),...r,container:owner});
  }
  issues.push(...overflow.map(o=>({type:'container-overflow',...o})));
  if(document.documentElement.scrollWidth>innerWidth)issues.push({type:'viewport-overflow',scrollWidth:document.documentElement.scrollWidth,width:innerWidth});
  // Header, main, and footer use the same container at every breakpoint.
  for(const e of document.querySelectorAll('.wrap')) {
    const r=contentBox(e);
    if(!near(r.left,container.left)||!near(r.right,container.right))issues.push({type:'container-mismatch',selector:selector(e),...r});
  }
  const eyebrows=[...document.querySelectorAll('main .overline')].filter(e=>visible(e)&&!e.closest('#calculator'));
  if(eyebrows.length>2)issues.push({type:'excess-eyebrows',count:eyebrows.length});
  return {container,columns,borders,eyebrows:eyebrows.map(e=>e.textContent),overflow,issues};
}

const output='/workspace/gold-ira/free-apps/qa';
await mkdir(output,{recursive:true});await mkdir('docs/qa',{recursive:true});
const {server,url}=await startServer();
const chrome=await launchChrome();
const pages=[['home','/'],['guides','/guides/'],...GUIDES.map(g=>[g.slug,`/guides/${g.slug}/`]),['how-we-calculate','/how-we-calculate/'],['embed-code','/embed-code/'],['about','/about/'],['contact','/contact/'],['404','/404.html'],['embed','/embed/']];
const widths=[320,390,768,1280,1440];
const results=[];
let detectorChecks=[];
try {
  for(const [name,path] of pages) for(const width of widths) {
    const page=await chrome.page(width,width>=1280?900:844);
    await page.navigate(url+path,path==='/'||path==='/embed/');
    await page.evaluate("Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()})).then(()=>true)");
    const states=[];
    states.push({state:'default',...await page.evaluate(`(${inspectLines.toString()})()`)});
    if(width===390||width===1280) {
      await page.screenshot(`${output}/jsc-b5-${name}-${width}.png`);
      const size=await page.command('Page.getLayoutMetrics');
      const {data}=await page.command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:size.cssContentSize.height,scale:1}});
      await writeFile(`${output}/jsc-b5-${name}-${width}-full.png`,Buffer.from(data,'base64'));
    }
    await page.evaluate("document.querySelector('#more-button')?.click();document.querySelectorAll('details').forEach(e=>e.open=true)");
    states.push({state:'expanded',...await page.evaluate(`(${inspectLines.toString()})()`)});
    if(path==='/'||path==='/embed/') {
      await page.evaluate(`document.querySelectorAll('.coin-row input').forEach(e=>{e.value='1000000000';e.dispatchEvent(new Event('input',{bubbles:true}))})`);
      states.push({state:'large-quantities',...await page.evaluate(`(${inspectLines.toString()})()`)});
      await page.evaluate("document.querySelector('#clear').click()");
      states.push({state:'clear-notice',...await page.evaluate(`(${inspectLines.toString()})()`)});
    }
    if(name==='home'&&width===390) {
      await page.evaluate(`(()=>{const e=document.createElement('aside');e.id='audit-probes';e.innerHTML='<div class="how" style="width:100px;margin-left:17px;padding:0">Probe</div><div style="height:24px;border-bottom:1px solid">Probe</div><div style="height:24px;border-top:1px solid">Probe</div><div style="width:1440px;height:1px"></div>';document.querySelector('main').append(e)})()`);
      const probe=await page.evaluate(`(${inspectLines.toString()})()`);
      detectorChecks=['unaligned-border','decorative-rule','double-border','line-near-text','container-overflow'].map(type=>({type,detected:probe.issues.some(i=>i.type===type)}));
      await page.evaluate("document.getElementById('audit-probes').remove()");
      if(detectorChecks.some(c=>!c.detected))throw Error('Audit detector self-check failed: '+JSON.stringify(detectorChecks));
    }
    if(page.errors.length)states.at(-1).issues.push({type:'browser-errors',errors:page.errors});
    results.push({page:name,path,width,states});
    console.log(`${name} ${width}: ${states.reduce((n,s)=>n+s.issues.length,0)} findings`);
    await page.close();
  }
} finally {await chrome.close();await new Promise(ok=>server.close(ok));}
const findings=results.flatMap(r=>r.states.flatMap(s=>s.issues.map(i=>({page:r.page,width:r.width,state:s.state,...i}))));
const report={generatedAt:new Date().toISOString(),chrome:'/usr/bin/google-chrome',widths,pages:pages.length,checks:results.reduce((n,r)=>n+r.states.length,0),borderRecords:results.reduce((n,r)=>n+r.states.reduce((m,s)=>m+s.borders.length,0),0),policy:{tolerancePx:1.1,minTextGapPx:8,cardEdges:'shared container, left-aligned reading measure, hero columns, gallery columns',controls:'local functional form/grid geometry, contained in page container',tables:'functional data borders; collapsed borders paint once',states:'default, all disclosures/mobile menu expanded, and calculator large quantities/clear notice'},detectorChecks,findingCount:findings.length,findings,results};
await writeFile('docs/qa/lines-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(`${report.checks} page/width/state checks, ${report.borderRecords} borders, ${findings.length} findings. docs/qa/lines-audit.json`);
if(findings.length)process.exitCode=1;
