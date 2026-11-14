import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.jpg':'image/jpeg','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml' };
export async function startServer(port = 0) {
  const config = JSON.parse(await readFile('vercel.json','utf8'));
  const directory = resolve('public');
  const server = http.createServer(async (req,res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      for (const h of config.headers[0].headers) res.setHeader(h.key,h.value);
      const rule = config.headers[pathname === '/embed' || pathname.startsWith('/embed/') ? 2 : 1];
      for (const h of rule.headers) res.setHeader(h.key,h.value.replace('; upgrade-insecure-requests',''));
      let file = resolve(directory,'.'+(pathname === '/live/spot.json' ? '/spot.json' : pathname));
      if (file !== directory && !file.startsWith(directory+sep)) { res.writeHead(403); res.end(); return; }
      try { if ((await stat(file)).isDirectory()) file += '/index.html'; }
      catch { file = directory+'/404.html'; res.statusCode=404; }
      const body = await readFile(file);
      res.setHeader('Content-Type',types[extname(file)] || 'application/octet-stream');
      res.end(body);
    } catch { res.writeHead(500); res.end('Server error'); }
  });
  await new Promise(ok=>server.listen(port,'127.0.0.1',ok));
  return { server, url:'http://127.0.0.1:'+server.address().port };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const {url} = await startServer(Number(process.env.PORT)||4173);
  console.log('Local preview: '+url);
}
