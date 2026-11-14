"""Retrieve and normalize real Commons photos. Run after reviewing originals."""
import runpy,json,re,html,time
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
mod=runpy.run_path('scripts/source-images.py');query=mod['query'];session=mod['SESSION']
ROOT=Path('sources-ref/images/originals');ROOT.mkdir(parents=True,exist_ok=True)
FILES={
'roosevelt-obverse':'Monnaie - Etats-Unis, 1 dime, 1962 - btv1b113366252 (1 of 2).jpg','roosevelt-reverse':'Monnaie - Etats-Unis, 1 dime, 1962 - btv1b113366252 (2 of 2).jpg',
'mercury-obverse':'1943D Mercury Dime obverse.jpg','mercury-reverse':'1943D Mercury Dime reverse.jpg',
'barber-dime':'NNC-US-1892-10C-Barber Dime.jpg',
'washington-obverse':'Washington Quarter Silver 1944S Obverse.png','washington-reverse':'Washington Quarter Silver 1944S Reverse.png',
'barber-quarter-obverse':'1903 proof Barber quarter obverse.jpg','barber-quarter-reverse':'1903 proof Barber quarter reverse.jpg',
'standing-liberty-obverse':'Standing Liberty Quarter Type2m 1926 Obverse.png','standing-liberty-reverse':'Standing Liberty Quarter Type2m 1926 Reverse.png',
'kennedy-90-obverse':'1964-USA-half-dollar-Kennedy-d.jpg','kennedy-90-reverse':'1964-USA-half-dollar-Kennedy-r.jpg',
'kennedy-40-obverse':'John F. Kennedy half-dollar coin (1967) (obverse) (54339953791).jpg','kennedy-40-reverse':'John F. Kennedy half-dollar coin (1967) (reverse) (54340166864).jpg',
'franklin-obverse':'Franklin Half 1963 D Obverse.png','franklin-reverse':'Franklin Half 1963 D Reverse.png',
'walking-liberty-obverse':'Walking Liberty Half Dollar 1945D Obverse.png','walking-liberty-reverse':'Walking Liberty Half Dollar 1945D Reverse.png',
'barber-half-obverse':'1907-D Barber half obverse.jpg','barber-half-reverse':'1907-D Barber half reverse.jpg',
'war-nickel-obverse':'1945-P-Jefferson-War-Nickel-Obverse.JPG','war-nickel-reverse':'1945-P-Jefferson-War-Nickel-Reverse.JPG',
'morgan-obverse':'1889-p-morgan-dollar-obverse.jpg','morgan-reverse':'1889-p-morgan-dollar-reverse.jpg',
'peace':'NNC-US-1921-1$-Peace dollar.jpg',
'edge-test':'Two stacks of half dollars, one silver, one clad - effects of the Coinage Act 1965.jpg'
}
def plain(s):return html.unescape(re.sub('<[^>]+>','',s)).strip()
credits=[]
for key,title in FILES.items():
    meta=Path('sources-ref/images')/(key+'.json')
    if meta.exists(): p=json.loads(meta.read_text())
    else:
        p=next(iter(query(titles='File:'+title,prop='imageinfo',iiprop='url|extmetadata|size')['query']['pages'].values()));meta.write_text(json.dumps(p,indent=2))
    info=p['imageinfo'][0];ext=info['extmetadata'];license=ext['LicenseShortName']['value']
    assert license=='Public domain' or re.match(r'CC (BY|BY-SA|0)',license),license
    path=ROOT/(key+Path(title).suffix.lower())
    if not path.exists():
        
        for attempt in range(5):
            res=session.get(info['url'].split('?')[0],timeout=90)
            if res.status_code!=429: break
            time.sleep(8+attempt*6)
        res.raise_for_status();path.write_bytes(res.content)
        time.sleep(2)
    credits.append(dict(id=key,title='File:'+title,filePage=info['descriptionurl'],originalUrl=info['url'],originalWidth=info['width'],originalHeight=info['height'],author=plain(ext.get('Artist',{}).get('value',ext.get('Credit',{}).get('value','Unknown'))),license=license,licenseUrl=ext.get('LicenseUrl',{}).get('value','https://creativecommons.org/publicdomain/mark/1.0/'),changes='Background removed outside coin rim; cropped, centered and resized; paired obverse/reverse; AVIF and WebP encoding.',metadata=info,localOriginal=str(path)))
    print(key,path,license,flush=True)
    im=Image.open(path);im.thumbnail((720,720));im.convert('RGB').save(ROOT/(key+'-review.jpg'))
Path('static/img/credits.json').write_text(json.dumps(credits,indent=2)+'\n')
