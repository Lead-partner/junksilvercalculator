"""Pillow delivery assets; crop coordinates visually checked against real originals."""
import json,html
from pathlib import Path
from PIL import Image,ImageDraw
credits=json.loads(Path('static/img/credits.json').read_text());by={c['id']:c for c in credits}
out=Path('static/img/coins');out.mkdir(parents=True,exist_ok=True)
BG='#FBFBFA'
CROPS={'roosevelt-obverse':(.035,.035,.965,.97),'roosevelt-reverse':(.035,.035,.97,.97),'kennedy-90-obverse':(.065,.065,.925,.875),'kennedy-90-reverse':(.065,.08,.94,.905),'kennedy-40-obverse':(.20,.05,.80,.955),'kennedy-40-reverse':(.22,.10,.78,.92)}
SERIES=['roosevelt','mercury','barber-dime','washington','barber-quarter','standing-liberty','kennedy-90','kennedy-40','franklin','walking-liberty','barber-half','war-nickel','morgan','peace']
def save(im,name,widths):
 for w in widths:
  size=(w,round(im.height*w/im.width));res=im.resize(size,Image.Resampling.LANCZOS)
  res.save(out/f'{name}-{w}.webp','WEBP',quality=68 if w==960 else 76,method=6)
  res.save(out/f'{name}-{w}.avif','AVIF',quality=42 if w==960 else 57,speed=6)
def side(key,which):
 source=key if key in ['barber-dime','peace'] else key+'-'+which
 im=Image.open(by[source]['localOriginal']).convert('RGB')
 if key in ['barber-dime','peace']:
  half=im.width//2;im=im.crop((0 if which=='obverse' else half,0,half if which=='obverse' else im.width,im.height))
 box=CROPS.get(source,(0,0,1,1));im=im.crop(tuple(round(v*(im.width if i%2==0 else im.height)) for i,v in enumerate(box)))
 # Retain the actual photograph and toning; only replace the outside background.
 im=im.resize((448,448),Image.Resampling.LANCZOS)
 mask=Image.new('L',im.size);ImageDraw.Draw(mask).ellipse((0,0,447,447),fill=255)
 canvas=Image.new('RGB',(480,480),BG);canvas.paste(im,(16,16),mask)
 save(canvas,key+'-'+which,[480]);return canvas
for key in SERIES:
 a,b=side(key,'obverse'),side(key,'reverse');pair=Image.new('RGB',(960,480),BG);pair.paste(a,(0,0));pair.paste(b,(480,0));save(pair,key,[480,960]);pair.resize((480,240)).save(Path('sources-ref/images/originals')/(key+'-pair-review.jpg'))
edge=Image.open(by['edge-test']['localOriginal']).convert('RGB');save(edge,'edge-test',[480,960])
for c in credits:
 if c['id']=='edge-test':c['changes']='Resized to 480/960px; AVIF and WebP encoding; photograph and original background retained.'
 c['visualQA']='PASS: viewed original review image; correct series, date and side. War nickel reverse has a clearly visible large P above Monticello. No NGC/PCGS company photographs used.'
Path('static/img/credits.json').write_text(json.dumps(credits,indent=2)+'\n')
md=['# Image credits','', 'Checked 14 Nov 2026. All originals retrieved through the Wikimedia Commons API with `prop=imageinfo&iiprop=url|extmetadata|size` and a descriptive JunkSilverCalculator User-Agent. Raw API responses are retained in `sources-ref/images/` and `static/img/credits.json`. Original photographs were each viewed before processing; normalized pairs and annotation overlays were also reviewed.','', 'The photographs retain their real details and toning. Outside backgrounds are replaced with the site surface color, with matching coin diameters in each pair. Smithsonian/NNC photos are split into sides. The Kennedy photos receive tighter crops. Crops are illustrative, not physical diameter comparisons between denominations. Derivatives of CC BY-SA material retain the original share-alike license. Public-domain components remain public domain.','', 'Some independently photographed coins were graded by a grading service; their Commons metadata attributes the photographs to the individual photographer, not NGC or PCGS. No NGC/PCGS photographs are used.','']
for c in credits:
 md += ['## '+c['id'],'',f"- File: [{c['title']}]({c['filePage']})",f"- Author: {c['author']}",f"- License: [{c['license']}]({c['licenseUrl']})",f"- Changes: {c['changes']}",f"- Visual QA: {c['visualQA']}",'']
md+=['## Social image derivatives', '', 'The 1200×630 PNGs in static/img/og/ reuse the corresponding page photo or diagram, credited in that page’s figure. Roosevelt/BnF is public domain; Washington/Brandon Grossardt is public domain; Kennedy 1964/Albertomos is CC BY 4.0; wartime nickel and Morgan/Bobby131313 pairs retain CC BY-SA 3.0. Home, calculation and embed use the site’s MIT data diagrams.', '', '## Teaching diagrams','', 'Formula and silver-content SVGs: original site artwork generated from `COINS`, `coinOzt` and `TROY_GRAMS` in `src/calc.js`; MIT (repository license). Mintmark overlays use actual Commons photographs, with source and license links in the page captions. The war-nickel location is confirmed by NGC article 999; the Roosevelt location by NGC article 12205; the Washington location by NGC Coin Explorer. A half-dollar mintmark annotation is omitted because the allowed textual sources fetched did not confirm its exact position; its guide uses silver-content teaching figures instead.','', '## Rejected candidate','', '`File:Silver Roosevelt Dime.jpg` (Aamsse, public domain) was viewed and correctly showed a 1953 dime pair, but its 301px width was too low for the lead figure. Replaced by the 1962 BnF photos.','']
Path('docs/images/credits.md').write_text('\n'.join(md))
