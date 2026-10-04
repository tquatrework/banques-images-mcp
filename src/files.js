import {mkdir,writeFile,readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {sanitize,missing} from './providers.js';
const escape=s=>String(s??missing).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function galleryHtml(slots){
 let number=0;
 return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Sélection d’images</title><style>body{font:16px system-ui;margin:2rem;background:#f4f5f7;color:#16202b}section{display:flex;flex-wrap:wrap;gap:1rem}article{background:white;padding:1rem;width:320px;border-radius:12px}img{width:100%;height:220px;object-fit:contain}.crop{object-fit:cover;height:auto}a{color:#155aba}h2{width:100%}</style><h1>Galerie de sélection</h1><p>Répondez par exemple : « bannière : image 2 ; formation : image 5 ». Aperçus Pixabay temporaires (24 h). Aucune image juridiquement vérifiée.</p>${slots.map(s=>`<section><h2>${escape(s.name)}</h2>${s.candidates.map(c=>{const i=c.image;const n=++number;return `<article><h3>Image ${n} — ${escape(s.name)}</h3><img loading="lazy" src="${escape(safeUrl(i.preview_url))}" alt="${escape(i.description)}">${s.aspect_ratio?`<p>Cadrage envisagé (simulation centrée)</p><img class="crop" style="aspect-ratio:${s.aspect_ratio}" src="${escape(safeUrl(i.preview_url))}" alt="">`:''}<p>${escape(i.bank)} · ${escape(i.id)} · ${escape(i.width)} × ${escape(i.height)}</p><p>Photo par <a href="${escape(safeUrl(i.author.profile_url))}">${escape(i.author.name)}</a> sur <a href="${escape(safeUrl(i.source_url))}">${escape(i.bank)}</a></p><p><a href="${escape(safeUrl(i.provider_conditions.url))}">${escape(i.provider_conditions.name)}</a> (conditions générales)</p><p>${escape(i.provider_conditions.attribution)}</p><p>${escape(i.provider_conditions.rules)}</p><p>Droits propres à l’image / autorisations supplémentaires : ${escape(i.image_rights.additional_permissions)}</p><p>${escape(c.reason||missing)}</p></article>`;}).join('')}</section>`).join('')}</html>`;
}
export async function createGallery(slots,destination){
 if(!path.isAbsolute(destination))throw new Error('Destination absolue requise.');
 await mkdir(destination,{recursive:true});const id=randomUUID();const htmlPath=path.join(destination,`galerie-${id}.html`);const manifestPath=path.join(destination,`galerie-${id}.json`);
 let n=0;const selection=slots.map(s=>({...s,candidates:s.candidates.map(c=>({...c,number:++n}))}));
 await writeFile(htmlPath,galleryHtml(selection),{flag:'wx'});await writeFile(manifestPath,JSON.stringify(sanitize({created_at:new Date().toISOString(),slots:selection}),null,2),{flag:'wx'});
 return {html_path:htmlPath,manifest_path:manifestPath};
}
export async function serveGallery(file,port=0){
 const html=await readFile(file);const server=http.createServer((req,res)=>{if(req.url!=='/'||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:html);});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 const actual=server.address().port;return {server,url:`http://127.0.0.1:${actual}/`,port:actual};
}
const allowed={pexels:['images.pexels.com'],pixabay:['pixabay.com','cdn.pixabay.com']};
export async function downloadImage(image,destination,fetcher=fetch){
 const url=new URL(image.image_url);if(url.protocol!=='https:'||!allowed[image.bank]?.includes(url.hostname)||url.username||url.password)throw new Error('URL image fournisseur non autorisée.');
 let r;try{r=await fetcher(url,{signal:AbortSignal.timeout(30000),redirect:'error'});}catch{throw new Error('Téléchargement interrompu, redirection refusée ou délai dépassé.');}
 const type=r.headers.get('content-type')?.split(';')[0];const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[type];
 if(!r.ok||!ext||!r.body)throw new Error('Téléchargement invalide (statut ou type image).');
 const max=25*1024*1024;if(Number(r.headers.get('content-length'))>max){await r.body.cancel();throw new Error('Image supérieure à 25 Mo.');}
 const parts=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>max)throw new Error('Image supérieure à 25 Mo.');parts.push(chunk);}
 await mkdir(destination,{recursive:true});const root=await realpath(destination);const file=path.join(root,`${image.bank}-${image.id}.${ext}`);
 await writeFile(file,Buffer.concat(parts),{flag:'wx',mode:0o600});return file;
}
export async function prepare(providers,selections,destination,confirmed){
 if(confirmed!==true)throw new Error('Validation explicite des images requise.');
 if(!path.isAbsolute(destination))throw new Error('Dossier de destination absolu explicitement requis.');
 await mkdir(destination,{recursive:true});const manifest=path.join(destination,`manifest-${randomUUID()}.json`);const entries=[];
 const save=()=>writeFile(manifest,JSON.stringify(sanitize({created_at:new Date().toISOString(),entries}),null,2),{mode:0o600});
 await writeFile(manifest,'{}',{flag:'wx',mode:0o600});
 for(const s of selections){
  const entry={...s,status:'pending'};entries.push(entry);
  try{const image=await providers.details(s.bank,s.id);entry.image=image;entry.alt_text=s.alt_text||`À adapter à l’emplacement « ${s.placement} » : ${image.description}`;entry.alt_text_status=s.alt_text?'fourni pour cet usage':'proposition à vérifier';
   if(s.bank==='unsplash'){await providers.track(image);entry.download_reported_at=new Date().toISOString();entry.used_url=image.image_url;entry.status='remote_url_ready';}
   else{image.local_path=await downloadImage(image,destination);entry.file=image.local_path;entry.status='downloaded';}
  }catch(e){entry.status='error';entry.error=sanitize(e.message);}
  await save();
 }
 return {manifest_path:manifest,entries};
}
