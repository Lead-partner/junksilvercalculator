import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export const pause = ms => new Promise(ok=>setTimeout(ok,ms));
export async function launchChrome() {
  const profile = await mkdtemp(join(tmpdir(),'jsc-chrome-'));
  const child = spawn('/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote','--renderer-process-limit=2','--no-first-run','--no-default-browser-check','--hide-scrollbars','--force-color-profile=srgb','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
  let stderr = '';
  const endpoint = await new Promise((ok,fail)=>{
    const timer=setTimeout(()=>{child.kill('SIGKILL');fail(Error('Chrome did not start: '+stderr.slice(-1500)));},30000);
    child.stderr.on('data',chunk=>{ stderr += chunk; const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/); if(match){clearTimeout(timer);ok(match[1]);} });
    child.on('error',fail);
    child.on('exit',code=>{clearTimeout(timer);fail(Error('Chrome exited '+code+': '+stderr.slice(-1500)));});
  });
  const ws = new WebSocket(endpoint);
  await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true});});
  let next=0;
  const pending=new Map(), listeners=new Set();
  ws.addEventListener('message',event=>{
    const msg=JSON.parse(event.data);
    if(msg.id && pending.has(msg.id)) {
      const p=pending.get(msg.id); pending.delete(msg.id); clearTimeout(p.timer);
      if(msg.error) p.fail(Error(JSON.stringify(msg.error))); else p.ok(msg.result);
    } else for(const listener of listeners) listener(msg);
  });
  function send(method,params={},sessionId) {
    const id=++next;
    return new Promise((ok,fail)=>{
      const timer=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout: '+method));},30000);
      pending.set(id,{ok,fail,timer}); ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
    });
  }
  async function page(width=390,height=844) {
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    const command=(method,params={})=>send(method,params,sessionId);
    await command('Page.enable'); await command('Runtime.enable'); await command('Log.enable');
    await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=700});
    const errors=[];
    const log=msg=>{ if(msg.sessionId===sessionId && msg.method==='Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text); };
    listeners.add(log);
    const evaluate=async expression=>{
      const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
      if(result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const until=async expression=>{
      for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(50);}
      throw Error('Browser condition timed out: '+expression);
    };
    return {command,evaluate,until,errors,
      async navigate(url, ready=true){await command('Page.navigate',{url});await until("document.readyState === 'complete'");if(ready)await until("document.getElementById('calculator')?.dataset.ready === 'true'");await evaluate('document.fonts.ready.then(()=>true)');},
      async screenshot(file){const {data}=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(file,Buffer.from(data,'base64'));},
      async close(){listeners.delete(log);await send('Target.closeTarget',{targetId});}
    };
  }
  return {page,
    async close(){try{await send('Browser.close');}catch{}ws.close();if(child.exitCode===null){await Promise.race([new Promise(ok=>child.once('exit',ok)),pause(3000)]);if(child.exitCode===null)child.kill('SIGKILL');}await rm(profile,{recursive:true,force:true});}
  };
}
