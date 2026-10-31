import {createServer} from '../../node_modules/vite/dist/node/index.js';
import {createServer as httpServer} from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const backend=httpServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({proxy:'ok',path:req.url}));});
await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
process.env.API_PROXY_TARGET=`http://127.0.0.1:${backend.address().port}`;
const vite=await createServer({root,configFile:root+'vite.config.js',server:{middlewareMode:true},logLevel:'error'});
// API-only test harness: no frontend pages/assets or preview are exposed.
const harness=httpServer((req,res)=>{if(req.url==='/api/proxy-check')vite.middlewares(req,res,()=>{res.writeHead(404);res.end()});else {res.writeHead(404);res.end()}});
await new Promise(resolve=>harness.listen(0,'127.0.0.1',resolve));
const response=await fetch(`http://127.0.0.1:${harness.address().port}/api/proxy-check`,{signal:AbortSignal.timeout(5000)});
assert.equal(response.status,200);assert.deepEqual(await response.json(),{proxy:'ok',path:'/api/proxy-check'});
console.log('PASS Vite actual /api proxy: HTTP 200, prefix preserved, local backend reached.');
await vite.close();harness.close();backend.close();process.exit(0);
