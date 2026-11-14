"""Commons-only discovery; descriptive User-Agent on API and original downloads."""
import requests,json,time,re
from pathlib import Path
API='https://commons.wikimedia.org/w/api.php'
SESSION=requests.Session()
SESSION.headers['User-Agent']='JunkSilverCalculator/1.0 (educational coin identification; https://junksilvercalculator.net/about/)'
def query(**params):
    r=SESSION.get(API,params=dict(action='query',format='json',**params),timeout=60);r.raise_for_status();return r.json()
def search(term):
    data=query(generator='search',gsrsearch=term+' filetype:bitmap',gsrnamespace=6,gsrlimit=15,prop='imageinfo',iiprop='url|extmetadata|size')
    return list(data.get('query',{}).get('pages',{}).values())
if __name__=='__main__':
    queries=['Roosevelt dime','Mercury dime','Barber dime','Washington quarter 1964','Barber quarter','Standing Liberty quarter','Kennedy half dollar 1964','Kennedy half dollar 1967','Franklin half dollar','Walking Liberty half dollar','1943 nickel','Morgan dollar','Peace dollar','silver clad coin edge']
    all={}
    for term in queries:
        pages=search(term);all[term]=pages
        print('\n'+term,flush=True)
        for p in pages:
            i=p['imageinfo'][0];m=i.get('extmetadata',{});print(p['title'],i['width'],i['height'],m.get('LicenseShortName',{}).get('value',''),flush=True)
    Path('sources-ref/images/search.json').write_text(json.dumps(all,indent=2))
