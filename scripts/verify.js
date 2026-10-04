import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const live=process.argv.includes('--live');
const env=Object.fromEntries(Object.entries(process.env).filter(([k,v])=>typeof v==='string'&&(live||!['PEXELS_API_KEY','UNSPLASH_ACCESS_KEY','PIXABAY_API_KEY'].includes(k))));
const client=new Client({name:'banques-images-verification',version:'1.0.0'});
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../src/server.js',import.meta.url))],env,stderr:'inherit'}));
 const tools=await client.listTools();assert.equal(tools.tools.length,7);
 const status=JSON.parse((await client.callTool({name:'status',arguments:{}})).content[0].text);
 if(!live)assert.ok(Object.values(status).every(x=>!x.available));
 const result=JSON.parse((await client.callTool({name:'search_images',arguments:{bank:'all',query:'nature',count:1}})).content[0].text);
 assert.equal(result.results.length,3);
 if(!live)assert.ok(result.results.every(x=>x.error&&x.images.length===0));
 const bad=await client.callTool({name:'prepare_images',arguments:{confirmed:false,destination:'/tmp',selections:[{bank:'pexels',id:'1',placement:'test'}]}});assert.equal(bad.isError,true);
 console.log(`Protocole STDIO, 7 outils, recherche et validation : OK (${live?'appels réels selon clés disponibles':'sans API'}).`);
 if(live)for(const r of result.results)console.log(`${r.bank}: ${r.error||r.images.length+' image(s)'}`);
}finally{await client.close();}
